"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { CodeWorkspace } from "@/components/assessment/CodeWorkspace";
import VoiceRecorder from "@/components/onboarding/VoiceRecorder";
import { getOnboardingWorkspace, getWorkspaceExercise } from "@/lib/onboarding/workspace-catalog";
import { BEAT_NOTES, BELIEF_TOPICS, bookingObservation, contrastRatio, MEMORIES, REFLECTIONS, rubricAnchors, type WorkspaceAnswer, type WorkspaceRecord } from "@/lib/onboarding/workspace-contract";

const field = "mt-1.5 w-full rounded-xl border border-white/15 bg-[#101011] px-3 py-2 text-base text-white focus-visible:outline-[#ff955f]";
const button = "min-h-10 rounded-lg border border-white/20 px-3 py-2 text-sm text-white disabled:opacity-50";

export default function WorkQuestion({ record, question, answer, onChange, busy, onBusy, onError }: {
  record: WorkspaceRecord; question: number; answer: WorkspaceAnswer; onChange: (answer: WorkspaceAnswer) => void;
  busy: boolean; onBusy: (busy: boolean) => void; onError: (message: string) => void;
}) {
  const workspace = getOnboardingWorkspace(record.role_id, question, record.form);
  const reflections = REFLECTIONS[question];
  const fields = workspace?.fields ?? reflections.fields;
  const criteria = workspace?.criteria ?? reflections.criteria;
  const previous = question === 6 ? record.answers[5] : undefined;
  const previousWorkspace = question === 6 ? getOnboardingWorkspace(record.role_id, 5, record.form) : undefined;
  const [showSketch, setShowSketch] = useState(false);
  const choiceId = useId();

  const setValue = (kind: "fields" | "choices", index: number, value: string) => {
    const next = Array.from({ length: Math.max(answer[kind].length, index + 1) }, (_, i) => i === index ? value : answer[kind][i] ?? "");
    onChange({ ...answer, [kind]: next });
  };

  async function upload(blob: Blob, filename: string) {
    if (busy) return;
    onBusy(true);
    onError("");
    try {
      const body = new FormData();
      body.set("id", record.id);
      body.set("question", String(question));
      body.set("file", blob, filename);
      const response = await fetch("/api/onboarding/workspace/evidence", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      onChange({ ...answer, artifact: payload.path, alternative: false });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Evidence could not be uploaded.");
    } finally {
      onBusy(false);
    }
  }

  const editor = (label: string, index: number) => <label key={label} className="block text-sm font-medium">
    {label}<textarea rows={label === "Draft" ? 7 : 3} className={field}
      value={answer.fields[index] ?? ""} maxLength={8000} onChange={(event) => setValue("fields", index, event.target.value)} />
  </label>;
  const select = (label: string, options: readonly string[], index: number) => <div key={label} className="text-sm font-medium">
    <label htmlFor={`${choiceId}-${index}`}>{label}</label>
    <select id={`${choiceId}-${index}`} className={field} value={answer.choices[index] ?? ""} onChange={(event) => setValue("choices", index, event.target.value)}>
      <option value="">Choose an option</option>{options.map((option) => <option key={option}>{option}</option>)}
    </select>
  </div>;

  return <fieldset disabled={busy || Boolean(record.assessment_id)} className="min-w-0 space-y-4">
    <legend className="mb-2 px-1 text-sm font-semibold text-[#ffad89]">{workspace?.name ?? "Your private response"}</legend>
    {!workspace && <p className="text-sm text-white/75">{reflections.mechanism}</p>}
    {workspace?.artifact && <label className="flex items-start gap-2 text-sm text-white/80"><input type="checkbox"
      checked={Boolean(answer.alternative)} onChange={(event) => onChange({ ...answer, alternative: event.target.checked, artifact: undefined })} />
      Use a planning description instead of uploading an artifact.</label>}
    {answer.alternative && <p className="text-sm text-white/75">Describe what you would create, where the evidence would appear, and what you would change. Planning feedback appears separately from artifact proficiency.</p>}
    {question === 1 && select("Opinion topic", BELIEF_TOPICS, 0)}
    {question === 3 ? <div className="space-y-3">
      {MEMORIES.map((topic, index) => <div key={topic}>
        <label className="flex gap-3 text-sm">
          <input type="checkbox" checked={answer.choices.includes(topic)} disabled={!answer.choices.includes(topic) && answer.choices.length >= 3}
            onChange={(event) => onChange({ ...answer, choices: event.target.checked ? [...answer.choices, topic] : answer.choices.filter((value) => value !== topic) })} />
          {topic}
        </label>
        {answer.choices.includes(topic) && editor(topic, index)}
      </div>)}
      <p role="status" className="text-sm text-white/70">{answer.choices.length} of 3 selected</p>
    </div> : fields.map(editor)}

    {previous && <details open={Boolean(previous.artifact)} className="rounded-xl border border-white/10 p-3">
      <summary className="cursor-pointer text-sm font-semibold">Compare with your first work sample</summary>
      {previous.artifact && <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Artifact path={previous.artifact} label="Original work sample" />
        {answer.artifact && <Artifact path={answer.artifact} label="Revised work sample" />}
      </div>}
      {previous.fields.map((value, index) => <div key={index} className="mt-3 text-sm">
        <p className="font-medium text-white/70">{previousWorkspace?.fields[index]}</p><p className="whitespace-pre-wrap break-words">{value}</p>
      </div>)}
      {previous.files && <p className="mt-3 text-sm text-white/70">This question uses the saved code from Question 5.</p>}
    </details>}

    {workspace?.checks?.map((check, index) => "options" in check ? select(check.label, check.options, index) : <label key={check.label} className="block text-sm font-medium">
      {check.label}<input type="number" step="any" className={field} value={answer.choices[index] ?? ""}
        onChange={(event) => setValue("choices", index, event.target.value)} />
    </label>)}
    {workspace?.order && <div className="space-y-2 rounded-xl border border-white/10 p-3">
      <p className="text-sm font-semibold">Build your sequence</p>
      <ol className="space-y-1" aria-label="Your sequence">
        {answer.order.map((item, index) => <li key={item} className="flex items-center justify-between gap-2 text-sm">
          <span>{index + 1}. {item}</span><button type="button" className={button} onClick={() => onChange({ ...answer, order: answer.order.filter((value) => value !== item) })}>Remove {item}</button>
        </li>)}
      </ol>
      <div className="flex flex-wrap gap-2">{workspace.order.filter((item) => !answer.order.includes(item)).map((item) => <button key={item} type="button"
        className={button} onClick={() => onChange({ ...answer, order: [...answer.order, item] })}>Add {item}</button>)}</div>
    </div>}
    {workspace?.simulator && <BookingSimulator question={question} observations={answer.observations ?? []}
      onObserve={(observations) => onChange({ ...answer, observations })} />}
    {record.role_id === "designer" && workspace && !answer.alternative && <PaletteCheck values={answer.palette}
      onChange={(palette) => onChange({ ...answer, palette })} />}
    {record.role_id === "musician" && workspace && <BeatGrid values={answer.beatGrid}
      onChange={(beatGrid) => onChange({ ...answer, beatGrid })} />}
    {workspace?.code && <><p className="rounded-xl border border-white/10 p-3 text-sm text-white/80">{getWorkspaceExercise(record.form, record.difficulty).brief}</p>
      <CodeWorkspace brief={getWorkspaceExercise(record.form, record.difficulty)}
      files={answer.files ?? getWorkspaceExercise(record.form, record.difficulty).files}
      onChange={(name, text) => onChange({ ...answer, files: { ...(answer.files ?? getWorkspaceExercise(record.form, record.difficulty).files), [name]: text } })} /></>}

    {((workspace?.artifact && !answer.alternative) || question === 4 || question === 7) && <div className="space-y-3 rounded-xl border border-white/10 p-3">
      <label className="block text-sm font-medium">{workspace?.artifact ? `Upload ${workspace.artifact} evidence` : question === 4 ? "Attach a private voice recording" : "Attach a private photo, sketch, or voice recording"}
        <input type="file" className={field} accept={workspace?.artifact ? `${workspace.artifact}/*` : question === 4 ? "audio/*" : "audio/*,image/*"} onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file, file.name);
        }} />
      </label>
      <p className="text-xs text-white/65">Use your own or consented materials. Files up to 4 MB.</p>
      {(question === 4 || question === 7) && <details><summary className="cursor-pointer text-sm">Record your response</summary>
        <VoiceRecorder onRecordingComplete={(blob) => { void upload(blob, "reflection"); }} /></details>}
      {(workspace?.artifact === "image" || question === 7) && <>
        <button type="button" className={button} onClick={() => setShowSketch(!showSketch)}>{showSketch ? "Hide sketch pad" : "Open sketch pad"}</button>
        {showSketch && <SketchPad onAttach={(blob) => void upload(blob, "sketch.png")} />}
      </>}
      {answer.artifact && <>
        <Artifact path={answer.artifact} label="Your saved evidence" />
        <button type="button" className={button} onClick={() => onChange({ ...answer, artifact: undefined })}>Remove attachment from this answer</button>
      </>}
    </div>}
    <details className="rounded-xl border border-white/10 p-3">
      <summary className="cursor-pointer text-sm font-semibold">{question === 4 || question === 7 ? "Private reflection check" : "How this answer is assessed"}</summary>
      {criteria.map((skill) => <div key={skill} className="mt-3 text-sm text-white/80"><p className="font-semibold">{skill}</p>
        {question !== 4 && question !== 7 && !answer.alternative && <ul className="mt-1 space-y-1">{rubricAnchors(skill).map((line) => <li key={line}>{line}</li>)}</ul>}
      </div>)}
    </details>
  </fieldset>;
}

