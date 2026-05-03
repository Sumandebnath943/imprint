"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import DriftRing from "@/components/drift/DriftRing";
import { DriftHero, DriftZoneBar } from "@/components/drift/DriftHero";
import DriftHistoryChart from "@/components/drift/DriftHistoryChart";
import DriftSignalCards from "@/components/drift/DriftSignals";
import { DriftWeeklyTable, DriftRecovery, DriftCalibration, DriftExport } from "@/components/drift/DriftSections";
import type { DriftPageData } from "@/lib/drift/types";
import { getZoneColor } from "@/lib/drift/types";

interface DriftClientProps { pageData: DriftPageData; }

function EmptyState() {
  const router = useRouter();
  const score = 0;
  const color = "#00D97E";
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 relative" style={{ background: "#080808" }}>
      {/* Ghost */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ fontSize: 200, fontWeight: 700, color: "#FFFFFF", opacity: 0.03, overflow: "hidden" }}>DRIFT</div>

      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="relative z-10">
        <DriftRing score={score} size={200} strokeWidth={10} showCenter />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="text-center relative z-10 max-w-lg">
        <h1 className="font-bold mb-2" style={{ fontSize: 40, lineHeight: 1.1 }}>
          <span className="text-white">Your Drift Score </span>
          <span style={{ color }}>starts at zero.</span>
        </h1>
        <p className="mb-8 leading-relaxed" style={{ fontSize: 16, color: "rgba(255,255,255,0.50)", lineHeight: 1.7 }}>
          You&apos;ve just set your Baseline Imprint. Your Drift Score measures how much your identity shifts from this moment forward.<br /><br />
          Complete your first Calibration Session to get your real score — and start tracking your identity over time.
        </p>
        <button onClick={() => router.push("/dashboard/calibration")}
          className="rounded-full h-12 px-10 text-base font-semibold text-white mb-4"
          style={{ background: "#FF5500", boxShadow: "0 0 40px rgba(255,85,0,0.25)" }}>
          Begin First Calibration →
        </button>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Takes 15–20 minutes. Bi-weekly after that.</p>
      </motion.div>
    </div>
  );
}

export default function DriftClient({ pageData }: DriftClientProps) {
  const { currentScore, previousScore, allScores, signals, signalTrends, calibrations, weeklyRows, nextCalibrationAvailable, nextCalibrationDate } = pageData;

  if (!currentScore) return <EmptyState />;

  const color = getZoneColor(currentScore.score);

  const rawData = {
    challengesCompleted: pageData.rawStats.challengesCompleted,
    skillsAbove50: pageData.rawStats.skillsAbove50,
    totalSkills: pageData.rawStats.totalSkills,
    daysSinceVault: pageData.rawStats.daysSinceVault,
    mirrorSessions: pageData.rawStats.mirrorSessions,
    avgDependencyFlags: pageData.rawStats.avgDependencyFlags,
    independentPct: signals.aiIndependence,
    journalStreak: pageData.rawStats.journalStreak,
    journalEntriesMonth: pageData.rawStats.journalEntriesThisMonth,
  };

  return (
    <div className="relative" style={{ background: "#080808", minHeight: "100%", padding: "40px 48px 80px" }}>
      {/* Ghost DRIFT */}
      <div className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
        style={{ fontSize: 200, fontWeight: 700, color: "#FFFFFF", opacity: 0.03, lineHeight: 1, zIndex: 0 }}>
        DRIFT
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* 1. Hero */}
        <DriftHero
          current={currentScore}
          previous={previousScore}
          nextCalibrationAvailable={nextCalibrationAvailable}
          nextCalibrationDate={nextCalibrationDate}
          signals={signals}
        />

        {/* 2. Zone bar */}
        <DriftZoneBar score={currentScore.score} />

        {/* 3. History chart */}
        {allScores.length > 0 && (
          <DriftHistoryChart allScores={allScores} currentColor={color} />
        )}

        {/* 4. Signal cards */}
        <DriftSignalCards signals={signals} trends={signalTrends} rawData={rawData} />

        {/* 5. Weekly table */}
        <DriftWeeklyTable rows={weeklyRows} />

        {/* 6. Recovery protocol (conditional) */}
        <DriftRecovery score={currentScore.score} signals={signals} />

        {/* 7. Calibration history */}
        <DriftCalibration calibrations={calibrations} />

        {/* 8. Export */}
        <DriftExport score={currentScore.score} signals={signals} date={currentScore.created_at} />
      </div>
    </div>
  );
}
