"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { ASSESSMENT_CONSENT_VERSION, type CriterionScore, type RoleAnswer } from "@/lib/assessment/rules";
import VoiceRecorder from "@/components/onboarding/VoiceRecorder";
import ScoreReview from "./ScoreReview";
import { SCORING_LABELS, type ScoringAvailability } from "@/lib/assessment/availability";
import { CodeWorkspace, TestResults } from "./CodeWorkspace";
import type { CodeChecks } from "@/lib/assessment/code-checks";
import type { getPublicTasks } from "@/lib/assessment/rules";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

type Task = ReturnType<typeof getPublicTasks>[number];
type Attempt = {
  id: string;
  status: "draft" | "scored";
  score: number | null;
  answers: Record<string, RoleAnswer>;
  progress_version: number;
  results?: { criteria: CriterionScore[] };
  check_results?: CodeChecks | null;
};
type View = { available?: boolean; availability?: ScoringAvailability; attempt?: Attempt | null; tasks?: Task[]; version?: number; consentRequired?: boolean };

async function assessmentRequest(input: unknown): Promise<View> {
  const response = await fetch("/api/assessment", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "The assessment is unavailable.");
  return data;
}

const field = "mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white focus:outline focus:outline-[#ff8054]";
const button = "inline-flex min-h-11 items-center rounded-full bg-[#ff713d] px-5 py-2 font-semibold text-[#15100e] disabled:opacity-50";

