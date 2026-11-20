import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { findRoleTrack, getRoleTasks } from "@/lib/assessment/catalog";
import { evaluateRole } from "@/lib/assessment/evaluate";
import { getScoringAvailability, isRoleScoringEnabled } from "@/lib/assessment/pilot";
import { AIProviderError } from "@/lib/ai/providers";
import { runCodeChecks, type CodeChecks } from "@/lib/assessment/code-checks";
import { WORKSPACE_RUBRIC_VERSION } from "@/lib/assessment/workspaces";
import {
  ASSESSMENT_CONSENT_VERSION, getObjectiveCheck, getPublicTasks, isPastGrace, type RoleAnswer,
} from "@/lib/assessment/rules";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ADULT_ONLY_MESSAGE, hasConfirmedAdultAge } from "@/lib/auth/eligibility";

export const maxDuration = 60;
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

async function selectedRole(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase.from("profiles").select("profession,onboarding_completed").eq("id", userId).single();
  if (error) throw error;
  const role = data.onboarding_completed ? findRoleTrack(data.profession) : undefined;
  return role ? { ...role, savedName: data.profession as string } : undefined;
}

const answer = z.object({
  text: z.string().max(12000),
  evidencePath: z.string().max(230).optional(),
  checkValue: z.string().max(40).optional(),
});

