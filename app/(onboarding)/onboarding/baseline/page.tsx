"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, FileText, Upload } from "lucide-react";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store/user.store";
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
  const { profile } = useUserStore();
  const supabase = createClient();

  const modules = answers.baselineModules;
  const [moduleIndex, setModuleIndex] = useState(0);
  const [textValue, setTextValue] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [fading, setFading] = useState(false);
  const moduleStartTime = useRef<number>(Date.now());

  const currentModule: BaselineModule | undefined = modules[moduleIndex];
  const isLastModule = moduleIndex === modules.length - 1;
  const isFinalModule = currentModule?.id === "FINAL";

  // Reset state when module changes
  useEffect(() => {
    setTextValue("");
    setAudioBlob(null);
    setUploadedFile(null);
    setInputMode(currentModule?.responseType === "audio" ? "audio" : currentModule?.responseType === "file" ? "file" : "text");
    moduleStartTime.current = Date.now();

    // Restore from localStorage if available
    if (profile?.id && currentModule) {
      const saved = localStorage.getItem(`imprint_baseline_${profile.id}_${currentModule.id}`);
      if (saved) setTextValue(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleIndex]);

  // Auto-save text to localStorage
  useEffect(() => {
    if (profile?.id && currentModule && textValue) {
      localStorage.setItem(`imprint_baseline_${profile.id}_${currentModule.id}`, textValue);
    }
  }, [textValue, profile?.id, currentModule]);

  const canContinue = () => {
    if (!currentModule) return false;
    if (inputMode === "text") {
      const wc = countWords(textValue);
      return wc >= (currentModule.minWords ?? 1) || isFinalModule;
    }
    if (inputMode === "audio") return !!audioBlob;
    if (inputMode === "file") return !!uploadedFile;
    return false;
  };

  const uploadAudio = async (): Promise<string | null> => {
    if (!audioBlob || !profile?.id || !currentModule) return null;
    const path = `${profile.id}/baseline/${currentModule.id}.webm`;
    const formData = new FormData();
    formData.append("file", audioBlob);
    formData.append("bucket", "baseline-audio");
    formData.append("path", path);
    const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!uploadedFile || !profile?.id || !currentModule) return null;
    const ext = uploadedFile.name.split(".").pop() ?? "bin";
    const path = `${profile.id}/baseline/${currentModule.id}.${ext}`;
    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("bucket", "baseline-files");
    formData.append("path", path);
    const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
  };

  const handleContinue = async () => {
    if (!currentModule || !canContinue()) return;

    const responseTimeSeconds = Math.round((Date.now() - moduleStartTime.current) / 1000);
    const wc = countWords(textValue);

    let audioUrl: string | null = null;
    let fileUrl: string | null = null;

    if (inputMode === "audio" && audioBlob) audioUrl = await uploadAudio();
    if (inputMode === "file" && uploadedFile) fileUrl = await uploadFile();

    // Save to store (offline backup)
    saveBaselineResponse({
      moduleId: currentModule.id,
      responseText: inputMode === "text" ? textValue : undefined,
      responseAudioUrl: audioUrl ?? undefined,
      responseFileUrl: fileUrl ?? undefined,
      responseType: inputMode,
      wordCount: wc,
      responseTimeSeconds,
      completedAt: new Date().toISOString(),
    });

    // Persist to Supabase via API route
    if (profile?.id) {
      const sentences = textValue.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const avgSentenceLength = sentences.length > 0 ? wc / sentences.length : 0;
      const words = textValue.toLowerCase().split(/\s+/).filter(Boolean);
      const vocabRichness = words.length > 0 ? new Set(words).size / words.length : 0;

      fetch("/api/onboarding/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cluster: currentModule.cluster,
          module_id: currentModule.id,
          module_name: currentModule.name,
          prompt_given: currentModule.prompt,
          response_text: inputMode === "text" ? textValue : null,
          response_audio_url: audioUrl,
          response_file_url: fileUrl,
          response_type: inputMode,
          word_count: wc,
          avg_sentence_length: parseFloat(avgSentenceLength.toFixed(2)),
          vocabulary_richness: parseFloat(vocabRichness.toFixed(3)),
          response_time_seconds: responseTimeSeconds,
          step_data: { onboarding_step: isLastModule ? 6 : 5 },
          is_final_step: isLastModule
        })
      }).then(() => {
        // Clear localStorage backup after successful save
        if (profile?.id) {
          localStorage.removeItem(`imprint_baseline_${profile.id}_${currentModule.id}`);
        }
      });
    }

    // Advance or finish
    if (isLastModule) {
      setFading(true);
      setStep(6);
      setTimeout(() => router.push("/onboarding/skill-vault"), 700);
    } else {
      setFading(true);
      setTimeout(() => {
        setModuleIndex((i) => i + 1);
        setFading(false);
      }, 300);
    }
  };

  const handleBack = () => {
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
    <div className="relative min-h-screen overflow-hidden">
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
          className="relative z-10 max-w-[720px] mx-auto px-6 pt-24 pb-36"
        >
          {/* Module label */}
          <div className="mb-8">
            <p className="uppercase tracking-widest text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
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
          <h2 className="font-bold text-white mb-6" style={{ fontSize: "clamp(28px,4vw,40px)", lineHeight: 1.2 }}>
            {currentModule.headline}
          </h2>

          {/* Prompt */}
          <div
            className="rounded-2xl p-6 mb-8"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="whitespace-pre-line leading-relaxed" style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
              {currentModule.prompt}
            </p>
          </div>

          {/* Response area */}
          {isFinalModule ? (
            <FinalModuleContent
              value={textValue}
              onChange={setTextValue}
              mode={inputMode}
              setMode={setInputMode}
              onVoiceDone={(blob, secs) => { setAudioBlob(blob); }}
              onFileDone={(file, _url) => setUploadedFile(file)}
            />
          ) : currentModule.responseType === "audio" && !currentModule.allowVoiceAlternative ? (
            <VoiceRecorder onRecordingComplete={(blob, _secs) => { setAudioBlob(blob); }} />
          ) : currentModule.responseType === "file" && !currentModule.allowVoiceAlternative ? (
            <FileUploadZone onFileSelected={(file) => setUploadedFile(file)} />
          ) : currentModule.allowVoiceAlternative ? (
            <div>
              {/* Mode toggle */}
              <div className="flex gap-3 mb-5">
                {(["text", "audio"] as InputMode[]).map((m) => {
                  const labels = { text: "Write", audio: "Voice" };
                  const icons = { text: FileText, audio: Mic };
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
                  onTimerEnd={handleContinue}
                  disableBackspace={currentModule.disableBackspace}
                  minHeight={200}
                />
              ) : (
                <VoiceRecorder onRecordingComplete={(blob, _secs) => { setAudioBlob(blob); }} />
              )}
            </div>
          ) : (
            <ModuleTextarea
              value={textValue}
              onChange={setTextValue}
              timerSeconds={currentModule.timed ? currentModule.timed * 60 : 0}
              onTimerEnd={handleContinue}
              disableBackspace={currentModule.disableBackspace}
              minHeight={200}
            />
          )}

          {/* Min words hint */}
          {currentModule.minWords && inputMode === "text" && (
            <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              Minimum {currentModule.minWords} words · {Math.max(0, currentModule.minWords - countWords(textValue))} to go
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <BottomNav
        step={STEP}
        total={TOTAL}
        onBack={handleBack}
        onContinue={handleContinue}
        continueLabel={isLastModule ? "That's my Imprint." : "Continue →"}
        continueDisabled={!canContinue()}
      />
    </div>
  );
}