export default function RoleAssessment({ roleName }: { roleName: string }) {
  const role = findRoleTrack(roleName);
  const [view, setView] = useState<View>({});
  const [answers, setAnswers] = useState<Record<string, RoleAnswer>>({});
  const [phase, setPhase] = useState<"loading" | "intro" | "editing" | "result" | "unavailable">("loading");
  const [context, setContext] = useState("");
  const [consent, setConsent] = useState(false);
  const [independentAttempt, setIndependentAttempt] = useState(false);
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("");
  const paired = role?.id === "illustrator";

  useEffect(() => {
    if (!role) { setPhase("unavailable"); return; }
    const controller = new AbortController();
    fetch(`/api/assessment?role=${encodeURIComponent(role.id)}`, { signal: controller.signal })
      .then(async (response) => {
        const data: View & { error?: string } = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Cannot load assessments.");
        if (controller.signal.aborted) return;
        setView(data);
        setAnswers(data.attempt?.answers ?? {});
        setPhase(data.attempt?.status === "scored" ? "result" : data.attempt && !data.consentRequired ? "editing" :
          data.available ? "intro" : "unavailable");
      }).catch((error) => {
        if (!controller.signal.aborted) { setPhase("unavailable"); setStatus(String(error.message)); }
      });
    return () => controller.abort();
  }, [role]);

  const change = (id: string, patch: Partial<RoleAnswer>) =>
    setAnswers((previous) => ({ ...previous, [id]: { ...(previous[id] ?? { text: "" }), ...patch } }));

  async function start() {
    if (!role || !consent || busy) return;
    setBusy("Starting…");
    setStatus("");
    try {
      const result = await assessmentRequest({ action: "start", role: role.id, context, consent, consentVersion: ASSESSMENT_CONSENT_VERSION });
      setView({ ...result, available: true });
      const saved = result.attempt?.answers ?? {};
      const coding = result.tasks?.find(({ exercise }) => exercise);
      setAnswers(coding && coding.exercise && !saved[coding.id] ? {
        ...saved, [coding.id]: { text: coding.exercise.files["total.js"] },
      } : saved);
      setIndependentAttempt(false);
      setPhase("editing");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not start.");
    } finally {
      setBusy("");
    }
  }

  async function save(score: boolean) {
    const attempt = view.attempt;
    if (!attempt || busy) return;
    setBusy(score ? "Saving and scoring…" : "Saving…");
    setStatus("");
    try {
      const saved = await assessmentRequest({ action: "save", id: attempt.id, version: attempt.progress_version, answers });
      const version = saved.version ?? attempt.progress_version;
      setView({ ...view, attempt: { ...attempt, answers, progress_version: version, check_results: null } });
      if (score) {
        const result = await assessmentRequest({ action: "score", id: attempt.id, version, independentAttempt });
        setView({ ...view, attempt: result.attempt });
        setPhase("result");
      } else {
        setStatus("Progress saved.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save progress.");
    } finally {
      setBusy("");
    }
  }

  async function upload(taskId: string, blob: Blob, filename?: string) {
    if (!view.attempt || busy) return;
    setBusy("Uploading…");
    setStatus("");
    try {
      const form = new FormData();
      form.append("attemptId", view.attempt.id);
      form.append("taskId", taskId);
      form.append("file", blob, filename ?? "recording.webm");
      const response = await fetch("/api/assessment/evidence", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not upload evidence.");
      change(taskId, { evidencePath: data.path });
      setStatus("Attachment added. Save progress to keep it with this attempt.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not upload evidence.");
    } finally {
      setBusy("");
    }
  }

  const chooseFile = (taskId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void upload(taskId, file, file.name);
  };

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-2"
      onCopyCapture={(event) => event.preventDefault()}
      onPasteCapture={(event) => event.preventDefault()}>
      <div>
        <h1 className="text-3xl font-semibold">{role?.name ?? "Role"} assessment</h1>
        {phase !== "unavailable" && <p className="mt-2 text-white/65">Allow 20–30 minutes. You can save and return later.</p>}
      </div>
      {phase === "loading" && <p role="status">Loading your assessment…</p>}
      {phase === "unavailable" && <p className="text-white/70">{SCORING_LABELS[view.availability ?? "unavailable"]}</p>}
      {phase === "intro" && role && (
        <div className="space-y-4 rounded-2xl border border-white/10 p-5">
          <h2 className="text-lg font-semibold">{view.attempt ? "Resume your saved work" : "First assessment ready"}</h2>
          <label className="block">{role.intake}
            <input className={field} value={context} onChange={(event) => setContext(event.target.value)} maxLength={200} />
          </label>
          <p className="text-sm text-white/70">Use your own judgment and abilities. Follow the task’s material and tool instructions. Use fictional or provided information only.</p>
          <label className="flex items-start gap-3 text-sm">
            <input className="mt-1" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>I agree to have my assessment responses and submitted media processed by Google Gemini or its fallback, Groq, for scoring or transcription. <Link className="underline" href="/privacy" target="_blank">Privacy details</Link></span>
          </label>
          <button className={button} disabled={!consent || !!busy} onClick={start}>Begin assessment</button>
        </div>
      )}
      {phase === "editing" && (
        <>
          <h2 className="text-lg font-semibold">{busy === "Saving and scoring…" ? "Scoring pending" : "Your assessment workspace"}</h2>
          {view.available === false && <p className="text-sm text-white/70">{SCORING_LABELS[view.availability ?? "unavailable"]}. You can save your draft.</p>}
          {paired && <div className="grid grid-cols-2 gap-3" aria-label="Compare original and revision">
            <ArtifactPreview label="Original" path={answers[view.tasks?.[0]?.id ?? ""]?.evidencePath} />
            <ArtifactPreview label="Revision" path={answers[view.tasks?.[1]?.id ?? ""]?.evidencePath} />
          </div>}
          {view.tasks?.map((task, index) => (
            <fieldset key={task.id} disabled={!!busy} className="space-y-3 rounded-2xl border border-white/10 p-5">
              <legend className="px-2 font-medium">{task.skill}</legend>
              <p className="text-white/90">{task.prompt}</p>
              <p className="text-sm text-white/75">{task.criterion}</p>
              {task.anchors && <details className="text-sm text-white/75">
                <summary className="cursor-pointer text-[#ffad89]">View the scoring rubric</summary>
                <ol start={0} className="mt-2 list-decimal space-y-1 pl-5">{task.anchors.map((anchor) => <li key={anchor}>{anchor}</li>)}</ol>
              </details>}
              <p className="text-sm text-white/65">{index === 0 ? "Suggested time 12–16 minutes" : "Suggested time 8–14 minutes"}</p>
              {task.mode === "voice" && <VoiceRecorder onRecordingComplete={(blob) => void upload(task.id, blob)}
                onRecordingCleared={() => change(task.id, { evidencePath: undefined })} />}
              {task.mode === "voice" && <p className="text-sm text-white/70">Scoring uses the spoken words in the transcript or your written response.</p>}
              {(task.mode === "image" || task.mode === "voice") && (
                <label className="block text-sm">
                  {task.mode === "image" ? "Upload your image" : "Choose a recording or use the written response"}
                  <input type="file" className={field} accept={task.mode === "image" ? "image/jpeg,image/png,image/webp" : "audio/*,video/webm,video/mp4"}
                    onChange={(event) => chooseFile(task.id, event)} />
                  {answers[task.id]?.evidencePath && <span className="mt-2 block">Attachment selected</span>}
                </label>
              )}
              {task.exercise ? <CodeWorkspace brief={task.exercise} key={task.exercise.id}
                files={{ "total.js": answers[task.id]?.text ?? task.exercise.files["total.js"] }}
                onChange={(_name, text) => change(task.id, { text })}
                savedResults={answers[task.id]?.text === view.attempt?.answers[task.id]?.text ? view.attempt?.check_results : null} /> : <label className="block text-sm">
                {task.mode === "image" ? paired ? "Rationale for your visual choices" : "Notes about your artifact" : task.mode === "voice" && answers[task.id]?.evidencePath ? "Optional recording notes" : "Your response"}
                <textarea className={`${field} ${task.mode === "code" ? "font-mono" : ""}`} rows={5} maxLength={12000}
                  value={answers[task.id]?.text ?? ""} onChange={(event) => change(task.id, { text: event.target.value })}
                  onDrop={(event) => event.preventDefault()} />
              </label>}
              {task.check && <label className="block text-sm">{task.check}
                <input className={field} inputMode="decimal" maxLength={40} value={answers[task.id]?.checkValue ?? ""}
                  onChange={(event) => change(task.id, { checkValue: event.target.value })} />
              </label>}
            </fieldset>
          ))}
          <label className="flex gap-3 text-sm">
            <input type="checkbox" checked={independentAttempt} onChange={(event) => setIndependentAttempt(event.target.checked)} />
            I performed the core work myself under the stated conditions.
          </label>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full border border-white/20 px-5 py-2" disabled={!!busy} onClick={() => save(false)}>Save progress</button>
            <button className={button} disabled={!!busy || !independentAttempt || view.available === false} onClick={() => save(true)}>Submit for scoring</button>
          </div>
        </>
      )}
      {phase === "result" && view.attempt && (
        <div className="space-y-5 rounded-2xl border border-white/10 p-5">
          <p className="text-xl">Current proficiency <strong className="ml-2 text-[#ff9c77]">{view.attempt.score}/100</strong></p>
          {view.attempt.check_results && <details><summary className="cursor-pointer">Deterministic submission checks</summary><TestResults result={view.attempt.check_results} /></details>}
          {view.attempt.results?.criteria.map((criterion) => (
            <div className="border-t border-white/10 pt-3" key={criterion.taskId}>
              <p className="font-medium">{criterion.skill} · {criterion.score}/100</p>
              <p className="my-1 text-sm text-white/65">Evidence · {criterion.evidence}</p>
              <p className="text-sm">{criterion.feedback}</p>
            </div>
          ))}
          <ScoreReview id={view.attempt.id} />
          <button className={button} onClick={() => { setConsent(false); setStatus(""); setPhase("intro"); }}>Start a reassessment</button>
        </div>
      )}
      <p role="status" className={status && status !== "Progress saved." ? "text-[#ffa685]" : "text-white/70"}>{busy || status}</p>
    </section>
  );
}

function ArtifactPreview({ label, path }: { label: string; path?: string }) {
  const [image, setImage] = useState<{ path: string; url?: string }>();
  useEffect(() => {
    if (!path) return;
    let active = true;
    void createClient().storage.from("assessment-evidence").createSignedUrl(path, 3600).then(({ data }) => {
      if (active) setImage({ path, url: data?.signedUrl });
    });
    return () => { active = false; };
  }, [path]);
  return <figure className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
    {image?.url && image.path === path ? <Image unoptimized src={image.url} alt={`Your submitted ${label.toLowerCase()} illustration`} width={420} height={260}
      className="h-40 w-full object-contain sm:h-60" /> : <div className="flex h-40 items-center justify-center px-3 text-center text-sm text-white/70 sm:h-60">
      {path ? image?.path === path ? "Preview unavailable. Reload to try again." : "Preview loading…" : "Upload an image below"}
    </div>}
    <figcaption className="border-t border-white/10 px-3 py-2 text-sm text-white/85">{label}</figcaption>
  </figure>;
}
