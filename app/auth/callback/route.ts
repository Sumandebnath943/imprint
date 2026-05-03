import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Map onboarding_step number → route
const ONBOARDING_STEP_ROUTES: Record<number, string> = {
  0: "/onboarding/welcome",
  1: "/onboarding/who-are-you",
  2: "/onboarding/ai-exposure",
  3: "/onboarding/baseline",
  4: "/onboarding/skill-vault",
  5: "/onboarding/complete",
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createClient();

    // Exchange authorization code for session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !sessionData.user) {
      return NextResponse.redirect(`${origin}/signin?error=oauth_failed`);
    }

    const user = sessionData.user;

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, onboarding_completed, onboarding_step")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      // First-time OAuth user — create profile
      await supabase.from("profiles").insert({
        id: user.id,
        email: user.email ?? "",
        full_name:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          "",
        onboarding_completed: false,
        onboarding_step: 0,
        imprint_score: 0,
        ai_use_context: [],
      });

      return NextResponse.redirect(`${origin}/onboarding/welcome`);
    }

    // Returning user
    if (existingProfile.onboarding_completed) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    // Resume onboarding from where they left off
    const step = existingProfile.onboarding_step ?? 0;
    const route = ONBOARDING_STEP_ROUTES[step] ?? "/onboarding/welcome";
    return NextResponse.redirect(`${origin}${route}`);
  }

  // No code — redirect to sign in
  return NextResponse.redirect(`${origin}/signin`);
}
