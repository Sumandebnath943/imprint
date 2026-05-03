"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Sparkles, Radio } from "lucide-react";
import type { DashboardDriftScore, DashboardChallenge, DashboardCalibration } from "@/lib/dashboard/types";
import { getDriftColor, getDriftLabel, getDriftMessage, daysUntil, daysAgo } from "@/lib/dashboard/types";

// Animated count-up hook
function useCountUp(target: number, duration = 1500): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const raf = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

interface DriftRingProps {
  score: number;
  color: string;
}

function DriftRing({ score, color }: DriftRingProps) {
  const radius = 80;
  const stroke = 10;
  const size = (radius + stroke) * 2;
  const circumference = 2 * Math.PI * radius;
  // Lower score = more arc (better)
  const arcFraction = (100 - score) / 100;
  const dashOffset = circumference * (1 - arcFraction);
  const displayScore = useCountUp(score);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Background ring */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}
          />
          {/* Score arc */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold text-white"
            style={{ fontSize: 52, lineHeight: 1, fontFamily: "Space Grotesk, sans-serif" }}
          >
            {displayScore}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.40)", fontFamily: "Space Grotesk, sans-serif" }}>
            Drift Score
          </span>
        </div>
      </div>

      {/* Status badge */}
      <span
        className="rounded-full px-4 py-1.5 text-sm font-medium"
        style={{
          background: `${color}1A`,
          border: `1px solid ${color}4D`,
          color,
          fontFamily: "Space Grotesk, sans-serif",
        }}
      >
        {getDriftLabel(score)}
      </span>
    </div>
  );
}

interface SignalBarProps {
  label: string;
  value: number;
  color: string;
  delay: number;
}

function SignalBar({ label, value, color, delay }: SignalBarProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "Space Grotesk, sans-serif" }}>
          {label}
        </span>
        <span className="text-sm font-medium" style={{ color, fontFamily: "Space Grotesk, sans-serif" }}>
          {value}%
        </span>
      </div>
      <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: "0%" }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

interface HeroRowProps {
  driftScore: DashboardDriftScore | null;
  nextChallenge: DashboardChallenge | null;
  calibration: DashboardCalibration | null;
}

