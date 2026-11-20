"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RescheduleTask({ id }: { id: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  async function reschedule() {
    setSaving(true);
    try {
      const response = await fetch("/api/assessment/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, kind: "reschedule" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not move this task.");
    } finally { setSaving(false); }
  }
  return <div className="mt-2 text-sm">
    <button type="button" className="text-[#ff9c77] underline disabled:opacity-60" onClick={reschedule} disabled={saving}>
      Move deadline by two days
    </button>
    <p role="status">{status}</p>
  </div>;
}
