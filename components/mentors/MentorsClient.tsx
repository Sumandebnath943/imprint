"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/hooks/useHydrated";
import type { Application, Mentor, MentorActivity, MentorSettings, Pair } from "@/lib/mentors/types";

const panel = "rounded-2xl border border-white/10 bg-[#111] p-5";
const field = "mt-1 block w-full rounded-lg border border-white/15 bg-[#1d1a1a] p-2";
const button = "rounded-full bg-[#ff713d] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50";
const secondary = "rounded-full border border-white/20 px-4 py-2 text-sm disabled:opacity-50";
const styles = ["Structured practice", "Feedback", "Career guidance", "Accountability"];

export default function MentorsClient({ activity, directory, settings, application, canReview }: {
  activity: MentorActivity; directory: Mentor[]; settings: MentorSettings | null; application?: Application; canReview: boolean;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [apply, setApply] = useState(false);
  const [composeFor, setComposeFor] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("");
  const [checkIns, setCheckIns] = useState<Record<string, Pick<Pair, "last_checkin" | "check_in_streak">>>({});
  const { pairs, requests, eligible, remaining_capacity } = activity;
  const activeMentor = pairs.find((pair) => pair.role === "mentee");
  const activeMentees = pairs.filter((pair) => pair.role === "mentor");
  const isOpen = eligible && settings?.accepting_mentees === true;

  async function update<T>(path: string, body: object, onSuccess: (result: T) => string) {
    setBusy(path);
    setStatus("");
    try {
      const response = await fetch("/api/mentors/" + path, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setStatus(onSuccess(payload.result as T));
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save. Try again.");
    } finally { setBusy(""); }
  }

  function applyForReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void update("apply", {
      mentor_bio: form.get("bio"), max_mentees: Number(form.get("capacity")), mentoring_style: form.getAll("style"),
    }, (result: Application["status"]) => {
      setApply(false);
      return result === "approved" ? "Mentoring profile saved." : "Application submitted for human review.";
    });
  }

  function requestMentor(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void update("request", { mentor_id: id, message: form.get("message") }, (result: { status: string }) => {
      setComposeFor(null);
      return result.status === "pending" ? "Mentorship request pending." : "This request has already been " + result.status + ".";
    });
  }

  function pairing(pair: Pair) {
    const saved = checkIns[pair.id] ?? pair;
    return <article key={pair.id} className={panel}>
      <h3 className="font-semibold">{pair.name || "Imprint member"}</h3>
      {pair.profession && <p className="text-sm text-white/70">{pair.profession}</p>}
      <p className="my-2 text-sm">Shared streak · {saved.check_in_streak ?? 0} consecutive days</p>
      {saved.last_checkin && <p className="mb-2 text-xs text-white/70">Last check-in {saved.last_checkin.slice(0, 10)} UTC</p>}
      <button className={button} disabled={!hydrated || !!busy} onClick={() => void update("checkin", { mentorship_id: pair.id }, (result: Pick<Pair, "last_checkin" | "check_in_streak"> & { alreadyCheckedIn: boolean }) => {
        setCheckIns((previous) => ({ ...previous, [pair.id]: result }));
        return result.alreadyCheckedIn ? "This pair already checked in today." : "Check-in saved.";
      })}>Log Check-in</button>
    </article>;
  }

  return <main className="mx-auto max-w-6xl space-y-7 px-5 py-10 md:px-10">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <h1 className="text-3xl font-semibold">Mentor Network</h1>
      {canReview && <Link className={secondary} href="/dashboard/mentors/review">Review mentor applications</Link>}
    </header>
    <p role="status" className="text-sm text-[#ffc2ac]">{status}</p>

    <section className={panel}>
      <h2 className="text-lg font-semibold">Become a Mentor</h2>
      {settings?.profession ? <p className="mt-1 text-sm text-white/70">
        {application ? `Application for ${settings.profession} · ${application.status}` : `Apply to mentor in ${settings.profession}. A human reviewer will assess your eligibility.`}
      </p> : <p className="mt-1 text-sm text-white/70">Choose a profession in your profile to apply.</p>}
      {application?.review_note && <p className="mt-2 whitespace-pre-wrap text-sm">{application.review_note}</p>}
      {eligible && <p className="mt-2 text-sm">{remaining_capacity} open {remaining_capacity === 1 ? "place" : "places"} · {isOpen ? (remaining_capacity ? "Accepting requests" : "At capacity") : "Availability paused"}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {settings?.profession && <button className={secondary} disabled={!hydrated || !!busy} onClick={() => setApply(!apply)} aria-expanded={apply}>
          {application?.status === "approved" ? "Edit mentor profile" : application?.status === "pending" ? "Edit application" : "Apply to mentor"}
        </button>}
        {eligible && <button className={button} disabled={!hydrated || !!busy} onClick={() => void update("availability", { open: !isOpen }, () => isOpen ? "Availability paused." : "Availability opened.")}>
          {isOpen ? "Pause requests" : "Start accepting requests"}
        </button>}
      </div>
      {apply && <form method="post" onSubmit={applyForReview} className="mt-4 max-w-2xl space-y-3">
        <label className="block">Mentor bio<textarea className={field} name="bio" minLength={12} maxLength={1000} rows={3} required defaultValue={settings?.mentor_bio ?? ""} /></label>
        <label className="block">Maximum active mentees<input className={field} type="number" name="capacity" min={1} max={10} required defaultValue={settings?.max_mentees ?? 2} /></label>
        <fieldset className="flex flex-wrap gap-3"><legend className="mb-1">Mentoring style</legend>
          {styles.map((style) => <label key={style} className="text-sm"><input type="checkbox" name="style" value={style} defaultChecked={settings?.mentoring_style?.includes(style)} /> {style}</label>)}
        </fieldset>
        <button type="submit" className={button} disabled={!hydrated || !!busy}> {application ? "Save mentor profile" : "Submit application"}</button>
      </form>}
    </section>

    {activeMentor && <section className="space-y-2"><h2 className="text-lg font-semibold">Your mentor</h2>{pairing(activeMentor)}</section>}
    {activeMentees.length > 0 && <section className="space-y-2">
      <h2 className="text-lg font-semibold">Your active mentees</h2>
      <div className="grid gap-3 sm:grid-cols-2">{activeMentees.map(pairing)}</div>
    </section>}

    <div className="grid gap-4 sm:grid-cols-2">
      {(["inbox", "outgoing"] as const).map((direction) => <section key={direction} className={panel}>
        <h2 className="text-lg font-semibold">{direction === "inbox" ? "Mentor inbox" : "Outgoing requests"}</h2>
        {!requests.some((request) => request.direction === direction) && <p className="mt-2 text-sm text-white/70">No requests yet.</p>}
        <ul className="mt-2 space-y-3">
          {requests.filter((request) => request.direction === direction).map((request) => <li key={request.id} className="border-t border-white/10 pt-3">
            <p>{request.name || "Imprint member"} <span className="text-sm text-white/70">· {request.status}</span></p>
            {request.message && <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">{request.message}</p>}
            {direction === "inbox" && request.status === "pending" && <div className="mt-2 flex gap-2">
              <button className={button} disabled={!hydrated || !!busy} onClick={() => void update("decision", { id: request.id, accept: true }, () => "Request accepted.")}>Accept</button>
              <button className={secondary} disabled={!hydrated || !!busy} onClick={() => void update("decision", { id: request.id, accept: false }, () => "Request declined.")}>Decline</button>
            </div>}
          </li>)}
        </ul>
      </section>)}
    </div>

    <section>
      <h2 className="mb-3 text-lg font-semibold">Browse Mentors</h2>
      {directory.length === 0 && <p className="text-white/70">No mentors have open places right now.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {directory.map((mentor) => {
          const previous = requests.find((request) => request.direction === "outgoing" && request.counterpart_id === mentor.id);
          return <article key={mentor.id} className={panel}>
            <h3 className="font-semibold">{mentor.full_name || "Imprint mentor"}</h3>
            <p className="text-sm text-white/70">{mentor.profession} · {mentor.remaining_capacity} open {mentor.remaining_capacity === 1 ? "place" : "places"}</p>
            {mentor.mentor_bio && <p className="mt-2 whitespace-pre-wrap">{mentor.mentor_bio}</p>}
            {!!mentor.mentoring_style?.length && <p className="my-2 text-sm text-white/70">{mentor.mentoring_style.join(" · ")}</p>}
            {!activeMentor && !previous && <button className={secondary + " mt-3"} disabled={!hydrated || !!busy} aria-expanded={composeFor === mentor.id}
              onClick={() => setComposeFor(composeFor === mentor.id ? null : mentor.id)}>Request Mentorship</button>}
            {previous && <p className="mt-2 text-sm text-white/70">Request {previous.status}</p>}
            {composeFor === mentor.id && <form method="post" onSubmit={(event) => requestMentor(event, mentor.id)} className="mt-3 space-y-2">
              <label className="block">Message (optional)<textarea name="message" className={field} maxLength={1000} /></label>
              <button type="submit" className={button} disabled={!hydrated || !!busy}>Send request</button>
            </form>}
          </article>;
        })}
      </div>
    </section>
  </main>;
}
