"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ProgressPreferences({ reminderEmails, journalDays }: { reminderEmails: boolean; journalDays: number }) {
  const hydrated = useHydrated();
  const [status, setStatus] = useState("");
  const router = useRouter();
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("Saving…");
    try {
      const response = await fetch("/api/assessment/preferences", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderEmails: form.has("email"), journalDays: Number(form.get("days")),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
        }),
      });
      if (!response.ok) throw new Error();
      setStatus("Preferences saved.");
      router.refresh();
    } catch { setStatus("Could not save preferences. Try again."); }
  }
  return <details className="mt-3 text-sm">
    <summary className="cursor-pointer text-[#ff9c77]">Task and journal preferences</summary>
    <form method="post" onSubmit={save} className="mt-3 space-y-3">
      <label className="block"><input type="checkbox" name="email" defaultChecked={reminderEmails} /> Email me about scheduled, upcoming, and overdue tasks</label>
      <label className="block">Journal days per week
        <select name="days" defaultValue={journalDays} className="ml-2 rounded bg-[#242121] p-2">
          <option value={0}>No goal</option>
          {Array.from({ length: 7 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}
        </select>
      </label>
      <button type="submit" disabled={!hydrated} className="rounded-full border border-white/20 px-3 py-1.5">Save preferences</button>
      <p role="status">{status}</p>
    </form>
  </details>;
}
