"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/hooks/useHydrated";

export default function MentorReviewForm({ id, profession }: { id: string; profession: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/mentors/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, profession, approved: form.get("decision") === "approve", note: form.get("note") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not save the review."); }
    finally { setBusy(false); }
  }
  return <form method="post" onSubmit={submit} className="mt-4 space-y-3">
    <label className="block">Decision <select className="rounded bg-[#252222] p-2" name="decision" defaultValue="" required>
      <option value="" disabled>Choose a decision</option><option value="approve">Approve</option><option value="decline">Decline</option>
    </select></label>
    <label className="block">Reason shared with the applicant
      <textarea className="mt-1 block w-full rounded bg-[#252222] p-2" name="note" required minLength={12} maxLength={1000} />
    </label>
    <button type="submit" disabled={!hydrated || busy} className="rounded-full bg-[#ff713d] px-4 py-2 font-medium text-black disabled:opacity-50">Save decision</button>
    <p role="status" className="text-sm text-[#ffc2ac]">{error}</p>
  </form>;
}
