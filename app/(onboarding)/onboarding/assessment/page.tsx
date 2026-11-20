"use client";

import { useRouter } from "next/navigation";
import RoleAssessment from "@/components/assessment/RoleAssessment";
import { useOnboardingStore } from "@/lib/store/onboarding.store";

export default function AssessmentOnboardingPage() {
  const router = useRouter();
  const { answers, setStep } = useOnboardingStore();
  return (
    <div className="min-h-screen overflow-y-auto px-5 pb-24 pt-28 md:h-full md:min-h-0 md:pt-24">
      {answers.profession && <RoleAssessment roleName={answers.profession} onContinue={() => {
        setStep(6);
        router.push("/onboarding/skill-vault");
      }} />}
    </div>
  );
}
