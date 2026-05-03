"use client";

import { motion } from "framer-motion";
import { Timer, Fingerprint, Activity } from "lucide-react";
import DriftRing from "@/components/drift/DriftRing";
import { getZoneColor, getZoneShortLabel } from "@/lib/drift/types";
import type { CalibrationPageData, CalibrationSession } from "@/lib/calibration/types";
import { formatScoreDate } from "@/lib/drift/types";

// ── Cycle ring (days elapsed / 14) ─────────────────────────────────────────

function CycleRing({ daysElapsed }: { daysElapsed: number }) {
  const pct = Math.min(1, daysElapsed / 14);
  const r = 32, circ = 2 * Math.PI * r;
  return (
    <svg width={80} height={80} viewBox="0 0 80 80">
      <circle cx={40} cy={40} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <circle cx={40} cy={40} r={r} fill="none" stroke="#FF5500" strokeWidth={6}
        strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 40 40)" />
      <text x={40} y={45} textAnchor="middle" fill="white" fontSize={14} fontWeight={700}>{daysElapsed}</text>
    </svg>
  );
}

interface HubProps {
  pageData: CalibrationPageData;
  onBegin: () => void;
}

export default function CalibrationHub({ pageData, onBegin }: HubProps) {
  const { sessions, latestDriftScore, previousDriftScore } = pageData;
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const sessionCount = completedSessions.length;
  const nextSessionNumber = sessionCount + 1;

  // Days since last completed session
  const lastCompleted = completedSessions[0];
  const daysSinceLast = lastCompleted
    ? Math.floor((Date.now() - new Date(lastCompleted.completed_at!).getTime()) / 86400000) : 999;
  const daysUntilNext = Math.max(0, 14 - daysSinceLast);
  const isDue = daysUntilNext === 0;

  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((s, c) => s + (c.drift_score_produced ?? 50), 0) / completedSessions.length) : 0;
  const bestSession = [...completedSessions].sort((a, b) => (a.drift_score_produced ?? 100) - (b.drift_score_produced ?? 100))[0];

  return (
    <div className="relative" style={{ background: "#080808", minHeight: "100%", padding: "40px 48px 80px" }}>
      <div className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
        style={{ fontSize: 160, fontWeight: 700, color: "#fff", opacity: 0.03, lineHeight: 1, zIndex: 0 }}>CALIBRATE</div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-bold text-white mb-1" style={{ fontSize: 32 }}>Calibration</h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.40)" }}>Bi-weekly identity check-in.</p>
          </div>
          {isDue ? (
            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: "rgba(255,85,0,0.15)", border: "1px solid rgba(255,85,0,0.40)", color: "#FF5500" }}>
              Session Due
            </motion.span>
          ) : (
            <span className="rounded-full px-4 py-2 text-sm"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.50)" }}>
              Next: {daysUntilNext}d
            </span>
          )}
        </motion.div>

        {/* Hero status card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="rounded-3xl mb-8"
          style={{ background: "linear-gradient(135deg, #111111, #0F0F0F)", border: "1px solid rgba(255,255,255,0.07)", padding: "36px 40px" }}>
          <div className="grid gap-8" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
            {/* Col 1 — Next session */}
            <div>
              <p className="font-bold text-white mb-1" style={{ fontSize: 48, lineHeight: 1 }}>
                Session {nextSessionNumber}
              </p>
              <p className="mb-4" style={{ fontSize: 16, color: "rgba(255,255,255,0.40)" }}>
                {sessionCount === 0 ? "Your first calibration" : `Calibration ${nextSessionNumber} of your ongoing record`}
              </p>

              {sessionCount === 0 ? (
                <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 320 }}>
                  Establishes your first real Drift Score.<br />Compared against your Baseline Imprint.
                </p>
              ) : isDue ? (
                <div className="mb-6">
                  <p className="font-semibold mb-1" style={{ fontSize: 24, color: "#FF5500" }}>Due Now</p>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>Your score needs updating.</p>
                </div>
              ) : (
                <div className="flex items-center gap-4 mb-6">
                  <div>
                    <p className="font-bold text-white" style={{ fontSize: 64, lineHeight: 1 }}>{daysUntilNext}</p>
                    <p style={{ fontSize: 16, color: "rgba(255,255,255,0.40)" }}>days until next session</p>
                  </div>
                  <CycleRing daysElapsed={daysSinceLast} />
                </div>
              )}

              <div className="flex items-center gap-3">
                <button onClick={onBegin}
                  className="rounded-full font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: isDue || sessionCount === 0 ? "#FF5500" : "transparent", border: isDue || sessionCount === 0 ? "none" : "1px solid rgba(255,255,255,0.20)", color: isDue || sessionCount === 0 ? "white" : "rgba(255,255,255,0.65)", height: 52, padding: "0 32px", fontSize: 16 }}>
                  {sessionCount === 0 ? "Begin Session 1 →" : isDue ? "Begin Calibration →" : "Begin Early →"}
                </button>
                {!isDue && sessionCount > 0 && (
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Available in {daysUntilNext} days</p>
                )}
              </div>
            </div>

            {/* Col 2 — Last score (center) */}
            {latestDriftScore !== null && (
              <div className="flex flex-col items-center justify-center px-8"
                style={{ borderLeft: "1px solid rgba(255,255,255,0.07)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.30)" }}>Last Score</p>
                <DriftRing score={latestDriftScore} size={120} strokeWidth={8} showCenter />
                <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Session {sessionCount} · {lastCompleted ? formatScoreDate(lastCompleted.completed_at!) : ""}
                </p>
              </div>
            )}

            {/* Col 3 — Stats */}
            <div className="flex flex-col justify-center gap-5">
              {[
                { label: "Total Sessions", value: String(sessionCount), color: "white" },
                { label: "Avg Score", value: sessionCount > 0 ? String(avgScore) : "—", color: sessionCount > 0 ? getZoneColor(avgScore) : "rgba(255,255,255,0.30)" },
                { label: "Best Score", value: bestSession ? String(bestSession.drift_score_produced ?? 0) : "—", color: "#00D97E", sub: bestSession ? `Session ${bestSession.session_number} · ${formatScoreDate(bestSession.completed_at!)}` : undefined },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.30)" }}>{stat.label}</p>
                  <p className="font-bold" style={{ fontSize: 36, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
                  {stat.sub && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>{stat.sub}</p>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* First-time info cards */}
        {sessionCount === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: Timer, title: "15–20 minutes", body: "A series of prompts tailored to your cluster. Same structure as your baseline — different content." },
              { icon: Fingerprint, title: "No right answers", body: "The calibration measures HOW you respond — not what you know. Your depth, vocabulary, and reasoning patterns are what matter." },
              { icon: Activity, title: "Updates your Drift Score", body: "Your responses are compared to your Baseline Imprint. The delta becomes your new Drift Score for the next 2 weeks." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl p-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Icon size={24} style={{ color: "#FF5500", marginBottom: 12 }} />
                <p className="font-semibold text-white mb-2" style={{ fontSize: 16 }}>{title}</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.50)", lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Session history */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-semibold text-white" style={{ fontSize: 20 }}>Session History</h2>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>{sessionCount} sessions completed</span>
          </div>

          {sessionCount === 0 ? (
            <div className="rounded-2xl py-16 text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>No sessions yet.</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Your calibration history will appear here after your first session.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {completedSessions.map((session, i) => {
                const score = session.drift_score_produced ?? 50;
                const color = getZoneColor(score);
                const prev = completedSessions[i + 1];
                const delta = prev ? score - (prev.drift_score_produced ?? 50) : null;
                const signals = (session.comparison_vs_baseline ?? {}) as Record<string, number>;
                return (
                  <div key={session.id} className="rounded-2xl p-6 flex items-center justify-between gap-8 flex-wrap"
                    style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {/* Left */}
                    <div>
                      <span className="text-xs rounded-full px-3 py-1 font-semibold mb-3 inline-block"
                        style={{ background: "rgba(255,85,0,0.10)", border: "1px solid rgba(255,85,0,0.25)", color: "#FF5500" }}>
                        #{session.session_number}
                      </span>
                      <p className="font-medium text-white" style={{ fontSize: 16 }}>{formatScoreDate(session.completed_at!)}</p>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Completed session</p>
                    </div>
                    {/* Center */}
                    <div className="text-center">
                      <p className="font-bold" style={{ fontSize: 36, color }}>{score}</p>
                      <p className="text-sm" style={{ color }}>{getZoneShortLabel(score)}</p>
                      {delta !== null && (
                        <p className="text-xs mt-1" style={{ color: delta <= 0 ? "#00D97E" : "#FF2D2D" }}>
                          {delta <= 0 ? `↓ ${Math.abs(delta)} improved` : `↑ ${delta} worsened`}
                        </p>
                      )}
                      {delta === null && <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.30)" }}>First session</p>}
                    </div>
                    {/* Right — signal bars */}
                    <div className="flex flex-col gap-2 min-w-40">
                      {[
                        { label: "Baseline", val: signals.baselineConsistency ?? 75 },
                        { label: "Vault", val: signals.vaultActivity ?? 70 },
                        { label: "AI Indep.", val: signals.aiIndependence ?? 80 },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="text-xs w-14" style={{ color: "rgba(255,255,255,0.40)" }}>{label}</span>
                          <div className="w-16 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div className="h-full rounded-full" style={{ width: `${val}%`, background: color }} />
                          </div>
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>{val}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
