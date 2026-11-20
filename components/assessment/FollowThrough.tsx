"use client";

import { useHydrated } from "@/hooks/useHydrated";
import LocalDate from "@/components/shared/LocalDate";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { RoleTrack } from "@/lib/assessment/catalog";

type Task = { id: string; kind: string; due_at: string };

export default function FollowThrough({ task, role, recommendedSkill }: {
  task: Task; role: RoleTrack; recommendedSkill: string;
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [skill, setSkill] = useState(recommendedSkill);
  const [contribution, setContribution] = useState("none");
  const [verification, setVerification] = useState("unchecked");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const target = role.tasks.find((item) => item.skill === skill) ?? role.tasks[0];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const input = task.kind === "practice" ? { skill, reflection: form.get("reflection") } : {
      skill, stage: Number(form.get("stage")), attemptedFirst: form.get("first") === "yes",
      contribution, verification: contribution === "none" ? "not-applicable" : verification,
      context: contribution === "none" ? "no-ai" : form.get("context"),
      verificationNote: contribution === "none" ? "" : form.get("verificationNote") ?? "",
    };
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/assessment/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, kind: task.kind, ...input }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save this task.");
      setStatus("Task completed.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save this task.");
    } finally {
      setBusy(false);
    }
  }

  const field = "block w-full rounded-lg border border-white/20 bg-[#171515] p-2 text-white";
  return (
    <form method="post" onSubmit={submit} className="space-y-4 rounded-xl border border-white/10 p-5">
      <h3 className="text-lg font-semibold">{task.kind === "practice" ? "Targeted practice" : "AI-use check-in"}</h3>
      <p className="text-sm text-white/65">Due <LocalDate value={task.due_at} /></p>
      <label className="block space-y-1 text-sm">Skill
        <select className={field} value={skill} onChange={(event) => setSkill(event.target.value)}>
          {role.tasks.map((item) => <option key={item.skill}>{item.skill}</option>)}
        </select>
      </label>
      {task.kind === "practice" ? (
        <>
          <p>{target.practice}</p>
          <p className="text-sm text-white/65">Check your work against this criterion. {target.evidence}</p>
          <label className="block space-y-1 text-sm">What did you complete and what would you check again?
            <textarea className={field} name="reflection" maxLength={1200} required rows={3} />
          </label>
        </>
      ) : (
        <>
          <p className="text-sm text-white/65">Think of one recent task. Describe your process without including confidential work.</p>
          <label className="block space-y-1 text-sm">Which part of the work did you do?
            <select name="stage" className={field}>{role.workStages.map((stage, index) => <option key={stage} value={index}>{stage}</option>)}</select>
          </label>
          <label className="block space-y-1 text-sm">Did you make an independent attempt first?
            <select name="first" className={field} required defaultValue="">
              <option value="" disabled>Choose an answer</option>
              <option value="yes">Yes</option><option value="no">No</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">How much did AI contribute to this step?
            <select value={contribution} className={field} onChange={(event) => setContribution(event.target.value)}>
              <option value="none">I did this without generative AI</option><option value="hint-or-critique">A hint or feedback</option>
              <option value="partial-draft">Part of the work</option><option value="core-step">It did the core step</option>
            </select>
          </label>
          {contribution !== "none" && (
            <>
              <label className="block space-y-1 text-sm">How did you check the contribution?
                <select value={verification} className={field} onChange={(event) => setVerification(event.target.value)}>
                  <option value="unchecked">I did not check it</option><option value="ai-checked-only">I asked AI to check it</option>
                  <option value="independently-checked">I checked it independently</option>
                </select>
              </label>
              {verification === "independently-checked" && <label className="block space-y-1 text-sm">
                What did you verify? Consider this part of the role: {role.workStages[2]}.
                <input required className={field} name="verificationNote" maxLength={350} />
              </label>}
              <label className="block space-y-1 text-sm">What best describes the tool use?
                <select name="context" className={field}>
                  <option value="optional">Optional use</option><option value="required-tool">Required for my work</option>
                  <option value="accessibility">Accessibility support</option>
                </select>
              </label>
            </>
          )}
        </>
      )}
      <button type="submit" disabled={!hydrated || busy} className="min-h-10 rounded-full bg-[#ff713d] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
        {busy ? "Saving…" : "Complete task"}
      </button>
      <p role="status" className="text-sm text-[#ffc2ac]">{status}</p>
    </form>
  );
}
