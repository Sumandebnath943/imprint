"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import ProgressBar from "@/components/onboarding/ProgressBar";
import OnboardingTopBar from "@/components/onboarding/OnboardingTopBar";
import { TOTAL_STEPS } from "@/lib/onboarding/modules";
import { toast } from "sonner";
import { MotionConfig } from "framer-motion";
import type { ScoringAvailability } from "@/lib/assessment/availability";

const OnboardingUser = createContext("");
const OnboardingScoring = createContext<Record<string, ScoringAvailability>>({});
export const useOnboardingUserId = () => useContext(OnboardingUser);
export const useOnboardingScoring = () => useContext(OnboardingScoring);

export default function OnboardingShell({ children, userId, scoringStatuses }: {
  children: ReactNode;
  userId: string;
  scoringStatuses: Record<string, ScoringAvailability>;
}) {
  const router = useRouter();
  const { currentStep } = useOnboardingStore();
  const [readyFor, setReadyFor] = useState("");

  // Rehydrate the persisted store on the client (skipHydration was set to avoid SSR crash)
  useEffect(() => {
    const name = `imprint-onboarding-${userId}`;
    useOnboardingStore.persist.setOptions({ name });
    if (!localStorage.getItem(name)) useOnboardingStore.getState().reset();
    Promise.resolve(useOnboardingStore.persist.rehydrate()).then(() => setReadyFor(userId));
  }, [userId]);

  const handleSaveExit = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_step: currentStep })
      .eq("id", userId);
    if (error) { toast.error("Onboarding progress could not be saved."); return; }
    router.push("/");
  }, [userId, currentStep, router]);

  return (
    <MotionConfig reducedMotion="user">
    <div
      onCopyCapture={(event) => event.preventDefault()}
      onPasteCapture={(event) => event.preventDefault()}
      className="onboarding-shell relative min-h-[100dvh] bg-[#0b0b0c] font-sans text-white"
    >
      <ProgressBar step={currentStep} total={TOTAL_STEPS} />
      <OnboardingTopBar onSaveExit={handleSaveExit} step={currentStep} total={TOTAL_STEPS} />
      <main id="onboarding-content" className="mx-auto">
        <OnboardingUser.Provider value={userId}>
          <OnboardingScoring.Provider value={scoringStatuses}>
          {readyFor === userId ? children : <p role="status" className="p-24">Loading onboarding…</p>}
          </OnboardingScoring.Provider>
        </OnboardingUser.Provider>
      </main>
    </div>
    </MotionConfig>
  );
}
