import DriftClient from "@/components/drift/DriftClient";
import type { DriftPageData, DriftSignalValues, DriftSignalTrend, WeeklyRow } from "@/lib/drift/types";
import { calcSignals } from "@/lib/drift/types";

async function getDriftData(): Promise<DriftPageData> {
  const empty: DriftPageData = {
    userId: "", currentScore: null, previousScore: null, allScores: [],
    signals: { baselineConsistency: 80, vaultActivity: 70, aiIndependence: 85, journalRegularity: 60 },
    signalTrends: { baselineConsistency: "stable", vaultActivity: "stable", aiIndependence: "stable", journalRegularity: "stable" },
    calibrations: [], weeklyRows: [], nextCalibrationAvailable: true, nextCalibrationDate: null,
    rawStats: { journalStreak: 0, journalEntriesThisMonth: 0, challengesCompleted: 0, skillsAbove50: 0, totalSkills: 0, daysSinceVault: 999, mirrorSessions: 0, avgDependencyFlags: 0 },
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const now = new Date();
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);

    const [scoresRes, calibRes, vaultRes, vaultChalRes, mirrorRes, journalRes] = await Promise.all([
      supabase.from("drift_scores").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("calibration_sessions").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(10),
      supabase.from("skill_vault").select("id,strength_level,last_exercised").eq("user_id", user.id),
      supabase.from("vault_challenges").select("id,status,created_at").eq("user_id", user.id).gte("created_at", monthAgo.toISOString()),
      supabase.from("mirror_sessions").select("dependency_flags,created_at").eq("user_id", user.id).gte("created_at", monthAgo.toISOString()),
      supabase.from("journal_entries").select("created_at,word_count").eq("user_id", user.id).order("created_at", { ascending: false }).limit(60),
    ]);

    const allScores = (scoresRes.data ?? []) as DriftPageData["allScores"];
    const currentScore = allScores[0] ?? null;
    const previousScore = allScores[1] ?? null;

    // Vault signal data
    const skills = vaultRes.data ?? [];
    const totalSkills = skills.length;
    const skillsAbove50 = skills.filter((s) => s.strength_level >= 50).length;
    const daysSinceLastVaultPractice = skills.length > 0
      ? Math.min(...skills.map((s) => Math.floor((now.getTime() - new Date(s.last_exercised).getTime()) / 86400000))) : 999;
    const challengesCompletedThisMonth = (vaultChalRes.data ?? []).filter((c) => c.status === "completed").length;

    // Mirror signal data
    const mirrorSessions = mirrorRes.data ?? [];
    const totalDependencyFlagsThisMonth = mirrorSessions.reduce((s, m) => s + (m.dependency_flags ?? 0), 0);

    // Journal signal data
    const journalEntries = journalRes.data ?? [];
    const journalEntriesThisMonth = journalEntries.filter((e) => new Date(e.created_at) >= monthAgo).length;
    const dates = new Set(journalEntries.map((e) => new Date(e.created_at).toDateString()));
    let streak = 0;
    const checkDate = new Date(); checkDate.setHours(0, 0, 0, 0);
    while (dates.has(new Date(checkDate).toDateString())) { streak++; checkDate.setDate(checkDate.getDate() - 1); }

    const avgJournalWordCount = journalEntries.length > 0
      ? journalEntries.reduce((s, e) => s + (e.word_count ?? 0), 0) / journalEntries.length : 0;

    const signals: DriftSignalValues = calcSignals({
      totalSkills, skillsAbove50, daysSinceLastVaultPractice, challengesCompletedThisMonth,
      mirrorSessionsThisMonth: mirrorSessions.length,
      totalDependencyFlagsThisMonth,
      journalStreak: streak, journalEntriesThisMonth, avgJournalWordCount,
      baselineAvgWordCount: 300,
    });

    // Simple trend: compare current signals vs computed from scores[1]
    const signalTrends: DriftSignalTrend = {
      baselineConsistency: currentScore && previousScore && currentScore.score < previousScore.score ? "up" : currentScore && previousScore && currentScore.score > previousScore.score ? "down" : "stable",
      vaultActivity: challengesCompletedThisMonth > 2 ? "up" : challengesCompletedThisMonth === 0 ? "down" : "stable",
      aiIndependence: totalDependencyFlagsThisMonth === 0 ? "up" : totalDependencyFlagsThisMonth > 5 ? "down" : "stable",
      journalRegularity: streak >= 3 ? "up" : streak === 0 ? "down" : "stable",
    };

    // Weekly rows from allScores
    const weeklyRows: WeeklyRow[] = allScores.slice(0, 20).map((s, i) => ({
      week: new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: s.score,
      status: s.score < 40 ? "Anchored" : s.score < 60 ? "Drifting" : s.score < 80 ? "Critical" : "Crisis",
      baseline: signals.baselineConsistency,
      vault: signals.vaultActivity,
      ai: signals.aiIndependence,
      journal: signals.journalRegularity,
      delta: i < allScores.length - 1 ? s.score - allScores[i + 1].score : null,
      isCurrent: i === 0,
    }));

    // Calibrations with session numbers
    const calibrations = (calibRes.data ?? []).map((c, i) => ({
      id: c.id,
      user_id: c.user_id,
      completed_at: c.completed_at,
      score_produced: (c as Record<string, unknown>).score_produced as number | undefined,
      findings: (c as Record<string, unknown>).findings as CalibrationSession["findings"],
      session_number: (calibRes.data?.length ?? 0) - i,
    }));

    // Next calibration: available if last calibration was > 14 days ago
    const lastCalDate = calibRes.data?.[0]?.completed_at;
    const daysSinceLastCal = lastCalDate
      ? Math.floor((now.getTime() - new Date(lastCalDate).getTime()) / 86400000) : 999;
    const nextCalibrationAvailable = daysSinceLastCal >= 14 || !lastCalDate;
    const nextCalibrationDate = nextCalibrationAvailable ? null : (() => {
      const d = new Date(lastCalDate!); d.setDate(d.getDate() + 14);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    })();

    return {
      userId: user.id, currentScore, previousScore, allScores,
      signals, signalTrends, calibrations, weeklyRows,
      nextCalibrationAvailable, nextCalibrationDate,
      rawStats: {
        journalStreak: streak,
        journalEntriesThisMonth,
        challengesCompleted: challengesCompletedThisMonth,
        skillsAbove50,
        totalSkills,
        daysSinceVault: daysSinceLastVaultPractice,
        mirrorSessions: mirrorSessions.length,
        avgDependencyFlags: mirrorSessions.length > 0 ? totalDependencyFlagsThisMonth / mirrorSessions.length : 0,
      }
    };
  } catch {
    return empty;
  }
}

// Type import for calibration session
type CalibrationSession = DriftPageData["calibrations"][0];

export default async function DriftPage() {
  const pageData = await getDriftData();
  return <DriftClient pageData={pageData} />;
}
