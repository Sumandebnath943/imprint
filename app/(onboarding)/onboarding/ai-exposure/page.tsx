"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import BottomNav from "@/components/onboarding/BottomNav";
import { AI_EXPOSURE_LEVELS, AI_USE_CONTEXTS } from "@/lib/onboarding/modules";
import { CheckCircle2 } from "lucide-react";

const STEP = 3;
const TOTAL = 7;

export default function AIExposurePage() {
  const router = useRouter();
  const { answers, setStep, setAiExposureLevel, setAiUseContext, setAiReflectionNote } = useOnboardingStore();

  const toggleContext = (item: string) => {
    const cur = answers.aiUseContext;
    setAiUseContext(cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item]);
  };

  const canContinue = !!answers.aiExposureLevel;

  const handleContinue = () => {
    setStep(4);
    router.push("/onboarding/baseline-intro");
  };

  const handleBack = () => {
    setStep(2);
    router.push("/onboarding/who-are-you");
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden px-6 py-32">
      {/* Ghost word */}
      <div
        className="fixed select-none pointer-events-none"
        style={{ fontSize: 200, fontWeight: 700, color: "#FFFFFF", opacity: 0.03, top: "40%", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap", letterSpacing: "-0.04em", zIndex: 0 }}
      >
        HONEST
      </div>

      <div className="relative z-10 max-w-[720px] w-full mx-auto">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4"
        >
          <h1 className="font-bold leading-tight" style={{ fontSize: "clamp(36px,5vw,48px)" }}>
            <span className="text-white">How deep are you </span>
            <span style={{ color: "#FF5500" }}>already in?</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
          style={{ fontSize: 17, color: "rgba(255,255,255,0.50)", lineHeight: 1.7 }}
        >
          No judgment. We need to know your starting point to measure your drift accurately.
        </motion.p>

        {/* Exposure level */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <p className="uppercase tracking-widest text-xs font-medium mb-5" style={{ color: "rgba(255,255,255,0.50)" }}>
            How heavily do you currently use AI tools?
          </p>
          <div className="flex flex-col gap-3">
            {AI_EXPOSURE_LEVELS.map((level) => {
              const selected = answers.aiExposureLevel === level.value;
              return (
                <button
                  key={level.value}
                  onClick={() => setAiExposureLevel(level.value)}
                  className="flex items-center gap-4 rounded-2xl px-6 py-5 text-left transition-all duration-200"
                  style={{
                    background: selected ? "rgba(255,85,0,0.08)" : "#111111",
                    border: `1px solid ${selected ? "rgba(255,85,0,0.50)" : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: level.color, boxShadow: selected ? `0 0 8px ${level.color}` : "none" }} />
                  <div className="flex-1">
                    <p className="font-medium text-white text-base">{level.label}</p>
                    <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{level.description}</p>
                  </div>
                  {selected && <CheckCircle2 size={18} style={{ color: "#FF5500", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Use context */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-10"
        >
          <p className="uppercase tracking-widest text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.50)" }}>
            What do you use AI for?
          </p>
          <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.30)" }}>Select all that apply</p>
          <div className="flex flex-wrap gap-2.5">
            {AI_USE_CONTEXTS.map((item) => {
              const selected = answers.aiUseContext.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleContext(item)}
                  className="rounded-pill px-4 py-2.5 text-sm font-medium transition-all duration-200"
                  style={{
                    background: selected ? "rgba(255,85,0,0.15)" : "#1A1A1A",
                    border: `1px solid ${selected ? "rgba(255,85,0,0.45)" : "rgba(255,255,255,0.10)"}`,
                    color: selected ? "#FF5500" : "white",
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Honest reflection */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
        >
          <p className="text-sm font-medium text-white mb-2">
            Optional: Anything else about your AI use you want to record for yourself?
          </p>
          <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            This is for you, not us. We&apos;ll reflect it back in 90 days.
          </p>
          <textarea
            value={answers.aiReflectionNote}
            onChange={(e) => setAiReflectionNote(e.target.value)}
            placeholder="This is for you, not us. We'll reflect it back in 90 days."
            className="w-full text-white outline-none resize-none transition-all duration-200"
            style={{
              background: "#1A1A1A",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "16px",
              minHeight: 100,
              fontSize: 14,
              lineHeight: 1.7,
              caretColor: "#FF5500",
            }}
            onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(255,85,0,0.50)"; }}
            onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; }}
          />
        </motion.div>
      </div>

      <div className="h-28" />

      <BottomNav
        step={STEP}
        total={TOTAL}
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!canContinue}
      />
    </div>
  );
}
