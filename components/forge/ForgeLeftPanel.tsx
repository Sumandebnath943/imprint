"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Timer, Zap, Mic, PenTool, Brain } from "lucide-react";
import type { ForgeTool, ForgeChallenge, ForgeSession } from "@/lib/forge/types";
import { MEMORY_TOPICS, formatTime } from "@/lib/forge/types";

const TOOLS = [
  { id: "free-write" as ForgeTool, icon: FileText, name: "Free Write", desc: "Open session, no timer" },
  { id: "timed-write" as ForgeTool, icon: Timer, name: "Timed Write", desc: "Set your own timer" },
  { id: "vault-challenge" as ForgeTool, icon: Zap, name: "Vault Challenge", desc: "Your active challenge" },
  { id: "voice-note" as ForgeTool, icon: Mic, name: "Voice Note", desc: "Raw audio capture" },
  { id: "sketch-upload" as ForgeTool, icon: PenTool, name: "Sketch Upload", desc: "Upload handwriting or sketch" },
  { id: "memory-recall" as ForgeTool, icon: Brain, name: "Memory Recall", desc: "From memory only" },
] as const;

const DURATIONS = [5, 10, 15, 20, 30];

interface ForgeLeftPanelProps {
  activeTool: ForgeTool;
  sessionState: "idle" | "active" | "complete";
  session: ForgeSession | null;
  challenge: ForgeChallenge | null;
  elapsed: number;
  professionCluster: string;
  timerDuration: number;
  selectedMemoryTopic: string;
  history: { date: string; tool: string; words: number }[];
  onSelectTool: (t: ForgeTool) => void;
  onSetDuration: (secs: number) => void;
  onSetMemoryTopic: (t: string) => void;
}