export default function HeroRow({ driftScore, nextChallenge, calibration }: HeroRowProps) {
  const pathname = usePathname();
  const score = driftScore?.score ?? 0;
  const color = getDriftColor(score);
  const signals = driftScore?.contributing_signals ?? {};

  const calDue = calibration?.next_due_at ? daysUntil(calibration.next_due_at) : null;
  const calOverdue = calDue !== null && calDue === 0;

  const lastUpdatedDays = driftScore
    ? daysAgo(driftScore.created_at)
    : null;

  return (
    <div className="flex gap-5 mb-6" style={{ alignItems: "stretch" }}>
      {/* LEFT — Drift Score Card (65%) */}
      <motion.div
        key={pathname} // force remount on route change → ring re-animates
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col rounded-[20px] p-8"
        style={{
          flex: "0 0 calc(65% - 10px)",
          background: "#111111",
          border: "1px solid rgba(255,255,255,0.07)",
          minHeight: 340,
        }}
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-8">
          <span
            className="text-xs uppercase tracking-widest font-medium"
            style={{ color: "rgba(255,255,255,0.40)", fontFamily: "Space Grotesk, sans-serif" }}
          >
            Your Drift Score
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
              {lastUpdatedDays !== null
                ? lastUpdatedDays === 0 ? "Updated today" : `Updated ${lastUpdatedDays}d ago`
                : "No data yet"}
            </span>
            <Link href="/dashboard/drift" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: "#FF5500" }}>
              View History →
            </Link>
          </div>
        </div>

        {/* Main content row */}
        <div className="flex gap-10 flex-1 items-center">
          {/* Ring */}
          <DriftRing score={score} color={color} />

          {/* Breakdown */}
          <div className="flex-1">
            <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.40)", fontFamily: "Space Grotesk, sans-serif" }}>
              What&apos;s affecting your score
            </p>
            <div className="flex flex-col gap-5">
              <SignalBar
                label="Baseline Consistency"
                value={signals.baseline_consistency ?? 85}
                color={color}
                delay={0.3}
              />
              <SignalBar
                label="Vault Activity"
                value={signals.vault_activity ?? 60}
                color="#FF5500"
                delay={0.5}
              />
              <SignalBar
                label="AI Independence"
                value={signals.ai_independence ?? 72}
                color={signals.ai_independence !== undefined && signals.ai_independence < 50 ? "#FF2D2D" : "#00D97E"}
                delay={0.7}
              />
            </div>

            {/* Bottom message */}
            <p
              className="mt-6 text-sm font-medium"
              style={{
                color: score >= 80 ? "#FF2D2D" : color,
                fontFamily: "Space Grotesk, sans-serif",
                fontWeight: score >= 80 ? 600 : 400,
              }}
            >
              {getDriftMessage(score)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* RIGHT — Quick action cards (35%) */}
      <div className="flex flex-col gap-4" style={{ flex: "0 0 calc(35% - 10px)" }}>
        {/* Forge card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl p-6 flex flex-col gap-3 group transition-all duration-200 cursor-pointer"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", flex: 1 }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.14)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(255,85,0,0.06)";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          <div className="flex items-center gap-2">
            <Flame size={18} style={{ color: "#FF5500" }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#FF5500" }}>The Forge</span>
          </div>
          {nextChallenge ? (
            <>
              <p className="font-semibold text-white" style={{ fontSize: 16 }}>
                {nextChallenge.title ?? "Active Challenge"}
              </p>
              {nextChallenge.due_date && (
                <span
                  className="self-start rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: "rgba(255,184,0,0.15)", border: "1px solid rgba(255,184,0,0.30)", color: "#FFB800" }}
                >
                  Due in {daysUntil(nextChallenge.due_date)}d
                </span>
              )}
            </>
          ) : (
            <>
              <p className="font-semibold text-white" style={{ fontSize: 16 }}>Open session</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                No active challenge. Write freely for 10 minutes.
              </p>
            </>
          )}
          <Link
            href="/dashboard/forge"
            className="mt-auto self-start rounded-full h-9 px-5 text-sm font-medium text-white transition-all hover:opacity-80"
            style={{ background: "#FF5500", lineHeight: "36px" }}
          >
            Enter The Forge →
          </Link>
        </motion.div>

        {/* Mirror card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl p-6 flex flex-col gap-3 transition-all duration-200"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", flex: 1 }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.14)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(255,85,0,0.06)";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: "rgba(255,120,50,0.9)" }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,120,50,0.9)" }}>The Mirror</span>
          </div>
          <p className="font-semibold text-white" style={{ fontSize: 16 }}>Reflect on something</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Ask yourself a question. The Mirror will push you deeper.
          </p>
          <Link
            href="/dashboard/mirror"
            className="mt-auto self-start rounded-full h-9 px-5 text-sm font-medium transition-all hover:bg-white/8"
            style={{ border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.70)", lineHeight: "36px" }}
          >
            Open The Mirror →
          </Link>
        </motion.div>

        {/* Calibration card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl p-6 flex flex-col gap-3 transition-all duration-200"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", flex: 1 }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.14)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(255,85,0,0.06)";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          <div className="flex items-center gap-2">
            <Radio size={18} style={{ color: "rgba(255,255,255,0.50)" }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>Calibration</span>
          </div>
          {calOverdue ? (
            <>
              <p className="font-semibold" style={{ fontSize: 16, color: "#FF5500" }}>Calibration due</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Your Drift Score needs updating</p>
              <Link
                href="/dashboard/calibration"
                className="mt-auto self-start rounded-full h-9 px-5 text-sm font-medium text-white"
                style={{ background: "#FF5500", lineHeight: "36px" }}
              >
                Begin Session →
              </Link>
            </>
          ) : (
            <>
              <p className="font-semibold text-white" style={{ fontSize: 16 }}>
                {calDue !== null ? `Next calibration in ${calDue} days` : "No calibration scheduled"}
              </p>
              {calDue !== null && (
                <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ background: "#FF5500", width: `${Math.max(5, 100 - (calDue / 30) * 100)}%` }}
                  />
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
