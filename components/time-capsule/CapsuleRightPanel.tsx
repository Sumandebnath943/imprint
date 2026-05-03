"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, BookOpen, Trash2 } from "lucide-react";
import { getZoneColor, getZoneShortLabel } from "@/lib/drift/types";
import type { TimeCapsule } from "@/components/time-capsule/CapsuleList";
import { daysRemaining, fmtDate, capsuleIsUnlocked, progressPct } from "@/components/time-capsule/CapsuleList";

const REVEAL_KEY = (id: string) => `capsule_revealed_${id}`;

// ── Small arc ring for locked countdown ───────────────────────────────────

function ArcRing({ pct }: { pct: number }) {
  const r = 80, circ = 2 * Math.PI * r, size = 180;
  const fill = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#FF5500" strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${fill} ${circ}` }}
        transition={{ duration: 1.5, ease: "easeOut" }} />
    </svg>
  );
}

// ── Locked view ───────────────────────────────────────────────────────────

function LockedView({ capsule }: { capsule: TimeCapsule }) {
  const days = daysRemaining(capsule.unlock_date);
  const pct = progressPct(capsule);

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative" style={{ background: "#0A0A0A" }}>
      <div className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
        style={{ fontSize: 180, fontWeight: 700, color: "#fff", opacity: 0.025 }}>FUTURE</div>

      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 flex flex-col items-center gap-6 text-center" style={{ maxWidth: 360 }}>
        {/* Lock icon */}
        <motion.div animate={{ rotate: [0, -5, 5, -3, 3, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,85,0,0.10)", border: "1px solid rgba(255,85,0,0.25)" }}>
            <Lock size={28} style={{ color: "#FF5500" }} />
          </div>
        </motion.div>

        <div>
          <h2 className="font-semibold text-white mb-1" style={{ fontSize: 24 }}>{capsule.title || "Untitled Capsule"}</h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>Sealed on {fmtDate(capsule.created_at)}</p>
        </div>

        <div className="relative flex items-center justify-center">
          <ArcRing pct={pct} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-bold text-white" style={{ fontSize: 36, lineHeight: 1 }}>{days}</span>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>days</span>
          </div>
        </div>

        <p className="font-semibold" style={{ fontSize: 18, color: "#FF5500" }}>
          Opens {fmtDate(capsule.unlock_date)}
        </p>

        {capsule.drift_score_at_writing !== undefined && capsule.drift_score_at_writing !== null && (
          <div className="rounded-xl px-4 py-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>Drift Score when written: </span>
            <span className="text-sm font-semibold" style={{ color: getZoneColor(capsule.drift_score_at_writing) }}>
              {capsule.drift_score_at_writing} — {getZoneShortLabel(capsule.drift_score_at_writing)}
            </span>
          </div>
        )}

        <p className="italic" style={{ fontSize: 16, color: "rgba(255,255,255,0.18)" }}>
          &ldquo;Some things are worth waiting for.&rdquo;
        </p>
      </motion.div>
    </div>
  );
}

// ── Unlocked view ─────────────────────────────────────────────────────────

interface UnlockedViewProps {
  capsule: TimeCapsule;
  currentDriftScore?: number | null;
  onReply: (capsule: TimeCapsule) => void;
  onDelete: (id: string) => void;
}

function UnlockedView({ capsule, currentDriftScore, onReply, onDelete }: UnlockedViewProps) {
  const [revealed, setRevealed] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRevealed(!!localStorage.getItem(REVEAL_KEY(capsule.id)));
    }
  }, [capsule.id]);

  const handleReveal = () => {
    localStorage.setItem(REVEAL_KEY(capsule.id), "1");
    setRevealed(true);
  };

  const daysSinceWriting = Math.floor((Date.now() - new Date(capsule.created_at).getTime()) / 86400000);
  const driftThen = capsule.drift_score_at_writing;
  const driftNow = currentDriftScore;

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden" style={{ background: "#0A0A0A" }}>
      {/* First-open reveal overlay */}
      <AnimatePresence>
        {!revealed && (
          <motion.div className="absolute inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: "rgba(10,10,10,0.97)" }}
            initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <Unlock size={48} style={{ color: "#00D97E", marginBottom: 24 }} />
            <h2 className="font-medium text-white mb-2 text-center" style={{ fontSize: 18 }}>Your capsule has been waiting for you.</h2>
            <p className="text-sm mb-8 text-center" style={{ color: "rgba(255,255,255,0.45)" }}>
              Written {daysSinceWriting} days ago, sealed until today.
            </p>
            <button onClick={handleReveal}
              className="rounded-full font-medium text-white"
              style={{ height: 48, padding: "0 32px", background: "#FF5500", fontSize: 15 }}>
              Open it →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="flex items-center justify-between px-10 shrink-0"
        style={{ height: 56, background: "rgba(10,10,10,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
          <span>{fmtDate(capsule.created_at)}</span>
          <span>·</span>
          <span>Unlocked {fmtDate(capsule.unlock_date)}</span>
        </div>
        <div className="flex items-center gap-2">
          {driftThen !== null && driftThen !== undefined && driftNow !== null && driftNow !== undefined && (
            <span className="text-xs" style={{ color: driftNow <= driftThen ? "#00D97E" : "#FF2D2D" }}>
              {driftNow <= driftThen ? `↓ Improved ${driftThen - driftNow}pts since sealing` : `↑ Drifted ${driftNow - driftThen}pts since sealing`}
            </span>
          )}
          <button onClick={() => setShowDelete(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-red-500/10"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <Trash2 size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
          </button>
        </div>
      </div>

      {/* Drift comparison */}
      {driftThen !== null && driftThen !== undefined && (
        <div className="flex items-center gap-4 px-10 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: "rgba(255,255,255,0.40)" }}>Drift when written:</span>
            <span className="font-semibold rounded-full px-2 py-0.5"
              style={{ background: `${getZoneColor(driftThen)}18`, color: getZoneColor(driftThen) }}>
              {driftThen}
            </span>
          </div>
          {driftNow !== null && driftNow !== undefined && (
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: "rgba(255,255,255,0.40)" }}>Drift now:</span>
              <span className="font-semibold rounded-full px-2 py-0.5"
                style={{ background: `${getZoneColor(driftNow)}18`, color: getZoneColor(driftNow) }}>
                {driftNow}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Letter content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "40px 80px 120px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
        <div style={{
          fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 17,
          lineHeight: 1.9, color: "rgba(255,255,255,0.82)", whiteSpace: "pre-wrap",
          background: "rgba(255,85,0,0.02)", borderRadius: 16, padding: "32px",
        }}>
          {capsule.content}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between px-10 py-3 shrink-0"
        style={{ background: "rgba(10,10,10,0.95)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={() => onReply(capsule)}
          className="rounded-full h-10 px-5 text-sm transition-all hover:bg-white/5"
          style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.65)" }}>
          Reply to yourself →
        </button>
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDelete && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.75)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDelete(false)}>
            <motion.div className="rounded-2xl p-7 text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", width: 320 }}
              onClick={(e) => e.stopPropagation()} initial={{ scale: 0.94 }} animate={{ scale: 1 }}>
              <p className="font-medium text-white mb-2" style={{ fontSize: 18 }}>Delete this letter?</p>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.6 }}>This letter is gone forever.</p>
              <button onClick={() => onDelete(capsule.id)}
                className="w-full rounded-full h-11 text-white mb-3" style={{ background: "#FF2D2D" }}>Delete</button>
              <button onClick={() => setShowDelete(false)}
                className="w-full rounded-full h-11 text-sm" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.55)" }}>
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Combined right panel ──────────────────────────────────────────────────

interface RightPanelProps {
  capsule: TimeCapsule;
  currentDriftScore?: number | null;
  onReply: (capsule: TimeCapsule) => void;
  onDelete: (id: string) => void;
}

export default function CapsuleRightPanel({ capsule, currentDriftScore, onReply, onDelete }: RightPanelProps) {
  if (capsuleIsUnlocked(capsule)) {
    return <UnlockedView capsule={capsule} currentDriftScore={currentDriftScore} onReply={onReply} onDelete={onDelete} />;
  }
  return <LockedView capsule={capsule} />;
}
