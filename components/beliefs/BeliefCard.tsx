"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ChangeLogEntry { date: string; previous_confidence: number; new_confidence: number; note?: string; }

export interface Belief {
  id: string; user_id: string; belief_statement: string; category: string;
  confidence_level: number; context_note?: string;
  first_recorded: string; last_reviewed: string;
  change_log: ChangeLogEntry[];
}

export const CONFIDENCE_LABEL = (n: number) =>
  n <= 2 ? "Exploratory" : n <= 4 ? "Leaning toward" : n <= 6 ? "Fairly confident" : n <= 8 ? "Strongly held" : "Core belief";

export const CONFIDENCE_COLOR = (n: number) =>
  n >= 8 ? "#FF5500" : n >= 5 ? "#FFB800" : "rgba(255,255,255,0.20)";

const EDGE_COLOR = (n: number) =>
  n >= 8 ? "#FF5500" : n >= 5 ? "#FFB800" : "rgba(255,255,255,0.18)";

function relTime(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today"; if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ── Review Modal ──────────────────────────────────────────────────────────

interface ReviewModalProps {
  belief: Belief;
  onUpdate: (id: string, newConf: number, note: string) => void;
  onClose: () => void;
}

function ReviewModal({ belief, onUpdate, onClose }: ReviewModalProps) {
  const [conf, setConf] = useState(belief.confidence_level);
  const [note, setNote] = useState("");
  const daysSince = Math.floor((Date.now() - new Date(belief.first_recorded).getTime()) / 86400000);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.75)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="rounded-3xl w-full max-w-md"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", padding: "36px" }}
        onClick={(e) => e.stopPropagation()} initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }}>
        <h3 className="font-semibold text-white mb-1" style={{ fontSize: 20 }}>Revisiting a belief</h3>
        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.40)" }}>{daysSince} days since you recorded this</p>

        <div className="rounded-xl p-4 mb-5" style={{ background: "#0D0D0D" }}>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.80)", lineHeight: 1.7 }}>{belief.belief_statement}</p>
        </div>

        <div className="flex items-center gap-1 mb-5">
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Your original confidence:</span>
          <span className="ml-2 text-sm font-semibold" style={{ color: CONFIDENCE_COLOR(belief.confidence_level) }}>
            {belief.confidence_level}/10
          </span>
        </div>

        <p className="font-medium text-white mb-3" style={{ fontSize: 16 }}>Where does this belief stand today?</p>

        {/* Slider */}
        <div className="mb-1 text-center">
          <span className="font-bold" style={{ fontSize: 32, color: "#FF5500" }}>{conf}</span>
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>/10</span>
        </div>
        <input type="range" min={1} max={10} value={conf} onChange={(e) => setConf(Number(e.target.value))}
          className="w-full mb-1" style={{ accentColor: "#FF5500" }} />
        <div className="flex justify-between text-xs mb-5" style={{ color: "rgba(255,255,255,0.30)" }}>
          <span>Not sure at all</span><span>{CONFIDENCE_LABEL(conf)}</span><span>Completely certain</span>
        </div>

        <textarea value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="What changed, if anything?"
          className="w-full rounded-xl outline-none resize-none text-sm mb-5"
          style={{ background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px", minHeight: 72, color: "rgba(255,255,255,0.70)", lineHeight: 1.6 }} />

        <button onClick={() => onUpdate(belief.id, conf, note)}
          className="w-full rounded-full h-12 font-medium text-white mb-3"
          style={{ background: "#FF5500" }}>Update Belief</button>
        <button onClick={() => onUpdate(belief.id, belief.confidence_level, "")}
          className="w-full rounded-full h-12 text-sm transition-all hover:bg-white/5"
          style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.55)" }}>
          Unchanged — Still {belief.confidence_level}/10
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Belief Card ───────────────────────────────────────────────────────────

interface BeliefCardProps {
  belief: Belief;
  index: number;
  onReview: (belief: Belief) => void;
  onDelete: (id: string) => void;
}

export default function BeliefCard({ belief, index, onReview, onDelete }: BeliefCardProps) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const conf = belief.confidence_level;
  const color = CONFIDENCE_COLOR(conf);
  const truncated = belief.belief_statement.length > 200;
  const displayText = truncated && !expanded
    ? belief.belief_statement.slice(0, 200) + "…"
    : belief.belief_statement;

  const isDue = (Date.now() - new Date(belief.last_reviewed).getTime()) / 86400000 > 30;
  const lastChange = belief.change_log[belief.change_log.length - 1];

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        className="rounded-2xl cursor-pointer relative overflow-hidden"
        style={{
          background: "#111111",
          border: `1px solid ${hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"}`,
          borderLeft: `3px solid ${EDGE_COLOR(conf)}`,
          padding: "22px 24px",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          transition: "all 200ms ease",
        }}>
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs rounded-full px-2 py-0.5"
            style={{ background: "rgba(255,85,0,0.10)", color: "#FF5500", border: "1px solid rgba(255,85,0,0.20)" }}>
            {belief.category}
          </span>
          <div className="flex items-center gap-2">
            {isDue && (
              <span className="text-xs rounded-full px-2 py-0.5"
                style={{ background: "rgba(255,184,0,0.10)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.25)" }}>
                Review due
              </span>
            )}
            <span className="text-xs font-semibold rounded-full px-2 py-0.5"
              style={{ background: `${color}1A`, color, border: `1px solid ${color}35` }}>
              {conf}/10
            </span>
          </div>
        </div>

        {/* Belief text */}
        <p className="mb-3" style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 1.7 }}>{displayText}</p>
        {truncated && (
          <button onClick={() => setExpanded((p) => !p)} className="text-xs mb-3" style={{ color: "#FF5500" }}>
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {/* Confidence dots */}
        <div className="flex items-center gap-1 mb-1">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="rounded-full" style={{ width: 8, height: 8, background: i < conf ? color : "rgba(255,255,255,0.10)" }} />
          ))}
        </div>
        <p className="text-xs mb-3" style={{ color }}>{CONFIDENCE_LABEL(conf)}</p>

        {/* Dates */}
        <div className="flex gap-3 text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
          <span>Recorded {relTime(belief.first_recorded)}</span>
          <span>·</span>
          <span>Reviewed {relTime(belief.last_reviewed)}</span>
        </div>

        {/* Change indicator */}
        {belief.change_log.length > 0 && (
          <p className="text-xs italic" style={{ color: "rgba(255,255,255,0.35)" }}>
            Changed {belief.change_log.length}×
            {lastChange && ` — was ${lastChange.previous_confidence}/10 → ${lastChange.new_confidence}/10`}
          </p>
        )}

        {/* Hover actions */}
        <AnimatePresence>
          {hovered && (
            <motion.div className="flex gap-2 mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>
              <button onClick={() => setShowReview(true)}
                className="rounded-full h-8 px-4 text-xs font-medium transition-all"
                style={{ border: "1px solid rgba(255,85,0,0.35)", color: "#FF5500" }}>Review</button>
              <button onClick={() => onDelete(belief.id)}
                className="rounded-full h-8 px-4 text-xs transition-all hover:bg-red-500/10"
                style={{ border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.40)" }}>Delete</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Review modal */}
      <AnimatePresence>
        {showReview && (
          <ReviewModal belief={belief} onClose={() => setShowReview(false)}
            onUpdate={(id, newConf, note) => { onReview({ ...belief, confidence_level: newConf }); setShowReview(false); }} />
        )}
      </AnimatePresence>
    </>
  );
}
