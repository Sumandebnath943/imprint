"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { toast } from "sonner";

import MirrorLeftPanel from "@/components/mirror/MirrorLeftPanel";
import MirrorMessageBubble, { TypingIndicator } from "@/components/mirror/MirrorMessage";
import MirrorComplete from "@/components/mirror/MirrorComplete";
import MirrorSessionViewer from "@/components/mirror/MirrorSessionViewer";

import type {
  SessionContext, MirrorMessage, MirrorUserData, MirrorSessionStats,
  IndicatorStatus,
} from "@/lib/mirror/types";
import {
  OPENING_QUESTIONS, OPENING_FALLBACK, detectDependency,
  calcVocabRichness, calcAvgSentenceLen,
  getVocabStatus, getDepthStatus, formatTime,
} from "@/lib/mirror/types";
import { createClient } from "@/lib/supabase/client";

type SessionState = "idle" | "active" | "complete";
const LS_KEY = (uid: string) => `imprint_mirror_session_${uid}`;
const MAX_CHARS = 1500;

interface MirrorClientProps { userData: MirrorUserData; }

function nanoid() { return Math.random().toString(36).slice(2, 11); }

export default function MirrorClient({ userData }: MirrorClientProps) {
  const router = useRouter();
  const supabase = createClient();

  // ── Core state ────────────────────────────────────────────────────────
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [messages, setMessages] = useState<MirrorMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedContext, setSelectedContext] = useState<SessionContext | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [dependencyFlags, setDependencyFlags] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [draftBanner, setDraftBanner] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [completeSummary, setCompleteSummary] = useState("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);

  // ── Refs ─────────────────────────────────────────────────────────────
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef(inputVal);
  inputRef.current = inputVal;

  // ── Computed stats ────────────────────────────────────────────────────
  const stats: MirrorSessionStats = {
    questionCount: messages.filter((m) => m.role === "mirror").length,
    userCount: messages.filter((m) => m.role === "user").length,
    dependencyFlags,
  };

  const vocabRichness = calcVocabRichness(messages);
  const avgSentLen = calcAvgSentenceLen(messages);
  const vocabStatus: IndicatorStatus = getVocabStatus(vocabRichness, userData.baselineSummary.vocabularyRichness);
  const depthStatus: IndicatorStatus = getDepthStatus(avgSentLen, userData.baselineSummary.avgSentenceLength);
  const langStatus: IndicatorStatus = vocabStatus === "bad" || depthStatus === "bad" ? "bad" : vocabStatus === "warn" || depthStatus === "warn" ? "warn" : "good";

  // ── Scroll to bottom on new message ───────────────────────────────────
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  // ── Timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionState === "active") {
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionState]);

  // ── Auto-save every 30s ───────────────────────────────────────────────
  useEffect(() => {
    if (sessionState !== "active") return;
    const id = setInterval(() => {
      localStorage.setItem(LS_KEY(userData.userId), JSON.stringify({ messages, context: selectedContext, customTopic, dependencyFlags, ts: Date.now() }));
    }, 30000);
    return () => clearInterval(id);
  }, [sessionState, messages, selectedContext, customTopic, dependencyFlags, userData.userId]);

  // ── Draft restore check ───────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY(userData.userId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.ts && Date.now() - parsed.ts < 2 * 60 * 60 * 1000) setDraftBanner(true);
      } catch { /* ignore */ }
    }
  }, [userData.userId]);

  // ── Textarea auto-resize ───────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "52px";
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [inputVal]);

  // ── Send message to API ────────────────────────────────────────────────
  const sendToMirror = useCallback(async (userMsg: string, history: MirrorMessage[]) => {
    setIsTyping(true);

    // Minimum 1.2s typing delay
    const minDelay = new Promise((r) => setTimeout(r, 1200));

    const context = selectedContext ?? "Something Else";
    const res = await fetch("/api/mirror", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMsg,
        conversationHistory: history.map((m) => ({ role: m.role === "mirror" ? "assistant" : m.role, content: m.content })),
        sessionContext: context === "Something Else" ? customTopic || "open reflection" : context,
        userCluster: userData.userCluster,
        baselineSummary: userData.baselineSummary,
        dependencyFlagCount: dependencyFlags,
        mode: "question",
      }),
    });

    await minDelay;
    setIsTyping(false);

    if (!res.ok) {
      setMessages((p) => [...p, { id: nanoid(), role: "system", content: "The Mirror is momentarily unavailable. Your thoughts are still here.", timestamp: Date.now() }]);
      return;
    }

    const data = await res.json();

    if (data.dependencyFlagged) {
      setDependencyFlags((p) => p + 1);
      setMessages((p) => [...p, { id: nanoid(), role: "system", content: "The Mirror noticed you asked for a recommendation. It will only reflect your thinking back.", timestamp: Date.now() }]);
    }

    setMessages((p) => [...p, { id: nanoid(), role: "mirror", content: data.response, timestamp: Date.now() }]);
  }, [selectedContext, customTopic, userData, dependencyFlags]);

  // ── Begin session ─────────────────────────────────────────────────────
  const beginSession = useCallback(async () => {
    const ctx = selectedContext ?? "Something Else";
    const opening = OPENING_QUESTIONS[ctx] ?? OPENING_FALLBACK;

    setMessages([]);
    setDependencyFlags(0);
    setElapsed(0);
    setSessionStartTime(Date.now());
    setSessionState("active");
    setDraftBanner(false);
    localStorage.removeItem(LS_KEY(userData.userId));

    // Show typing → opening question
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsTyping(false);

    let openingText = opening;
    // If "Something Else" with no preset, call API for opening
    if (ctx === "Something Else" && customTopic) {
      const res = await fetch("/api/mirror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: customTopic,
          conversationHistory: [],
          sessionContext: customTopic,
          userCluster: userData.userCluster,
          baselineSummary: userData.baselineSummary,
          dependencyFlagCount: 0,
          mode: "question",
        }),
      });
      if (res.ok) { const d = await res.json(); openingText = d.response; }
    }

    setMessages([{ id: nanoid(), role: "mirror", content: openingText, timestamp: Date.now() }]);
    textareaRef.current?.focus();
  }, [selectedContext, customTopic, userData]);

  // ── Handle user send ──────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputVal.trim();
    if (!text || isTyping) return;

    const userMsg: MirrorMessage = { id: nanoid(), role: "user", content: text, timestamp: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputVal("");

    // Detect dependency in user message
    if (detectDependency(text)) {
      setMessages((p) => [...p, { id: nanoid(), role: "system", content: "The Mirror noticed you asked for a recommendation. It will only reflect your thinking back.", timestamp: Date.now() + 1 }]);
    }

    await sendToMirror(text, updated);
  }, [inputVal, isTyping, messages, sendToMirror]);

  // ── Keyboard: Enter to send, Shift+Enter = newline ────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── End session ───────────────────────────────────────────────────────
  const handleEndSession = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSessionState("idle");
    setSessionComplete(true);
    setIsLoadingSummary(true);

    // Second OpenAI call for summary
    try {
      const res = await fetch("/api/mirror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "",
          conversationHistory: messages.map((m) => ({ role: m.role === "mirror" ? "assistant" : m.role, content: m.content })),
          sessionContext: selectedContext ?? "open reflection",
          userCluster: userData.userCluster,
          baselineSummary: userData.baselineSummary,
          dependencyFlagCount: dependencyFlags,
          mode: "summary",
        }),
      });
      const d = await res.json();
      setCompleteSummary(d.response);
    } catch {
      setCompleteSummary("A rich reflection — the themes you explored will resurface when you need them. What will you do differently now that you've thought this through?");
    }
    setIsLoadingSummary(false);
    localStorage.removeItem(LS_KEY(userData.userId));
  }, [messages, selectedContext, userData, dependencyFlags]);

  // ── Save session to Supabase + navigate ───────────────────────────────
  const handleSaveReturn = async () => {
    try {
      const response = await fetch("/api/mirror/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          aiQuestionCount: stats.questionCount,
          userMessageCount: stats.userCount,
          dependencyFlags,
          topics: selectedContext ? [selectedContext] : [],
          sessionContext: selectedContext ?? "Something Else",
          sessionDurationSeconds: Math.floor(elapsed)
        })
      });
      if (!response.ok) throw new Error('Save failed');
    } catch (error) {
      console.error('Mirror end session error:', error);
      toast.error('Session data failed to save.');
    }
    router.push("/dashboard");
  };

  const handleNewSession = () => {
    setSessionComplete(false);
    setMessages([]);
    setInputVal("");
    setDependencyFlags(0);
    setElapsed(0);
    setCompleteSummary("");
  };

  // ── Draft restore ─────────────────────────────────────────────────────
  const restoreDraft = () => {
    const raw = localStorage.getItem(LS_KEY(userData.userId));
    if (!raw) return;
    try {
      const p = JSON.parse(raw);
      setMessages(p.messages ?? []);
      setSelectedContext(p.context ?? null);
      setCustomTopic(p.customTopic ?? "");
      setDependencyFlags(p.dependencyFlags ?? 0);
      setSessionState("active");
      setDraftBanner(false);
    } catch { /* ignore */ }
  };

  const isActive = sessionState === "active";
  const canSend = inputVal.trim().length > 0 && !isTyping;
  const charCount = inputVal.length;

  return (
    <div className="absolute flex overflow-hidden" style={{ top: 64, left: 0, right: 0, bottom: 0, background: "#0A0A10", zIndex: 10 }}>
      {/* Ambient purple glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(180,100,255,0.06) 0%, transparent 70%)",
        filter: "blur(60px)", zIndex: 0,
      }} />

      {/* Draft recovery banner */}
      <AnimatePresence>
        {draftBanner && !isActive && (
          <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-3"
            style={{ background: "rgba(255,120,50,0.10)", borderBottom: "1px solid rgba(255,120,50,0.20)" }}>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>You have an unfinished reflection.</span>
            <div className="flex gap-3">
              <button onClick={restoreDraft} className="text-sm font-medium" style={{ color: "rgba(255,120,50,0.90)" }}>Continue</button>
              <button onClick={() => { localStorage.removeItem(LS_KEY(userData.userId)); setDraftBanner(false); }}
                className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Start fresh</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT PANEL */}
      <MirrorLeftPanel
        selectedContext={selectedContext}
        customTopic={customTopic}
        stats={stats}
        isActive={isActive}
        elapsed={elapsed}
        vocabStatus={vocabStatus}
        depthStatus={depthStatus}
        langStatus={langStatus}
        pastSessions={userData.pastSessions}
        onSelectContext={setSelectedContext}
        onCustomTopic={setCustomTopic}
        onViewPastSession={setViewingSessionId}
      />

      {/* CENTER */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {!isActive && !sessionComplete ? (
            /* ── PRE-SESSION ── */
            <motion.div key="pre" className="flex-1 flex flex-col items-center justify-center gap-6 relative overflow-y-auto py-12"
              style={{ background: "#0A0A10" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Ghost text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                style={{ fontSize: 160, fontWeight: 700, color: "#FFFFFF", opacity: 0.03, overflow: "hidden" }}>MIRROR</div>

              {/* Mirror graphic */}
              <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
                <motion.div className="absolute rounded-full" style={{ width: 160, height: 160, border: "1px solid rgba(255,255,255,0.04)" }}
                  animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />
                <div className="absolute rounded-full" style={{ width: 120, height: 120, border: "1px solid rgba(255,255,255,0.08)" }} />
                <motion.div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,120,50,0.90)", boxShadow: "0 0 12px rgba(255,120,50,0.50)" }}
                  animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              </div>

              <div className="text-center z-10 flex flex-col items-center gap-4">
                <h2 className="font-bold" style={{ fontSize: 40, lineHeight: 1.2 }}>
                  <span className="text-white">What do you want </span><br />
                  <span style={{ color: "rgba(255,120,50,0.90)" }}>to think through?</span>
                </h2>
                <p className="text-base max-w-md leading-relaxed" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.7 }}>
                  The Mirror will ask you questions.<br />It will not answer them.<br />
                  You&apos;ll leave knowing more about what you actually think.
                </p>

                {!selectedContext ? (
                  <p className="italic" style={{ fontSize: 14, color: "rgba(255,255,255,0.30)" }}>Select a context from the left to begin.</p>
                ) : (
                  <div className="flex flex-col items-center gap-4 mt-2">
                    <span className="text-sm rounded-full px-4 py-1.5 font-medium" style={{ background: "rgba(255,120,50,0.12)", border: "1px solid rgba(255,120,50,0.30)", color: "rgba(255,120,50,0.90)" }}>
                      Reflecting on: {selectedContext === "Something Else" && customTopic ? customTopic : selectedContext}
                    </span>
                    <motion.button onClick={beginSession}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="rounded-full h-12 px-10 text-sm font-semibold text-white"
                      style={{ background: "rgba(255,120,50,0.85)", boxShadow: "0 0 40px rgba(255,120,50,0.20)" }}>
                      Begin Session →
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : isActive ? (
            /* ── ACTIVE SESSION ── */
            <motion.div key="active" className="flex-1 flex flex-col overflow-hidden min-h-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Top bar */}
              <div className="flex items-center justify-between shrink-0 px-8"
                style={{ height: 48, background: "rgba(10,10,16,0.95)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-xs rounded-full px-3 py-1 font-medium" style={{ background: "rgba(255,120,50,0.12)", border: "1px solid rgba(255,120,50,0.25)", color: "rgba(255,120,50,0.90)" }}>
                  Reflecting on: {selectedContext === "Something Else" ? customTopic || "open" : selectedContext}
                </span>
                <span className="font-mono text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>{formatTime(elapsed)}</span>
                <div className="flex items-center gap-3">
                  {dependencyFlags > 0 && (
                    <span className="text-xs rounded-full px-2 py-0.5" style={{ background: "rgba(255,184,0,0.12)", border: "1px solid rgba(255,184,0,0.25)", color: "#FFB800" }}>
                      {dependencyFlags} flags
                    </span>
                  )}
                  <button onClick={handleEndSession}
                    className="text-xs font-medium rounded-full transition-all"
                    style={{ border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.50)", padding: "4px 12px" }}
                    onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,120,50,0.50)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,120,50,0.90)"; }}
                    onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.20)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.50)"; }}>
                    End Session
                  </button>
                </div>
              </div>

              {/* Chat area */}
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 relative"
                style={{ padding: "32px 48px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,120,50,0.20) transparent" }}>
                {/* Ghost MIRROR */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                  style={{ fontSize: 160, fontWeight: 700, color: "#FFFFFF", opacity: 0.025, overflow: "hidden" }}>MIRROR</div>

                {messages.map((msg) => <MirrorMessageBubble key={msg.id} msg={msg} />)}
                {isTyping && <TypingIndicator />}
                <div ref={bottomRef} />
              </div>

              {/* Input area */}
              <div className="shrink-0 relative" style={{ background: "rgba(10,10,16,0.98)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 48px", backdropFilter: "blur(20px)" }}>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value.slice(0, MAX_CHARS))}
                    onKeyDown={handleKeyDown}
                    placeholder={messages.length <= 1 ? "Start with whatever's on your mind..." : "Your response..."}
                    rows={1}
                    className="w-full resize-none outline-none"
                    style={{
                      background: "#111118", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16, padding: "14px 60px 14px 20px",
                      fontFamily: "Space Grotesk, sans-serif", fontSize: 15,
                      color: "white", lineHeight: 1.6, minHeight: 52, maxHeight: 140,
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(255,120,50,0.35)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  {charCount > 100 && (
                    <span className="absolute bottom-3 right-14 text-xs" style={{ color: "rgba(255,255,255,0.20)" }}>
                      {charCount}/{MAX_CHARS}
                    </span>
                  )}
                  <button onClick={handleSend} disabled={!canSend}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: canSend ? "#FF5500" : "rgba(255,85,0,0.15)",
                      opacity: canSend ? 1 : 0.4,
                      transform: "translateY(-50%)",
                    }}
                    onMouseOver={(e) => { if (canSend) (e.currentTarget as HTMLElement).style.background = "#FF7A30"; }}
                    onMouseOut={(e) => { if (canSend) (e.currentTarget as HTMLElement).style.background = "#FF5500"; }}>
                    <ArrowUp size={16} style={{ color: canSend ? "white" : "rgba(255,120,50,0.70)" }} />
                  </button>
                </div>
                <p className="text-center mt-2 text-xs" style={{ color: "rgba(255,255,255,0.20)" }}>
                  The Mirror asks questions. It never answers.
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Completion overlay */}
        <AnimatePresence>
          {sessionComplete && (
            <MirrorComplete
              questionCount={stats.questionCount}
              elapsed={elapsed}
              dependencyFlags={dependencyFlags}
              summary={completeSummary}
              isLoadingSummary={isLoadingSummary}
              vocabStatus={vocabStatus}
              depthStatus={depthStatus}
              langStatus={langStatus}
              onSaveReturn={handleSaveReturn}
              onNewSession={handleNewSession}
            />
          )}
        </AnimatePresence>

        {/* Read-only Past Session Viewer */}
        <AnimatePresence>
          {viewingSessionId && (
            <MirrorSessionViewer
              sessionId={viewingSessionId}
              onClose={() => setViewingSessionId(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