function PaletteCheck({ values = ["#101011", "#ffffff"], onChange }: { values?: string[]; onChange: (colors: string[]) => void }) {
  const ratio = contrastRatio(values[0], values[1]);
  return <div aria-label="Text contrast checker" className="space-y-2 rounded-xl border border-white/10 p-3">
    <p className="font-medium">Record your text and background colors</p>
    <div className="flex flex-wrap gap-4">{["Text color", "Background color"].map((label, index) => <label key={label} className="flex items-center gap-2 text-sm">{label}
      <input type="color" value={values[index]} onChange={(event) => onChange(values.map((color, at) => at === index ? event.target.value : color))} />
    </label>)}</div>
    <p className="rounded-lg px-3 py-2" style={{ color: values[0], background: values[1] }}>Event details and registration</p>
    <p className="text-sm text-white/75">Recorded contrast {ratio.toFixed(2)}:1 · Exercise target 4.5:1</p>
    <button type="button" className={button} onClick={() => onChange(values)}>Record these colors</button>
  </div>;
}

function BeatGrid({ values = Array<string>(16).fill("Rest"), onChange }: { values?: string[]; onChange: (notes: string[]) => void }) {
  const [playing, setPlaying] = useState(false);
  async function play() {
    const context = new AudioContext();
    setPlaying(true);
    try {
      await context.resume();
      const start = context.currentTime + 0.05;
      values.forEach((note, beat) => {
        const index = BEAT_NOTES.indexOf(note);
        if (index <= 0) return;
        const oscillator = context.createOscillator(); const volume = context.createGain();
        oscillator.frequency.value = 261.63 * 2 ** ((index - 1) / 12);
        volume.gain.value = 0.12;
        oscillator.connect(volume); volume.connect(context.destination);
        oscillator.start(start + beat * 0.27); oscillator.stop(start + beat * 0.27 + 0.20);
      });
      await new Promise((resolve) => setTimeout(resolve, 4400));
    } finally { if (context.state !== "closed") await context.close(); setPlaying(false); }
  }
  return <div aria-label="Four-bar notation grid" className="space-y-2 rounded-xl border border-white/10 p-3">
    <p className="font-medium">Four bars · 4/4</p>
    {[0, 1, 2, 3].map((bar) => <div key={bar} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {values.slice(bar * 4, bar * 4 + 4).map((note, beat) => <label key={beat} className="text-xs">Bar {bar + 1}, beat {beat + 1}
        <select className={field} value={note} onChange={(event) => onChange(values.map((value, index) => index === bar * 4 + beat ? event.target.value : value))}>
          {BEAT_NOTES.map((option) => <option key={option}>{option}</option>)}
        </select></label>)}
    </div>)}
    <button type="button" className={button} onClick={() => void play().catch(() => setPlaying(false))} disabled={playing || values.every((note) => note === "Rest")}>Play notation</button>
  </div>;
}

