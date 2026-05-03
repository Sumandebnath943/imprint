"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { ForgeTool } from "@/lib/forge/types";

interface ForgeEditorProps {
  tool: ForgeTool;
  timerDuration: number;
  remaining: number; // seconds remaining (for countdown ghost)
  content: string;
  memoryTopic?: string;
  isReadOnly?: boolean;
  onChange: (val: string) => void;
}

export default function ForgeEditor({
  tool, timerDuration, remaining, content, memoryTopic, isReadOnly = false, onChange,
}: ForgeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [backspaceFlash, setBackspaceFlash] = useState(false);
  const isMemoryRecall = tool === "memory-recall";
  const isTimedWrite = tool === "timed-write";
  const minutesRemaining = Math.ceil(remaining / 60);

  // Focus on mount
  useEffect(() => {
    if (!isReadOnly) textareaRef.current?.focus();
  }, [isReadOnly]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Memory recall: block backspace / delete
    if (isMemoryRecall && (e.key === "Backspace" || e.key === "Delete")) {
      e.preventDefault();
      setBackspaceFlash(true);
      setTimeout(() => setBackspaceFlash(false), 600);
      return;
    }
    // ⌘/Ctrl + Enter: end session (handled by parent via custom event)
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("forge:end-session"));
    }
    // ⌘/Ctrl + S: save
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("forge:save"));
    }
  }, [isMemoryRecall]);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden" style={{ background: "#080808" }}>
      {/* Scanline texture */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)",
        }}
      />

      {/* Ghost "FORGE" text */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none"
        style={{ fontSize: 180, fontWeight: 700, color: "#FFFFFF", opacity: 0.025, letterSpacing: "-0.05em", overflow: "hidden" }}
      >
        FORGE
      </div>

      {/* Timed write: ghost minute countdown */}
      {isTimedWrite && timerDuration > 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none"
          style={{ fontSize: 200, fontWeight: 700, color: "#FFFFFF", opacity: 0.035, overflow: "hidden" }}
        >
          {minutesRemaining}
        </div>
      )}

      {/* Memory recall: topic banner */}
      {isMemoryRecall && memoryTopic && (
        <div
          className="relative z-20 shrink-0"
          style={{ background: "rgba(255,85,0,0.06)", borderBottom: "1px solid rgba(255,85,0,0.12)", padding: "14px 64px" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#FF5500" }}>FROM MEMORY:</p>
          <p className="font-medium text-white" style={{ fontSize: 15 }}>{memoryTopic}</p>
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={isReadOnly}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        placeholder={`Start writing. Don't stop. Don't edit. Don't look back.`}
        className="relative z-20 flex-1 resize-none outline-none w-full"
        style={{
          background: "transparent",
          border: "none",
          padding: "48px 64px",
          fontFamily: "'Courier New', 'Courier', monospace",
          fontSize: 18,
          lineHeight: 1.9,
          color: "rgba(255,255,255,0.85)",
          caretColor: "#FF5500",
          // Placeholder style via CSS class below
        }}
      />

      {/* Memory recall: no-delete hint */}
      {isMemoryRecall && (
        <div
          className="absolute bottom-8 right-12 z-30 pointer-events-none transition-all duration-300"
          style={{
            color: backspaceFlash ? "#FF5500" : "rgba(255,255,255,0.20)",
            fontSize: 12,
            fontStyle: "italic",
            transform: backspaceFlash ? "scale(1.05)" : "scale(1)",
          }}
        >
          Keep moving forward. No deleting.
        </div>
      )}

      {/* Keyboard hint */}
      {!isReadOnly && (
        <div
          className="absolute bottom-5 left-0 right-0 flex justify-center pointer-events-none z-20"
          style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}
        >
          ⌘↵ to finish · ⌘S to save
        </div>
      )}

      {/* Placeholder style */}
      <style>{`
        textarea::placeholder {
          color: rgba(255,255,255,0.15);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
