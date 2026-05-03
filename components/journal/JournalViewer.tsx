"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Trash2 } from "lucide-react";
import type { JournalEntry, Mood } from "@/lib/journal/types";
import { MOOD_COLORS, relativeDate, countWords, readingMinutes } from "@/lib/journal/types";

interface JournalViewerProps {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

export default function JournalViewer({ entry, onEdit, onDelete }: JournalViewerProps) {
  const [showDrift, setShowDrift] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const moodColor = entry.mood ? MOOD_COLORS[entry.mood as Mood] : null;
  const wc = entry.word_count ?? countWords(entry.content ?? "");
  const d = entry.drift_signals;

  const driftStatus = (val: number, baseVal: number) => {
    if (!baseVal) return { label: "—", color: "rgba(255,255,255,0.35)" };
    const ratio = val / baseVal;
    if (ratio >= 0.8) return { label: "Matching", color: "#00D97E" };
    if (ratio >= 0.55) return { label: "Diverging", color: "#FFB800" };
    return { label: "Drifting", color: "#FF2D2D" };
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: "#0A0A0A" }}>
      {/* Ghost JOURNAL */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        style={{ fontSize: 160, fontWeight: 700, color: "#FFFFFF", opacity: 0.025, zIndex: 0 }}>JOURNAL</div>

      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-10 relative z-10"
        style={{ height: 56, background: "rgba(10,10,10,0.95)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div></div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit}
            className="rounded-full h-8 px-4 text-xs font-medium transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.70)" }}>
            Edit
          </button>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.10)" }}
            onMouseOver={(e) => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,45,45,0.40)"}
            onMouseOut={(e) => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"}>
            <Trash2 size={14} style={{ color: "rgba(255,255,255,0.35)" }} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative z-10" style={{ padding: "40px 64px 120px", width: "100%" }}>
        <h1 className="font-bold mb-3" style={{ fontSize: 32, color: "white" }}>
          {entry.title ?? "Untitled Entry"}
        </h1>
        {/* Metadata row */}
        <div className="flex items-center gap-3 mb-8 flex-wrap" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
          <span>{new Date(entry.created_at).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          {entry.mood && (
            <>
              <span>·</span>
              <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: `${moodColor}18`, color: moodColor! }}>
                {entry.mood}
              </span>
            </>
          )}
          {(entry.tags ?? []).length > 0 && (
            <>
              <span>·</span>
              <div className="flex gap-1 flex-wrap">
                {entry.tags.map((t) => (
                  <span key={t} className="text-xs rounded-full px-2 py-0.5"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>{t}</span>
                ))}
              </div>
            </>
          )}
          <span>·</span>
          <span>{wc} words · {readingMinutes(wc)} min read</span>
          {entry.is_forge_entry && (
            <>
              <span>·</span>
              <span className="text-xs rounded-full px-2 py-0.5" style={{ background: "rgba(255,85,0,0.12)", color: "#FF5500" }}>Forge entry</span>
            </>
          )}
        </div>

        {/* Body text */}
        <div style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 17, lineHeight: 1.9,
          color: "rgba(255,255,255,0.80)",
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {entry.content ?? ""}
        </div>

        {/* Drift signals (collapsible) */}
        {d && (
          <div className="mt-16 border-t pt-8" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <button onClick={() => setShowDrift((p) => !p)}
              className="flex items-center gap-2 text-sm mb-3"
              style={{ color: "rgba(255,255,255,0.40)" }}>
              <span>Baseline Comparison</span>
              <motion.div animate={{ rotate: showDrift ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} />
              </motion.div>
            </button>
            <AnimatePresence>
              {showDrift && (
                <motion.div key="drift" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: "hidden" }}>
                  <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex flex-col gap-3 mb-4">
                      {[
                        { label: "Vocabulary match", val: `${d.vocabulary_match}%`, status: driftStatus(d.vocabulary_match, 100) },
                        { label: "Avg sentence length", val: `${(d.sentence_length_delta > 0 ? "+" : "")}${d.sentence_length_delta} vs baseline`, status: { label: Math.abs(d.sentence_length_delta) < 3 ? "Matching" : Math.abs(d.sentence_length_delta) < 7 ? "Diverging" : "Drifting", color: Math.abs(d.sentence_length_delta) < 3 ? "#00D97E" : Math.abs(d.sentence_length_delta) < 7 ? "#FFB800" : "#FF2D2D" } },
                        { label: "Writing pace", val: `${d.wpm} WPM`, status: { label: d.wpm > 20 ? "Active" : "Slow", color: d.wpm > 20 ? "#00D97E" : "#FFB800" } },
                      ].map(({ label, val, status }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: "rgba(255,255,255,0.50)" }}>{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.60)" }}>{val}</span>
                            <span className="text-xs rounded-full px-2 py-0.5"
                              style={{ background: `${status.color}18`, color: status.color }}>{status.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs italic" style={{ color: "rgba(255,255,255,0.30)", lineHeight: 1.6 }}>
                      This data is only used to inform your Drift Score. It is never shared.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div key="del-overlay" className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.70)" }} onClick={() => setShowDeleteConfirm(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="rounded-2xl p-7 w-72 text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
              <p className="font-medium text-white mb-2">Delete this entry?</p>
              <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.40)" }}>This cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-full h-9 px-5 text-sm" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.60)" }}>Cancel</button>
                <button onClick={() => { onDelete(entry.id); setShowDeleteConfirm(false); }}
                  className="rounded-full h-9 px-5 text-sm text-white" style={{ background: "#FF2D2D" }}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Privacy Notice (one-time overlay) ───────────────────────────────────

export function PrivacyNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(10,10,10,0.95)" }}>
      <motion.div className="rounded-3xl p-10 text-center"
        style={{ width: 360, background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(255,85,0,0.12)", border: "1px solid rgba(255,85,0,0.25)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h3 className="font-bold text-white mb-4" style={{ fontSize: 18 }}>This journal is completely private.</h3>
        <p className="leading-relaxed mb-7" style={{ fontSize: 15, color: "rgba(255,255,255,0.50)", lineHeight: 1.7 }}>
          No AI reads your entries.<br />
          No one at IMPRINT sees your content.<br />
          Your drift analysis runs on your device.<br />
          You own everything you write here.
        </p>
        <button onClick={onDismiss}
          className="rounded-full h-11 px-8 text-sm font-medium text-white w-full"
          style={{ background: "#FF5500" }}>
          Got it.
        </button>
      </motion.div>
    </motion.div>
  );
}
