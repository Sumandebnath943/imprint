"use client";

import { useState } from "react";
import Link from "next/link";
import ScoreReview from "@/components/assessment/ScoreReview";
import { finalWorkspaceForm, getOnboardingWorkspace } from "@/lib/onboarding/workspace-catalog";
import { WorkspaceQuestions, WorkspaceScoring, workspaceRequest, type WorkspaceView } from "./WorkspaceFlow";

export default function WorkspaceCalibration({ roleId, roleName, initial, score }: {
  roleId: string; roleName: string; initial: WorkspaceView; score?: number;
}) {
  const [view, setView] = useState({ ...initial, score });
  const [editing, setEditing] = useState(Boolean(initial.workspace && !initial.workspace.capture_reflections && !initial.workspace.assessment_id && !initial.workspace.answers[6]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [difficulty, setDifficulty] = useState("Basic");
  const work = view.workspace;

  async function open(reassessment: boolean) {
    setBusy(true);
    setError("");
    try {
      const result = await workspaceRequest({ action: "open", reassessment, difficulty });
      if (result.workspace) { setView({ ...result, score: undefined }); setEditing(true); }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The work samples could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="space-y-4" aria-label={`${roleName} calibration`}>
    <h1 className="text-3xl font-semibold">Calibration for {roleName}</h1>
    {!work && <div className="space-y-3 rounded-2xl border border-white/10 p-4">
      <p className="text-sm text-white/75">{view.scoring ? "Complete two work samples for your current profession." : "Work samples are available to practise. Scoring is currently unavailable."}</p>
      {roleId === "software-developer" && <div className="text-sm">
        <label htmlFor="calibration-level">Level</label>
        <select id="calibration-level" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="ml-3 min-h-11 rounded-lg border border-white/10 bg-[#171717] px-3">
          {["Basic", "Intermediate", "Advanced"].map((level) => <option key={level}>{level}</option>)}
        </select>
      </div>}
      <button type="button" onClick={() => open(false)} disabled={busy} className="min-h-11 rounded-xl border border-[#ff955f] px-4 text-sm text-[#ffad89]">
        {busy ? "Opening…" : "Start work samples"}
      </button>
    </div>}
    {work && (editing ? <WorkspaceQuestions key={work.id} initial={work} numbers={[5, 6]} onBack={() => setEditing(false)} onDone={(saved) => {
      setView({ ...view, workspace: saved }); setEditing(false);
    }} /> : <>
      <WorkspaceScoring key={work.id} initial={view} onChange={(next) => setView({ ...next, score: next.score ?? undefined })} />
      {work.assessment_id && <><ScoreReview id={work.assessment_id} />
        {view.scoring && work.form < finalWorkspaceForm(work.role_id, work.difficulty) && <button type="button" onClick={() => open(true)} disabled={busy} className="min-h-11 rounded-xl border border-white/15 px-4 text-sm">
          {busy ? "Opening…" : "Start a reassessment"}
        </button>}
      </>}
      {!work.capture_reflections && !work.assessment_id && <button type="button" onClick={() => setEditing(true)} className="min-h-11 rounded-xl border border-white/15 px-4 text-sm">Edit work samples</button>}
    </>)}
    {error && <p role="alert" className="text-sm text-[#ffad89]">{error}</p>}
    <section aria-label="Role-specific practice" className="grid gap-3 sm:grid-cols-2">
      {[5, 6].map((question) => {
        const task = getOnboardingWorkspace(roleId, question)!;
        return <details key={question} className="rounded-2xl border border-white/10 p-4"><summary className="cursor-pointer font-semibold">Practice · {task.name}</summary>
          <p className="mt-2 text-sm text-white/75">{task.prompt}</p>
          <Link className="mt-2 inline-block text-sm text-[#ffad89] underline" href={`/dashboard/forge?role_practice=${encodeURIComponent(task.criteria[0])}`}>Practice in Forge</Link>
        </details>;
      })}
    </section>
  </section>;
}
