import type { ReactNode } from "react";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// This must be a Server Component — interactive shell is in OnboardingShell (client)
export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) redirect("/signin");
  return <OnboardingShell userId={user.id}>{children}</OnboardingShell>;
}
