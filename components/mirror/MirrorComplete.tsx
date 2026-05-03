"use client";

import { motion } from "framer-motion";
import type { IndicatorStatus } from "@/lib/mirror/types";
import { formatTime } from "@/lib/mirror/types";

interface MirrorCompleteProps {
  questionCount: number;
  elapsed: number;
  dependencyFlags: number;
  summary: string;
  isLoadingSummary: boolean;
  vocabStatus: IndicatorStatus;
  depthStatus: IndicatorStatus;
  langStatus: IndicatorStatus;
  onSaveReturn: () => void;
  onNewSession: () => void;
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", minWidth: 120 }}>
      <span className="font-bold" style={{ fontSize: 32, color, fontFamily: "monospace" }}>{value}</span>
      <span className="text-xs uppercase tracking-widest text-center" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</span>
    </div>
  );
}

function Pill({ label, status }: { label: string; status: IndicatorStatus }) {
  const c = status === "good"
    ? { bg: "rgba(0,217,126,0.10)", border: "rgba(0,217,126,0.25)", color: "#00D97E" }
    : status === "warn"
    ? { bg: "rgba(255,184,0,0.10)", border: "rgba(255,184,0,0.25)", color: "#FFB800" }
    : { bg: "rgba(255,45,45,0.10)", border: "rgba(255,45,45,0.25)", color: "#FF2D2D" };
  return (
    <span className="text-xs rounded-full px-3 py-1 font-medium" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      {label}
    </span>
  );
}

export default function MirrorComplete({
  questionCount, elapsed, dependencyFlags, summary, isLoadingSummary,
  vocabStatus, depthStatus, langStatus, onSaveReturn, onNewSession,
}: MirrorCompleteProps) {
  const depColor = dependencyFlags === 0 ? "#00D97E" : dependencyFlags <= 2 ? "#FFB800" : "#FF2D2D";

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-8 overflow-y-auto"
      style={{ background: "rgba(10,10,16,0.97)", backdropFilter: "blur(20px)" }}
    >
      {/* Mirror icon */}
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
          <motion.div className="absolute rounded-full" style={{ width: 80, height: 80, border: "1px solid rgba(255,120,50,0.20)" }}
            animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />
          <div className="absolute rounded-full" style={{ width: 50, height: 50, border: "1px solid rgba(255,120,50,0.10)" }} />
          <motion.div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,120,50,0.90)" }}
            animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        </div>
      </motion.div>

      {/* Headline */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
        <h2 className="font-bold" style={{ fontSize: 40, lineHeight: 1.1 }}>
          <span className="text-white">Session </span>
          <span style={{ color: "rgba(255,120,50,0.90)" }}>reflected.</span>
        </h2>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="flex gap-4 flex-wrap justify-center">
        <StatCard value={String(questionCount)} label="questions explored" color="rgba(255,120,50,0.90)" />
        <StatCard value={formatTime(elapsed)} label="minutes" color="white" />
        <StatCard value={String(dependencyFlags)} label="dependency flags" color={depColor} />
      </motion.div>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="w-full rounded-2xl p-6" style={{ maxWidth: 480, background: "#141420", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>What The Mirror noticed</p>
        {isLoadingSummary ? (
          <div className="flex gap-1.5 items-center py-2">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,120,50,0.50)" }}
                animate={{ y: [0, -4, 0] }} transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity }} />
            ))}
          </div>
        ) : (
          <p className="italic leading-relaxed" style={{ fontSize: 15, color: "rgba(255,255,255,0.70)", lineHeight: 1.7 }}>{summary}</p>
        )}

        {/* Indicator pills */}
        <div className="flex gap-2 flex-wrap mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Pill label={`Vocabulary: ${vocabStatus === "good" ? "Matching" : vocabStatus === "warn" ? "Diverging" : "Drifting"}`} status={vocabStatus} />
          <Pill label={`Depth: ${depthStatus === "good" ? "Deep" : depthStatus === "warn" ? "Surface" : "Brief"}`} status={depthStatus} />
          <Pill label={`Pattern: ${langStatus === "good" ? "Authentic" : langStatus === "warn" ? "Shifted" : "Unfamiliar"}`} status={langStatus} />
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
        className="flex gap-4">
        <button onClick={onNewSession}
          className="rounded-full h-11 px-7 text-sm font-medium transition-all hover:bg-white/5"
          style={{ border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.70)" }}>
          Start New Session
        </button>
        <button onClick={onSaveReturn}
          className="rounded-full h-11 px-7 text-sm font-medium text-white"
          style={{ background: "rgba(255,120,50,0.90)" }}>
          Save & Return
        </button>
      </motion.div>
    </motion.div>
  );
}
