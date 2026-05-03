import type { ReactNode } from "react";
import OnboardingShell from "@/components/onboarding/OnboardingShell";

// This must be a Server Component — interactive shell is in OnboardingShell (client)
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <OnboardingShell>{children}</OnboardingShell>;
}