function Artifact({ path, label }: { path: string; label: string }) {
  const [preview, setPreview] = useState<{ path: string; url?: string }>();
  useEffect(() => {
    let active = true;
    void createClient().storage.from("assessment-evidence").createSignedUrl(path, 3600).then(({ data }) => {
      if (active) setPreview({ path, url: data?.signedUrl });
    });
    return () => { active = false; };
  }, [path]);
  const url = preview?.path === path ? preview.url : undefined;
  return <figure className="min-w-0 rounded-lg border border-white/10 bg-[#101011] p-2">
    {url ? /\.(?:png|jpg|webp)$/.test(path) ? <Image unoptimized width={480} height={320} src={url} alt={label} className="max-h-64 w-full object-contain" />
      : /\.(?:mp4|vwebm)$/.test(path) ? <video aria-label={label} controls preload="metadata" src={url} className="max-h-64 w-full" />
      : <audio aria-label={label} controls preload="metadata" src={url} className="max-w-full" />
      : <p role="status" className="p-2 text-sm">{preview?.path === path ? "Preview unavailable. The attachment is saved." : "Loading preview…"}</p>}
    <figcaption className="mt-2 text-xs text-white/75">{label}</figcaption>
  </figure>;
}

function BookingSimulator({ question, observations, onObserve }: { question: number; observations: string[]; onObserve: (results: string[]) => void }) {
  const [size, setSize] = useState("1");
  const [flow, setFlow] = useState("Create");
  const [build, setBuild] = useState("Original");
  const validInput = /^-?\d{1,3}$/.test(size);
  return <div className="space-y-3 rounded-xl border border-white/10 p-3">
    <p className="font-semibold">Mock booking form</p>
    <div className="grid gap-2 sm:grid-cols-3">
      <label className="text-sm">Guest count<input className={field} type="number" value={size} onChange={(event) => setSize(event.target.value)} /></label>
      <label className="text-sm">Workflow<select className={field} value={flow} onChange={(event) => setFlow(event.target.value)}><option>Create</option><option>Edit</option></select></label>
      {question === 6 && <label className="text-sm">Build<select className={field} value={build} onChange={(event) => setBuild(event.target.value)}><option>Original</option><option>Candidate</option></select></label>}
    </div>
    <button type="button" className={button} disabled={!validInput || observations.length >= 30} onClick={() => {
      onObserve([...observations, bookingObservation(Number(size), flow, build)]);
    }}>Run booking case</button>
    {observations.length > 0 && <ul aria-live="polite" className="space-y-1 text-sm" aria-label="Recorded observations">
      {observations.map((observation, index) => <li key={index}>{observation}</li>)}
    </ul>}
  </div>;
}

