"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";

import ForgeLeftPanel from "@/components/forge/ForgeLeftPanel";
import ForgeTopBar from "@/components/forge/ForgeTopBar";
import ForgeEditor from "@/components/forge/ForgeEditor";
import ForgeVoice from "@/components/forge/ForgeVoice";
import ForgeSketch from "@/components/forge/ForgeSketch";
import ForgeComplete from "@/components/forge/ForgeComplete";
import ForgeRightPanel from "@/components/forge/ForgeRightPanel";

import type { ForgeTool, ForgeUserData } from "@/lib/forge/types";
import { countWords, formatTime } from "@/lib/forge/types";
import { createClient } from "@/lib/supabase/client";

type SessionState = "idle" | "active" | "complete";

interface ForgeClientProps { userData: ForgeUserData; }

const LS_KEY_PREFIX = "imprint_forge_draft_";

export default function ForgeClient({ userData }: ForgeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const practiceSkillId = searchParams.get("practice_skill_id");
  const practiceSkillName = searchParams.get("practice_skill_name");

  // Tool & config
  const [activeTool, setActiveTool] = useState<ForgeTool>("free-write");
  const [timerDuration, setTimerDuration] = useState(600); // 10min default
  const [memoryTopic, setMemoryTopic] = useState("");
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Session state
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [content, setContent] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [audioSaved, setAudioSaved] = useState(false);
  const [fileSaved, setFileSaved] = useState(false);

  // Refs for timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Draft recovery
  const [draftBanner, setDraftBanner] = useState<{ content: string; elapsed: number; tool: ForgeTool } | null>(null);

  // ── Load draft on mount ───────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY_PREFIX + userData.userId);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setDraftBanner(parsed);
      } catch { /* ignore */ }
    }
  }, [userData.userId]);

  // ── Auto-save to localStorage every 60s during active session ─────────
  useEffect(() => {
    if (sessionState !== "active") return;
    const id = setInterval(() => {
      localStorage.setItem(LS_KEY_PREFIX + userData.userId, JSON.stringify({ content, elapsed, tool: activeTool }));
    }, 60000);
    return () => clearInterval(id);
  }, [sessionState, content, elapsed, activeTool, userData.userId]);

  // ── Timer tick ────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionState === "active") {
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(secs);
        // Countdown: auto-complete when time's up
        if (timerDuration > 0 && secs >= timerDuration) {
          handleEndSession();
        }
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState, timerDuration]);

  // ── Keyboard shortcuts (global) ────────────────────────────────────────
  useEffect(() => {
    const endHandler = () => handleEndSession();
    const saveHandler = () => autoSave();
    window.addEventListener("forge:end-session", endHandler);
    window.addEventListener("forge:save", saveHandler);
    return () => {
      window.removeEventListener("forge:end-session", endHandler);
      window.removeEventListener("forge:save", saveHandler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, elapsed]);

  // ── beforeunload guard ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (sessionState === "active") {
        e.preventDefault();
        e.returnValue = "You have an active Forge session. Leaving will save your progress.";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [sessionState]);

  // ── Escape key ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (sessionState === "idle") router.push("/dashboard");
        else if (sessionState === "active") {
          if (confirm("End your current Forge session?")) handleEndSession();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState]);

  // ── Start session ─────────────────────────────────────────────────────
  const handleStartSession = useCallback(() => {
    setContent("");
    setElapsed(0);
    setAudioSaved(false);
    setFileSaved(false);
    startTimeRef.current = Date.now();
    setSessionState("active");
    setDraftBanner(null);
    localStorage.removeItem(LS_KEY_PREFIX + userData.userId);
  }, [userData.userId]);

  // ── End session ───────────────────────────────────────────────────────
  const handleEndSession = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSessionState("complete");
    localStorage.removeItem(LS_KEY_PREFIX + userData.userId);
    // Persist to Supabase
    saveToSupabase();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, elapsed, activeTool]);

  // ── Auto-save (mid-session) ───────────────────────────────────────────
  const autoSave = useCallback(() => {
    localStorage.setItem(LS_KEY_PREFIX + userData.userId, JSON.stringify({ content, elapsed, tool: activeTool }));
  }, [content, elapsed, activeTool, userData.userId]);

  // ── Save to Supabase ──────────────────────────────────────────────────
  const saveToSupabase = async () => {
    if (!userData.userId) return;
    const wc = countWords(content);
    if ((activeTool === "free-write" || activeTool === "timed-write" || activeTool === "memory-recall") && wc === 0) return;

    const words = content.toLowerCase().split(/\s+/).filter(Boolean);
    const vocabRichness = words.length > 0 ? new Set(words).size / words.length : 0;
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim());
    const avgSentenceLen = sentences.length > 0 ? wc / sentences.length : 0;
    const wpm = Math.round((wc / Math.max(1, elapsed)) * 60);
    const vocabMatch = userData.baselineVocabRichness > 0
      ? Math.min(1, vocabRichness / userData.baselineVocabRichness)
      : 0;

    await fetch("/api/forge/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: activeTool === "vault-challenge" && userData.activeChallenge ? `Vault Challenge: ${userData.activeChallenge.title}` : `Forge Session — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}`,
        content: content || null,
        word_count: wc,
        was_timed: timerDuration > 0,
        time_limit_seconds: timerDuration > 0 ? timerDuration : null,
        tool: activeTool,
        time_spent_seconds: elapsed,
        challenge_id: activeTool === "vault-challenge" ? userData.activeChallenge?.id : undefined,
        practiced_skill_id: practiceSkillId || undefined,
      })
    });
  };

  // ── Voice save ────────────────────────────────────────────────────────
  const handleVoiceSave = async (blob: Blob, duration: number) => {
    setElapsed(duration);
    setAudioSaved(true);
    const ts = Date.now();
    const path = `${userData.userId}/forge/${ts}.webm`;
    
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("bucket", "forge-audio");
    formData.append("path", path);

    const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
    if (res.ok) {
      await fetch("/api/forge/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Voice Note — ${new Date().toLocaleDateString()}`,
          was_timed: false,
          response_audio_url: path,
          tool: "voice-note",
          item_type: "audio"
        })
      });
    }
    setSessionState("complete");
  };

  // ── Sketch save ───────────────────────────────────────────────────────
  const handleSketchSave = async (file: File, caption: string) => {
    setFileSaved(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${userData.userId}/forge/${Date.now()}.${ext}`;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "forge-files");
    formData.append("path", path);

    const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
    if (res.ok) {
      await fetch("/api/forge/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Sketch/File — ${new Date().toLocaleDateString()}`,
          content: caption || null,
          was_timed: false,
          response_file_url: path,
          tool: "sketch-upload",
          item_type: "file"
        })
      });
    }
    setSessionState("complete");
  };

  // ── Reset ─────────────────────────────────────────────────────────────
  const handleReturn = () => {
    setSessionState("idle");
    setContent("");
    setElapsed(0);
    setAudioSaved(false);
    setFileSaved(false);
  };

  const remaining = Math.max(0, timerDuration - elapsed);
  const isTextTool = ["free-write", "timed-write", "memory-recall", "vault-challenge"].includes(activeTool);

  return (
    <div className="absolute flex overflow-hidden" style={{ top: 64, left: 0, right: 0, bottom: 0, background: "#040404", zIndex: 10 }}>

      {/* Draft recovery banner */}
      <AnimatePresence>
        {draftBanner && sessionState === "idle" && (
          <motion.div
            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-3"
            style={{ background: "rgba(255,85,0,0.12)", borderBottom: "1px solid rgba(255,85,0,0.25)" }}
          >
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>
              You have an unsaved session ({formatTime(draftBanner.elapsed)} · {countWords(draftBanner.content)} words)
            </span>
            <div className="flex gap-3">
              <button onClick={() => { setContent(draftBanner.content); setActiveTool(draftBanner.tool); setDraftBanner(null); }}
                className="text-sm font-medium" style={{ color: "#FF5500" }}>Recover</button>
              <button onClick={() => { localStorage.removeItem(LS_KEY_PREFIX + userData.userId); setDraftBanner(null); }}
                className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>Discard</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT PANEL */}
      <ForgeLeftPanel
        activeTool={activeTool}
        sessionState={sessionState}
        session={null}
        challenge={userData.activeChallenge}
        elapsed={elapsed}
        professionCluster={userData.professionCluster}
        timerDuration={timerDuration}
        selectedMemoryTopic={memoryTopic}
        history={userData.history.map((h) => ({
          date: new Date(h.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          tool: h.tool.replace("-", " "),
          words: h.word_count,
        }))}
        onSelectTool={setActiveTool}
        onSetDuration={setTimerDuration}
        onSetMemoryTopic={setMemoryTopic}
      />

      {/* CENTER */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {sessionState === "idle" && (
            <motion.div key="pre-session" className="flex-1 flex flex-col items-center justify-center relative overflow-y-auto py-12"
              style={{ background: "#040404" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}>
              {/* Ghost FORGE */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                style={{ fontSize: 180, fontWeight: 700, color: "#FFFFFF", opacity: 0.03 }}>FORGE</div>

              <div className="relative z-10 text-center flex flex-col items-center gap-5">
                <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>IMPRINT</p>
                {practiceSkillName ? (
                  <>
                    <h2 className="font-bold leading-none" style={{ fontSize: "clamp(36px,5vw,56px)" }}>
                      <span className="text-white">Practicing: </span>
                      <span style={{ color: "#FF5500" }}>{practiceSkillName}</span>
                    </h2>
                    <p className="text-base max-w-sm" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.7 }}>
                      Choose a tool from the left to start.<br />This session will boost your skill.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="font-bold leading-none" style={{ fontSize: "clamp(36px,5vw,56px)" }}>
                      <span className="text-white">What will you </span>
                      <span style={{ color: "#FF5500" }}>make today?</span>
                    </h2>
                    <p className="text-base max-w-sm" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.7 }}>
                      Choose a tool from the left.<br />Sit down. Start. No AI here.
                    </p>
                  </>
                )}

                {/* Vault challenge CTA */}
                {userData.activeChallenge && (
                  <motion.div onClick={() => { setActiveTool("vault-challenge"); handleStartSession(); }}
                    className="mt-4 rounded-[20px] p-8 cursor-pointer text-center max-w-lg w-full transition-all"
                    style={{ background: "#111111", border: "1px solid rgba(255,85,0,0.20)" }}
                    whileHover={{ boxShadow: "0 0 40px rgba(255,85,0,0.08)", borderColor: "rgba(255,85,0,0.40)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#FF5500" }}>Vault Challenge Due</p>
                    <p className="font-semibold text-white text-xl mb-2">{userData.activeChallenge.title}</p>
                    <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {userData.activeChallenge.due_date
                        ? `Due ${new Date(userData.activeChallenge.due_date).toLocaleDateString()}`
                        : "No due date"}
                    </p>
                    <span className="inline-flex items-center gap-2 rounded-full h-10 px-6 text-sm font-medium text-white" style={{ background: "#FF5500" }}>
                      <Zap size={14} /> Begin Challenge →
                    </span>
                  </motion.div>
                )}

                {/* Start button */}
                <motion.button onClick={handleStartSession}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="mt-2 rounded-full h-12 px-10 text-sm font-semibold text-white"
                  style={{ background: "rgba(255,85,0,0.90)", boxShadow: "0 0 40px rgba(255,85,0,0.25)" }}>
                  Begin {activeTool === "timed-write" ? `${timerDuration / 60}m Session` : "Session"} →
                </motion.button>
              </div>
            </motion.div>
          )}

          {sessionState === "active" && (
            <motion.div key="active-session" className="flex-1 flex flex-col min-h-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ForgeTopBar
                tool={activeTool}
                timerDuration={timerDuration}
                elapsed={elapsed}
                content={content}
                onEndSession={handleEndSession}
              />
              {/* Tool render */}
              {isTextTool ? (
                <ForgeEditor
                  tool={activeTool}
                  timerDuration={timerDuration}
                  remaining={remaining}
                  content={content}
                  memoryTopic={memoryTopic}
                  isReadOnly={timerDuration > 0 && remaining === 0}
                  onChange={setContent}
                />
              ) : activeTool === "voice-note" ? (
                <ForgeVoice onSave={handleVoiceSave} />
              ) : (
                <ForgeSketch onSave={handleSketchSave} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion overlay */}
        <AnimatePresence>
          {sessionState === "complete" && (
            <ForgeComplete
              tool={activeTool}
              content={content}
              elapsed={elapsed}
              audioSaved={audioSaved}
              fileSaved={fileSaved}
              baselineVocabRichness={userData.baselineVocabRichness}
              onReturn={handleReturn}
              onDashboard={() => router.push("/dashboard")}
            />
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT PANEL */}
      <ForgeRightPanel
        open={rightPanelOpen}
        onToggle={() => setRightPanelOpen((p) => !p)}
        content={content}
        elapsed={elapsed}
        isActive={sessionState === "active" && isTextTool}
        history={userData.history}
        baselineWordCount={userData.baselineWordCount}
      />
    </div>
  );
}
