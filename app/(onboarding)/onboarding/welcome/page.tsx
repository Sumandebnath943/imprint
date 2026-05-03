"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, X } from "lucide-react";
import { useOnboardingStore } from "@/lib/store/onboarding.store";

export default function WelcomePage() {
  const router = useRouter();
  const { setStep } = useOnboardingStore();

  const handleContinue = () => {
    setStep(2);
    router.push("/onboarding/who-are-you");
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 py-32">
      {/* Ghost word */}
      <div
        className="absolute select-none pointer-events-none"
        style={{
          fontSize: 180,
          fontWeight: 700,
          color: "#FFFFFF",
          opacity: 0.03,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
          letterSpacing: "-0.04em",
          zIndex: 0,
        }}
      >
        IDENTITY
      </div>

      <div className="relative z-10 max-w-[720px] w-full mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <span
            className="inline-flex items-center px-4 py-2 rounded-pill text-xs font-medium uppercase tracking-widest"
            style={{ background: "rgba(255,85,0,0.15)", border: "1px solid rgba(255,85,0,0.30)", color: "#FF5500" }}
          >
            Your journey begins here
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <h1 className="font-bold leading-[0.95]" style={{ fontSize: "clamp(40px,6vw,64px)" }}>
            <span className="text-white block">Before we begin,</span>
            <span style={{ color: "#FF5500" }}>a promise.</span>
          </h1>
        </motion.div>

        {/* Body */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="leading-[1.8] mb-12"
          style={{ fontSize: 18, color: "rgba(255,255,255,0.60)", maxWidth: 560 }}
        >
          IMPRINT will never write for you. Never think for you. Never replace you. Everything you do here is raw, unassisted, and entirely yours.
          <br /><br />
          What you&apos;re about to create is your Baseline Imprint — a living fingerprint of your authentic mind. It will take 12 minutes. It will ask things of you that no app has ever asked before.
          <br /><br />
          <span className="text-white font-medium">This is not onboarding. This is a declaration.</span>
        </motion.p>

        {/* Two cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12"
        >
          {/* What IMPRINT does */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="mb-4">
              <Shield size={22} style={{ color: "#FF5500" }} />
            </div>
            <p className="font-medium text-white mb-4" style={{ fontSize: 16 }}>
              What IMPRINT does
            </p>
            <ul className="space-y-2">
              {[
                "Measures your authentic identity over time",
                "Protects your skills from AI dependency",
                "Reflects your thinking back at you",
                "Alerts you when you start to drift",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.60)", lineHeight: 2 }}>
                  <span style={{ color: "#FF5500", flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* What IMPRINT never does */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="mb-4">
              <X size={22} style={{ color: "rgba(255,255,255,0.30)" }} />
            </div>
            <p className="font-medium text-white mb-4" style={{ fontSize: 16 }}>
              What IMPRINT never does
            </p>
            <ul className="space-y-2">
              {[
                "Write, think, or decide for you",
                "Share your data with anyone",
                "Judge your intelligence or skill level",
                "Use AI to evaluate your responses",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.50)", lineHeight: 2 }}>
                  <span style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center"
        >
          <motion.button
            onClick={handleContinue}
            whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(255,85,0,0.35)" }}
            whileTap={{ scale: 0.97 }}
            className="h-14 px-10 rounded-pill text-white font-medium text-base"
            style={{ background: "#FF5500", boxShadow: "0 0 24px rgba(255,85,0,0.25)" }}
          >
            I&apos;m ready. Let&apos;s begin.
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom spacer for nav */}
      <div className="h-24" />
    </div>
  );
}
