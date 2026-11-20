"use client";

import { useEffect, useRef, useState } from "react";
import { buildModuleList } from "@/lib/onboarding/modules";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { getOnboardingWorkspace } from "@/lib/onboarding/workspace-catalog";
import { blankWorkspaceAnswer, checkWorkspaceAnswer, WORKSPACE_CONSENT, workspaceQuestionNumbers, type WorkspaceAnswer, type WorkspaceRecord } from "@/lib/onboarding/workspace-contract";
import BottomNav from "@/components/onboarding/BottomNav";
import WorkQuestion from "./WorkQuestion";

export type WorkspaceView = { workspace: WorkspaceRecord | null; scoring: boolean; score?: number | null };
export async function workspaceRequest(input?: unknown, baseline = false, signal?: AbortSignal): Promise<WorkspaceView> {
  const response = await fetch(`/api/onboarding/workspace${baseline ? "?baseline=true" : ""}`, input ? {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal,
  } : { cache: "no-store", signal });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Could not open the workspace.");
  return result;
}

function draftKey(record: WorkspaceRecord, question: number) { return `imprint-workspace-${record.id}-${question}`; }

function initialAnswer(record: WorkspaceRecord, question: number) {
  try {
    const raw = localStorage.getItem(draftKey(record, question));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === record.progress_version) return parsed.answer as WorkspaceAnswer;
    }
  } catch { /* The saved server answer remains available. */ }
  return record.answers[question] ?? blankWorkspaceAnswer();
}

export default function WorkspaceFlow({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const [record, setRecord] = useState<WorkspaceRecord>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void workspaceRequest(undefined, true, controller.signal).then(async (view) => {
      const current = view.workspace ?? (await workspaceRequest({ action: "open" }, false, controller.signal)).workspace;
      if (!controller.signal.aborted && current) setRecord(current);
    }).catch((failure) => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, [attempt]);
  if (error) return <div className="mx-auto max-w-lg px-5 pt-24" role="alert">
    <p>{error}</p><button className="mt-3 underline" onClick={() => { setError(""); setAttempt((value) => value + 1); }}>Try again</button>
  </div>;
  if (!record) return <p role="status" className="p-24">Loading your workspace…</p>;
  return <WorkspaceQuestions initial={record} numbers={[1, 2, 3, 4, 5, 6, 7]} onDone={onComplete} onBack={onBack} />;
}

export function WorkspaceQuestions({ initial, numbers, onDone, onBack }: {
  initial: WorkspaceRecord; numbers: number[]; onDone: (record: WorkspaceRecord) => void; onBack: () => void;
}) {
  const [record, setRecord] = useState(initial);
  const [index, setIndex] = useState(() => {
    const first = numbers.findIndex((question) => !initial.answers[question]);
    return first === -1 ? numbers.length - 1 : first;
  });
  const question = numbers[index];
  const [answer, setAnswer] = useState(() => initialAnswer(initial, question));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const saving = useRef(false);
  const role = findRoleTrack(record.role_id)!;
  const baselineQuestion = buildModuleList(role.cluster)[question - 1];
  const workspace = getOnboardingWorkspace(record.role_id, question, record.form);
  const issue = checkWorkspaceAnswer(record.role_id, question, answer, record.form);
  const isBaseline = numbers.length === 7;

  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0 }); }, [question]);

  function change(value: WorkspaceAnswer) {
    setAnswer(value);
    try { localStorage.setItem(draftKey(record, question), JSON.stringify({ version: record.progress_version, answer: value })); }
    catch { /* Saving each answer to the server still works. */ }
  }

  function move(next: number, snapshot: WorkspaceRecord) {
    setError("");
    setIndex(next);
    setAnswer(initialAnswer(snapshot, numbers[next]));
  }

  async function advance() {
    if (busy || saving.current) return;
    if (record.assessment_id) { if (index === numbers.length - 1) onDone(record); else move(index + 1, record); return; }
    if (issue) { setError(issue); return; }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const { workspace: saved } = await workspaceRequest({ action: "save", id: record.id, version: record.progress_version, question, answer });
      if (!saved) throw new Error("No saved workspace was returned.");
      try { localStorage.removeItem(draftKey(record, question)); } catch { /* The response was saved. */ }
      setRecord(saved);
      if (index === numbers.length - 1) onDone(saved);
      else move(index + 1, saved);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The answer could not be saved.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return <div className={`mx-auto grid w-full max-w-6xl gap-6 px-5 pb-12 md:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10 ${isBaseline ? "pt-24" : "pt-6"}`}>
    <section aria-labelledby="workspace-question-title">
      <p className="mb-3 text-sm font-semibold text-[#ffa17a]">Question {index + 1} of {numbers.length}</p>
      <h1 id="workspace-question-title" tabIndex={-1} ref={heading} className="text-3xl font-bold md:text-4xl">
        {workspace?.name ?? baselineQuestion.headline}
      </h1>
      <p className="mt-2 text-sm text-white/70">{baselineQuestion.name}{workspace ? ` · ${role.name}` : ""}</p>
      <div className="mt-5 whitespace-pre-line rounded-2xl border border-white/10 bg-white/[0.03] p-5 leading-relaxed text-white/80">
        {workspace?.prompt ?? baselineQuestion.prompt}
      </div>
    </section>
    <section aria-label="Response workspace" className="min-w-0 rounded-2xl border border-white/10 bg-[#141415] p-4 sm:p-6">
      <WorkQuestion key={`${record.id}-${question}`} record={record} question={question} answer={answer} onChange={change} busy={busy}
        onBusy={setBusy} onError={setError} />
      <p className="mt-4 text-sm text-white/70" role="status">{busy ? "Saving or uploading…" : record.answers[question] &&
        JSON.stringify(record.answers[question]) === JSON.stringify(answer) ? "Response saved" : "Changes stay in this browser until you continue."}</p>
      {error && <p role="alert" className="mt-2 text-sm text-[#ffad89]">{error}</p>}
      <BottomNav inline step={5} total={7} onBack={() => {
        if (busy) return;
        if (index === 0) onBack(); else move(index - 1, record);
      }} onContinue={advance} continueDisabled={busy} continueLabel={index === numbers.length - 1 ? "Save and continue" : "Continue →"} />
    </section>
  </div>;
}

