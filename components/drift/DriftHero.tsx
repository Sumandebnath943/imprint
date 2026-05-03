"use client";

import { motion, animate } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import DriftRing from "@/components/drift/DriftRing";
import type { DriftScore, DriftSignalValues } from "@/lib/drift/types";
import { getZoneColor, getZoneLabel, getZoneShortLabel, formatScoreDate } from "@/lib/drift/types";

interface DriftHeroProps {
  current: DriftScore;
  previous: DriftScore | null;
  nextCalibrationAvailable: boolean;
  nextCalibrationDate: string | null;
  signals: DriftSignalValues;
}

// ── Count-up animation ─────────────────────────────────────────────────────
function CountUp({ to, color }: { to: number; color: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, to, { duration: 2.2, ease: "easeOut", onUpdate: (v) => setVal(Math.round(v)) });
    return () => ctrl.stop();
  }, [to]);
  return <span style={{ color }}>{val}</span>;
}

export function DriftHero({ current, previous, nextCalibrationAvailable, nextCalibrationDate, signals }: DriftHeroProps) {
  const score = current.score;
  const color = getZoneColor(score);
  const delta = previous ? score - previous.score : null;

  const orbitalSignals = [
    { label: "Baseline Consistency", good: signals.baselineConsistency >= 70 },
    { label: "Vault Activity",       good: signals.vaultActivity >= 60 },
    { label: "AI Independence",      good: signals.aiIndependence >= 70 },
    { label: "Journal Regularity",   good: signals.journalRegularity >= 50 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      className="flex items-center justify-between gap-12 mb-6 flex-wrap">
      {/* LEFT */}
      <div className="flex-1" style={{ minWidth: 280 }}>
        <h1 className="font-bold text-white mb-1" style={{ fontSize: 32 }}>Drift Score</h1>
        <p className="mb-8" style={{ fontSize: 15, color: "rgba(255,255,255,0.40)" }}>Your identity preservation index.</p>

        {/* Big score */}
        <div className="flex items-end gap-3 mb-4">
          <span className="font-bold" style={{ fontSize: 96, lineHeight: 1, color }}>
            <CountUp to={score} color={color} />
          </span>
          <span className="mb-3" style={{ fontSize: 32, color: "rgba(255,255,255,0.20)" }}>/ 100</span>
        </div>

        {/* Status badge */}
        <div className="inline-flex rounded-full px-5 py-2 mb-4"
          style={{ background: `${color}1E`, border: `1px solid ${color}4D` }}>
          <span className="font-semibold" style={{ fontSize: 15, color }}>{getZoneLabel(score)}</span>
        </div>

        {/* Delta */}
        <div className="flex flex-col gap-1">
          {delta !== null ? (
            <span style={{ fontSize: 15, color: delta <= 0 ? "#00D97E" : "#FF2D2D", fontWeight: 500 }}>
              {delta <= 0 ? `↓ ${Math.abs(delta)}` : `↑ ${delta}`} points since last calibration
            </span>
          ) : (
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.35)" }}>No change since last calibration</span>
          )}
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.30)" }}>
            Last calibration: {formatScoreDate(current.created_at)}
          </span>
        </div>
      </div>

      {/* RIGHT — ring */}
      <div className="flex flex-col items-center gap-4">
        <DriftRing score={score} size={240} strokeWidth={12} showCenter signals={orbitalSignals} />
        <div className="text-center">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Next calibration:</p>
          <p className="text-sm font-medium" style={{ color: nextCalibrationAvailable ? "#FF5500" : "white" }}>
            {nextCalibrationAvailable ? "Available now" : (nextCalibrationDate ?? "In 2 weeks")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Zone Bar ───────────────────────────────────────────────────────────────

export function DriftZoneBar({ score }: { score: number }) {
  const pct = (score / 100) * 100;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="rounded-2xl mb-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", padding: "20px 28px" }}>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          {/* Gradient bar */}
          <div className="relative h-2 rounded-full mb-3"
            style={{ background: "linear-gradient(to right, #00D97E 0%, #FFB800 40%, #FF5500 60%, #FF2D2D 80%)" }}>
            {/* Score indicator */}
            <motion.div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
              initial={{ left: "0%" }}
              animate={{ left: `${pct}%` }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}>
              <div className="w-0.5 h-4 bg-white rounded-full" />
              <div className="w-0 h-0 mt-0.5" style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "5px solid white" }} />
            </motion.div>
          </div>
          {/* Zone labels */}
          <div className="grid grid-cols-4 text-center">
            {[
              { label: "0–39 Anchored", color: "#00D97E" },
              { label: "40–59 Drifting", color: "#FFB800" },
              { label: "60–79 Critical", color: "#FF5500" },
              { label: "80–100 Crisis", color: "#FF2D2D" },
            ].map((z) => (
              <span key={z.label} className="text-xs" style={{ color: z.color }}>{z.label}</span>
            ))}
          </div>
        </div>
        <p className="text-sm italic shrink-0" style={{ color: "rgba(255,255,255,0.30)" }}>Lower is better.</p>
      </div>
    </motion.div>
  );
}
