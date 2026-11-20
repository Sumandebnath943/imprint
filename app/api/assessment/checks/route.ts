import { NextResponse } from "next/server";
import { z } from "zod";
import { ADULT_ONLY_MESSAGE, hasConfirmedAdultAge } from "@/lib/auth/eligibility";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { runCodeChecks } from "@/lib/assessment/code-checks";
import { findDeveloperExercise } from "@/lib/assessment/developer-bank";
import { rateLimit } from "@/lib/api/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { loadWorkspace } from "@/lib/onboarding/workspace-access";

export const maxDuration = 30;

const input = z.object({ exercise: z.string().max(60), files: z.record(z.string().max(32), z.string().max(12000)) });

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to run practice tests." }, { status: 401 });
  if (!hasConfirmedAdultAge(user)) return NextResponse.json({ error: ADULT_ONLY_MESSAGE }, { status: 403 });
  const { data: profile, error } = await supabase.from("profiles").select("profession,onboarding_completed").eq("id", user.id).single();
  if (error || findRoleTrack(profile?.profession)?.id !== "software-developer") {
    return NextResponse.json({ error: "Select Software Developer to run these tests." }, { status: 409 });
  }
  if (!profile.onboarding_completed && !await loadWorkspace(supabase, user.id, "software-developer", undefined, true).catch(() => null)) {
    return NextResponse.json({ error: "Open your onboarding workspace to run tests." }, { status: 409 });
  }
  const submission = input.safeParse(await request.json().catch(() => null));
  const exercise = submission.success ? findDeveloperExercise(submission.data.exercise) : undefined;
  if (!submission.success || !exercise || Object.keys(submission.data.files).length !== Object.keys(exercise.files).length ||
      Object.keys(exercise.files).some((name) => !submission.data.files[name]?.trim())) {
    return NextResponse.json({ error: "Provide code for each starter file." }, { status: 400 });
  }
  if (!rateLimit(`code-checks:${user.id}`, 8, 60000).allowed) {
    return NextResponse.json({ error: "Too many test runs. Wait a minute and try again." }, { status: 429 });
  }
  try {
    const results = await runCodeChecks(exercise.id, submission.data.files);
    return NextResponse.json({ ...results, cases: results.cases.slice(0, 2) });
  } catch {
    return NextResponse.json({ error: "The isolated test runner is temporarily unavailable." }, { status: 503 });
  }
}
