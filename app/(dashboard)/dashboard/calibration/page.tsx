import CalibrationClient from "@/components/calibration/CalibrationClient";
import RoleAssessment from "@/components/assessment/RoleAssessment";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { createClient } from "@/lib/supabase/server";
import type { CalibrationPageData, CalibrationSession } from "@/lib/calibration/types";
import { getScoringAvailability } from "@/lib/assessment/pilot";
import Link from "next/link";
import DeveloperPractice from "@/components/assessment/CodeWorkspace";
import WorkspaceCalibration from "@/components/onboarding/WorkspaceCalibration";
import { loadWorkspace } from "@/lib/onboarding/workspace-access";

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

    const activeSession = sessions.find(
      (s) => s.status === "in_progress" && s.prompts && s.prompts.length > 0
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

export default async function CalibrationPage({ searchParams }: { searchParams?: { history?: string } }) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("profiles").select("profession").eq("id", user.id).maybeSingle();
      const role = findRoleTrack(data?.profession);
      if (role) {
        const pageData = await getCalibrationData();
        if (searchParams?.history === "legacy" && pageData.activeSession) return <CalibrationClient pageData={pageData} />;
        const availability = getScoringAvailability(role.id);
        const workspace = await loadWorkspace(supabase, user.id, role.id);
        const score = workspace?.assessment_id ? await supabase.from("role_assessments").select("score")
          .eq("id", workspace.assessment_id).eq("user_id", user.id).maybeSingle() : null;
        const earlier = await supabase.from("role_assessments").select("id")
          .eq("user_id", user.id).eq("role_id", role.id).eq("rubric_version", role.version).limit(1).maybeSingle();
        return <main className="mx-auto max-w-5xl space-y-6 px-5 py-8">
          {searchParams?.history === "role" && earlier.data ? <>
            <Link className="text-[#ffad89] underline" href="/dashboard/calibration">Current work samples</Link>
            <RoleAssessment roleName={role.name} />
          </> : <>
            <WorkspaceCalibration roleId={role.id} roleName={role.name} initial={{ workspace, scoring: availability === "enabled" }} score={score?.data?.score ?? undefined} />
            {earlier.data && <Link className="text-[#ffad89] underline" href="/dashboard/calibration?history=role">View or resume earlier role assessments</Link>}
          </>}
          {role.id === "software-developer" && <DeveloperPractice />}
          {role.id === "illustrator" && <Link className="inline-flex min-h-11 items-center text-[#ffad89] underline" href="/dashboard/mentors">Find a mentor for portfolio feedback</Link>}
          {pageData.sessions.length > 0 && <section className="space-y-2 border-t border-white/10 pt-5">
            <h2 className="text-lg font-semibold">Legacy Calibration history</h2>
            {pageData.activeSession && <Link className="text-[#ffad89] underline" href="/dashboard/calibration?history=legacy">Resume saved legacy Calibration</Link>}
            <ul className="space-y-2 text-sm text-white/75">
              {pageData.sessions.map((session) => <li key={session.id}><details>
                <summary className="cursor-pointer">{session.created_at.slice(0, 10)} · Session {session.session_number} · {session.status.replaceAll("_", " ")}</summary>
                <dl className="mt-3 space-y-3 border-l border-white/15 pl-4">
                  {(session.responses ?? []).map((response) => <div key={response.promptId}>
                    <dt className="font-medium">{session.prompts?.find(({ id }) => id === response.promptId)?.headline ?? response.promptId}</dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words">{response.content}</dd>
                  </div>)}
                </dl>
              </details></li>)}
            </ul>
            <Link className="text-sm text-[#ffad89] underline" href="/dashboard/drift">View legacy scores in Progress</Link>
          </section>}
        </main>;
      }
    }
  }
  const pageData = await getCalibrationData();
  return <CalibrationClient pageData={pageData} />;
}