export default function ForgeLeftPanel({
  activeTool, sessionState, session, challenge, elapsed,
  professionCluster, timerDuration, selectedMemoryTopic,
  history, onSelectTool, onSetDuration, onSetMemoryTopic,
}: ForgeLeftPanelProps) {
  const [customDuration, setCustomDuration] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const topics = MEMORY_TOPICS[professionCluster] ?? MEMORY_TOPICS.life_personal;

  const isActive = sessionState === "active";

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{
        width: 280, minWidth: 280, background: "#0A0A0A",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        padding: "24px 16px",
        scrollbarWidth: "none",
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#FF5500" }}>THE FORGE</p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>Zero-Silicon Workspace</p>
      </div>

      {/* Session indicator */}
      {isActive && (
        <div className="flex items-center gap-2 mb-6 p-3 rounded-xl" style={{ background: "rgba(255,85,0,0.08)", border: "1px solid rgba(255,85,0,0.15)" }}>
          <motion.div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: "#FF5500" }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <div>
            <p className="text-xs font-medium" style={{ color: "#FF5500" }}>Session active</p>
            <p className="font-mono font-bold text-white" style={{ fontSize: 15 }}>{formatTime(elapsed)}</p>
          </div>
        </div>
      )}

      {/* Tools */}
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.30)" }}>Tools</p>
      <div className="flex flex-col gap-1 mb-6">
        {TOOLS.map(({ id, icon: Icon, name, desc }) => {
          const active = activeTool === id;
          const hasBadge = id === "vault-challenge" && challenge;
          return (
            <button
              key={id}
              onClick={() => !isActive && onSelectTool(id)}
              disabled={isActive}
              className="text-left rounded-[10px] transition-all duration-150 flex items-center gap-3"
              style={{
                padding: "10px 14px",
                background: active ? "rgba(255,85,0,0.10)" : "transparent",
                borderLeft: active ? "2px solid #FF5500" : "2px solid transparent",
                opacity: isActive && !active ? 0.4 : 1,
                cursor: isActive ? "default" : "pointer",
              }}
              onMouseOver={(e) => { if (!isActive && !active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseOut={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon size={18} style={{ color: active ? "#FF5500" : "rgba(255,120,50,0.50)", flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{name}</span>
                  {hasBadge && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,85,0,0.20)", color: "#FF5500" }}>Due</span>
                  )}
                </div>
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mb-5" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

      {/* Session config */}
      <AnimatePresence mode="wait">
        {activeTool === "timed-write" && !isActive && (
          <motion.div key="timed-config" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.30)" }}>Duration</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {DURATIONS.map((d) => {
                const sel = timerDuration === d * 60;
                return (
                  <button key={d} onClick={() => onSetDuration(d * 60)}
                    className="rounded-full text-xs font-medium transition-all"
                    style={{
                      padding: "5px 12px",
                      background: sel ? "#FF5500" : "rgba(255,255,255,0.06)",
                      color: sel ? "white" : "rgba(255,255,255,0.50)",
                      border: sel ? "none" : "1px solid rgba(255,255,255,0.10)",
                    }}>
                    {d}m
                  </button>
                );
              })}
            </div>
            <input
              type="number" min="1" max="120"
              placeholder="Custom min"
              value={customDuration}
              onChange={(e) => { setCustomDuration(e.target.value); onSetDuration(parseInt(e.target.value || "0") * 60); }}
              className="w-full text-sm outline-none"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, padding: "8px 12px", color: "white" }}
            />
          </motion.div>
        )}

        {activeTool === "vault-challenge" && !isActive && (
          <motion.div key="challenge-config" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {challenge ? (
              <div className="rounded-xl p-4" style={{ background: "rgba(255,85,0,0.06)", border: "1px solid rgba(255,85,0,0.15)" }}>
                <p className="font-semibold text-white mb-2" style={{ fontSize: 13 }}>{challenge.title}</p>
                {challenge.description && <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{challenge.description}</p>}
                <div className="flex gap-2 flex-wrap">
                  {challenge.skill_name && (
                    <span className="text-xs rounded-full px-2 py-0.5" style={{ background: "rgba(255,85,0,0.15)", color: "#FF5500" }}>{challenge.skill_name}</span>
                  )}
                  {challenge.due_date && (
                    <span className="text-xs rounded-full px-2 py-0.5" style={{ background: "rgba(255,184,0,0.15)", color: "#FFB800" }}>
                      Due {new Date(challenge.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.35)" }}>No challenge assigned yet.</p>
            )}
          </motion.div>
        )}

        {activeTool === "memory-recall" && !isActive && (
          <motion.div key="memory-config" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.30)" }}>Choose a topic from memory</p>
            <div className="flex flex-col gap-2">
              {topics.map((t) => {
                const isSel = selectedMemoryTopic === t;
                if (t === "Custom topic") {
                  return (
                    <div key={t}>
                      <input placeholder="Type your topic…" value={customTopic}
                        onChange={(e) => { setCustomTopic(e.target.value); onSetMemoryTopic(e.target.value); }}
                        className="w-full text-xs outline-none"
                        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, padding: "7px 10px", color: "white" }}
                      />
                    </div>
                  );
                }
                return (
                  <button key={t} onClick={() => onSetMemoryTopic(t)}
                    className="text-left text-xs rounded-lg px-3 py-2 transition-all"
                    style={{
                      background: isSel ? "rgba(255,85,0,0.12)" : "rgba(255,255,255,0.04)",
                      border: isSel ? "1px solid rgba(255,85,0,0.30)" : "1px solid transparent",
                      color: isSel ? "#FF5500" : "rgba(255,255,255,0.55)",
                    }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent sessions */}
      {history.length > 0 && (
        <div className="mt-auto pt-6">
          <div className="mb-3" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.30)" }}>Recent Sessions</p>
          <div className="flex flex-col gap-2">
            {history.slice(0, 5).map((h, i) => {
              const toolLabel = h.tool.replace(/-/g, " ");
              const isFile = h.tool === "sketch-upload" || h.tool === "voice-note";
              const detail = isFile
                ? (h.tool === "voice-note" ? "voice recording" : "file upload")
                : `${h.words} words`;
              return (
                <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <span style={{ color: "rgba(255,255,255,0.20)" }}>·</span>
                  <div>
                    <span className="capitalize" style={{ color: "rgba(255,255,255,0.55)" }}>{toolLabel}</span>
                    <span> — {detail}</span>
                    <div style={{ color: "rgba(255,255,255,0.25)" }}>{h.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
