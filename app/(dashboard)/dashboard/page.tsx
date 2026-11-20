import { Suspense } from "react";
import type { DashboardData } from "@/lib/dashboard/types";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { getAssessmentSummary } from "@/lib/assessment/summary";
import { getRoleSeries } from "@/lib/onboarding/workspace-access";

// Revalidate dashboard data every 60s
export const revalidate = 60;

async function fetchDashboardData(): Promise<DashboardData> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const empty: DashboardData = {
    profile: null, driftScore: null, skills: [],
    nextChallenge: null, journalCountThisWeek: 0, calibration: null,
    activityByDay: DAY_LABELS.map((day, i) => ({ day, value: 0, isToday: i === new Date().getDay() })),
    streak: 0,
  };

  if (!url || !key) return empty;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    // Start of current week (Monday)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    // 30 days ago for streak calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [profileRes, driftRes, skillsRes, challengeRes, journalRes, calRes, allRecentJournalRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("drift_scores").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(1).single(),
      supabase.from("skill_vault").select("*").eq("user_id", user.id)
        .order("strength_level", { ascending: false }).limit(4),
      supabase.from("vault_challenges").select("*").eq("user_id", user.id)
        .eq("status", "pending").order("due_date", { ascending: true }).limit(1).single(),
      // This week's entries with dates for per-day chart
      supabase.from("journal_entries").select("created_at")
        .eq("user_id", user.id).gte("created_at", weekStart.toISOString()),
      supabase.from("calibration_sessions").select("*").eq("user_id", user.id)
        .order("completed_at", { ascending: false }).limit(1).single(),
      // Last 30 days for streak
      supabase.from("journal_entries").select("created_at")
        .eq("user_id", user.id).gte("created_at", thirtyDaysAgo.toISOString()),
    ]);
    const role = findRoleTrack(profileRes.data?.profession);
    const [assessed, due] = role ? await Promise.all([
      getAssessmentSummary(supabase, user.id, role),
      getRoleSeries(supabase, user.id, role).then(({ role: series }) => supabase.from("imprint_tasks").select("kind,due_at").eq("user_id", user.id)
        .eq("role_id", role.id).eq("rubric_version", series.version).is("completed_at", null)
        .order("due_at").limit(1).maybeSingle()),
    ]) : [null, null];

    // Build per-day activity for this week (Mon–Sun)
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayCounts: Record<string, number> = {};
    (journalRes.data ?? []).forEach(e => {
      const d = new Date(e.created_at);
      // getDay() returns 0=Sun, so map to Mon-first index
      const dayName = weekDays[(d.getDay() + 6) % 7];
      dayCounts[dayName] = (dayCounts[dayName] ?? 0) + 1;
    });
    const todayMonFirst = (new Date().getDay() + 6) % 7; // 0=Mon
    const activityByDay = weekDays.map((day, i) => ({
      day,
      value: dayCounts[day] ?? 0,
      isToday: i === todayMonFirst,
    }));

    // Compute consecutive day streak (going backwards from today)
    const entryDates = new Set(
      (allRecentJournalRes.data ?? []).map(e => new Date(e.created_at).toDateString())
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 31; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (entryDates.has(d.toDateString())) streak++;
      else break;
    }

    return {
      profile: profileRes.data ?? null,
      driftScore: driftRes.data ?? null,
      skills: skillsRes.data ?? [],
      nextChallenge: challengeRes.data ?? null,
      journalCountThisWeek: journalRes.data?.length ?? 0,
      calibration: calRes.data ?? null,
      activityByDay,
      streak,
      proficiency: assessed,
      dueTask: due?.data ?? null,
    };
  } catch {
    return empty;
  }
}

export default async function DashboardPage() {
  const data = await fetchDashboardData();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent data={data} />
    </Suspense>
  );
}
