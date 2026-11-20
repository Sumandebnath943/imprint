"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, FileText, Upload } from "lucide-react";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import { useOnboardingUserId } from "@/components/onboarding/OnboardingShell";
import ModuleTextarea from "@/components/onboarding/ModuleTextarea";
import VoiceRecorder from "@/components/onboarding/VoiceRecorder";
import FileUploadZone from "@/components/onboarding/FileUploadZone";
import BottomNav from "@/components/onboarding/BottomNav";
import type { BaselineModule } from "@/lib/onboarding/modules";
import WorkspaceFlow from "@/components/onboarding/WorkspaceFlow";

const STEP = 5;
const TOTAL = 7;

type InputMode = "text" | "audio" | "file";

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── FINAL module special layout ─────────────────────────────────────────────
function FinalModuleContent({
  value,
  onChange,
  mode,
  setMode,
  onVoiceDone,
  onFileDone,
}: {
  value: string;
  onChange: (v: string) => void;
  mode: InputMode;
  setMode: (m: InputMode) => void;
  onVoiceDone: (blob: Blob, secs: number) => void;
  onFileDone: (file: File, url: string) => void;
}) {
  return (
    <div>
      {/* Mode selector */}
      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Response format">
        {(["text", "audio", "file"] as InputMode[]).map((m) => {
          const labels = { text: "Write it", audio: "Say it", file: "Show it" };
          const icons = { text: FileText, audio: Mic, file: Upload };
          const Icon = icons[m];
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              aria-pressed={active}
              onClick={() => setMode(m)}
              className="flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium"
              style={{
                background: active ? "rgba(255,85,0,0.15)" : "#1A1A1A",
                border: `1px solid ${active ? "rgba(255,85,0,0.45)" : "rgba(255,255,255,0.10)"}`,
                color: active ? "#FF5500" : "rgba(255,255,255,0.55)",
              }}
            >
              <Icon size={14} />
              {labels[m]}
            </button>
          );
        })}
      </div>

      {mode === "text" && <ModuleTextarea value={value} onChange={onChange} minHeight={220} />}
      {mode === "audio" && <VoiceRecorder onRecordingComplete={onVoiceDone} />}
      {mode === "file" && <FileUploadZone onFileSelected={onFileDone} />}
    </div>
  );
}

// ─── Main Baseline Page ───────────────────────────────────────────────────────
export default function BaselinePage() {
  const router = useRouter();
  const { answers, setStep } = useOnboardingStore();
  return answers.workspaceId || !answers.baselineModules.length ? <WorkspaceFlow onBack={() => {
    setStep(4);
    router.push("/onboarding/baseline-intro");
  }} onComplete={() => {
    setStep(6);
    router.push("/onboarding/skill-vault");
  }} /> : <LegacyBaseline />;
}

