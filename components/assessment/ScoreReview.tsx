"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ScoreReview({ id, resolve = false }: { id: string; resolve?: boolean }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/assessment/appeal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: resolve ? "resolve" : "request", [resolve ? "resolution" : "reason"]: form.get("note") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setStatus(resolve ? "Review resolved." : "Review requested.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save the review.");
    } finally {
      setBusy(false);
    }
  }
  return <details className="mt-3 text-sm">
    <summary className="cursor-pointer text-[#ff9c77]">{resolve ? "Record a review outcome" : "Request a score review"}</summary>
    <form method="post" className="mt-3 space-y-2" onSubmit={submit}>
      <label className="block">{resolve ? "Explain the outcome and any next step" : "Describe the criterion or evidence you want reviewed"}
        <textarea className="mt-1 block w-full rounded bg-[#222] p-2" name="note" rows={3} minLength={12} maxLength={1200} required />
      </label>
      {!resolve && <p className="text-white/65">This shares the assessment and your explanation with an authorized reviewer.</p>}
      <button type="submit" disabled={!hydrated || busy} className="rounded border border-white/20 px-3 py-1.5">Submit</button>
      <p role="status">{status}</p>
    </form>
  </details>;
}
