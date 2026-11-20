"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import { toast } from "sonner";

export default function CompletePage() {
  const router = useRouter();
  const { answers, totalWordCount, reset } = useOnboardingStore();
  const [entering, setEntering] = useState(false);

  const moduleCount = Object.keys(answers.baselineResponses).length;
  const skillCount = answers.skills.length;

  const handleEnter = async () => {
    if (entering) return;
    setEntering(true);
    try {
      const response = await fetch("/api/onboarding/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profession: answers.profession,
          ageGroup: answers.ageGroup,
          aiExposureLevel: answers.aiExposureLevel,
          aiUseContext: answers.aiUseContext,
          reflection: answers.aiReflectionNote,
          skills: answers.skills,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Could not finish onboarding.");
      }
      reset();
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not finish onboarding.");
      setEntering(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center md:justify-start overflow-hidden px-6 pt-28 pb-28 md:pt-[72px] md:pb-[84px] md:h-full">
      {/* Ghost word */}
      <div
        className="fixed select-none pointer-events-none"
        style={{ fontSize: 160, fontWeight: 700, color: "#FFFFFF", opacity: 0.03, top: "50%", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap", letterSpacing: "-0.04em", zIndex: 0 }}
      >
        IMPRINTED
      </div>

      {/* Large orange glow bloom */}
      <motion.div
        className="fixed pointer-events-none"
        style={{ width: 800, height: 800, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(255,85,0,0.18) 0%, transparent 65%)", filter: "blur(60px)", zIndex: 0 }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.06, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Fade overlay on enter */}
      <AnimatePresence>
        {entering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50"
            style={{ background: "#080808" }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[980px] flex flex-col items-center text-center lg:flex-row lg:items-center lg:text-left lg:gap-14 lg:flex-1 lg:min-h-0"
      >
        {/* Left — the message and the way forward. */}
        <div className="flex flex-col items-center lg:items-start lg:w-[46%] lg:shrink-0">
        {/* Sonar pulse icon */}
        <div className="relative w-20 h-20 flex items-center justify-center mb-10">
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute rounded-full"
              style={{ border: "1px solid rgba(255,85,0,0.25)" }}
              animate={{ width: [20 + ring * 18, 20 + ring * 36], height: [20 + ring * 18, 20 + ring * 36], opacity: [0.7, 0] }}
              transition={{ duration: 2, delay: ring * 0.5, repeat: Infinity, ease: "easeOut" }}
            />
          ))}
          <div className="w-4 h-4 rounded-full" style={{ background: "#FF5500", boxShadow: "0 0 16px rgba(255,85,0,0.8)" }} />
        </div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-bold mb-6"
          style={{ fontSize: "clamp(44px,6vw,64px)", lineHeight: 0.95 }}
        >
          <span className="text-white block">Your Imprint</span>
          <span style={{ color: "#FF5500" }}>is set.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mb-10 lg:mb-4"
          style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, maxWidth: 480 }}
        >
          Your onboarding responses are saved. Your proficiency result appears after a scored assessment.
        </motion.p>

        {/* CTA */}
        <motion.button
          onClick={handleEnter}
          disabled={entering}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(255,85,0,0.40)" }}
          whileTap={{ scale: 0.97 }}
          className="h-14 px-10 rounded-pill text-on-accent font-medium text-base mb-5"
          style={{ background: "#FF5500", boxShadow: "0 0 24px rgba(255,85,0,0.25)" }}
        >
          Enter IMPRINT →
        </motion.button>

        <p className="text-sm" style={{ color: "rgba(255,255,255,0.58)" }}>
          Continue to your dashboard for next steps.
        </p>

        </div>

        {/* Right — the numbers this step produced. */}
        <div className="flex flex-col items-center lg:items-start w-full lg:flex-1 lg:min-w-0">
        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex gap-4 mb-10 flex-wrap justify-center"
        >
          {[
            { label: "Modules Completed", value: moduleCount, color: "white" },
            { label: "Words Written", value: totalWordCount, color: "#FF5500" },
            { label: "Skills Tracked", value: skillCount, color: "white" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl text-center"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", padding: "20px 28px", minWidth: 140 }}
            >
              <p className="font-bold mb-1" style={{ fontSize: 36, color, lineHeight: 1 }}>{value}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.66)", lineHeight: 1.5 }}>{label}</p>
            </div>
          ))}
        </motion.div>

        </div>

      </motion.div>
    </div>
  );
}
