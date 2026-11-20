"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, FileText, Upload } from "lucide-react";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import { toast } from "sonner";
import { useOnboardingUserId } from "@/components/onboarding/OnboardingShell";
import ModuleTextarea from "@/components/onboarding/ModuleTextarea";
import VoiceRecorder from "@/components/onboarding/VoiceRecorder";
import FileUploadZone from "@/components/onboarding/FileUploadZone";
import BottomNav from "@/components/onboarding/BottomNav";
import type { BaselineModule } from "@/lib/onboarding/modules";

const STEP = 5;
const TOTAL = 7;

type InputMode = "text" | "audio" | "file";

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Sub-progress bar for baseline modules ───────────────────────────────────
function ModuleProgress({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full h-px rounded-full mt-3" style={{ background: "rgba(255,255,255,0.08)" }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: "#FF5500" }}
        initial={{ width: "0%" }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
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
      <div className="flex gap-3 mb-6">
        {(["text", "audio", "file"] as InputMode[]).map((m) => {
          const labels = { text: "Write it", audio: "Say it", file: "Show it" };
          const icons = { text: FileText, audio: Mic, file: Upload };
          const Icon = icons[m];
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-pill text-sm font-medium transition-all duration-200"
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
  const { answers, setStep, saveBaselineResponse } = useOnboardingStore();
  const userId = useOnboardingUserId();

  const modules = answers.baselineModules;
  const [moduleIndex, setModuleIndex] = useState(0);
  const [textValue, setTextValue] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [fading, setFading] = useState(false);
  const [startedAt, setStartedAt] = useState<number>();
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const resumedRef = useRef(false);

  const currentModule: BaselineModule | undefined = modules[moduleIndex];
  const isLastModule = moduleIndex === modules.length - 1;
  const isFinalModule = currentModule?.id === "FINAL";

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
    setInputMode(currentModule.responseType === "audio" ? "audio" : currentModule.responseType === "file" ? "file" : "text");
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
    if (inputMode === "audio") return !!audioBlob;
    if (inputMode === "file") return !!uploadedFile;
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
    const responseTimeSeconds = Math.min(86400, Math.floor((Date.now() - startedAt) / 1000));
    try {
      const path = inputMode === "audio" ? await uploadAudio() : inputMode === "file" ? await uploadFile() : null;
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
        setFading(true);
        setStep(6);
        router.push("/onboarding/skill-vault");
      } else {
        setModuleIndex((index) => index + 1);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The response could not be saved.");
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
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="relative min-h-screen overflow-hidden lg:h-full lg:min-h-0">
      {/* Ghost word */}
      <div
        className="fixed select-none pointer-events-none"
        style={{ fontSize: 200, fontWeight: 700, color: "#FFFFFF", opacity: 0.03, top: "40%", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap", letterSpacing: "-0.04em", zIndex: 0 }}
      >
        {currentModule.ghostWord}
      </div>

      {/* Fade overlay */}
      <AnimatePresence>
        {fading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50"
            style={{ background: "#080808" }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentModule.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-[1180px] mx-auto px-6 md:px-10 pt-24 pb-32 lg:pt-[84px] lg:pb-[100px] lg:h-full lg:flex lg:flex-col"
        >
          <div className="lg:flex lg:flex-row lg:gap-14 lg:flex-1 lg:min-h-0">
          {/* Left — module context and the prompt. Fixed, always readable. */}
          <div className="lg:w-[40%] lg:shrink-0 lg:scroll-pane lg:pr-2">
          {/* Module label */}
          <div className="mb-8 md:mb-4">
            <p className="uppercase tracking-widest text-xs mb-3" style={{ color: "rgba(255,255,255,0.62)" }}>
              Baseline Module {moduleIndex + 1} of {modules.length}
            </p>
            <span
              className="inline-block text-xs font-medium px-3 py-1 rounded-pill mb-2"
              style={{ background: "rgba(255,85,0,0.15)", border: "1px solid rgba(255,85,0,0.30)", color: "#FF5500" }}
            >
              {currentModule.badge}
            </span>
            <ModuleProgress current={moduleIndex + 1} total={modules.length} />
          </div>

          {/* Headline */}
          <h2 className="font-bold text-white mb-6 md:mb-3" style={{ fontSize: "clamp(24px,3vw,40px)", lineHeight: 1.2 }}>
            {currentModule.headline}
          </h2>

          {/* Prompt */}
          <div
            className="rounded-2xl p-6 mb-8 md:p-4 md:mb-4"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="whitespace-pre-line leading-relaxed" style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
              {currentModule.prompt}
            </p>
          </div>

          </div>

          {/* Right — the writing surface. */}
          <div className="lg:flex-1 lg:min-w-0 lg:flex lg:flex-col lg:min-h-0 mt-8 lg:mt-0">
          {/* Response area */}
          {isFinalModule ? (
            <FinalModuleContent
              value={textValue}
              onChange={setTextValue}
              mode={inputMode}
              setMode={setInputMode}
              onVoiceDone={(blob, _secs) => { setAudioBlob(blob); }}
              onFileDone={(file, _url) => setUploadedFile(file)}
            />
          ) : currentModule.responseType === "audio" && !currentModule.allowVoiceAlternative ? (
            <VoiceRecorder onRecordingComplete={(blob, _secs) => { setAudioBlob(blob); }} />
          ) : currentModule.responseType === "file" && !currentModule.allowVoiceAlternative ? (
            <FileUploadZone onFileSelected={(file) => setUploadedFile(file)} />
          ) : currentModule.allowVoiceAlternative ? (
            <div>
              {/* Mode toggle */}
              <div className="flex gap-3 mb-5 md:mb-3">
                {([currentModule.responseType, "audio"] as ("text" | "file" | "audio")[]).map((m) => {
                  const labels = { text: "Write", audio: "Voice", file: "Upload" };
                  const icons = { text: FileText, audio: Mic, file: Upload };
                  const Icon = icons[m as keyof typeof icons];
                  const active = inputMode === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setInputMode(m)}
                      className="flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-medium transition-all"
                      style={{
                        background: active ? "rgba(255,85,0,0.15)" : "#1A1A1A",
                        border: `1px solid ${active ? "rgba(255,85,0,0.45)" : "rgba(255,255,255,0.10)"}`,
                        color: active ? "#FF5500" : "rgba(255,255,255,0.50)",
                      }}
                    >
                      <Icon size={12} />
                      {labels[m as keyof typeof labels]}
                    </button>
                  );
                })}
              </div>
              {inputMode === "text" ? (
                <ModuleTextarea
                  value={textValue}
                  onChange={setTextValue}
                  timerSeconds={currentModule.timed ? currentModule.timed * 60 : 0}
                  startedAt={startedAt}
                  onTimerEnd={handleContinue}
                  disableBackspace={currentModule.disableBackspace}
                  minHeight={220}
                />
              ) : inputMode === "file" ? (
                <FileUploadZone onFileSelected={setUploadedFile} />
              ) : (
                <VoiceRecorder onRecordingComplete={(blob, _secs) => { setAudioBlob(blob); }} />
              )}
            </div>
          ) : (
            <ModuleTextarea
              value={textValue}
              onChange={setTextValue}
              timerSeconds={currentModule.timed ? currentModule.timed * 60 : 0}
              startedAt={startedAt}
                  onTimerEnd={handleContinue}
              disableBackspace={currentModule.disableBackspace}
              minHeight={220}
            />
          )}

          {/* Min words hint */}
          {currentModule.minWords && inputMode === "text" && (
            <p className="mt-3 text-xs shrink-0" style={{ color: "rgba(255,255,255,0.54)" }}>
              Minimum {currentModule.minWords} words · {Math.max(0, currentModule.minWords - countWords(textValue))} to go
            </p>
          )}
          </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <BottomNav
        step={STEP}
        total={TOTAL}
        onBack={handleBack}
        onContinue={handleContinue}
        continueLabel={saving ? "Saving…" : isLastModule ? "That's my Imprint." : "Continue →"}
        continueDisabled={!canContinue()}
      />
    </div>
  );
}
