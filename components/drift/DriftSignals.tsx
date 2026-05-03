"use client";

import { motion } from "framer-motion";
import { Fingerprint, Shield, Brain, BookOpen, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { DriftSignalValues, DriftSignalTrend } from "@/lib/drift/types";
import { getZoneColor } from "@/lib/drift/types";

interface SignalCardProps {
  icon: React.ReactNode;
  name: string;
  score: number;
  description: string;
  trend: "up" | "down" | "stable";
  trendPoints: number;
  miniRows: { label: string; value: string; pct?: number }[];
  index: number;
}

function SignalCard({ icon, name, score, description, trend, trendPoints, miniRows, index }: SignalCardProps) {
  const color = getZoneColor(100 - score); // invert: high signal = low drift = green
  const trendColor = trend === "up" ? "#00D97E" : trend === "down" ? "#FF2D2D" : "rgba(255,255,255,0.40)";
  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;
  const trendLabel = trend === "up" ? "Improving" : trend === "down" ? "Declining" : "Stable";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + index * 0.07 }}
      className="rounded-2xl p-6"
      style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div style={{ color }}>{icon}</div>
          <span className="font-semibold text-white" style={{ fontSize: 16 }}>{name}</span>
        </div>
        <span className="font-bold" style={{ fontSize: 20, color }}>{score}%</span>
      </div>

      {/* Description */}
      <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.50)", lineHeight: 1.6 }}>{description}</p>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full mb-4" style={{ background: "rgba(255,255,255,0.08)" }}>
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 + index * 0.07 }} />
      </div>

      {/* Mini breakdown */}
      <div className="flex flex-col gap-2 mb-4">
        {miniRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>{row.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white">{row.value}</span>
              {row.pct !== undefined && (
                <div className="w-16 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: color }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Trend row */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-1.5">
          <TrendIcon size={13} style={{ color: trendColor }} />
          <span className="text-xs font-medium" style={{ color: trendColor }}>
            {trendPoints > 0 ? `${trendPoints} pts ` : ""}{trendLabel}
          </span>
        </div>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>vs last calibration</span>
      </div>
    </motion.div>
  );
}

interface DriftSignalCardsProps {
  signals: DriftSignalValues;
  trends: DriftSignalTrend;
  rawData: {
    challengesCompleted: number;
    skillsAbove50: number;
    totalSkills: number;
    daysSinceVault: number;
    mirrorSessions: number;
    avgDependencyFlags: number;
    independentPct: number;
    journalStreak: number;
    journalEntriesMonth: number;
  };
}

export default function DriftSignalCards({ signals, trends, rawData }: DriftSignalCardsProps) {
  const cards: Omit<SignalCardProps, "index">[] = [
    {
      icon: <Fingerprint size={22} />,
      name: "Baseline Consistency",
      score: signals.baselineConsistency,
      description: "How closely your current writing, reasoning, and responses match your original Baseline Imprint. The foundation of your drift score.",
      trend: trends.baselineConsistency,
      trendPoints: 4,
      miniRows: [
        { label: "Vocabulary match", value: `${Math.round(signals.baselineConsistency * 0.9)}%`, pct: Math.round(signals.baselineConsistency * 0.9) },
        { label: "Reasoning depth", value: `${Math.round(signals.baselineConsistency * 0.85)}%`, pct: Math.round(signals.baselineConsistency * 0.85) },
        { label: "Response patterns", value: `${Math.round(signals.baselineConsistency * 0.95)}%`, pct: Math.round(signals.baselineConsistency * 0.95) },
      ],
    },
    {
      icon: <Shield size={22} />,
      name: "Vault Activity",
      score: signals.vaultActivity,
      description: "How consistently you're practicing and defending your declared human skills. Missed challenges accelerate drift.",
      trend: trends.vaultActivity,
      trendPoints: 3,
      miniRows: [
        { label: "Challenges completed", value: `${rawData.challengesCompleted} this month` },
        { label: "Skills above 50% strength", value: `${rawData.skillsAbove50} / ${rawData.totalSkills}` },
        { label: "Days since last practice", value: rawData.daysSinceVault === 0 ? "Today" : `${rawData.daysSinceVault}d` },
      ],
    },
    {
      icon: <Brain size={22} />,
      name: "AI Independence",
      score: signals.aiIndependence,
      description: "Measures your Mirror session patterns — how often you seek AI validation vs. arriving at your own conclusions. Dependency flags reduce this score.",
      trend: trends.aiIndependence,
      trendPoints: 2,
      miniRows: [
        { label: "Mirror sessions this month", value: `${rawData.mirrorSessions}` },
        { label: "Avg dependency flags", value: rawData.avgDependencyFlags.toFixed(1) },
        { label: "Independent conclusions", value: `${rawData.independentPct}%`, pct: rawData.independentPct },
      ],
    },
    {
      icon: <BookOpen size={22} />,
      name: "Journal Regularity",
      score: signals.journalRegularity,
      description: "Consistent self-reflection strengthens identity. Irregular or absent journaling is a leading indicator of drift.",
      trend: trends.journalRegularity,
      trendPoints: 5,
      miniRows: [
        { label: "Current streak", value: `${rawData.journalStreak} days` },
        { label: "Entries this month", value: `${rawData.journalEntriesMonth}` },
        { label: "Regularity score", value: `${signals.journalRegularity}%`, pct: signals.journalRegularity },
      ],
    },
  ];

  return (
    <div className="mb-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="mb-5">
        <h2 className="font-semibold text-white mb-1" style={{ fontSize: 20 }}>What&apos;s driving your score</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>Your drift score is calculated from 4 contributing signals.</p>
      </motion.div>
      <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {cards.map((card, i) => <SignalCard key={card.name} {...card} index={i} />)}
      </div>
    </div>
  );
}
