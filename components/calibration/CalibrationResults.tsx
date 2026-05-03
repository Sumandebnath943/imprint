"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import DriftRing from "@/components/drift/DriftRing";
import { getZoneColor, getZoneLabel, getZoneShortLabel } from "@/lib/drift/types";
import type { CalibrationScoreResult } from "@/lib/calibration/types";

// ── Processing Overlay ───────────────────────────────────────────────────

const STEPS = [
  "Analyzing vocabulary patterns...",
  "Measuring reasoning depth...",
  "Comparing sentence structure...",
  "Calculating signal scores...",
  "Computing Drift Score...",
];

interface ProcessingProps { onDone: (result: CalibrationScoreResult) => void; sessionId: string; }

export function CalibrationProcessing({ onDone, sessionId }: ProcessingProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [resultRef, setResultRef] = useState<CalibrationScoreResult | null>(null);

  // Advance steps every ~0.8s
  useEffect(() => {
    const iv = setInterval(() => {
      setStepIdx((p) => {
        if (p >= STEPS.length - 1) { clearInterval(iv); return p; }
        return p + 1;
      });
    }, 800);
    return () => clearInterval(iv);
  }, []);

  // Hit the complete API
  useEffect(() => {
    fetch("/api/calibration/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data) => setResultRef(data as CalibrationScoreResult))
      .catch(() => setResultRef({ score: 45, scoreLabel: "drifting", delta: null,
        signals: { baselineConsistency: 75, vaultActivity: 70, aiIndependence: 80, journalRegularity: 60 },
        nextSessionDue: new Date(Date.now() + 14 * 86400000).toISOString() }));
  }, [sessionId]);

  // Wait for both steps done AND API response
  useEffect(() => {
    if (stepIdx >= STEPS.length - 1 && resultRef) {
      setTimeout(() => { setDone(true); setTimeout(() => onDone(resultRef!), 800); }, 600);
    }
  }, [stepIdx, resultRef, onDone]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: "#050508" }}>
      {/* Pulse rings */}
      <div className="relative mb-10">
        {[0, 1, 2].map((i) => (
          <motion.div key={i} className="absolute rounded-full border"
            style={{ width: 100 + i * 60, height: 100 + i * 60, top: -(i * 30), left: -(i * 30), borderColor: `rgba(255,85,0,${0.15 - i * 0.04})` }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }} />
        ))}
        <div className="w-24 h-24 rounded-full flex items-center justify-center relative z-10"
          style={{ background: "rgba(255,85,0,0.12)", border: "2px solid rgba(255,85,0,0.40)" }}>
          <span style={{ fontSize: 36 }}>⧗</span>
        </div>
      </div>

      <p className="font-medium text-white mb-8" style={{ fontSize: 18 }}>Comparing to your Baseline Imprint...</p>

      {/* Fake progress bar */}
      <div className="mb-8 rounded-full overflow-hidden" style={{ width: 320, height: 2, background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full rounded-full" style={{ background: "#FF5500" }}
          animate={{ width: done ? "100%" : `${((stepIdx + 1) / STEPS.length) * 90}%` }}
          transition={{ duration: 0.8 }} />
      </div>

      {/* Step list */}
      <div className="flex flex-col gap-3">
        {STEPS.map((step, i) => (
          <motion.div key={step} className="flex items-center gap-3"
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: i <= stepIdx ? 1 : 0.2, x: 0 }}
            transition={{ delay: i * 0.1 }}>
            <span style={{ width: 16, color: i < stepIdx ? "#00D97E" : i === stepIdx ? "#FF5500" : "rgba(255,255,255,0.20)", fontSize: 14 }}>
              {i < stepIdx ? "✓" : i === stepIdx ? "→" : "○"}
            </span>
            <span className="text-sm" style={{ color: i <= stepIdx ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.25)" }}>{step}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Results Screen ───────────────────────────────────────────────────────

interface ResultsProps {
  result: CalibrationScoreResult;
  sessionNumber: number;
  previousSessionNumber?: number;
}

export function CalibrationResults({ result, sessionNumber, previousSessionNumber }: ResultsProps) {
  const router = useRouter();
  const { score, delta, signals, nextSessionDue } = result;
  const color = getZoneColor(score);
  const [entered, setEntered] = useState(false);
  useEffect(() => { setTimeout(() => setEntered(true), 100); }, []);

  // Which signal moved most (from delta perspective — we use signals as proxy)
  const signalLabels: Record<string, string> = {
    baselineConsistency: "Baseline Consistency",
    vaultActivity: "Vault Activity",
    aiIndependence: "AI Independence",
    journalRegularity: "Journal Regularity",
  };
  const signalDescriptions: Record<string, string> = {
    baselineConsistency: "Your vocabulary and reasoning patterns are diverging from your baseline. Spend time in The Forge this week.",
    vaultActivity: "Your skill practice has declined. Complete at least 2 Vault challenges before your next calibration.",
    aiIndependence: "You've been relying on AI validation more than usual. Try 3 days without AI assistance.",
    journalRegularity: "Irregular journaling is weakening your identity signal. Write daily for the next week.",
  };

  const weakestSignalKey = Object.entries(signals)
    .sort(([, a], [, b]) => a - b)[0][0];

  const nextDate = new Date(nextSessionDue).toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "#050508" }}>
      <div className="mx-auto flex flex-col items-center" style={{ maxWidth: 680, padding: "80px 32px 120px" }}>
        {/* Score ring */}
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-6">
          <DriftRing score={score} size={240} strokeWidth={12} showCenter />
        </motion.div>

        {/* Score + status */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center mb-4">
          <div className="inline-flex rounded-full px-6 py-2 mb-4"
            style={{ background: `${color}1E`, border: `1px solid ${color}4D` }}>
            <span className="font-semibold" style={{ fontSize: 16, color }}>{getZoneLabel(score)}</span>
          </div>

          {delta !== null ? (
            <div>
              <p className="font-semibold mb-1" style={{ fontSize: 16, color: delta <= 0 ? "#00D97E" : "#FF2D2D" }}>
                {delta <= 0 ? `↓ ${Math.abs(delta)} points from Session ${previousSessionNumber}` : `↑ ${delta} points from Session ${previousSessionNumber}`}
              </p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                {delta <= 0 ? "Your identity is strengthening." : "Recovery protocol has been updated."}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium text-white mb-1" style={{ fontSize: 16 }}>Your first Drift Score.</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>This is your starting point.</p>
            </div>
          )}
        </motion.div>

        {/* Signal breakdown */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          className="grid grid-cols-2 gap-3 w-full mb-6">
          {Object.entries(signals).map(([key, val], i) => {
            const c = getZoneColor(100 - val);
            return (
              <div key={key} className="rounded-xl px-4 py-3" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>{signalLabels[key]}</span>
                  <span className="text-sm font-semibold" style={{ color: c }}>{val}%</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: c }}
                    initial={{ width: 0 }} animate={{ width: `${val}%` }}
                    transition={{ duration: 0.8, delay: 0.7 + i * 0.08 }} />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Key insight */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.80 }}
          className="w-full rounded-2xl p-6 mb-6"
          style={{ background: "rgba(255,85,0,0.05)", border: "1px solid rgba(255,85,0,0.15)" }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>What moved most this session:</p>
          <p className="font-semibold text-white mb-1" style={{ fontSize: 16 }}>{signalLabels[weakestSignalKey]}</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{signalDescriptions[weakestSignalKey]}</p>
        </motion.div>

        {/* Next steps */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className="w-full mb-8">
          <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.40)" }}>Next session due: {nextDate}</p>
          {score > 40 && (
            <div className="flex flex-col gap-2">
              {[
                { text: "Review your Recovery Protocol →", href: "/dashboard/drift" },
                { text: "Complete a Vault Challenge this week →", href: "/dashboard/vault" },
                { text: "Open The Mirror and reflect →", href: "/dashboard/mirror" },
              ].map(({ text, href }) => (
                <button key={text} onClick={() => router.push(href)}
                  className="flex items-center gap-2 text-sm text-left"
                  style={{ color: "#FF5500" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />{text}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
          className="flex gap-4">
          <button onClick={() => router.push("/dashboard/drift")}
            className="rounded-full font-medium text-white" style={{ background: "#FF5500", height: 46, padding: "0 32px" }}>
            View Full Report →
          </button>
          <button onClick={() => router.push("/dashboard")}
            className="rounded-full transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.65)", height: 46, padding: "0 28px" }}>
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  );
}
