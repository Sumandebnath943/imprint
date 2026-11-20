"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SessionContext, MirrorSessionStats, MirrorPastSession } from "@/lib/mirror/types";
import { formatTime } from "@/lib/mirror/types";
import LocalDate from "@/components/shared/LocalDate";

const CONTEXTS: SessionContext[] = ["My Work", "A Decision", "My Skills", "My Beliefs", "Something Else"];

interface MirrorLeftPanelProps {
  selectedContext: SessionContext | null;
  customTopic: string;
  stats: MirrorSessionStats;
  isActive: boolean;
  elapsed: number;
  pastSessions: MirrorPastSession[];
  onSelectContext: (c: SessionContext) => void;
  onCustomTopic: (t: string) => void;
  onViewPastSession: (id: string) => void;
}

export default function MirrorLeftPanel({
  selectedContext, customTopic, stats, isActive, elapsed,
  pastSessions,
  onSelectContext, onCustomTopic, onViewPastSession,
}: MirrorLeftPanelProps) {

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{
      width: 300, minWidth: 300, background: "#080810",
      borderRight: "1px solid rgba(255,255,255,0.05)", padding: "24px 16px",
      scrollbarWidth: "none",
    }}>
      {/* Header */}
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,120,50,0.90)" }}>THE MIRROR</p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.54)" }}>Reflection Chamber</p>
      </div>

      {/* Context selector */}
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.58)" }}>Reflecting On</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {CONTEXTS.map((c) => {
          const sel = selectedContext === c;
          return (
            <button key={c} onClick={() => !isActive && onSelectContext(c)}
              disabled={isActive}
              className="text-xs rounded-full transition-all duration-150"
              style={{
                padding: "6px 12px",
                background: sel ? "rgba(255,85,0,0.12)" : "#1A1A24",
                border: sel ? "1px solid rgba(255,120,50,0.40)" : "1px solid rgba(255,255,255,0.08)",
                color: sel ? "rgba(255,120,50,0.90)" : "rgba(255,255,255,0.70)",
                opacity: isActive && !sel ? 0.5 : 1,
                cursor: isActive ? "default" : "pointer",
              }}>
              {c}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedContext === "Something Else" && !isActive && (
          <motion.div key="custom" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3">
            <input placeholder="What's on your mind?" value={customTopic} onChange={(e) => onCustomTopic(e.target.value)}
              className="w-full text-xs outline-none"
              style={{ background: "#1A1A24", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "white" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mirror rules */}
      <div className="my-5" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.58)" }}>Mirror Rules</p>
      {["Mirror uses AI to ask reflective questions.", "You decide what to share and when to stop.", "Your thinking is the only output that matters."].map((r) => (
        <div key={r} className="flex items-start gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "rgba(255,120,50,0.70)" }} />
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.66)", lineHeight: 1.8 }}>{r}</p>
        </div>
      ))}

      {/* Session stats */}
      {isActive && (
        <>
          <div className="my-5" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.58)" }}>This Session</p>
          <div className="flex flex-col gap-4 mb-2">
            <div>
              <p className="font-bold text-white" style={{ fontSize: 24 }}>{stats.questionCount}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>questions asked by Mirror</p>
            </div>
            <div>
              <p className="font-bold" style={{ fontSize: 24, color: "rgba(255,120,50,0.90)" }}>{stats.userCount}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>thoughts explored by you</p>
            </div>
          </div>
        </>
      )}

      {/* Past sessions */}
      {pastSessions.length > 0 && (
        <div className="mt-auto pt-5">
          <div className="mb-3" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.58)" }}>Past Sessions</p>
          <div className="flex flex-col gap-3">
            {pastSessions.slice(0, 4).map((s) => (
              <div key={s.id} className="rounded-xl p-3 cursor-pointer transition-all"
                style={{ background: "rgba(255,255,255,0.02)" }}
                onClick={() => onViewPastSession(s.id)}
                onMouseOver={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"}
                onMouseOut={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}>
                <p className="text-xs font-medium text-white mb-0.5">
                  <LocalDate value={s.created_at} locale="en-US" options={{ month: "short", day: "numeric" }} />
                </p>
                <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.66)" }}>{(s.topics ?? []).join(", ")}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.54)" }}>
                  {s.ai_question_count}q · {s.user_message_count} messages · {formatTime(s.session_duration_seconds)}
                </p>
              </div>
            ))}
          </div>
          <a href="/dashboard/mirror/history" className="text-xs mt-3 block" style={{ color: "rgba(255,120,50,0.80)" }}>View all →</a>
        </div>
      )}
    </div>
  );
}