export function WorkspaceScoring({ initial, onChange, onBusy, onboarding = false }: {
  initial: WorkspaceView; onChange?: (view: WorkspaceView) => void; onBusy?: (busy: boolean) => void; onboarding?: boolean;
}) {
  const [view, setView] = useState(initial);
  const [consent, setConsent] = useState(false);
  const [share, setShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const workspace = view.workspace;
  if (!workspace) return null;
  const required = workspaceQuestionNumbers(workspace);
  const complete = required.every((question) => workspace.answers[question]);

  async function score() {
    if (!workspace || busy || !consent) return;
    setBusy(true);
    onBusy?.(true);
    setError("");
    try {
      const result = await workspaceRequest({ action: "score", id: workspace.id, version: workspace.progress_version,
        consent: WORKSPACE_CONSENT, shareReasoning: share });
      setView(result);
      onChange?.(result);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Scoring is temporarily unavailable.");
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  }

  return <section aria-label="Score your work" className="space-y-3 rounded-2xl border border-white/10 p-4 text-left">
    <h2 className="font-semibold">{workspace.assessment_id ? "Assessment saved" : "Evaluate your work sample"}</h2>
    {typeof view.score === "number" && <p className="text-xl font-semibold text-[#ffad89]">{view.score}/100 · work-sample proficiency</p>}
    {!complete && <p className="text-sm text-white/70">Save every question before requesting an assessment.</p>}
    {complete && !workspace.assessment_id && !view.scoring && <p className="text-sm text-white/70">Scoring is currently unavailable. Your work is saved.</p>}
    {complete && !workspace.assessment_id && view.scoring && <>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
        I consent to sending my profession work samples to Gemini, with Groq as a fallback where supported.</label>
      {onboarding && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={share} onChange={(event) => setShare(event.target.checked)} />
        Also evaluate the reasoning I chose to share in Questions 1–3. My emotional and personal reflections stay private.</label>}
      <button type="button" disabled={!consent || busy} className="min-h-11 rounded-xl border border-[#ff955f] px-4 text-sm font-semibold text-[#ffad89] disabled:opacity-50" onClick={score}>
        {busy ? "Evaluating your evidence…" : workspace.feedback ? "Retry assessment" : "Evaluate my work"}
      </button>
    </>}
    {workspace.feedback && <ul className="space-y-3 text-sm text-white/80" aria-label="Criterion feedback">
      {workspace.feedback.map((item) => <li key={`${item.question}-${item.skill}`} className="border-t border-white/10 pt-2">
        <p className="font-semibold">Q{item.question} · {item.skill} · {item.rating === null ? "Insufficient evidence" : `${item.rating}/4`}</p>
        {item.evidence && <p className="mt-1">{item.evidence}</p>}<p className="mt-1 text-white/70">{item.feedback}</p>
      </li>)}
    </ul>}
    {error && <p role="alert" className="text-sm text-[#ffad89]">{error}</p>}
  </section>;
}
