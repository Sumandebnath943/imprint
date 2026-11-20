import "server-only";
import type { RoleTrack } from "./catalog";
import { assessmentSummary, type AssessmentScore } from "./comparison";
import { getScoringAvailability } from "./pilot";
import type { createClient } from "@/lib/supabase/server";
import { getRoleSeries } from "@/lib/onboarding/workspace-access";

export async function getAssessmentSummary(supabase: ReturnType<typeof createClient>, userId: string, role: RoleTrack) {
  const series = await getRoleSeries(supabase, userId, role);
  const records = () => supabase.from("role_assessments").select("score,form,scored_at,results")
    .eq("user_id", userId).eq("role_id", role.id).eq("rubric_version", series.role.version);
  const [latest, original, draft] = await Promise.all([
    records().eq("status", "scored").order("form", { ascending: false }).limit(1).maybeSingle(),
    records().eq("status", "scored").eq("form", 0).maybeSingle(),
    records().eq("status", "draft").limit(1).maybeSingle(),
  ]);
  const availability = latest.error || original.error || draft.error ? "unavailable" : getScoringAvailability(role.id);
  return assessmentSummary(latest.data as AssessmentScore | null, original.data as AssessmentScore | null, availability, series.draft || Boolean(draft.data));
}
