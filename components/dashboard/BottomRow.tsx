"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users } from "lucide-react";
import type { DashboardProfile, DashboardCalibration, DashboardChallenge } from "@/lib/dashboard/types";
import { getImprintScoreLabel, getDriftColor, daysUntil } from "@/lib/dashboard/types";

interface BottomRowProps {
  profile: DashboardProfile | null;
  calibration: DashboardCalibration | null;
  nextChallenge: DashboardChallenge | null;
}

export default function BottomRow({ profile, calibration, nextChallenge }: BottomRowProps) {
  const imprintScore = profile?.imprint_score ?? 0;
  const scoreLabel = getImprintScoreLabel(imprintScore);
  const scoreFraction = imprintScore / 1000;
  const scoreColor = getDriftColor(Math.max(0, 100 - scoreFraction * 100));

  // Build upcoming items list
  const upcoming: { label: string; badge: string }[] = [];
  if (nextChallenge?.due_date) {
    upcoming.push({ label: `Vault Challenge: ${nextChallenge.title ?? "Open challenge"}`, badge: `Due in ${daysUntil(nextChallenge.due_date)}d` });
  }
  if (calibration?.next_due_at) {
    const d = daysUntil(calibration.next_due_at);
    if (d <= 7) upcoming.push({ label: "Calibration Session", badge: d === 0 ? "Due now" : `In ${d}d` });
  }
  upcoming.push({ label: "Weekly Reflection Prompt", badge: "This week" });

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* Coming Up */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.48 }}
        className="rounded-2xl p-6"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <h3 className="font-semibold text-white mb-4" style={{ fontSize: 16 }}>Coming Up</h3>
        {upcoming.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.40)" }}>You&apos;re clear for now.</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Enjoy the stillness.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.slice(0,3).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#FF5500" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.label}</p>
                  <span className="text-xs rounded-full px-2 py-0.5"
                    style={{ background: "rgba(255,85,0,0.12)", border: "1px solid rgba(255,85,0,0.25)", color: "#FF5500" }}>
                    {item.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* IMPRINT Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.56 }}
        className="rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, #111111 0%, #0F0F0F 100%)",
          border: "1px solid rgba(255,85,0,0.15)",
        }}
      >
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "#FF5500" }}>
          IMPRINT Score
        </p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-bold text-white" style={{ fontSize: 52, lineHeight: 1 }}>
            {new Intl.NumberFormat().format(imprintScore)}
          </span>
          <span style={{ fontSize: 22, color: "rgba(255,255,255,0.35)" }}>/1000</span>
        </div>
        <span className="inline-block rounded-full px-3 py-1 text-xs font-medium mb-5"
          style={{ background: `${scoreColor}1A`, border: `1px solid ${scoreColor}4D`, color: scoreColor }}>
          {scoreLabel}
        </span>
        <div className="flex flex-col gap-2 mb-5">
          {[
            ["Vault Strength", `${profile?.imprint_score ? Math.round(imprintScore * 0.35) : 0} pts`],
            ["Baseline Sessions", "0 sessions"],
            ["Streak", `${profile?.streak_days ?? 0} days`],
            ["Calibrations", "0 completed"],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              <span>{label}</span>
              <span>{val}</span>
            </div>
          ))}
        </div>
        <Link href="/dashboard/profile" className="text-xs font-medium" style={{ color: "#FF5500" }}>
          See full credential →
        </Link>
      </motion.div>

      {/* Human Circles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.64 }}
        className="rounded-2xl p-6"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <h3 className="font-semibold text-white mb-4" style={{ fontSize: 16 }}>Your Circles</h3>
        <div className="flex flex-col items-center text-center py-6 gap-3">
          <Users size={32} style={{ color: "rgba(255,255,255,0.15)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>No circles yet</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            Accountability is part of preservation.
          </p>
          <Link href="/dashboard/circles" className="text-sm font-medium" style={{ color: "#FF5500" }}>
            + Join or Create
          </Link>
        </div>
        <div className="border-t pt-3 mt-auto" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Link href="/dashboard/circles" className="text-xs" style={{ color: "#FF5500" }}>View Circles →</Link>
        </div>
      </motion.div>
    </div>
  );
}
