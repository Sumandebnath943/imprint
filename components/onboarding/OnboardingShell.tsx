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
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: "#080808", fontFamily: "Space Grotesk, sans-serif" }}
    >
      <ProgressBar step={currentStep} total={TOTAL_STEPS} />
      <OnboardingTopBar onSaveExit={handleSaveExit} />
      <main className="min-h-screen">{children}</main>
    </div>
  );
}
