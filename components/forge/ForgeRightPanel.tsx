"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";
import type { ForgeHistoryEntry } from "@/lib/forge/types";
import { formatTime } from "@/lib/forge/types";
import ForgeMetrics from "./ForgeMetrics";

interface ForgeRightPanelProps {
  open: boolean;
  onToggle: () => void;
  content: string;
  elapsed: number;
  isActive: boolean;
  history: ForgeHistoryEntry[];
}

export default function ForgeRightPanel({ open, onToggle, content, elapsed, isActive, history }: ForgeRightPanelProps) {
  return (
    <div className="relative flex h-full">
      {/* Toggle button */}
      <button onClick={onToggle}
        className="absolute top-4 -left-4 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all"
        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.10)" }}>
        {open ? <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.66)" }} /> : <ChevronLeft size={12} style={{ color: "rgba(255,255,255,0.66)" }} />}
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
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.58)" }}>This Session</p>
          {isActive ? <ForgeMetrics content={content} elapsed={elapsed} /> : (
            <p className="text-xs py-4 text-white/60">Start a session to see live stats.</p>
          )}

          {/* Forge history */}
          {history.length > 0 && (
            <div className="mt-6">
              <div className="mb-3" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.58)" }}>Forge History</p>
              <div className="flex flex-col gap-2">
                {history.slice(0, 5).map((h) => {
                  const d = new Date(h.created_at);
                  const label = `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${h.tool.replace("-", " ")}`;
                  return (
                    <div key={h.id} className="rounded-xl p-3 cursor-pointer transition-all"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid transparent" }}
                      onMouseOver={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"}
                      onMouseOut={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}>
                      <p className="text-xs font-medium text-white mb-1">{label}</p>
                      <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.62)" }}>
                        {h.word_count > 0 ? `${h.word_count} words` : formatTime(h.time_spent_seconds)}
                      </p>
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
