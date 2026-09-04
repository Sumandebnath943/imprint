"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, X } from "lucide-react";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import StepLayout from "@/components/onboarding/StepLayout";

const DOES = [
  "Measures your authentic identity over time",
  "Protects your skills from AI dependency",
  "Reflects your thinking back at you",
  "Alerts you when you start to drift",
];

const NEVER = [
  "Write, think, or decide for you",
  "Share your data with anyone",
  "Judge your intelligence or skill level",
  "Use AI to evaluate your responses",
];

export default function WelcomePage() {
  const router = useRouter();
  const { setStep } = useOnboardingStore();

  const handleContinue = () => {
    setStep(2);
    router.push("/onboarding/who-are-you");
  };

  return (
    <StepLayout
      ghost="IDENTITY"
      eyebrow="Your journey begins here"
      title={
        <>
          Before we begin,
          <br />
          <span style={{ color: "#FF5500" }}>a promise.</span>
        </>
      }
      description={
        <>
          IMPRINT will never write for you. Never think for you. Never replace
          you. Everything you do here is raw, unassisted, and entirely yours.
          <br />
          <br />
          What you&apos;re about to create is your Baseline Imprint — a living
          fingerprint of your authentic mind. It takes about 12 minutes.
          <br />
          <br />
          <span className="text-white font-medium">
            This is not onboarding. This is a declaration.
          </span>
        </>
      }
      aside={
        <motion.button
          onClick={handleContinue}
          whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(255,85,0,0.35)" }}
          whileTap={{ scale: 0.97 }}
          className="h-12 px-8 rounded-full text-on-accent font-medium text-[15px]"
          style={{
            background: "#FF5500",
            boxShadow: "0 0 24px rgba(255,85,0,0.25)",
          }}
        >
          I&apos;m ready. Let&apos;s begin.
        </motion.button>
      }
    >
      {/* The two panels sit beside the promise rather than under it, which is
          what lets the whole step fit without a scroll region. */}
      <div className="flex flex-col gap-3 lg:justify-center lg:h-full">
        <Panel
          icon={<Shield size={18} style={{ color: "#FF5500" }} />}
          title="What IMPRINT does"
          items={DOES}
          mark="✓"
          markColor="#FF5500"
          textColor="rgba(255,255,255,0.66)"
        />
        <Panel
          icon={<X size={18} style={{ color: "rgba(255,255,255,0.6)" }} />}
          title="What IMPRINT never does"
          items={NEVER}
          mark="✗"
          markColor="rgba(255,255,255,0.55)"
          textColor="rgba(255,255,255,0.58)"
        />
      </div>
    </StepLayout>
  );
}

function Panel({
  icon,
  title,
  items,
  mark,
  markColor,
  textColor,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  mark: string;
  markColor: string;
  textColor: string;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        {icon}
        <p className="font-medium text-white text-[15px]">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-[13px] leading-relaxed"
            style={{ color: textColor }}
          >
            <span style={{ color: markColor, flexShrink: 0 }}>{mark}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
