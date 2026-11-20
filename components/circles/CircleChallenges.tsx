"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useHydrated } from "@/hooks/useHydrated";

type Challenge = { id: string; title: string; instructions: string; criteria: string; due_date: string; response_mode: "text" | "code" | "image" | "audio" };
type Response = { challenge_id: string; response: string | null; forge_entry_id: string | null; completed_at: string };
type Progress = { challenge_id: string; completed: number; members: number };
type Entry = { id: string; title: string | null; item_type: string; created_at: string };
const field = "mt-1 block w-full rounded-lg border border-white/15 bg-[#201d1d] p-2 text-white";
const primary = "rounded-full bg-[#ff713d] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50";

export default function CircleChallenges({ circleId, isAdmin }: { circleId: string; isAdmin: boolean }) {
  const hydrated = useHydrated();
  const [showAssignment, setShowAssignment] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const list = await supabase.from("circle_challenges").select("id,title,instructions,criteria,response_mode,due_date")
      .eq("circle_id", circleId).order("created_at", { ascending: false }).limit(100);
    if (list.error) throw list.error;
    const items = (list.data ?? []) as Challenge[];
    const [completed, totals, forge] = await Promise.all([
      items.length ? supabase.from("circle_challenge_responses").select("challenge_id,response,forge_entry_id,completed_at").in("challenge_id", items.map(({ id }) => id)) : { data: [], error: null },
      isAdmin ? supabase.rpc("circle_challenge_progress", { p_circle: circleId }) : { data: [], error: null },
      items.some(({ response_mode }) => response_mode === "image" || response_mode === "audio")
        ? supabase.from("journal_entries").select("id,title,item_type,created_at").eq("is_forge_entry", true)
          .not("response_file_url", "is", null).in("item_type", ["voice", "sketch", "handwriting", "photo"]).order("created_at", { ascending: false }).limit(100)
        : { data: [], error: null },
    ]);
    if (completed.error || totals.error || forge.error) throw new Error();
    setChallenges(items);
    setResponses((completed.data ?? []) as Response[]);
    setProgress((totals.data ?? []) as Progress[]);
    setEntries((forge.data ?? []) as Entry[]);
  }, [circleId, isAdmin]);

  useEffect(() => { void load().catch(() => setNotice("Could not load assignments. Choose Reload assignments to try again.")); }, [load]);

  async function save(rpc: string, values: Record<string, unknown>, success: string) {
    setBusy(true);
    setNotice("");
    try {
      const { error } = await createClient().rpc(rpc, values);
      if (error) {
        setNotice(["42501", "22023", "P0001"].includes(error.code) ? error.message : "Could not save. Check the fields and try again.");
        return false;
      }
      setNotice(success);
      await load().catch(() => setNotice("Saved. Reload assignments to see the latest progress."));
      return true;
    } catch { setNotice("Could not save. Try again."); return false; }
    finally { setBusy(false); }
  }

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (await save("assign_circle_challenge", {
      p_circle: circleId, p_title: form.get("title"), p_instructions: form.get("instructions"), p_criteria: form.get("criteria"),
      p_mode: form.get("mode"), p_due: form.get("due"),
    }, "Challenge published.")) setShowAssignment(false);
  }

  function complete(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void save("complete_circle_challenge", { p_challenge: id, p_response: form.get("response"), p_forge_entry: form.get("entry") }, "Challenge completed.");
  }

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold">Circle assignments</h2>
      <div className="flex flex-wrap gap-3">
        <button className="text-sm text-[#ff9c77] underline" onClick={() => void load().catch(() => setNotice("Could not reload assignments."))}>Reload assignments</button>
        {isAdmin && <button className={primary} onClick={() => setShowAssignment(!showAssignment)} aria-expanded={showAssignment}>Assign challenge</button>}
      </div>
    </div>
    <p role="status" className="text-sm text-[#ffc2ac]">{notice}</p>
    {showAssignment && isAdmin && <form method="post" onSubmit={assign} className="space-y-3 rounded-xl border border-white/10 p-4">
      <label className="block">Challenge title<input name="title" className={field} minLength={2} maxLength={100} required /></label>
      <label className="block">Instructions<textarea name="instructions" className={field} minLength={5} maxLength={3000} required /></label>
      <label className="block">Completion criteria<textarea name="criteria" className={field} minLength={5} maxLength={1500} required /></label>
      <label className="block">Response format<select name="mode" className={field}><option value="text">Text</option><option value="code">Code</option><option value="image">Image from Forge</option><option value="audio">Audio from Forge</option></select></label>
      <label className="block">Due date (UTC)<input name="due" className={field} type="date" required /></label>
      <button type="submit" className={primary} disabled={!hydrated || busy}>Publish challenge</button>
    </form>}
    {!challenges && !notice && <p className="text-sm text-white/70">Loading assignments…</p>}
    {challenges?.length === 0 && <p className="text-sm text-white/70">No challenges have been assigned.</p>}
    {challenges?.map((challenge) => {
      const response = responses.find((item) => item.challenge_id === challenge.id);
      const total = progress.find((item) => item.challenge_id === challenge.id);
      const usesForge = challenge.response_mode === "audio" || challenge.response_mode === "image";
      const choices = entries.filter((entry) => challenge.response_mode === "audio" ? entry.item_type === "voice" : entry.item_type !== "voice");
      return <article key={challenge.id} className="space-y-2 rounded-xl border border-white/10 bg-[#111] p-4">
        <h3 className="font-semibold">{challenge.title}</h3>
        <p className="text-sm text-white/70">Due {challenge.due_date} UTC · {challenge.response_mode}</p>
        <p className="whitespace-pre-wrap">{challenge.instructions}</p>
        <h4 className="text-sm font-semibold">Completion criteria</h4>
        <p className="whitespace-pre-wrap text-sm text-white/80">{challenge.criteria}</p>
        {total && <p className="text-sm">{total.completed}/{total.members} current members completed</p>}
        {response ? <div className="text-sm">
          <p>Completed {response.completed_at.slice(0, 10)} UTC</p>
          {response.response && <details><summary>Your private response</summary><pre className="whitespace-pre-wrap break-words">{response.response}</pre></details>}
          {response.forge_entry_id && <Link className="text-[#ff9c77] underline" href="/dashboard/forge">View your private Forge work</Link>}
        </div> : <form method="post" onSubmit={(event) => complete(event, challenge.id)} className="space-y-3">
          <p className="text-sm text-white/70">Your response stays private. Circle admins can see completion totals.</p>
          {usesForge ? <>
            <Link href="/dashboard/forge" target="_blank" className="text-sm text-[#ff9c77] underline">Open Forge to save your {challenge.response_mode} response</Link>
            <label className="block">Your saved Forge attachment<select name="entry" className={field} required defaultValue="">
              <option value="" disabled>Choose an attachment</option>
              {choices.map((entry) => <option key={entry.id} value={entry.id}>{entry.title || "Forge session"} · {entry.created_at.slice(0, 10)}</option>)}
            </select></label>
          </> : <label className="block">Your {challenge.response_mode} response<textarea className={field} rows={4} name="response" maxLength={12000} required /></label>}
          <button type="submit" className={primary} disabled={!hydrated || busy || (usesForge && !choices.length)}>Complete challenge</button>
        </form>}
      </article>;
    })}
  </section>;
}
