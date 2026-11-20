import type { ReactNode } from "react";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROLE_TRACKS } from "@/lib/assessment/catalog";
import { getScoringAvailability } from "@/lib/assessment/pilot";
import { hasConfirmedAdultAge } from "@/lib/auth/eligibility";

// This must be a Server Component — interactive shell is in OnboardingShell (client)
export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) redirect("/signin");
  if (!hasConfirmedAdultAge(user)) redirect("/confirm-age");
  const scoringStatuses = Object.fromEntries(ROLE_TRACKS.map(({ id }) => [id, getScoringAvailability(id)]));
  return <OnboardingShell userId={user.id} scoringStatuses={scoringStatuses}>{children}</OnboardingShell>;
}
