"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import { useUserStore } from "@/lib/store/user.store";
import ProgressBar from "@/components/onboarding/ProgressBar";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar";
import { TOTAL_STEPS } from "@/lib/onboarding/modules";

export default function OnboardingShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { currentStep } = useOnboardingStore();
  const { profile } = useUserStore();

  // Rehydrate the persisted store on the client (skipHydration was set to avoid SSR crash)
  useEffect(() => {
    useOnboardingStore.persist.rehydrate();
  }, []);

  const handleSaveExit = useCallback(async () => {
    if (!profile?.id) { router.push("/signin"); return; }
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ onboarding_step: currentStep })
      .eq("id", profile.id);
    router.push("/signin");
  }, [profile, currentStep, router]);

  return (
    // The onboarding flow is a guided sequence, so each step should fit the
    // screen rather than hiding its input below the fold. Above md the shell
    // is exactly one viewport tall and never scrolls; each step fills it and
    // gives its own long region (a profession grid, a prompt) internal scroll.
    // Below md it falls back to normal page scrolling, which is expected on a
    // phone and the only way this much content stays usable there.
    <div
      className="relative overflow-x-hidden md:h-[100dvh] md:overflow-hidden"
      style={{ background: "#080808", fontFamily: "Space Grotesk, sans-serif" }}
    >
      <ProgressBar step={currentStep} total={TOTAL_STEPS} />
      <OnboardingTopBar onSaveExit={handleSaveExit} />
      <main className="min-h-screen md:h-full md:min-h-0">{children}</main>
    </div>
  );
}
