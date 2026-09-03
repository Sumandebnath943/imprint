"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import BottomNav from "@/components/onboarding/BottomNav";
import StepLayout from "@/components/onboarding/StepLayout";
import { AI_EXPOSURE_LEVELS, AI_USE_CONTEXTS } from "@/lib/onboarding/modules";
import { CheckCircle2 } from "lucide-react";

const STEP = 3;
const TOTAL = 7;

export default function AIExposurePage() {
  const router = useRouter();
  const {
    answers,
    setStep,
    setAiExposureLevel,
    setAiUseContext,
    setAiReflectionNote,
  } = useOnboardingStore();

  const toggleContext = (item: string) => {
    const cur = answers.aiUseContext;
    setAiUseContext(
      cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item]
    );
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
    <>
      <StepLayout
        ghost="HONEST"
        eyebrow="Step 3 · Your starting point"
        title={
          <>
            How deep are you{" "}
            <span style={{ color: "#FF5500" }}>already in?</span>
          </>
        }
        description="No judgment. We need to know your starting point to measure your drift accurately."
        wide
      >
        {/* Two questions plus an optional note is more than one screen can
            hold at this height, so this column scrolls on its own while the
            question and the nav stay fixed. */}
        <div className="overflow-y-auto pr-1 -mr-1 lg:flex-1 lg:min-h-0" style={{ scrollbarWidth: "thin" }}>
          {/* Exposure level */}
          <p
            className="uppercase tracking-widest text-[11px] font-medium mb-3"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            How heavily do you currently use AI tools?
          </p>
          <div className="flex flex-col gap-2 mb-7">
            {AI_EXPOSURE_LEVELS.map((level) => {
              const selected = answers.aiExposureLevel === level.value;
              return (
                <button
                  key={level.value}
                  onClick={() => setAiExposureLevel(level.value)}
                  className="flex items-center gap-3.5 rounded-xl px-4 py-3 text-left transition-all duration-200"
                  style={{
                    background: selected ? "rgba(255,85,0,0.08)" : "#111111",
                    border: `1px solid ${selected ? "rgba(255,85,0,0.50)" : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      background: level.color,
                      boxShadow: selected ? `0 0 8px ${level.color}` : "none",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{level.label}</p>
                    <p
                      className="text-[13px] mt-0.5"
                      style={{ color: "rgba(255,255,255,0.62)" }}
                    >
                      {level.description}
                    </p>
                  </div>
                  {selected && (
                    <CheckCircle2 size={16} style={{ color: "#FF5500", flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Use context */}
          <div className="flex items-baseline justify-between mb-3">
            <p
              className="uppercase tracking-widest text-[11px] font-medium"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              What do you use AI for?
            </p>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              {answers.aiUseContext.length
                ? `${answers.aiUseContext.length} selected`
                : "Select all that apply"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-7">
            {AI_USE_CONTEXTS.map((item) => {
              const selected = answers.aiUseContext.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleContext(item)}
                  className="rounded-full px-3.5 py-2 text-[13px] font-medium transition-all duration-200"
                  style={{
                    background: selected ? "rgba(255,85,0,0.15)" : "#161616",
                    border: `1px solid ${selected ? "rgba(255,85,0,0.45)" : "rgba(255,255,255,0.09)"}`,
                    color: selected ? "#FF5500" : "rgba(255,255,255,0.85)",
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>

          {/* Optional note */}
          <p className="text-[13px] font-medium text-white mb-1.5">
            Anything else about your AI use worth recording?
          </p>
          <p className="text-[12px] mb-2.5" style={{ color: "rgba(255,255,255,0.55)" }}>
            Optional. This is for you, not us — we&apos;ll reflect it back in 90 days.
          </p>
          <textarea
            value={answers.aiReflectionNote}
            onChange={(e) => setAiReflectionNote(e.target.value)}
            placeholder="Write freely, or skip this."
            className="w-full text-white outline-none resize-none transition-all duration-200"
            style={{
              background: "#141414",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "14px",
              minHeight: 88,
              fontSize: 14,
              lineHeight: 1.7,
              caretColor: "#FF5500",
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = "1px solid rgba(255,85,0,0.50)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
            }}
          />
        </div>
      </StepLayout>

      <BottomNav
        step={STEP}
        total={TOTAL}
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!canContinue}
      />
    </>
  );
}
