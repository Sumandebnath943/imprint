"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ASSESSMENT_CONSENT_VERSION } from "@/lib/assessment/rules";

type Criterion = { id: string; skill: string; mode: string };
type Sample = { id: string; criterion_id: string; status: string; work_date: string; review_note: string | null; consent_version: string };

const field = "mt-1 block w-full rounded-lg border border-white/15 bg-[#151414] p-2 text-white";

export default function PastWork({ roleId, criteria, samples, scoringEnabled }: {
  roleId: string; criteria: Criterion[]; samples: Sample[]; scoringEnabled: boolean;
}) {
  const hydrated = useHydrated();
  const [selected, setSelected] = useState(criteria[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();
  const isImage = criteria.find((item) => item.id === selected)?.mode === "image";

  async function request(method: "POST" | "PATCH" | "DELETE", body: FormData | string, form?: HTMLFormElement) {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/assessment/history", {
        method, body, headers: typeof body === "string" ? { "Content-Type": "application/json" } : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update your samples.");
      const notices = { POST: "Submitted for independent review.", PATCH: "Permission renewed.", DELETE: "Sample removed." };
      setStatus(notices[method]);
      form?.reset();
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update your samples.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("roleId", roleId);
    form.set("consentVersion", ASSESSMENT_CONSENT_VERSION);
    void request("POST", form, event.currentTarget);
  }

  return (
    <details className="space-y-4">
      <summary className="cursor-pointer font-medium text-[#ff9c77]">Manage earlier work</summary>
      <p className="text-sm text-white/70">Submit two distinct dated pieces for the same skill and earlier period. Use work you can share and describe your own contribution and any assistance.</p>
      {samples.length > 0 && <ul className="divide-y divide-white/10">
        {samples.map((sample) => <li key={sample.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="text-sm">
            <p>{criteria.find((item) => item.id === sample.criterion_id)?.skill} · {sample.work_date} · {sample.status}</p>
            {sample.review_note && <p className="text-white/65">{sample.review_note}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            {scoringEnabled && sample.status === "pending" && sample.consent_version !== ASSESSMENT_CONSENT_VERSION && (
              <button type="button" disabled={busy} className="text-sm text-[#ff9c77] underline" onClick={() => {
                if (window.confirm("May Google Gemini, or Groq if Gemini is unavailable, score this sample after independent review?")) {
                  void request("PATCH", JSON.stringify({ id: sample.id, consent: true, consentVersion: ASSESSMENT_CONSENT_VERSION }));
                }
              }}>Renew scoring permission</button>
            )}
            <button type="button" disabled={busy} className="text-sm text-[#ff9c77] underline"
              onClick={() => { if (window.confirm("Remove this sample and recalculate your comparison?")) void request("DELETE", JSON.stringify({ id: sample.id })); }}>Remove sample</button>
          </div>
        </li>)}
      </ul>}
      {scoringEnabled && <form method="post" encType="multipart/form-data" className="space-y-3 text-sm" onSubmit={submit}>
        <label className="block">Skill
          <select name="criterionId" className={field} value={selected} onChange={(event) => setSelected(event.target.value)}>
            {criteria.map((criterion) => <option key={criterion.id} value={criterion.id}>{criterion.skill}</option>)}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>Work date<input type="date" name="workDate" className={field} required /></label>
          <label>End of the earlier period<input type="date" name="priorPeriodEnd" className={field} required /></label>
        </div>
        <label className="block">Dated source showing publication or version history<input className={field} type="url" name="sourceUrl" maxLength={600} required /></label>
        <label className="block">Your contribution<textarea className={field} name="contribution" minLength={8} maxLength={450} required /></label>
        <label className="block">Tools or assistance used<textarea className={field} name="toolContext" minLength={3} maxLength={450} required /></label>
        <label className="block">{isImage ? "Image or score excerpt" : "Text or code file (optional)"}
          <input key={selected} className={field} type="file" name="file" required={isImage}
            accept={isImage ? "image/jpeg,image/png,image/webp" : ".txt,.md,.csv,.js,.ts"} />
        </label>
        {!isImage && <label className="block">Or enter a work excerpt<textarea className={field} name="content" rows={5} maxLength={10000} /></label>}
        <label className="flex gap-2">
          <input type="checkbox" name="consent" value="yes" required />
          I agree to independent provenance review and to sending qualifying work to Google Gemini for rubric scoring, with Groq as a fallback.
        </label>
        <button type="submit" disabled={!hydrated || busy} className="min-h-10 rounded-full bg-[#ff713d] px-4 py-2 font-semibold text-black disabled:opacity-50">Submit sample</button>
      </form>}
      <p role="status" className="text-sm">{busy ? "Saving…" : status}</p>
    </details>
  );
}
