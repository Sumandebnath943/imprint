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

const OnboardingUser = createContext("");
export const useOnboardingUserId = () => useContext(OnboardingUser);

export default function OnboardingShell({ children, userId }: { children: ReactNode; userId: string }) {
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
    // The onboarding flow is a guided sequence, so each step should fit the
    // screen rather than hiding its input below the fold. Above md the shell
    // is exactly one viewport tall and never scrolls; each step fills it and
    // gives its own long region (a profession grid, a prompt) internal scroll.
    // Below md it falls back to normal page scrolling, which is expected on a
    // phone and the only way this much content stays usable there.
    <div
      onCopyCapture={(event) => event.preventDefault()}
      onPasteCapture={(event) => event.preventDefault()}
      className="relative overflow-x-hidden md:h-[100dvh] md:overflow-hidden"
      style={{ background: "#080808", fontFamily: "Space Grotesk, sans-serif" }}
    >
      <ProgressBar step={currentStep} total={TOTAL_STEPS} />
      <OnboardingTopBar onSaveExit={handleSaveExit} />
      <main className="min-h-screen md:h-full md:min-h-0">
        <OnboardingUser.Provider value={userId}>
          {readyFor === userId ? children : <p role="status" className="p-24">Loading onboarding…</p>}
        </OnboardingUser.Provider>
      </main>
    </div>
  );
}
