"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CriterionScore } from "@/lib/assessment/rules";

export default function ScoreReview({ id, resolve = false, criteria = [] }: { id: string; resolve?: boolean; criteria?: CriterionScore[] }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [task, setTask] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const correction = resolve && task ? {
        taskId: task, rating: Number(form.get("rating")), evidence: form.get("evidence"), feedback: form.get("feedback"),
      } : undefined;
      const response = await fetch("/api/assessment/appeal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: resolve ? "resolve" : "request", [resolve ? "resolution" : "reason"]: form.get("note"), correction }),
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
      {resolve && criteria.length > 0 && <label className="block">Criterion correction
        <select value={task} onChange={(event) => setTask(event.target.value)} className="mt-1 block w-full rounded bg-[#222] p-2">
          <option value="">Resolve with an explanation</option>
          {criteria.map(({ taskId, skill }) => <option key={taskId} value={taskId}>{skill}</option>)}
        </select>
      </label>}
      {resolve && task && <div className="space-y-2" key={task}>
        <label className="block">Revised rubric rating
          <select name="rating" defaultValue={criteria.find(({ taskId }) => taskId === task)?.rubricRating ?? ""} required className="ml-2 rounded bg-[#222] p-2">
            <option value="" disabled>Choose a rating</option>
            {[0, 1, 2, 3, 4].map((rating) => <option value={rating} key={rating}>{rating}</option>)}
          </select>
        </label>
        <label className="block">Evidence citation
          <textarea name="evidence" minLength={3} maxLength={750} required className="mt-1 block w-full rounded bg-[#222] p-2" />
        </label>
        <label className="block">Feedback
          <textarea name="feedback" minLength={3} maxLength={750} required className="mt-1 block w-full rounded bg-[#222] p-2" />
        </label>
      </div>}
      <button type="submit" disabled={!hydrated || busy} className="rounded border border-white/20 px-3 py-1.5">Submit</button>
      <p role="status">{status}</p>
    </form>
  </details>;
}
