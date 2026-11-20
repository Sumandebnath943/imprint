"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_RESUME_PATH } from "@/lib/auth/resume";
import { isAdultAgeGroup } from "@/lib/auth/age-groups";
import { buildModuleList } from "@/lib/onboarding/modules";
import { useOnboardingStore } from "@/lib/store/onboarding.store";

export default function ResumeOnboardingPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function resume() {
      if (new URLSearchParams(location.search).has("error")) throw new Error();
      const { currentStep, answers, setBaselineModules } = useOnboardingStore.getState();
      const path = (step: string) => router.replace(`/onboarding/${step}`);
      if (currentStep < 2) return path("welcome");
      if (currentStep < 3 || !answers.profession || !isAdultAgeGroup(answers.ageGroup)) return path("who-are-you");
      if (currentStep < 4 || !answers.aiExposureLevel) return path("ai-exposure");
      if (currentStep === 4) return path("baseline-intro");
      if (currentStep === 6) return path("skill-vault");
      if (currentStep >= 7) return path("complete");
      if (answers.baselineModules.length) return path("baseline");
      const response = await fetch(`/api/assessment?role=${encodeURIComponent(answers.profession)}`, { signal: controller.signal });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (controller.signal.aborted) return;
      if (!result.available) setBaselineModules(buildModuleList(answers.professionCluster));
      path(result.available ? "assessment" : "baseline");
    }
    void resume().catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [router]);

  return <div className="p-24" role="status">
    {failed ? <p>Your saved progress could not be loaded. <a className="underline" href={AUTH_RESUME_PATH}>Try again</a></p> : "Loading your saved progress…"}
  </div>;
}
