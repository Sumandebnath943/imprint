"use client";

import { useState } from "react";
import { DEVELOPER_PRACTICE, type developerExerciseBrief } from "@/lib/assessment/developer-bank";
import type { CodeChecks } from "@/lib/assessment/code-checks";

type Brief = ReturnType<typeof developerExerciseBrief>;

export function TestResults({ result }: { result: CodeChecks }) {
  return <ul className="mt-2 space-y-1 text-sm" aria-label="Test results">
    {result.cases.map(({ label, outcome }) => <li key={label} className="flex flex-wrap justify-between gap-2">
      {label}<span className={outcome === "passed" ? "text-emerald-300" : "text-[#ffad89]"}>{outcome === "timed-out" ? "Timed out" : outcome === "passed" ? "Passed" : "Failed"}</span>
    </li>)}
  </ul>;
}

export function CodeWorkspace({ brief, files, onChange, savedResults }: {
  brief: Brief; files: Record<string, string>; onChange: (name: string, code: string) => void; savedResults?: CodeChecks | null;
}) {
  const [selected, setSelected] = useState(Object.keys(brief.files)[0]);
  const [run, setRun] = useState<{ files: string; result: CodeChecks }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const version = JSON.stringify(files);

  async function test() {
    setBusy(true);
    setError("");
    setRun(undefined);
    try {
      const response = await fetch("/api/assessment/checks", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exercise: brief.id, files }),
      });
      const outcome = await response.json();
      if (!response.ok) throw new Error(outcome.error);
      setRun({ files: version, result: outcome });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not run the example tests.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
    <section className="min-w-0" aria-label="Code editor">
      {Object.keys(brief.files).length > 1 && <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Starter files">
        {Object.keys(brief.files).map((name) => <button key={name} type="button" aria-pressed={name === selected} onClick={() => setSelected(name)}
          className="min-h-11 rounded-lg border border-white/15 px-3 aria-pressed:border-[#ff955f]">{name}</button>)}
      </div>}
      <label className="block text-sm font-medium">{selected}
        <textarea className="mt-2 min-h-52 w-full resize-y rounded-xl border border-white/15 bg-black/40 p-3 font-mono text-base focus-visible:outline-[#ff955f]"
          value={files[selected] ?? ""} onChange={(event) => { setError(""); onChange(selected, event.target.value); }} maxLength={12000}
          autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      </label>
    </section>
    <section className="min-w-0 space-y-3 rounded-xl border border-white/10 p-4" aria-label="Test panel">
      <h3 className="font-semibold">Example tests</h3>
      <ul className="space-y-2 text-sm text-white/80">
        {brief.examples.map(({ label, input, expected }) => <li key={label}>
          <span className="block font-medium">{label}</span>
          <code className="break-all">{JSON.stringify(input)} → {expected}</code>
        </li>)}
      </ul>
      <button type="button" onClick={test} disabled={busy} className="min-h-11 rounded-lg border border-[#ff955f] px-3 text-[#ffad89] disabled:opacity-60">
        {busy ? "Running…" : "Run example tests"}
      </button>
      {busy && <p role="status" className="text-sm text-white/70">Running in the isolated test workspace.</p>}
      {error && <p role="alert" className="text-sm text-[#ffad89]">{error}</p>}
      {run?.files === version && <TestResults result={run.result} />}
      {savedResults && <details><summary className="cursor-pointer text-sm">Saved submission checks</summary><TestResults result={savedResults} /></details>}
    </section>
  </div>;
}

export default function DeveloperPractice() {
  const [brief, setBrief] = useState(DEVELOPER_PRACTICE[0]);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  return <section className="space-y-4 rounded-2xl border border-white/10 p-5">
    <h2 className="text-xl font-semibold">Software Developer practice bank</h2>
    <label className="block text-sm font-medium">Difficulty
      <select value={brief.id} onChange={(event) => {
        const selected = DEVELOPER_PRACTICE.find((exercise) => exercise.id === event.target.value);
        if (selected) setBrief(selected);
      }} className="ml-3 min-h-11 rounded-lg border border-white/10 bg-[#171717] px-3">
        {DEVELOPER_PRACTICE.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.difficulty}</option>)}
      </select>
    </label>
    <p className="text-white/80">{brief.brief}</p>
    <p className="text-sm text-white/70">Practice is unscored. Keep a copy of any code you want to revisit.</p>
    <CodeWorkspace key={brief.id} brief={brief} files={drafts[brief.id] ?? brief.files}
      onChange={(name, code) => setDrafts((previous) => ({ ...previous, [brief.id]: { ...(previous[brief.id] ?? brief.files), [name]: code } }))} />
  </section>;
}
