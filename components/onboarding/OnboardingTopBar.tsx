"use client";

import Link from "next/link";

interface OnboardingTopBarProps {
  onSaveExit: () => void;
  step: number;
  total: number;
}

export default function OnboardingTopBar({ onSaveExit, step, total }: OnboardingTopBarProps) {
  return (
    <>
      <style>{`
        @keyframes ob-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
        .ob-pulse-dot { animation: ob-pulse 2s ease-in-out infinite; }
      `}</style>

      <header className="fixed top-[3px] left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-[#0b0b0c]/95 px-5 sm:px-8">
        {/* Wordmark */}
        <Link href="/" className="flex items-center">
          <span
            className="text-base font-bold text-white tracking-tight"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            IMPRINT
          </span>
          <span
            className="ob-pulse-dot w-1.5 h-1.5 rounded-full ml-0.5 mb-2.5 inline-block"
            style={{ background: "#FF5500", boxShadow: "0 0 6px rgba(255,85,0,0.8)" }}
          />
        </Link>

        <p className="text-sm font-medium text-white/75">Step {step} of {total}</p>

        {/* Save & Exit */}
        <button
          onClick={onSaveExit}
          className="text-xs transition-colors duration-200 hover:text-white"
          style={{ color: "rgba(255,255,255,0.66)", fontFamily: "Space Grotesk, sans-serif" }}
        >
          Save &amp; Exit
        </button>
      </header>
    </>
  );
}
