"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Timer, Lock, Brain } from "lucide-react";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import { buildModuleList, CLUSTER_LABELS } from "@/lib/onboarding/modules";
import BottomNav from "@/components/onboarding/BottomNav";
import StepLayout from "@/components/onboarding/StepLayout";

const STEP = 4;
const TOTAL = 7;

const RULE_CARDS = [
  {
    icon: Timer,
    title: "Timed prompts.",
    sub: "Work at your own pace within each window.",
  },
  {
    icon: Lock,
    title: "Fully private.",
    sub: "Only you see this. Never used for training AI.",
  },
  {
    icon: Brain,
    title: "No AI. Just you.",
    sub: "No autocorrect. No suggestions. Pure you.",
  },
];

export default function BaselineIntroPage() {
  const router = useRouter();
  const { answers, setStep, setBaselineModules } = useOnboardingStore();
  const [fading, setFading] = useState(false);

  const clusterLabel = CLUSTER_LABELS[answers.professionCluster] ?? "Your Cluster";

  const handleBegin = () => {
    const modules = buildModuleList(answers.professionCluster);
    setBaselineModules(modules);
    setStep(5);
    setFading(true);
    setTimeout(() => {
      router.push("/onboarding/baseline");
    }, 900);
  };

  const handleBack = () => {
    setStep(3);
    router.push("/onboarding/ai-exposure");
  };

  return (
    <>
      {/* Fade to black on exit */}
      <AnimatePresence>
        {fading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50"
            style={{ background: "#080808" }}
          />
        )}
      </AnimatePresence>

      <StepLayout
        ghost="BASELINE"
        eyebrow="Step 4 · Before you start"
        title={
          <>
            Now for the{" "}
            <span style={{ color: "#FF5500" }}>important part.</span>
          </>
        }
        description={
          <>
            Your Baseline Imprint is about to be captured — a series of short
            prompts designed for{" "}
            <span className="text-white font-medium">
              {answers.profession || "you"}
            </span>
            , in the <span style={{ color: "#FF5500" }}>{clusterLabel}</span>{" "}
            cluster.
            <br />
            <br />
            No AI assistance. No Google. No notes. Answer from your own mind,
            right now. There are no right or wrong answers —{" "}
            <span className="text-white font-medium">
              your honesty is the only thing that matters.
            </span>
          </>
        }
      >
        {/* Beside the rules rather than under them, which is what keeps this
            step on one screen without a scroll region. */}
        <div className="flex flex-col gap-3 lg:justify-center lg:h-full">
          {RULE_CARDS.map(({ icon: Icon, title, sub }) => (
            <div
              key={title}
              className="rounded-2xl p-5 flex items-start gap-4"
              style={{
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <Icon
                size={20}
                style={{ color: "#FF5500", flexShrink: 0, marginTop: 2 }}
              />
              <div>
                <p className="text-[15px] font-medium text-white mb-1">{title}</p>
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </StepLayout>

      <BottomNav
        step={STEP}
        total={TOTAL}
        onBack={handleBack}
        onContinue={handleBegin}
        continueLabel="Begin My Baseline →"
      />
    </>
  );
}
