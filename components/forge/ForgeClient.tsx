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
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/format";

type SessionState = "idle" | "active" | "complete";

interface ForgeClientProps { userData: ForgeUserData; }

const LS_KEY_PREFIX = "imprint_forge_draft_";
type ForgeDraft = { content: string; elapsed: number; tool: ForgeTool; attemptId?: string; duration?: number; challengeId?: string };

export default function ForgeClient({ userData }: ForgeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [draftBanner, setDraftBanner] = useState<ForgeDraft | null>(null);

  const [saving, setSaving] = useState(false);
  const [challengeDisplayTool, setChallengeDisplayTool] = useState<ForgeTool | null>(null);
  const attemptRef = useRef("");
  const savingRef = useRef(false);
  const challengeRef = useRef<string>();
  const sessionTool = challengeDisplayTool ?? activeTool;
  const deadline = activeTool === "timed-write" ? timerDuration : 0;
  const endRef = useRef<(at?: number) => void>(() => undefined);
  const draftKey = LS_KEY_PREFIX + userData.userId;

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

  const autoSave = useCallback(() => {
    if (sessionState !== "active" || sessionTool === "voice-note" || sessionTool === "sketch-upload") return;
    localStorage.setItem(draftKey, JSON.stringify({
      content, elapsed, tool: activeTool, attemptId: attemptRef.current, duration: timerDuration,
      challengeId: challengeRef.current,
    }));
  }, [activeTool, content, draftKey, elapsed, sessionState, sessionTool, timerDuration]);

  useEffect(() => { autoSave(); }, [autoSave]);

  useEffect(() => {
    if (sessionState !== "active") return;
    timerRef.current = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(deadline ? Math.min(deadline, seconds) : seconds);
      if (deadline && seconds >= deadline) endRef.current(deadline);
    }, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [deadline, sessionState]);

  useEffect(() => {
    const end = () => { if (sessionState === "active") endRef.current(); };
    const leave = (event: BeforeUnloadEvent) => {
      if (sessionState === "active") event.preventDefault();
    };
    window.addEventListener("forge:end-session", end);
    window.addEventListener("forge:save", autoSave);
    window.addEventListener("beforeunload", leave);
    return () => {
      window.removeEventListener("forge:end-session", end);
      window.removeEventListener("forge:save", autoSave);
      window.removeEventListener("beforeunload", leave);
    };
  }, [autoSave, sessionState]);

  const handleStartSession = (tool = activeTool, draft?: ForgeDraft) => {
    if (tool === "vault-challenge" && (!userData.activeChallenge ||
        (draft?.challengeId && draft.challengeId !== userData.activeChallenge.id))) {
      toast.error("The challenge attached to this session is unavailable.");
      return;
    }
    setActiveTool(tool);
    const mode = userData.activeChallenge?.submissionMode;
    setChallengeDisplayTool(tool === "vault-challenge" && mode && mode !== "text" ? mode : null);
    if (draft?.duration) setTimerDuration(draft.duration);
    setContent(draft?.content ?? "");
    setElapsed(draft?.elapsed ?? 0);
    setAudioSaved(false);
    setFileSaved(false);
    attemptRef.current = draft?.attemptId ?? crypto.randomUUID();
    challengeRef.current = tool === "vault-challenge" ? userData.activeChallenge?.id : undefined;
    startTimeRef.current = Date.now() - (draft?.elapsed ?? 0) * 1000;
    setSessionState("active");
    setDraftBanner(null);
  };

  const saveSession = async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/forge/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId: attemptRef.current,
        tool: activeTool,
        practiced_skill_id: practiceSkillId ?? undefined,
        challenge_id: challengeRef.current,
        ...payload,
      }),
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error ?? "Your Forge session could not be saved.");
    }
  };

  const runSave = async (save: () => Promise<void>) => {
    if (savingRef.current || sessionState !== "active") return;
    savingRef.current = true;
    setSaving(true);
    try {
      await save();
      setSessionState("complete");
      localStorage.removeItem(draftKey);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Your Forge session could not be saved.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleEndSession = (at?: number) => {
    if (sessionTool === "voice-note" || sessionTool === "sketch-upload") {
      toast.info("Use the tool’s Save button to finish the session.");
      return;
    }
    if (!content.trim()) {
      if (at !== undefined && timerRef.current) clearInterval(timerRef.current);
      toast.info("Write a response before saving.");
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    const finalElapsed = at ?? Math.min(deadline || 86400, Math.floor((Date.now() - startTimeRef.current) / 1000));
    setElapsed(finalElapsed);
    void runSave(() => saveSession({
      title: challengeRef.current ? userData.activeChallenge?.title : undefined,
      content: content.trim(), time_spent_seconds: finalElapsed,
      was_timed: deadline > 0, time_limit_seconds: deadline || null,
    }));
  };

  useEffect(() => { endRef.current = handleEndSession; });

  const upload = async (file: Blob, bucket: string, extension: string) => {
    const path = `${userData.userId}/forge/${attemptRef.current}.${extension}`;
    const form = new FormData();
    form.append("file", file);
    form.append("bucket", bucket);
    form.append("path", path);
    const response = await fetch("/api/storage/upload", { method: "POST", body: form });
    if (!response.ok) throw new Error("The attachment could not be uploaded.");
    return path;
  };

  const handleVoiceSave = (blob: Blob, duration: number) => runSave(async () => {
    const path = await upload(blob, "forge-audio", blob.type.includes("mp4") ? "m4a" : "webm");
    await saveSession({ title: "Voice note", response_audio_url: path, item_type: "voice", time_spent_seconds: duration });
    setElapsed(duration);
    setAudioSaved(true);
  });

  const handleSketchSave = (file: File, caption: string) => runSave(async () => {
    const path = await upload(file, "forge-files", file.name.split(".").pop() ?? "png");
    await saveSession({
      title: "Sketch or file", content: caption, response_file_url: path,
      item_type: file.type.startsWith("image/") ? "sketch" : "document",
    });
    setFileSaved(true);
  });

  // ── Reset ─────────────────────────────────────────────────────────────
  const handleReturn = () => {
    setSessionState("idle");
    setChallengeDisplayTool(null);
    setContent("");
    setElapsed(0);
    setAudioSaved(false);
    setFileSaved(false);
  };

  const remaining = Math.max(0, deadline - elapsed);
  const isTextTool = ["free-write", "timed-write", "memory-recall", "vault-challenge"].includes(sessionTool);

  return (
    <div className="absolute flex flex-col md:flex-row overflow-hidden" style={{ top: 64, left: 0, right: 0, bottom: 0, background: "#040404", zIndex: 10 }}>

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
              <button onClick={() => { handleStartSession(draftBanner.tool, draftBanner); }}
                className="text-sm font-medium" style={{ color: "#FF5500" }}>Recover</button>
              <button onClick={() => { localStorage.removeItem(LS_KEY_PREFIX + userData.userId); setDraftBanner(null); }}
                className="text-sm" style={{ color: "rgba(255,255,255,0.66)" }}>Discard</button>
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
                <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.54)" }}>IMPRINT</p>
                {practiceSkillName ? (
                  <>
                    <h2 className="font-bold leading-none" style={{ fontSize: "clamp(36px,5vw,56px)" }}>
                      <span className="text-white">Practicing: </span>
                      <span style={{ color: "#FF5500" }}>{practiceSkillName}</span>
                    </h2>
                    <p className="text-base max-w-sm" style={{ color: "rgba(255,255,255,0.66)", lineHeight: 1.7 }}>
                      Choose a tool from the left to start.<br />Your practice will be recorded.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="font-bold leading-none" style={{ fontSize: "clamp(36px,5vw,56px)" }}>
                      <span className="text-white">What will you </span>
                      <span style={{ color: "#FF5500" }}>make today?</span>
                    </h2>
                    <p className="text-base max-w-sm" style={{ color: "rgba(255,255,255,0.66)", lineHeight: 1.7 }}>
                      Choose a tool from the left.<br />Sit down. Start. No AI here.
                    </p>
                  </>
                )}

                {/* Vault challenge CTA */}
                {userData.activeChallenge && (
                  <motion.div onClick={() => { handleStartSession("vault-challenge"); }}
                    className="mt-4 rounded-[20px] p-8 cursor-pointer text-center max-w-lg w-full transition-all"
                    style={{ background: "#111111", border: "1px solid rgba(255,85,0,0.20)" }}
                    whileHover={{ boxShadow: "0 0 40px rgba(255,85,0,0.08)", borderColor: "rgba(255,85,0,0.40)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#FF5500" }}>Vault Challenge Due</p>
                    <p className="font-semibold text-white text-xl mb-2">{userData.activeChallenge.title}</p>
                    <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.72)" }}>
                      {userData.activeChallenge.due_date
                        ? `Due ${formatDate(userData.activeChallenge.due_date)}`
                        : "No due date"}
                    </p>
                    <span className="inline-flex items-center gap-2 rounded-full h-10 px-6 text-sm font-medium text-on-accent" style={{ background: "#FF5500" }}>
                      <Zap size={14} /> Begin Challenge →
                    </span>
                  </motion.div>
                )}

                {/* Start button */}
                <motion.button onClick={() => handleStartSession()}
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
                timerDuration={deadline}
                elapsed={elapsed}
                content={content}
                onEndSession={() => handleEndSession()}
              />
              {activeTool === "vault-challenge" && userData.activeChallenge?.description && (
                <p className="border-b border-white/10 px-5 py-3 text-sm text-white/80">{userData.activeChallenge.description}</p>
              )}
              {/* Tool render */}
              {isTextTool ? (
                <ForgeEditor
                  tool={activeTool}
                  timerDuration={deadline}
                  remaining={remaining}
                  content={content}
                  memoryTopic={memoryTopic}
                  isReadOnly={saving || (deadline > 0 && remaining === 0)}
                  onChange={setContent}
                />
              ) : sessionTool === "voice-note" ? (
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
              tool={sessionTool}
              content={content}
              elapsed={elapsed}
              audioSaved={audioSaved}
              fileSaved={fileSaved}
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
      />
    </div>
  );
}
