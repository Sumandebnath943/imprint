"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import type { CalibrationSession, CalibrationPrompt, CalibrationResponse } from "@/lib/calibration/types";

interface SessionProps {
  session: CalibrationSession;
  sessionNumber: number;
  onComplete: (responses: CalibrationResponse[]) => void;
  onPause: (responses: CalibrationResponse[]) => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60), s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function TimerDisplay({ seconds, maxSeconds }: { seconds: number; maxSeconds: number }) {
  const pct = seconds / maxSeconds;
  const color = pct > 0.5 ? "rgba(255,255,255,0.35)" : pct > 0.25 ? "#FFB800" : pct > 0.1 ? "#FF5500" : "#FF2D2D";
  return <span className="font-mono" style={{ fontSize: 14, color }}>{formatTime(seconds)}</span>;
}

export default function CalibrationSessionView({ session, sessionNumber, onComplete, onPause }: SessionProps) {
  const prompts: CalibrationPrompt[] = session.prompts;
  const total = prompts.length;

  const [currentIdx, setCurrentIdx] = useState(() => {
    // Resume from last answered prompt
    return Math.min(session.responses.length, total - 1);
  });
  const [responses, setResponses] = useState<CalibrationResponse[]>(session.responses);
  const [content, setContent] = useState("");
  const [elapsed, setElapsed] = useState(0);       // session elapsed (count-up)
  const [promptStart, setPromptStart] = useState(Date.now());
  const [timerLeft, setTimerLeft] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const prompt = prompts[currentIdx];
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const minWords = prompt.minWords ?? 0;
  const canContinue = wordCount >= minWords || prompt.responseType !== "text";

  // Load existing response for this prompt
  useEffect(() => {
    const existing = responses.find((r) => r.promptId === prompt.id);
    setContent(existing?.content ?? "");
    setPromptStart(Date.now());
    if (prompt.timed) setTimerLeft(prompt.timed * 60);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [currentIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Session elapsed timer
  useEffect(() => {
    const iv = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  // Prompt countdown timer
  useEffect(() => {
    if (timerLeft === null) return;
    if (timerLeft <= 0) return;
    const iv = setInterval(() => {
      setTimerLeft((p) => {
        if (p === null || p <= 1) { clearInterval(iv); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [timerLeft]);

  // Backspace disabling
  useEffect(() => {
    if (!prompt.disableBackspace) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Backspace") e.preventDefault(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prompt.disableBackspace]);

  // Auto-save every 60s
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      fetch("/api/calibration/save-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, responses }),
      });
    }, 60000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [responses, session.id]);

  const saveCurrentResponse = useCallback(() => {
    const elapsed_secs = Math.floor((Date.now() - promptStart) / 1000);
    const resp: CalibrationResponse = {
      promptId: prompt.id,
      content,
      wordCount,
      responseTimeSeconds: elapsed_secs,
      recordedAt: new Date().toISOString(),
    };
    const updated = [...responses.filter((r) => r.promptId !== prompt.id), resp];
    setResponses(updated);
    return updated;
  }, [prompt.id, content, wordCount, promptStart, responses]);

  const handleNext = () => {
    const updated = saveCurrentResponse();
    if (currentIdx < total - 1) {
      setCurrentIdx(currentIdx + 1);
      // Save progress on advance
      fetch("/api/calibration/save-progress", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, responses: updated }),
      });
    } else {
      onComplete(updated);
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) { saveCurrentResponse(); setCurrentIdx(currentIdx - 1); }
  };

  const handlePause = () => {
    const updated = saveCurrentResponse();
    onPause(updated);
  };

  const progressPct = ((currentIdx) / total) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#050508" }}>
      {/* Fixed orange progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full" style={{ background: "#FF5500" }}
          animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5 }} />
      </div>

      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-12 z-40"
        style={{ height: 56, background: "rgba(5,5,8,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="font-semibold uppercase tracking-widest" style={{ fontSize: 12, color: "#FF5500" }}>
          CALIBRATION SESSION {sessionNumber}
        </span>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.40)" }}>
          Prompt {currentIdx + 1} of {total}
        </span>
        <div className="flex items-center gap-4">
          <span className="font-mono" style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>
            {formatTime(elapsed)}
          </span>
          <button onClick={handlePause}
            className="rounded-full h-8 px-4 text-xs transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.55)" }}>
            Pause & Save
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto" style={{ maxWidth: 720, padding: "80px 48px 140px" }}>
          {/* Ghost word */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
            style={{ fontSize: 200, fontWeight: 700, color: "#fff", opacity: 0.025, zIndex: 0 }}>
            {prompt.ghostWord}
          </div>

          <div className="relative z-10">
            {/* Label + badge */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.30)" }}>
                Prompt {currentIdx + 1} of {total}
              </span>
              <span className="text-xs rounded-full px-3 py-1"
                style={{ background: "rgba(255,85,0,0.12)", border: "1px solid rgba(255,85,0,0.25)", color: "#FF5500" }}>
                {prompt.badge}
              </span>
            </div>

            {/* Headline */}
            <h2 className="font-bold text-white mb-4" style={{ fontSize: 40, lineHeight: 1.15 }}>{prompt.headline}</h2>

            {/* Prompt text */}
            <p className="mb-6" style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", lineHeight: 1.8, maxWidth: 600, whiteSpace: "pre-wrap" }}>
              {prompt.prompt}
            </p>

            {/* Authenticity note */}
            <div className="mb-6 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.40)" }}>
                ⚡ You answered a similar prompt during your Baseline Imprint. Answer naturally — do not try to match your previous response. The engine measures authenticity, not consistency.
              </p>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea ref={textareaRef} value={content}
                disabled={timerLeft === 0 && prompt.timed !== undefined}
                onChange={(e) => {
                  if (prompt.disableBackspace && e.target.value.length < content.length) return;
                  setContent(e.target.value);
                }}
                placeholder={`Respond naturally. Don't overthink.\nWrite what comes to mind first.`}
                spellCheck autoComplete="off"
                className="w-full resize-y outline-none"
                style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16, padding: "28px 32px", minHeight: 220,
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 17, lineHeight: 1.9, color: "rgba(255,255,255,0.82)",
                  caretColor: "#FF5500",
                }}
              />
              {/* Word count + timer bottom row */}
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="font-mono text-xs" style={{ color: wordCount >= minWords && minWords > 0 ? "#00D97E" : "rgba(255,255,255,0.30)" }}>
                  {minWords > 0 ? `${wordCount}/${minWords} words` : `${wordCount} words`}
                </span>
                {prompt.timed && timerLeft !== null && (
                  <TimerDisplay seconds={timerLeft} maxSeconds={prompt.timed * 60} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="shrink-0 flex items-center justify-between px-12 z-40"
        style={{ background: "rgba(5,5,8,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 48px", backdropFilter: "blur(20px)" }}>
        {/* Left */}
        <div className="flex items-center gap-4">
          <button onClick={handleBack} disabled={currentIdx === 0}
            className="rounded-full h-10 px-5 text-sm transition-all hover:bg-white/5 disabled:opacity-30"
            style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.60)" }}>
            ← Back
          </button>
          <span className="text-xs italic" style={{ color: "rgba(255,255,255,0.20)" }}>
            Don&apos;t overthink. Write what comes to you first.
          </span>
        </div>

        {/* Center dots */}
        <div className="flex gap-2">
          {prompts.map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: i === currentIdx ? "#FF5500" : i < currentIdx ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.12)" }} />
          ))}
        </div>

        {/* Right */}
        <button onClick={handleNext} disabled={!canContinue}
          className="rounded-full font-medium text-white transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: "#FF5500", height: currentIdx === total - 1 ? 46 : 40, padding: "0 28px", fontSize: currentIdx === total - 1 ? 15 : 14 }}>
          {currentIdx === total - 1 ? "Complete Calibration →" : "Next Prompt →"}
        </button>
      </div>
    </div>
  );
}
