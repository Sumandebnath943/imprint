"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer} from "recharts";
import type { DriftScore } from "@/lib/drift/types";
import { getZoneColor, getZoneShortLabel, formatScoreDate } from "@/lib/drift/types";

type Range = "4w" | "3m" | "6m" | "all";
const RANGE_LABELS: { value: Range; label: string }[] = [
  { value: "4w", label: "4 Weeks" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "all", label: "All Time" },
];

function filterByRange(scores: DriftScore[], range: Range): DriftScore[] {
  const now = Date.now();
  const cutoff: Record<Range, number> = {
    "4w":  now - 28 * 86400000,
    "3m":  now - 90 * 86400000,
    "6m":  now - 180 * 86400000,
    "all": 0,
  };
  return scores.filter((s) => new Date(s.created_at).getTime() >= cutoff[range]);
}

interface CustomDotProps {
  cx?: number; cy?: number; payload?: { score: number };
}

function CustomDot({ cx = 0, cy = 0, payload }: CustomDotProps) {
  const color = getZoneColor(payload?.score ?? 0);
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="rgba(10,10,10,0.8)" strokeWidth={1.5} />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const score = payload[0]?.value ?? 0;
  const color = getZoneColor(score);
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.10)", fontFamily: "Space Grotesk, sans-serif" }}>
      <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.72)" }}>{label}</p>
      <p className="font-bold" style={{ fontSize: 20, color }}>{score}</p>
      <p className="text-xs" style={{ color }}>{getZoneShortLabel(score)}</p>
    </div>
  );
}

interface DriftHistoryChartProps { allScores: DriftScore[]; currentColor: string; }

export default function DriftHistoryChart({ allScores, currentColor }: DriftHistoryChartProps) {
  const [range, setRange] = useState<Range>("3m");

  const chartData = useMemo(() => {
    const filtered = filterByRange(allScores, range);
    // allScores arrives newest-first — every other consumer on the page wants
    // that order — but a chart plots array order left to right, so passing it
    // through unsorted drew time backwards: the oldest reading sat on the
    // right and an improving score appeared to be climbing.
    return [...filtered]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((s) => ({
        week: new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        score: s.score,
      }));
  }, [allScores, range]);

  const scores = chartData.map((d) => d.score);
  const minScore = scores.length ? Math.min(...scores) : 0;
  const maxScore = scores.length ? Math.max(...scores) : 0;
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const minEntry = allScores.find((s) => s.score === Math.min(...allScores.map((x) => x.score)));
  const maxEntry = allScores.find((s) => s.score === Math.max(...allScores.map((x) => x.score)));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="rounded-2xl mb-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", padding: "28px 32px" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="font-semibold text-white mb-1" style={{ fontSize: 18 }}>Score History</h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.66)" }}>How your drift has moved over time</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_LABELS.map(({ value, label }) => {
            const sel = range === value;
            return (
              <button key={value} onClick={() => setRange(value)}
                className="rounded-full text-xs font-medium transition-all"
                style={{ padding: "5px 14px", background: sel ? "#FF5500" : "#1A1A1A", border: sel ? "1px solid #FF5500" : "1px solid rgba(255,255,255,0.08)", color: sel ? "white" : "rgba(255,255,255,0.60)" }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={currentColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={currentColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Zone backgrounds */}
            <ReferenceArea y1={0} y2={39} fill="rgba(0,217,126,0.04)" />
            <ReferenceArea y1={40} y2={59} fill="rgba(255,184,0,0.04)" />
            <ReferenceArea y1={60} y2={79} fill="rgba(255,85,0,0.04)" />
            <ReferenceArea y1={80} y2={100} fill="rgba(255,45,45,0.04)" />

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.30)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 12, fill: "rgba(255,255,255,0.25)" }} axisLine={false} tickLine={false} />

            <ReferenceLine y={40} stroke="rgba(255,184,0,0.30)" strokeDasharray="4 4"
              label={{ value: "Drift threshold", position: "right", fill: "#FFB800", fontSize: 11 }} />

            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="score" stroke={currentColor} strokeWidth={2.5}
              fill="url(#driftGradient)" dot={<CustomDot />}
              activeDot={{ r: 6, stroke: "white", strokeWidth: 2, fill: currentColor }} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-56 text-sm" style={{ color: "rgba(255,255,255,0.58)" }}>
          No history data for this range.
        </div>
      )}

      {/* Summary stats */}
      {chartData.length > 1 && (
        <div className="flex gap-8 mt-5 pt-5 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div>
            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.66)" }}>Lowest score (best)</p>
            <p className="font-semibold" style={{ fontSize: 20, color: getZoneColor(minScore) }}>{minScore}</p>
            {minEntry && <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>{formatScoreDate(minEntry.created_at)}</p>}
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.66)" }}>Highest score (worst)</p>
            <p className="font-semibold" style={{ fontSize: 20, color: getZoneColor(maxScore) }}>{maxScore}</p>
            {maxEntry && <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>{formatScoreDate(maxEntry.created_at)}</p>}
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.66)" }}>Average score</p>
            <p className="font-semibold text-white" style={{ fontSize: 20 }}>{avgScore}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>across {allScores.length} calibrations</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