const operation = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"), role: z.string().max(100), context: z.string().trim().max(200),
    consent: z.literal(true), consentVersion: z.literal(ASSESSMENT_CONSENT_VERSION),
  }),
  z.object({ action: z.literal("save"), id: z.uuid(), version: z.number().int().min(0), answers: z.record(z.string(), answer) }),
  z.object({ action: z.literal("score"), id: z.uuid(), version: z.number().int().min(0), independentAttempt: z.literal(true) }),
]);

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Sign in to access assessments.", 401);
  if (!hasConfirmedAdultAge(user)) return fail(ADULT_ONLY_MESSAGE, 403);
  const role = await selectedRole(supabase, user.id).catch(() => null);
  if (role === null) return fail("Could not read your selected profession.", 503);
  const requested = new URL(request.url).searchParams.get("role");
  if (requested && role && findRoleTrack(requested)?.id !== role.id) return fail("Choose the assessment for your selected profession.", 409);
  const availability = role ? getScoringAvailability(role.id) : "disabled";
  if (!role) return NextResponse.json({ available: false, availability });

  const lookup = supabase.from("role_assessments")
    .select("id,form,status,answers,results,score,progress_version,scored_at,consent_version,role_context,check_results")
    .eq("user_id", user.id).eq("role_id", role.id).eq("rubric_version", role.version);
  if (availability !== "enabled") lookup.eq("status", "draft");
  const { data: attempt, error } = await lookup.order("form", { ascending: false }).limit(1).maybeSingle();
  if (error) return fail("Could not load the saved assessment.", 500);
  return NextResponse.json({
    available: availability === "enabled", availability, attempt, tasks: attempt ? getPublicTasks(role, attempt.form) : [],
    consentRequired: Boolean(attempt && attempt.consent_version !== ASSESSMENT_CONSENT_VERSION),
  });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Sign in to save your assessment.", 401);
  if (!hasConfirmedAdultAge(user)) return fail(ADULT_ONLY_MESSAGE, 403);
  const parsed = operation.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Check the assessment information and try again.", 400);
  const input = parsed.data;
  try {
    const admin = createAdminClient();
    const selected = await selectedRole(supabase, user.id);
    if (!selected) return fail("Finish onboarding before starting a profession assessment.", 409);
    if (input.action === "start") {
      const role = findRoleTrack(input.role);
      if (role?.id !== selected.id) return fail("Choose the assessment for your selected profession.", 409);
      if (!role || !isRoleScoringEnabled(role.id)) return fail("Scoring is unavailable for this track.", 404);
      const { data: assigned, error: taskError } = await supabase.from("imprint_tasks")
        .select("id,kind,due_at,completed_at").eq("user_id", user.id).eq("role_id", role.id)
        .eq("rubric_version", role.version).is("completed_at", null).in("kind", ["practice", "check-in"]);
      if (taskError) throw taskError;
      if (assigned?.some((task) => isPastGrace(task))) {
        return fail("Complete the overdue practice or check-in before starting another assessment.", 409);
      }
      const { data, error } = await admin.rpc("start_selected_role_assessment", {
        p_user: user.id, p_role: role.id, p_rubric: role.version, p_context: input.context,
        p_consent: ASSESSMENT_CONSENT_VERSION, p_profession: selected.savedName,
      });
      if (error?.code === "P0001") return fail(error.message, 409);
      if (error) throw error;
      const attempt = Array.isArray(data) ? data[0] : data;
      if (!attempt) throw new Error("No assessment was returned");
      return NextResponse.json({ attempt, tasks: getPublicTasks(role, attempt.form) });
    }

    const { data: attempt, error } = await supabase.from("role_assessments")
      .select("*").eq("id", input.id).eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    const role = findRoleTrack(attempt?.role_id);
    if (attempt && role?.id !== selected.id) return fail("This draft belongs to a previous profession. Switch back to resume it.", 409);
    if (!attempt || !role || role.version !== attempt.rubric_version) {
      return fail("This assessment is unavailable.", 404);
    }
    if (input.action === "score" && !isRoleScoringEnabled(role.id)) return fail("Scoring is temporarily unavailable. Your responses are saved.", 503);
    if (attempt.status === "scored" && input.action === "score") return NextResponse.json({ attempt });
    if (attempt.status !== "draft" || attempt.progress_version !== input.version) {
      return fail("This assessment changed elsewhere. Reload to resume the saved version.", 409);
    }

    const tasks = getRoleTasks(role, attempt.form);
    const expired = new Date(Date.now() - 120000).toISOString();
    if (input.action === "save") {
      for (const [id, response] of Object.entries(input.answers)) {
        const task = tasks.find((item) => item.id === id);
        if (!task) return fail("A response does not belong to this assessment.", 400);
        if (response.evidencePath) {
          const prefix = `${user.id}/${attempt.id}/${id}-`;
          if ((task.mode !== "image" && task.mode !== "voice") ||
              !response.evidencePath.startsWith(prefix) || response.evidencePath.split("/").length !== 3) {
            return fail("An attachment does not belong to this assessment.", 400);
          }
          const { data, error: storageError } = await supabase.storage.from("assessment-evidence").exists(response.evidencePath);
          if (storageError || !data) return fail("An attachment is missing. Upload it again before saving.", 400);
        }
      }
      const { data, error: writeError } = await admin.rpc("save_selected_role_assessment_draft", {
        p_user: user.id, p_profession: selected.savedName, p_attempt: input.id, p_version: input.version, p_answers: input.answers,
      });
      if (writeError?.code === "P0001") return fail(writeError.message, 409);
      if (writeError) throw writeError;
      if (data === null) return fail("This assessment is being scored or changed elsewhere.", 409);
      return NextResponse.json({ version: data });
    }

    if (attempt.consent_version !== ASSESSMENT_CONSENT_VERSION) {
      return fail("Review the current assessment data notice before scoring.", 409);
    }
    const answers = attempt.answers as Record<string, RoleAnswer>;
    const missing = tasks.filter((task, index) => {
      const response = answers[task.id];
      if (!response || (task.mode === "image" ? !response.evidencePath : !response.text.trim() && !response.evidencePath)) return true;
      if (role.version === WORKSPACE_RUBRIC_VERSION && role.id === "illustrator" && !response.text.trim()) return true;
      return getObjectiveCheck(role.id, attempt.form, index) && !response.checkValue?.trim();
    });
    if (missing.length) return fail(`Add evidence for ${missing.map((task) => task.skill).join(", ")}.`, 422);

    const token = randomUUID();
    const { data: locked, error: leaseError } = await admin.from("role_assessments")
      .update({ scoring_token: token, scoring_started_at: new Date().toISOString() })
      .eq("id", attempt.id).eq("user_id", user.id).eq("status", "draft").eq("progress_version", input.version)
      .or(`scoring_token.is.null,scoring_started_at.lt.${expired}`)
      .select("id").maybeSingle();
    if (leaseError) throw leaseError;
    if (!locked) return fail("Scoring is already in progress. Your responses are saved.", 409);

    try {
      let checks: CodeChecks | undefined;
      const exercise = tasks[0].exercise;
      if (exercise) {
        checks = await runCodeChecks(exercise.id, { "total.js": answers[tasks[0].id].text }).catch(() => undefined);
        if (!checks) return fail("The isolated test runner is temporarily unavailable. Your code is saved.", 503);
        const { error: testSaveError } = await admin.from("role_assessments").update({ check_results: checks })
          .eq("id", attempt.id).eq("user_id", user.id).eq("scoring_token", token);
        if (testSaveError) throw testSaveError;
      }
      const result = await evaluateRole(role, attempt.form, answers, checks);
      if ("insufficient" in result) {
        return fail(`More usable evidence is needed for ${result.insufficient?.join(", ")}. Your responses are saved.`, 422);
      }
      const { data, error: finishError } = await admin.rpc("finish_selected_role_assessment", {
        p_user: user.id, p_profession: selected.savedName, p_attempt: attempt.id, p_token: token, p_score: result.score,
        p_results: { ...result, independentAttempt: true },
      });
      if (finishError?.code === "P0001") return fail(finishError.message, 409);
      if (finishError) throw finishError;
      const scored = Array.isArray(data) ? data[0] : data;
      if (!scored) throw new Error("No scored assessment was returned");
      return NextResponse.json({ attempt: scored });
    } finally {
      await admin.from("role_assessments").update({ scoring_token: null, scoring_started_at: null })
        .eq("id", attempt.id).eq("user_id", user.id).eq("scoring_token", token);
    }
  } catch (error) {
    console.error("Assessment operation failed", error instanceof Error ? error.name : "database request");
    if (error instanceof AIProviderError && (error.kind === "unavailable" || error.kind === "configuration")) {
      return fail("Scoring is temporarily unavailable. Your responses are saved. Try again later.", 503);
    }
    return fail("The assessment service could not finish this request. Saved responses are still available.", 503);
  }
}