function LegacyBaseline() {
  const router = useRouter();
  const { answers, setStep, saveBaselineResponse } = useOnboardingStore();
  const userId = useOnboardingUserId();

  const modules = answers.baselineModules;
  const [moduleIndex, setModuleIndex] = useState(0);
  const [textValue, setTextValue] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [saveError, setSaveError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const [startedAt, setStartedAt] = useState<number>();
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const resumedRef = useRef(false);

  const currentModule: BaselineModule | undefined = modules[moduleIndex];
  const isLastModule = moduleIndex === modules.length - 1;
  const isFinalModule = currentModule?.id === "FINAL";
  const saved = currentModule && answers.baselineResponses[currentModule.id];

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [currentModule?.id]);

  const moduleKey = userId && currentModule
    ? `imprint_baseline_${userId}_${currentModule.id}`
    : null;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    if (resumedRef.current || !modules.length || !userId) return;
    resumedRef.current = true;
    const next = modules.findIndex(({ id }) => !answers.baselineResponses[id]);
    setModuleIndex(next < 0 ? modules.length - 1 : next);
  }, [answers.baselineResponses, modules, userId]);

  useEffect(() => {
    if (!moduleKey || !currentModule) return;
    const startKey = `${moduleKey}_start`;
    const stored = Number(localStorage.getItem(startKey));
    const start = Number.isFinite(stored) && stored > 0 ? stored : Date.now();
    localStorage.setItem(startKey, String(start));
    setTextValue(localStorage.getItem(moduleKey) ?? answers.baselineResponses[currentModule.id]?.responseText ?? "");
    setAudioBlob(null);
    setUploadedFile(null);
    setInputMode(answers.baselineResponses[currentModule.id]?.responseType ?? (currentModule.responseType === "file" ? "file" : "text"));
    setSaveError("");
    setStartedAt(start);
    setLoadedKey(moduleKey);
  }, [answers.baselineResponses, currentModule, moduleKey]);

  useEffect(() => {
    if (moduleKey && moduleKey === loadedKey) localStorage.setItem(moduleKey, textValue);
  }, [loadedKey, moduleKey, textValue]);

  const canContinue = () => {
    if (!currentModule || !startedAt || saving || loadedKey !== moduleKey) return false;
    if (inputMode === "text") {
      const wc = countWords(textValue);
      return wc >= (currentModule.minWords ?? 1) || isFinalModule || Boolean(currentModule.timed && Date.now() >= startedAt + currentModule.timed * 60000);
    }
    if (inputMode === "audio") return Boolean(audioBlob || saved?.responseAudioUrl);
    if (inputMode === "file") return Boolean(uploadedFile || saved?.responseFileUrl);
    return false;
  };

  const uploadAudio = async (): Promise<string | null> => {
    if (!audioBlob || !userId || !currentModule) return null;
    const path = `${userId}/baseline/${currentModule.id}.${audioBlob.type.includes("mp4") ? "m4a" : "webm"}`;
    const formData = new FormData();
    formData.append("file", audioBlob);
    formData.append("bucket", "baseline-audio");
    formData.append("path", path);
    const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
    if (!res.ok) return null;
    return path;
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!uploadedFile || !userId || !currentModule) return null;
    const ext = uploadedFile.name.split(".").pop() ?? "bin";
    const path = `${userId}/baseline/${currentModule.id}.${ext}`;
    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("bucket", "baseline-files");
    formData.append("path", path);
    const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
    if (!res.ok) return null;
    return path;
  };

  const handleContinue = async () => {
    if (!currentModule || !startedAt || !moduleKey || !canContinue() || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    const responseTimeSeconds = Math.min(86400, Math.floor((Date.now() - startedAt) / 1000));
    try {
      const path = inputMode === "audio"
        ? audioBlob ? await uploadAudio() : saved?.responseAudioUrl
        : inputMode === "file" ? uploadedFile ? await uploadFile() : saved?.responseFileUrl : null;
      if (inputMode !== "text" && !path) throw new Error("Your upload did not finish. Please retry.");
      const res = await fetch("/api/onboarding/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profession: answers.profession,
          moduleId: currentModule.id,
          mode: inputMode,
          text: inputMode === "text" ? textValue : "",
          path: path ?? undefined,
          duration: responseTimeSeconds,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "The response could not be saved.");
      }
      saveBaselineResponse({
        moduleId: currentModule.id,
        responseText: inputMode === "text" ? textValue : undefined,
        responseAudioUrl: inputMode === "audio" ? path ?? undefined : undefined,
        responseFileUrl: inputMode === "file" ? path ?? undefined : undefined,
        responseType: inputMode,
        wordCount: inputMode === "text" ? countWords(textValue) : 0,
        responseTimeSeconds,
        completedAt: new Date().toISOString(),
      });
      if (isLastModule) {
        setStep(6);
        router.push("/onboarding/skill-vault");
      } else {
        setModuleIndex((index) => index + 1);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The response could not be saved.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (savingRef.current) return;
    if (moduleIndex > 0) {
      setModuleIndex((i) => i - 1);
    } else {
      setStep(4);
      router.push("/onboarding/baseline-intro");
    }
  };

  if (!currentModule) {
    return <p className="p-24" role="status">Loading your questions…</p>;
  }

  const modes: InputMode[] = currentModule.responseType === "file" ? ["file"] : ["text"];
  if (currentModule.allowVoiceAlternative) modes.push("audio");

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 pb-12 pt-24 md:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10">
      <section aria-labelledby="question-title" key={currentModule.id}>
        <p className="mb-3 text-sm font-semibold text-[#ffa17a]">Question {moduleIndex + 1} of {modules.length}</p>
        <h1 ref={heading} id="question-title" tabIndex={-1} className="text-3xl font-bold md:text-4xl">{currentModule.headline}</h1>
        <p className="mt-2 text-sm text-white/70">{currentModule.name}</p>
        <p className="mt-6 hidden whitespace-pre-line rounded-2xl border border-white/10 bg-white/[0.03] p-6 leading-relaxed text-white/80 lg:block">
          {currentModule.prompt}
        </p>
        <details className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] lg:hidden" open>
          <summary className="cursor-pointer px-4 py-3 font-medium">Question instructions</summary>
          <p className="whitespace-pre-line px-4 pb-4 leading-relaxed text-white/80">{currentModule.prompt}</p>
        </details>
      </section>
      <section aria-label="Response workspace" className="min-w-0 rounded-2xl border border-white/10 bg-[#141415] p-4 sm:p-6">
        {loadedKey !== moduleKey ? <p role="status">Loading your response…</p> : isFinalModule ? (
          <FinalModuleContent
            value={textValue}
            onChange={setTextValue}
            mode={inputMode}
            setMode={setInputMode}
            onVoiceDone={setAudioBlob}
            onFileDone={setUploadedFile}
          />
        ) : (
          <>
            {modes.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Response format">
                {modes.map((mode) => (
                  <button key={mode} type="button" aria-pressed={inputMode === mode} onClick={() => setInputMode(mode)}
                    className="min-h-11 rounded-xl border border-white/15 px-4 text-sm text-white/80 aria-pressed:border-[#ff824b] aria-pressed:bg-[#ff5500]/10 aria-pressed:text-[#ffad89]">
                    {{ text: "Write", audio: "Voice", file: "Upload" }[mode]}
                  </button>
                ))}
              </div>
            )}
            {inputMode === "text" ? (
              <ModuleTextarea value={textValue} onChange={setTextValue} minHeight={240}
                timerSeconds={(currentModule.timed ?? 0) * 60} startedAt={startedAt}
                onTimerEnd={handleContinue} disableBackspace={currentModule.disableBackspace} />
            ) : inputMode === "file" ? (
              <FileUploadZone onFileSelected={setUploadedFile} />
            ) : <VoiceRecorder onRecordingComplete={setAudioBlob} />}
          </>
        )}
        {currentModule.minWords && inputMode === "text" && (
          <p className="mt-3 text-sm text-white/70">
            Minimum {currentModule.minWords} words · {Math.max(0, currentModule.minWords - countWords(textValue))} to go
          </p>
        )}
        <p role="status" className="mt-4 text-sm text-white/70">
          {saving ? "Saving your response…" : saved ? "Response saved" : inputMode === "text" && textValue ? "Draft saved on this device" : "Private reflection"}
        </p>
        {saveError && <p role="alert" className="mt-2 text-sm text-[#ffad89]">{saveError}</p>}
        <BottomNav inline step={STEP} total={TOTAL} onBack={handleBack} onContinue={handleContinue}
          continueLabel={saving ? "Saving…" : isLastModule ? "Save and continue to Skill Vault" : "Continue →"}
          continueDisabled={!canContinue()} />
      </section>
    </div>
  );
}
