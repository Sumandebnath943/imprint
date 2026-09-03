import ProfileClient from "@/components/profile/ProfileClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your IMPRINT Profile",
  description: "Your full identity record, scores, and activity.",
};

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const [
    { data: profile },
    { data: driftScores },
    { count: calibrationsCount },
    { data: skills },
    { data: challenges },
    { data: journalEntries },
    { data: mirrorSessions },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("drift_scores").select("score, score_label, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("calibration_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
    supabase.from("skill_vault").select("id, strength_level, times_practiced").eq("user_id", user.id),
    supabase.from("vault_challenges").select("id, status, completed_at").eq("user_id", user.id),
    supabase.from("journal_entries").select("id, word_count, is_forge_entry, has_ai_assistance, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("mirror_sessions").select("dependency_flags").eq("user_id", user.id),
  ]);

  const latestDriftScore = driftScores && driftScores.length > 0
    ? { score: driftScores[0].score, status: driftScores[0].score_label, date: driftScores[0].created_at }
    : null;

  // ── Real stats ──────────────────────────────────────────────────────────
  const completedChallenges = (challenges || []).filter(c => c.status === "completed");
  const totalChallenges = (challenges || []).length;

  const totalWords = (journalEntries || []).reduce((sum, e) => sum + (e.word_count || 0), 0);
  const forgeWords = (journalEntries || []).filter(e => e.is_forge_entry).reduce((sum, e) => sum + (e.word_count || 0), 0);
  const journalWords = (journalEntries || []).filter(e => !e.is_forge_entry).reduce((sum, e) => sum + (e.word_count || 0), 0);

  // Days active: distinct calendar days with any journal entry
  const activeDays = new Set(
    (journalEntries || []).map(e => new Date(e.created_at).toDateString())
  ).size;

  // Best (lowest) drift score
  const bestDrift = driftScores && driftScores.length > 0
    ? driftScores.reduce((best, d) => d.score < best.score ? d : best, driftScores[0])
    : null;

  // Simple streak: count consecutive days from today backwards with at least one entry
  const entryDates = new Set((journalEntries || []).map(e => new Date(e.created_at).toDateString()));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (entryDates.has(d.toDateString())) streak++;
    else break;
  }

  // ── IMPRINT score breakdown ─────────────────────────────────────────────
  const sessions = mirrorSessions ?? [];
  const totalDependencyFlags = sessions.reduce((sum, s) => sum + (s.dependency_flags ?? 0), 0);

  // These four are the exact components /api/calibration/complete sums into
  // profiles.imprint_score. The profile previously derived its own breakdown
  // from different inputs — skill *count* rather than average strength, the
  // journal streak rather than total active days — so the four bars could
  // never add up to the score printed above them.
  const avgSkillStrength = (skills ?? []).length
    ? (skills ?? []).reduce((sum, s) => sum + (s.strength_level ?? 0), 0) / (skills ?? []).length
    : 0;

  const scoreComponents = {
    vaultStrength: Math.min(250, Math.round(avgSkillStrength * 2.5)),
    calibrationRecord: Math.min((calibrationsCount ?? 0) * 50, 300),
    journalConsistency: Math.min(activeDays * 8, 250),
    aiIndependence: Math.max(200 - totalDependencyFlags * 5, 0),
  };

  const stats = {
    calibrations: calibrationsCount ?? 0,
    scoreComponents,
    streak,
    skillsTracked: (skills || []).length,
    vaultChallenges: completedChallenges.length,
    journalEntries: (journalEntries || []).length,
    daysActive: activeDays || (profile?.created_at ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000) + 1 : 1),
    wordsWritten: totalWords,
    forgeWords,
    journalWords,
    calibrationWords: 0,
    consistencyRate: totalChallenges > 0 ? Math.round((completedChallenges.length / totalChallenges) * 100) : 0,
    bestDriftScore: bestDrift?.score ?? null,
    bestDriftDate: bestDrift?.created_at
      ? new Date(bestDrift.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : null,
  };

  const scoreHistory = driftScores ? driftScores.map(d => ({ score: d.score })).reverse() : [{ score: 0 }];

  return (
    <ProfileClient
      profile={profile || {}}
      latestDriftScore={latestDriftScore}
      stats={stats}
      scoreHistory={scoreHistory}
      timeline={[]}
      skills={skills || []}
      baseline={{}}
      beliefs={[]}
    />
  );
}
