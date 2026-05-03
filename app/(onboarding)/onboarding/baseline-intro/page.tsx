"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Timer, Lock, Brain } from "lucide-react";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import { buildModuleList, CLUSTER_LABELS } from "@/lib/onboarding/modules";
import BottomNav from "@/components/onboarding/BottomNav";

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
    // Build and save the module list into the store
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
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 py-32">
      {/* Ghost word */}
      <div
        className="fixed select-none pointer-events-none"
        style={{ fontSize: 200, fontWeight: 700, color: "#FFFFFF", opacity: 0.03, top: "50%", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap", letterSpacing: "-0.04em", zIndex: 0 }}
      >
        BASELINE
      </div>

      {/* Orange glow bloom */}
      <div
        className="fixed pointer-events-none"
        style={{ width: 600, height: 600, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(255,85,0,0.12) 0%, transparent 70%)", filter: "blur(40px)", zIndex: 0 }}
      />

      {/* Fade to black overlay */}
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

      <div className="relative z-10 max-w-[680px] w-full mx-auto text-center">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-bold mb-8"
          style={{ fontSize: "clamp(38px,5vw,56px)", lineHeight: 0.95 }}
        >
          <span className="text-white block">Now for the</span>
          <span style={{ color: "#FF5500" }}>important part.</span>
        </motion.h1>

        {/* Body */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 mx-auto"
          style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, maxWidth: 520 }}
        >
          Your Baseline Imprint is about to be captured. This is a series of short prompts designed specifically for{" "}
          <span className="text-white font-medium">{answers.profession || "you"}</span> — your cluster is{" "}
          <span style={{ color: "#FF5500" }}>{clusterLabel}</span>.
          <br /><br />
          <span className="font-medium text-white">Rules:</span>
          <br />
          No AI assistance. No Google. No notes.
          <br />
          Answer from your own mind, right now.
          <br />
          There are no right or wrong answers.
          <br />
          <span className="font-medium text-white">Your honesty is the only thing that matters.</span>
        </motion.p>

        {/* Rule cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
        >
          {RULE_CARDS.map(({ icon: Icon, title, sub }) => (
            <div
              key={title}
              className="rounded-2xl p-5 text-center"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Icon size={22} style={{ color: "#FF5500", margin: "0 auto 12px" }} />
              <p className="text-sm font-medium text-white mb-1">{title}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{sub}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          onClick={handleBegin}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32 }}
          whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(255,85,0,0.40)" }}
          whileTap={{ scale: 0.97 }}
          className="h-14 px-10 rounded-pill text-white font-medium text-base"
          style={{ background: "#FF5500", boxShadow: "0 0 24px rgba(255,85,0,0.25)" }}
        >
          Begin My Baseline →
        </motion.button>
      </div>

      <div className="h-28" />

      <BottomNav
        step={STEP}
        total={TOTAL}
        onBack={handleBack}
        onContinue={handleBegin}
        continueLabel="Begin My Baseline →"
      />
    </div>
  );
}
