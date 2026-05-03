"use client";

import Link from "next/link";

interface OnboardingTopBarProps {
  onSaveExit: () => void;
}

export default function OnboardingTopBar({ onSaveExit }: OnboardingTopBarProps) {
  return (
    <>
      <style>{`
        @keyframes ob-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
        .ob-pulse-dot { animation: ob-pulse 2s ease-in-out infinite; }
      `}</style>

      <div className="fixed top-2 left-0 right-0 z-40 flex items-center justify-between px-8 h-12">
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

        {/* Save & Exit */}
        <button
          onClick={onSaveExit}
          className="text-xs transition-colors duration-200 hover:text-white"
          style={{ color: "rgba(255,255,255,0.40)", fontFamily: "Space Grotesk, sans-serif" }}
        >
          Save &amp; Exit
        </button>
      </div>
    </>
  );
}
