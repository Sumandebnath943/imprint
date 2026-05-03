"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";
import type { ForgeHistoryEntry } from "@/lib/forge/types";
import { formatTime, countWords, calcWPM } from "@/lib/forge/types";

interface ForgeRightPanelProps {
  open: boolean;
  onToggle: () => void;
  content: string;
  elapsed: number;
  isActive: boolean;
  history: ForgeHistoryEntry[];
  baselineWordCount?: number;
}

function StatRow({ value, label, color = "white" }: { value: string; label: string; color?: string }) {
  return (
    <div className="py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <p className="font-bold" style={{ fontSize: 20, color }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
    </div>
  );
}

function IndicatorPill({ label, status }: { label: string; status: "good" | "warn" | "bad" }) {
  const colors = { good: { bg: "rgba(0,217,126,0.12)", border: "rgba(0,217,126,0.25)", text: "#00D97E" }, warn: { bg: "rgba(255,184,0,0.12)", border: "rgba(255,184,0,0.25)", text: "#FFB800" }, bad: { bg: "rgba(255,45,45,0.12)", border: "rgba(255,45,45,0.25)", text: "#FF2D2D" } };
  const c = colors[status];
  const statusText = status === "good" ? "Matching" : status === "warn" ? "Diverging" : "Drift";
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
      <span className="text-xs rounded-full px-2 py-0.5 font-medium" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>{statusText}</span>
    </div>
  );
}

export default function ForgeRightPanel({ open, onToggle, content, elapsed, isActive, history, baselineWordCount = 300 }: ForgeRightPanelProps) {
  const words = countWords(content);
  const wpm = calcWPM(words, elapsed);
  const paceStatus = wpm > 30 ? "good" : wpm > 15 ? "warn" : "bad";

  return (
    <div className="relative flex h-full">
      {/* Toggle button */}
      <button onClick={onToggle}
        className="absolute top-4 -left-4 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all"
        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.10)" }}>
        {open ? <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.40)" }} /> : <ChevronLeft size={12} style={{ color: "rgba(255,255,255,0.40)" }} />}
      </button>

      <div
        className="flex flex-col h-full shrink-0 transition-all duration-250"
        style={{
          width: open ? 260 : 0,
          minWidth: open ? 260 : 0,
          overflow: "hidden",
          background: "#0A0A0A",
          borderLeft: open ? "1px solid rgba(255,255,255,0.05)" : "none",
        }}
      >

      {open && (
        <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: "none" }}>
          {/* Current session stats */}
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.30)" }}>This Session</p>
          {isActive ? (
            <>
              <StatRow value={String(words)} label="words written" />
              <StatRow value={formatTime(elapsed)} label="elapsed" />
              <StatRow value={String(wpm)} label="words / min" color="#FF5500" />
              {/* Pace bar */}
              <div className="mt-3">
                <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ background: paceStatus === "good" ? "#00D97E" : "#FF5500", width: `${Math.min(100, (wpm / 50) * 100)}%` }} />
                </div>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>vs 50 WPM target</p>
              </div>
            </>
          ) : (
            <p className="text-xs py-4" style={{ color: "rgba(255,255,255,0.30)" }}>Start a session to see live stats.</p>
          )}

          {/* Baseline comparison */}
          {isActive && words > 10 && (
            <div className="mt-6">
              <div className="mb-3" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.30)" }}>vs Your Baseline</p>
              <IndicatorPill label="Vocabulary" status={wpm > 20 ? "good" : "warn"} />
              <IndicatorPill label="Rhythm" status={words > baselineWordCount * 0.5 ? "good" : "warn"} />
              <IndicatorPill label="Depth" status={words > baselineWordCount * 0.8 ? "good" : words > baselineWordCount * 0.4 ? "warn" : "bad"} />
            </div>
          )}

          {/* Forge history */}
          {history.length > 0 && (
            <div className="mt-6">
              <div className="mb-3" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.30)" }}>Forge History</p>
              <div className="flex flex-col gap-2">
                {history.slice(0, 5).map((h) => {
                  const d = new Date(h.created_at);
                  const label = `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${h.tool.replace("-", " ")}`;
                  const signals = h.drift_signals as any;
                  let driftStatus = "good";
                  if (signals && signals.vocabulary_delta !== undefined) {
                    const avgDelta = (Math.abs(signals.vocabulary_delta || 0) + Math.abs(signals.sentence_length_delta || 0) + Math.abs(signals.word_count_delta || 0)) / 3;
                    if (avgDelta > 15) driftStatus = "bad";
                    else if (avgDelta > 5) driftStatus = "warn";
                  }

                  return (
                    <div key={h.id} className="rounded-xl p-3 cursor-pointer transition-all"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid transparent" }}
                      onMouseOver={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"}
                      onMouseOut={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}>
                      <p className="text-xs font-medium text-white mb-1">{label}</p>
                      <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {h.word_count > 0 ? `${h.word_count} words` : formatTime(h.time_spent_seconds)}
                      </p>
                      {signals && signals.vocabulary_delta !== undefined && (
                        <span className="text-xs" style={{ color: driftStatus === "good" ? "#00D97E" : driftStatus === "warn" ? "#FFB800" : "#FF2D2D" }}>
                          Baseline: {driftStatus === "good" ? "✓ Close" : driftStatus === "warn" ? "↑ Diverging" : "⇡ Drifting"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <a href="/dashboard/journal" className="text-xs mt-3 block" style={{ color: "#FF5500" }}>View all sessions →</a>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
