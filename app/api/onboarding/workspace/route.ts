import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isRoleScoringEnabled } from "@/lib/assessment/pilot";
import { rateLimit } from "@/lib/api/rate-limit";
import { loadWorkspace, workspaceAccess } from "@/lib/onboarding/workspace-access";
import { getOnboardingWorkspace, getWorkspaceExercise, ONBOARDING_WORK_VERSION } from "@/lib/onboarding/workspace-catalog";
import { bookingObservation, checkWorkspaceAnswer, workspaceQuestionNumbers, WORKSPACE_CONSENT } from "@/lib/onboarding/workspace-contract";
import { evaluateWorkspace } from "@/lib/onboarding/evaluate-workspace";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;
const answerSchema = z.object({
  fields: z.array(z.string().max(8000)).max(5), choices: z.array(z.string().max(200)).max(5),
  order: z.array(z.string().max(160)).max(8), artifact: z.string().max(240).optional(), alternative: z.boolean().optional(),
  files: z.record(z.string().max(32), z.string().max(12000)).optional(),
  observations: z.array(z.string().max(160)).max(30).optional(),
  beatGrid: z.array(z.string().max(8)).length(16).optional(),
  palette: z.array(z.string().regex(/^#[\da-f]{6}$/i)).length(2).optional(),
});
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("open"), reassessment: z.boolean().optional(), difficulty: z.enum(["Basic", "Intermediate", "Advanced"]).optional() }),
  z.object({ action: z.literal("save"), id: z.uuid(), question: z.number().int().min(1).max(7), version: z.number().int().nonnegative(), answer: answerSchema }),
  z.object({ action: z.literal("score"), id: z.uuid(), version: z.number().int().nonnegative(), consent: z.literal(WORKSPACE_CONSENT), shareReasoning: z.boolean().optional() }),
]);
const failure = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function GET(request: Request) {
  try {
    const access = await workspaceAccess();
    if (!access) return failure("Sign in and choose your profession.", 401);
    const baseline = new URL(request.url).searchParams.get("baseline") === "true";
    const workspace = await loadWorkspace(access.supabase, access.user.id, access.role.id, undefined, baseline);
    return NextResponse.json({ workspace, scoring: isRoleScoringEnabled(access.role.id) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return failure("Your saved workspace could not be loaded. Try again.", 503);
  }
}

export async function POST(request: Request) {
  try {
    const access = await workspaceAccess();
    if (!access) return failure("Sign in and choose your profession.", 401);
    const parsed = input.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure("Check the workspace response.", 400);
    const payload = parsed.data;
    const { user, role, profession, supabase } = access;
    const admin = createAdminClient();
    const scoring = isRoleScoringEnabled(role.id);
    if (payload.action === "open") {
      if (payload.reassessment && !scoring) return failure("Scoring is currently unavailable. Practice remains available.", 409);
      const { error } = await admin.rpc("open_role_onboarding_workspace", {
        p_user: user.id, p_profession: profession, p_role: role.id, p_rubric: ONBOARDING_WORK_VERSION,
        p_reassessment: payload.reassessment ?? false, p_difficulty: role.id === "software-developer" ? payload.difficulty ?? "Basic" : "Basic",
      });
      if (error?.code === "P0001") return failure(error.message, 409);
      if (error) throw error;
      return NextResponse.json({ workspace: await loadWorkspace(supabase, user.id, role.id, undefined, !payload.reassessment), scoring });
    }

    const workspace = await loadWorkspace(supabase, user.id, role.id, payload.id);
    if (!workspace) return failure("This work sample belongs to another profession or account.", 404);
    if (workspace.assessment_id) {
      return payload.action === "score" ? NextResponse.json({ workspace, scoring }) : failure("This result is already saved.", 409);
    }
    if (workspace.progress_version !== payload.version) return failure("The workspace changed in another tab. Reload to resume the saved version.", 409);
    if (payload.action === "save") {
      const { question, answer } = payload;
      if (!workspaceQuestionNumbers(workspace).includes(question)) return failure("Choose one of the two work sample questions.", 400);
      const issue = checkWorkspaceAnswer(role.id, question, answer, workspace.form);
      if (issue) return failure(issue, 400);
      const task = getOnboardingWorkspace(role.id, question, workspace.form);
      if (answer.files && (!task?.code || !matchesExercise(workspace.form, workspace.difficulty, answer.files))) return failure("Use the starter files for this exercise.", 400);
      if ((answer.beatGrid && (!task || role.id !== "musician")) || (answer.palette && (!task || role.id !== "designer"))) {
        return failure("Use the evidence controls for this question.", 400);
      }
      if (answer.observations && (!task?.simulator || answer.observations.some((observation) => {
        const match = observation.match(/^(Original|Candidate) (Create|Edit) with (-?\d{1,3}): (Accepted|Rejected)$/);
        return !match || observation !== bookingObservation(Number(match[3]), match[2], match[1]);
      }))) return failure("Record observations from the supplied simulation.", 400);
      if (answer.artifact) {
        if ((!task?.artifact && question !== 4 && question !== 7) || !answer.artifact.startsWith(`${user.id}/${workspace.id}/workspace-${question}-`) ||
          answer.artifact.split("/").length !== 3) return failure("Upload evidence for this question.", 400);
        const { data, error } = await supabase.storage.from("assessment-evidence").exists(answer.artifact);
        if (error || !data) return failure("The uploaded evidence is missing.", 400);
      }
      const { data, error } = await admin.rpc("save_role_workspace_answer", {
        p_user: user.id, p_profession: profession, p_id: workspace.id, p_question: question, p_version: payload.version, p_answer: answer,
      });
      if (error?.code === "P0001" || data === null && !error) return failure("The saved workspace changed. Reload and try again.", 409);
      if (error) throw error;
      return NextResponse.json({ workspace: { ...workspace, progress_version: data, feedback: null, answers: { ...workspace.answers, [question]: answer } }, scoring });
    }

    if (!scoring) return failure("Scoring is currently unavailable. Your saved work is available.", 503);
    const required = workspaceQuestionNumbers(workspace);
    if (required.some((number) => !workspace.answers[number])) return failure("Save every question in this assessment first.", 400);
    if (!rateLimit(`workspace-score:${user.id}`, 4, 60000).allowed) return failure("Wait a minute before requesting scoring again.", 429);
    const token = randomUUID();
    const { data: lease, error: leaseError } = await admin.from("onboarding_workspaces")
      .update({ scoring_token: token, scoring_started_at: new Date().toISOString() })
      .eq("id", workspace.id).eq("user_id", user.id).eq("progress_version", payload.version).is("assessment_id", null)
      .or(`scoring_token.is.null,scoring_started_at.lt.${new Date(Date.now() - 120000).toISOString()}`).select("id").maybeSingle();
    if (leaseError) throw leaseError;
    if (!lease) return failure("Scoring is already in progress. Your answers are saved.", 409);
    try {
      const result = await evaluateWorkspace(workspace, role.name, payload.shareReasoning === true);
      const roleAnswers = Object.fromEntries([5, 6].map((question) => {
        const answer = workspace.answers[question];
        return [`${role.id}-${question}`, { text: [...answer.fields, ...answer.choices, ...answer.order, ...(answer.observations ?? []),
          ...(answer.beatGrid ?? []), ...(answer.palette ?? []), ...Object.values(answer.files ?? {})].join("\n"), evidencePath: answer.artifact }];
      }));
      const { error } = await admin.rpc("record_role_workspace_score", {
        p_user: user.id, p_profession: profession, p_id: workspace.id, p_token: token, p_score: result.score,
        p_results: "details" in result ? result.details : null, p_role_answers: roleAnswers, p_consent: WORKSPACE_CONSENT, p_feedback: result.feedback,
      });
      if (error?.code === "P0001") return failure(error.message, 409);
      if (error) throw error;
      return NextResponse.json({ workspace: await loadWorkspace(supabase, user.id, role.id, workspace.id), scoring, score: result.score });
    } finally {
      await admin.from("onboarding_workspaces").update({ scoring_token: null, scoring_started_at: null })
        .eq("id", workspace.id).eq("user_id", user.id).eq("scoring_token", token);
    }
  } catch {
    return failure("The workspace service is temporarily unavailable. Saved work remains available for retry.", 503);
  }
}

function matchesExercise(form: number, difficulty: string, supplied: Record<string, string>) {
  const files = Object.keys(getWorkspaceExercise(form, difficulty).files);
  return Object.keys(supplied).length === files.length && files.every((file) => supplied[file]?.trim());
}
