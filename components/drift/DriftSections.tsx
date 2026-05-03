"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, FileDown, Copy, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import type { WeeklyRow, CalibrationSession, DriftSignalValues, RecoveryStep } from "@/lib/drift/types";
import { getZoneColor, getZoneShortLabel, buildRecoverySteps, formatScoreDate } from "@/lib/drift/types";

// ── Weekly Table ───────────────────────────────────────────────────────────

interface WeeklyTableProps { rows: WeeklyRow[]; }

export function DriftWeeklyTable({ rows }: WeeklyTableProps) {
  const [shown, setShown] = useState(12);

  const COLS = ["Week", "Score", "Status", "Baseline", "Vault", "AI Indep.", "Journal", "Delta"];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
      className="rounded-2xl overflow-hidden mb-8" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="font-semibold text-white mb-1" style={{ fontSize: 20 }}>Week by Week</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>Your full calibration history.</p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="font-medium text-white" style={{ fontSize: 18 }}>No calibration data yet.</p>
          <p className="text-sm text-center max-w-sm" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.6 }}>
            Complete your first calibration to see your score history.
          </p>
          <a href="/dashboard/calibration"
            className="rounded-full h-11 px-8 text-sm font-medium text-white inline-block text-center"
            style={{ background: "#FF5500", lineHeight: "44px" }}>
            Begin Calibration →
          </a>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 700 }}>
              <thead>
                <tr style={{ background: "#0D0D0D", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {COLS.map((c) => (
                    <th key={c} className="text-left px-5 py-3 text-xs uppercase tracking-widest"
                      style={{ color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, shown).map((row, i) => {
                  const color = getZoneColor(row.score);
                  return (
                    <tr key={i} style={{
                      background: row.isCurrent ? "rgba(255,85,0,0.03)" : i % 2 === 1 ? "rgba(255,255,255,0.01)" : "transparent",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      borderLeft: row.isCurrent ? "2px solid #FF5500" : "2px solid transparent",
                    }}>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{row.week}</td>
                      <td className="px-5 py-3.5 font-semibold text-sm" style={{ color }}>{row.score}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs rounded-full px-2 py-0.5"
                          style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}>
                          {getZoneShortLabel(row.score)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>{row.baseline}%</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>{row.vault}%</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>{row.ai}%</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>{row.journal}%</td>
                      <td className="px-5 py-3.5 text-sm">
                        {row.delta === null ? <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>
                          : row.delta <= 0
                          ? <span style={{ color: "#00D97E" }}>↓ {Math.abs(row.delta)}</span>
                          : <span style={{ color: "#FF2D2D" }}>↑ {row.delta}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {shown < rows.length && (
            <div className="flex justify-center py-4">
              <button onClick={() => setShown((p) => p + 12)}
                className="rounded-full h-9 px-6 text-sm transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)" }}>
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ── Recovery Protocol ─────────────────────────────────────────────────────

interface RecoveryProps { score: number; signals: DriftSignalValues; }

export function DriftRecovery({ score, signals }: RecoveryProps) {
  const router = useRouter();
  if (score < 40) return null;

  const color = getZoneColor(score);
  const steps = buildRecoverySteps(signals);

  const titles: Record<string, string> = {
    "40": "Drift Detected — Recovery Protocol Active",
    "60": "Critical Drift — Intervention Recommended",
    "80": "Identity Crisis Point Reached",
  };
  const descs: Record<string, string> = {
    "40": "Your identity patterns are showing early divergence from your baseline. This is recoverable. The protocol below will help you recalibrate within 2 weeks.",
    "60": "Significant drift detected across multiple signals. Your language, reasoning, or skill patterns have shifted meaningfully from your baseline. Immediate action is recommended.",
    "80": "You have reached the Identity Crisis Point. Your current patterns are significantly misaligned with your Baseline Imprint. IMPRINT strongly recommends pausing AI tool usage for 7 days and following the full recovery protocol.",
  };

  const titleKey = score >= 80 ? "80" : score >= 60 ? "60" : "40";
  const bgColor = score >= 80 ? "rgba(255,45,45,0.08)" : score >= 60 ? "rgba(255,85,0,0.06)" : "rgba(255,184,0,0.04)";
  const borderColor = score >= 80 ? "rgba(255,45,45,0.30)" : score >= 60 ? "rgba(255,85,0,0.25)" : "rgba(255,184,0,0.20)";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.43 }}
      className="rounded-2xl mb-8" style={{ background: bgColor, border: `1px solid ${borderColor}`, padding: "28px 32px" }}>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle size={22} style={{ color, marginTop: 2, flexShrink: 0 }} />
          <h2 className="font-semibold" style={{ fontSize: 18, color }}>{titles[titleKey]}</h2>
        </div>
        <span className="text-sm rounded-full px-4 py-1.5 font-medium"
          style={{ background: `${color}18`, border: `1px solid ${color}4D`, color }}>
          {score} / 100
        </span>
      </div>

      <p className="text-sm mb-7 max-w-2xl" style={{ color: "rgba(255,255,255,0.60)", lineHeight: 1.7 }}>
        {descs[titleKey]}
      </p>

      <div className="flex flex-col gap-5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold"
              style={{ background: `${color}1E`, color, fontSize: 16, minWidth: 32 }}>
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white mb-0.5" style={{ fontSize: 15 }}>{step.title}</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.50)", lineHeight: 1.6 }}>{step.desc}</p>
            </div>
            <button onClick={() => router.push(step.ctaHref)}
              className="rounded-full h-9 px-5 text-sm font-medium shrink-0 transition-all hover:opacity-90"
              style={step.ghost
                ? { border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.70)" }
                : { background: "#FF5500", color: "white" }}>
              {step.ctaLabel}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Calibration History ───────────────────────────────────────────────────

interface CalibrationProps { calibrations: CalibrationSession[]; }

export function DriftCalibration({ calibrations }: CalibrationProps) {
  if (calibrations.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
        className="rounded-2xl mb-8" style={{ background: "rgba(255,85,0,0.04)", border: "1px solid rgba(255,85,0,0.15)", padding: "40px" }}>
        <div className="text-center">
          <p className="font-medium text-white mb-2" style={{ fontSize: 18 }}>No calibrations yet.</p>
          <p className="text-sm mb-6 mx-auto max-w-sm" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
            Your Drift Score is based on your initial baseline. Complete your first calibration to get your real score.
          </p>
          <a href="/dashboard/calibration" className="inline-block rounded-full h-11 px-8 text-sm font-medium text-white"
            style={{ background: "#FF5500", lineHeight: "44px" }}>
            Begin First Calibration →
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }} className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-white" style={{ fontSize: 20 }}>Calibration Sessions</h2>
        <a href="/dashboard/calibration" className="text-sm font-medium" style={{ color: "#FF5500" }}>Schedule New →</a>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {calibrations.slice(0, 3).map((cal, i) => {
          const score = cal.score_produced ?? 50;
          const color = getZoneColor(score);
          const prevScore = calibrations[i + 1]?.score_produced;
          const delta = prevScore !== undefined ? score - prevScore : null;
          return (
            <div key={cal.id} className="rounded-2xl p-6"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FF5500" }}>#{cal.session_number ?? i + 1}</span>
                <span className="text-sm text-white">{formatScoreDate(cal.completed_at)}</span>
              </div>
              <p className="font-bold mb-1" style={{ fontSize: 32, color }}>{score}</p>
              <p className="text-sm mb-4" style={{ color }}>{getZoneShortLabel(score)}</p>
              <div className="flex flex-col gap-1.5 mb-4">
                {[
                  cal.findings?.vocab_drift !== undefined ? `Vocabulary drifted ${cal.findings.vocab_drift}% from baseline` : "Vocabulary analysis completed",
                  cal.findings?.vault_note ?? "Vault activity reviewed",
                  cal.findings?.mirror_note ?? "Mirror session patterns analyzed",
                ].map((f, j) => (
                  <div key={j} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                    <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: "rgba(255,255,255,0.30)" }} />{f}
                  </div>
                ))}
              </div>
              {delta !== null && (
                <p className="text-xs" style={{ color: delta <= 0 ? "#00D97E" : "#FF2D2D" }}>
                  {delta <= 0 ? `↓ ${Math.abs(delta)} from previous` : `↑ ${delta} from previous`}
                </p>
              )}
              <a href="/dashboard/calibration" className="text-xs mt-3 block" style={{ color: "#FF5500" }}>View Full Report →</a>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Export section ────────────────────────────────────────────────────────

interface ExportProps { score: number; signals: DriftSignalValues; date: string; }

export function DriftExport({ score, signals, date }: ExportProps) {
  const [copied, setCopied] = useState(false);

  const scoreCard = `IMPRINT Drift Score — ${formatScoreDate(date)}
Score: ${score}/100 — ${getZoneShortLabel(score)}
Baseline Consistency: ${signals.baselineConsistency}%
Vault Activity: ${signals.vaultActivity}%
AI Independence: ${signals.aiIndependence}%
Journal Regularity: ${signals.journalRegularity}%
Verified by IMPRINT Identity Engine`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scoreCard);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => window.print();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.53 }}
      className="flex items-center justify-between flex-wrap gap-4 rounded-2xl"
      style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", padding: "20px 28px" }}>
      <div>
        <p className="font-semibold text-white mb-1" style={{ fontSize: 16 }}>Your IMPRINT Score Report</p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>Export your full drift history and score breakdown.</p>
      </div>
      <div className="flex gap-3 flex-wrap">
        <button onClick={handlePrint}
          className="flex items-center gap-2 rounded-full h-9 px-5 text-sm transition-all hover:bg-white/5"
          style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.65)" }}>
          <FileDown size={15} />Export PDF
        </button>
        <button onClick={handleCopy}
          className="flex items-center gap-2 rounded-full h-9 px-5 text-sm transition-all hover:bg-white/5"
          style={{ border: "1px solid rgba(255,255,255,0.15)", color: copied ? "#00D97E" : "rgba(255,255,255,0.65)" }}>
          <Copy size={15} />{copied ? "Copied!" : "Copy Score Card"}
        </button>
      </div>
    </motion.div>
  );
}
