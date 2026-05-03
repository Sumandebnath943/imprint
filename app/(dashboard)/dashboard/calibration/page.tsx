import CalibrationClient from "@/components/calibration/CalibrationClient";
import type { CalibrationPageData, CalibrationSession } from "@/lib/calibration/types";

async function getCalibrationData(): Promise<CalibrationPageData> {
  const empty: CalibrationPageData = {
    userId: "", userCluster: "life_personal",
    sessions: [], latestDriftScore: null, previousDriftScore: null,
    activeSession: null, baselineExists: false,
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const [profileRes, sessionsRes, scoresRes, baselineRes] = await Promise.all([
      supabase.from("profiles").select("profession_cluster").eq("id", user.id).single(),
      supabase.from("calibration_sessions")
        .select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(20),
      supabase.from("drift_scores")
        .select("score,created_at").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(2),
      supabase.from("baseline_imprints").select("id").eq("user_id", user.id).limit(1),
    ]);

    const sessions = (sessionsRes.data ?? []) as CalibrationSession[];
    const scores = scoresRes.data ?? [];

    // Find active session (in_progress AND created within 24h)
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const activeSession = sessions.find(
      (s) => s.status === "in_progress" && s.created_at >= cutoff && s.prompts && s.prompts.length > 0
    ) ?? null;

    return {
      userId: user.id,
      userCluster: profileRes.data?.profession_cluster ?? "life_personal",
      sessions,
      latestDriftScore: (scores[0] as Record<string, unknown>)?.score as number ?? null,
      previousDriftScore: (scores[1] as Record<string, unknown>)?.score as number ?? null,
      activeSession,
      baselineExists: (baselineRes.data?.length ?? 0) > 0,
    };
  } catch {
    return empty;
  }
}

export default async function CalibrationPage() {
  const pageData = await getCalibrationData();
  return <CalibrationClient pageData={pageData} />;
}
