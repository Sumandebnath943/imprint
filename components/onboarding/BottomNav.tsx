"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface BottomNavProps {
  step: number;
  total: number;
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  hideBack?: boolean;
}

export default function BottomNav({
  step,
  total,
  onBack,
  onContinue,
  continueLabel = "Continue →",
  continueDisabled = false,
  hideBack = false,
}: BottomNavProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-12 py-5"
      style={{
        background: "rgba(8,8,8,0.90)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        fontFamily: "Space Grotesk, sans-serif",
      }}
    >
      {/* Back */}
      <div className="w-32">
        {!hideBack && onBack && (
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 h-10 px-5 rounded-pill text-sm transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.60)" }}
          >
            <ArrowLeft size={14} />
            Back
          </motion.button>
        )}
      </div>

      {/* Step indicator */}
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
        Step {step} of {total}
      </p>

      {/* Continue */}
      <div className="w-48 flex justify-end">
        <motion.button
          onClick={onContinue}
          disabled={continueDisabled}
          whileHover={continueDisabled ? {} : { scale: 1.02 }}
          whileTap={continueDisabled ? {} : { scale: 0.97 }}
          className="h-10 px-6 rounded-pill text-sm font-medium text-white transition-all"
          style={{
            background: continueDisabled ? "rgba(255,85,0,0.30)" : "#FF5500",
            boxShadow: continueDisabled ? "none" : "0 0 20px rgba(255,85,0,0.25)",
            cursor: continueDisabled ? "not-allowed" : "pointer",
          }}
        >
          {continueLabel}
        </motion.button>
      </div>
    </div>
  );
}
