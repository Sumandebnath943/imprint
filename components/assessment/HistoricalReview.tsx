"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function HistoricalReview({ sampleId }: { sampleId: string }) {
  const hydrated = useHydrated();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const response = await fetch("/api/assessment/history/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sampleId, decision: form.get("decision"), note: form.get("note"),
          dateCorroborated: form.has("date"), attributionCorroborated: form.has("attribution"),
          comparableConditions: form.has("conditions"),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The review did not save.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The review did not save.");
    } finally {
      setBusy(false);
    }
  }
  return <form method="post" className="space-y-3 text-sm" onSubmit={submit}>
    <label className="block"><input type="checkbox" name="date" /> The source corroborates the work date.</label>
    <label className="block"><input type="checkbox" name="attribution" /> The source and work support the stated contribution.</label>
    <label className="block"><input type="checkbox" name="conditions" /> The work and disclosed conditions support the same criterion.</label>
    <label className="block">Decision
      <select name="decision" className="ml-2 rounded bg-[#222] p-2"><option value="inconclusive">Inconclusive</option><option value="approve">Eligible for scoring</option></select>
    </label>
    <label className="block">Evidence checked and explanation for the user
      <textarea name="note" required minLength={12} maxLength={700} rows={3} className="mt-1 block w-full rounded bg-[#222] p-2" />
    </label>
    <button type="submit" disabled={!hydrated || busy} className="rounded bg-[#ff713d] px-3 py-2 text-black">{busy ? "Saving…" : "Save review"}</button>
    <p role="status">{status}</p>
  </form>;
}
