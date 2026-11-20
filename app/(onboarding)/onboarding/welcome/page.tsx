"use client";

import { useRouter } from "next/navigation";
import { ClipboardList, LockKeyhole } from "lucide-react";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import StepLayout from "@/components/onboarding/StepLayout";

export default function WelcomePage() {
  const router = useRouter();
  const setStep = useOnboardingStore((state) => state.setStep);

  return (
    <StepLayout title="Welcome to Imprint"
      description="Set up a private baseline and choose the skills you want to keep practicing. You can save your progress and come back."
      aside={<button type="button" onClick={() => { setStep(2); router.push("/onboarding/who-are-you"); }}
        className="min-h-11 rounded-xl bg-[#ff713d] px-5 py-2 font-semibold text-on-accent">
        I&apos;m ready. Let&apos;s begin.
      </button>}>
      <div className="space-y-4">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <LockKeyhole aria-hidden="true" className="mb-3 text-[#ff945e]" />
          <h2 className="text-lg font-semibold">Private baseline</h2>
          <p className="mt-2 text-white/75">You&apos;ll answer seven questions. Emotional and personal reflections stay private, and you choose what reasoning to share for evaluation.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <ClipboardList aria-hidden="true" className="mb-3 text-[#ff945e]" />
          <h2 className="text-lg font-semibold">Profession assessment</h2>
          <p className="mt-2 text-white/75">Two of the seven questions are work samples for your profession. You can choose evaluation at the end when scoring is available. Calibration is where you practice and reassess.</p>
        </section>
      </div>
    </StepLayout>
  );
}