function SketchPad({ onAttach }: { onAttach: (blob: Blob) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [marks, setMarks] = useState(false);
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    return [(event.clientX - left) * 600 / width, (event.clientY - top) * 360 / height] as const;
  };
  return <div className="space-y-2">
    <canvas ref={canvas} width={600} height={360} aria-label="Freehand sketch pad" className="w-full touch-none rounded-lg bg-white"
      onPointerDown={(event) => {
        drawing.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        const context = event.currentTarget.getContext("2d");
        context?.beginPath(); context?.moveTo(...point(event));
      }}
      onPointerMove={(event) => {
        if (!drawing.current) return;
        const context = event.currentTarget.getContext("2d");
        if (!context) return;
        context.strokeStyle = "#151515"; context.lineWidth = 3; context.lineCap = "round";
        context.lineTo(...point(event)); context.stroke(); setMarks(true);
      }} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} />
    <div className="flex flex-wrap gap-2">
      <button type="button" className={button} disabled={!marks} onClick={() => canvas.current?.toBlob((blob) => { if (blob) onAttach(blob); })}>Attach sketch</button>
      <button type="button" className={button} onClick={() => { canvas.current?.getContext("2d")?.clearRect(0, 0, 600, 360); setMarks(false); }}>Clear sketch</button>
    </div>
  </div>;
}
