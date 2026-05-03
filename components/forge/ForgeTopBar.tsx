"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ForgeTool } from "@/lib/forge/types";
import { formatTime, getTimerColor, countWords } from "@/lib/forge/types";

const TOOL_LABELS: Record<ForgeTool, string> = {
  "free-write": "FREE WRITE",
  "timed-write": "TIMED WRITE",
  "vault-challenge": "VAULT CHALLENGE",
  "voice-note": "VOICE NOTE",
  "sketch-upload": "SKETCH UPLOAD",
  "memory-recall": "MEMORY RECALL",
};

interface ForgeTopBarProps {
  tool: ForgeTool;
  timerDuration: number; // 0 = count up
  elapsed: number;
  content: string;
  onEndSession: () => void;
}

export default function ForgeTopBar({ tool, timerDuration, elapsed, content, onEndSession }: ForgeTopBarProps) {
  const isCountdown = timerDuration > 0;
  const remaining = Math.max(0, timerDuration - elapsed);
  const displayTime = isCountdown ? remaining : elapsed;
  const timerColor = isCountdown ? getTimerColor(remaining) : "rgba(255,255,255,0.40)";
  const wordCount = countWords(content);
  const isLastMinute = isCountdown && remaining < 60;

  const toolLabel = TOOL_LABELS[tool];
  const durationLabel = timerDuration > 0 ? ` · ${timerDuration / 60} MIN` : "";

  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        height: 52,
        background: "rgba(4,4,4,0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "0 24px",
      }}
    >
      {/* Left: tool badge */}
      <span
        className="text-xs font-semibold rounded-full"
        style={{ background: "rgba(255,85,0,0.15)", border: "1px solid rgba(255,85,0,0.25)", color: "#FF5500", padding: "4px 12px" }}
      >
        {toolLabel}{durationLabel}
      </span>

      {/* Center: timer */}
      <AnimatePresence>
        <motion.span
          key={Math.floor(displayTime)}
          className="font-mono font-bold tabular-nums"
          style={{ fontSize: 28, color: timerColor, letterSpacing: "-0.02em" }}
          animate={isLastMinute ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
          transition={isLastMinute ? { duration: 0.8, repeat: Infinity } : {}}
        >
          {formatTime(displayTime)}
        </motion.span>
      </AnimatePresence>

      {/* Right: word count + end button */}
      <div className="flex items-center gap-4">
        {(tool === "free-write" || tool === "timed-write" || tool === "memory-recall" || tool === "vault-challenge") && (
          <span className="font-mono text-sm tabular-nums" style={{ color: "rgba(255,255,255,0.35)" }}>
            {wordCount} words
          </span>
        )}
        <button
          onClick={onEndSession}
          className="text-xs font-medium rounded-full transition-all duration-150"
          style={{ border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.50)", padding: "5px 14px" }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,85,0,0.50)";
            (e.currentTarget as HTMLElement).style.color = "#FF5500";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.50)";
          }}
        >
          End Session
        </button>
      </div>
    </div>
  );
}
