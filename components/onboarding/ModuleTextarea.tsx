"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface ModuleTextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  disableBackspace?: boolean;
  timerSeconds?: number; // total seconds, 0 = no timer
  onTimerEnd?: () => void;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ModuleTextarea({
  value,
  onChange,
  placeholder = "Write from your mind. No editing. No perfection. Just you.",
  minHeight = 200,
  disableBackspace = false,
  timerSeconds = 0,
  onTimerEnd,
}: ModuleTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [remaining, setRemaining] = useState(timerSeconds);

  // Timer
  useEffect(() => {
    if (!timerSeconds) return;
    setRemaining(timerSeconds);
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          onTimerEnd?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerSeconds, onTimerEnd]);

  // Timer color
  const timerColor =
    remaining <= 30
      ? "#FF2D2D"
      : remaining <= 60
      ? "#FF5500"
      : remaining <= 120
      ? "#FFB800"
      : "rgba(255,255,255,0.60)";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disableBackspace && (e.key === "Backspace" || e.key === "Delete")) {
      e.preventDefault();
    }
  };

  return (
    <div className="relative">
      {/* Timer */}
      {timerSeconds > 0 && (
        <div
          className="absolute top-4 right-4 text-sm font-medium font-mono z-10 transition-colors duration-300"
          style={{ color: timerColor, fontFamily: "monospace" }}
        >
          {formatTime(remaining)}
        </div>
      )}

      {/* Backspace notice */}
      {disableBackspace && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-2"
          style={{ background: "rgba(255,85,0,0.10)", border: "1px solid rgba(255,85,0,0.20)", color: "rgba(255,255,255,0.50)" }}
        >
          <span className="text-[#FF5500]">⚡</span>
          Keep going forward. No deleting. This is The Forge rule.
        </motion.div>
      )}

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        className="w-full text-white resize-vertical outline-none transition-all duration-200 leading-relaxed"
        style={{
          background: "#0F0F0F",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "24px",
          minHeight,
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 16,
          lineHeight: 1.8,
          color: "rgba(255,255,255,0.90)",
          caretColor: "#FF5500",
          paddingRight: timerSeconds ? "80px" : "24px",
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = "1px solid rgba(255,85,0,0.35)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
        }}
      />

      {/* Word count */}
      <div className="flex justify-end mt-2 pr-1">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          {countWords(value)} words
        </span>
      </div>
    </div>
  );
}
