"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";

interface ActivityRowProps {
  journalCount: number;
  activityData?: { day: string; value: number; isToday: boolean }[];
  streak?: number;
}

const DEFAULT_ACTIVITY = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, i) => ({
  day, value: 0, isToday: i === (new Date().getDay() + 6) % 7,
}));

export default function ActivityRow({ journalCount, activityData, streak = 0 }: ActivityRowProps) {
  const data = activityData ?? DEFAULT_ACTIVITY;
  // Dots: color a dot for each day of the week that has at least one entry
  const weekDots = data.map(d => d.value > 0 ? "#FF5500" : "rgba(255,255,255,0.15)");

  return (
    <div className="flex gap-5 mb-6">
      {/* Weekly Activity Chart (60%) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.32 }}
        className="rounded-2xl p-6"
        style={{ flex: "0 0 calc(60% - 10px)", background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="mb-5">
          <h3 className="font-semibold text-white" style={{ fontSize: 16 }}>This Week</h3>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>Your IMPRINT activity</p>
        </div>
        {data.every(d => d.value === 0) ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.30)" }}>
              Your activity will appear here as you use IMPRINT
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} barCategoryGap="30%">
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.isToday ? "#FF5500" : "rgba(255,85,0,0.50)"}
                    style={entry.isToday ? { filter: "drop-shadow(0 0 6px rgba(255,85,0,0.5))" } : {}}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Journal Streak (40%) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.40 }}
        className="rounded-2xl p-6 flex flex-col"
        style={{ flex: "0 0 calc(40% - 10px)", background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <h3 className="font-semibold text-white mb-4" style={{ fontSize: 16 }}>Journal</h3>

        {/* Streak */}
        <div className="flex items-center gap-4 mb-5">
          <div style={{ fontSize: 36 }}>🔥</div>
          <div>
            <p className="font-bold text-white" style={{ fontSize: 28 }}>{streak} day streak</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
              {streak > 0 ? "Keep it going" : "Write your first entry today"}
            </p>
          </div>
        </div>

        {/* Week dots */}
        <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.40)" }}>
          {journalCount} {journalCount === 1 ? "entry" : "entries"} this week
        </p>
        <div className="flex gap-2 mb-5">
          {weekDots.map((color, i) => (
            <div key={i} className="w-3 h-3 rounded-full" style={{ background: color }} />
          ))}
        </div>

        <Link
          href="/dashboard/journal"
          className="mt-auto w-full text-center rounded-full h-9 text-sm font-medium transition-all hover:bg-white/5"
          style={{ border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.60)", lineHeight: "36px" }}
        >
          + New Entry
        </Link>
      </motion.div>
    </div>
  );
}
