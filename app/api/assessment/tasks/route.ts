import { NextResponse } from "next/server";
import { z } from "zod";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { CONTRIBUTIONS, TASK_CONTEXTS, VERIFICATIONS } from "@/lib/assessment/rules";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ADULT_ONLY_MESSAGE, hasConfirmedAdultAge } from "@/lib/auth/eligibility";
import { getRoleSeries } from "@/lib/onboarding/workspace-access";

const completion = z.discriminatedUnion("kind", [
  z.object({ id: z.uuid(), kind: z.literal("reschedule") }),
  z.object({
    id: z.uuid(), kind: z.literal("practice"),
    skill: z.string().max(120), reflection: z.string().trim().min(1).max(1200),
  }),
  z.object({
    id: z.uuid(), kind: z.literal("check-in"),
    skill: z.string().max(120), stage: z.number().int().min(0).max(2),
    attemptedFirst: z.boolean(),
    contribution: z.enum(CONTRIBUTIONS),
    verification: z.enum(VERIFICATIONS),
    context: z.enum(TASK_CONTEXTS),
    verificationNote: z.string().trim().max(350),
  }),
]);

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to complete tasks." }, { status: 401 });
    if (!hasConfirmedAdultAge(user)) return NextResponse.json({ error: ADULT_ONLY_MESSAGE }, { status: 403 });
    const parsed = completion.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Complete the required task fields." }, { status: 400 });
    const { id, ...response } = parsed.data;
    const [taskLookup, profileLookup] = await Promise.all([
      supabase.from("imprint_tasks").select("kind,role_id,rubric_version").eq("id", id).eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("profession").eq("id", user.id).single(),
    ]);
    if (taskLookup.error || profileLookup.error) throw taskLookup.error ?? profileLookup.error;
    const task = taskLookup.data;
    const selected = findRoleTrack(profileLookup.data.profession);
    const role = selected ? (await getRoleSeries(supabase, user.id, selected)).role : null;
    if (!task || !role || role.id !== task.role_id || role.version !== task.rubric_version) {
      return NextResponse.json({ error: "This task belongs to another profession or assessment version." }, { status: 404 });
    }
    if (response.kind === "reschedule") {
      const { data, error } = await createAdminClient().rpc("reschedule_imprint_task", { p_user: user.id, p_task: id });
      if (error?.code === "P0001") return NextResponse.json({ error: error.message }, { status: 409 });
      if (error) throw error;
      return NextResponse.json({ dueAt: data });
    }
    if (task.kind !== response.kind || !role.tasks.some((item) => item.skill === response.skill)) {
      return NextResponse.json({ error: "This task does not match your role or skill." }, { status: 404 });
    }
    if (response.kind === "check-in") {
      if ((response.contribution === "none") !== (response.context === "no-ai") ||
          (response.contribution === "none") !== (response.verification === "not-applicable") ||
          (response.verification === "independently-checked" && !response.verificationNote)) {
        return NextResponse.json({ error: "Check whether AI contributed and how that contribution was verified." }, { status: 400 });
      }
    }

    const { error } = await createAdminClient().rpc("complete_imprint_task", { p_user: user.id, p_task: id, p_completion: response });
    if (error?.code === "P0001") return NextResponse.json({ error: error.message }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Could not complete assessment task", error instanceof Error ? error.name : "database request");
    return NextResponse.json({ error: "The task could not be saved. Please retry." }, { status: 503 });
  }
}
