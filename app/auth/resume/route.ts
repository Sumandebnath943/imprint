import { redirectAfterAuth as go } from "@/lib/auth/resume";
import { createClient } from "@/lib/supabase/server";
import { AGE_CONFIRMATION_PATH, hasConfirmedAdultAge } from "@/lib/auth/eligibility";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return go("/signin?error=session");
  if (!hasConfirmedAdultAge(user)) return go(AGE_CONFIRMATION_PATH);
  const { data: profile, error } = await supabase.from("profiles").select("onboarding_completed").eq("id", user.id).maybeSingle();
  if (error) return go("/onboarding/resume?error=profile");
  if (profile) return go(profile.onboarding_completed ? "/dashboard" : "/onboarding/resume");

  // Reconcile a missing legacy profile without replacing progress on a retry.
  const { error: insertError } = await supabase.from("profiles").upsert({
    id: user.id, email: user.email ?? "",
    full_name: user.user_metadata.full_name ?? user.user_metadata.name ?? "",
  }, { onConflict: "id", ignoreDuplicates: true });
  if (insertError) return go("/onboarding/resume?error=profile");
  return go("/onboarding/resume");
}
