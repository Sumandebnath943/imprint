"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary. Without this, any thrown error in a page renders
 * the unstyled Next.js error screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "#080808" }}>
      <div className="max-w-[520px]">
        <p className="text-[12px] uppercase tracking-[0.25em] mb-4" style={{ color: "#FF5500" }}>
          Something drifted
        </p>
        <h1 className="text-white font-light text-[32px] md:text-[40px] leading-tight tracking-tight mb-4">
          We hit an unexpected error.
        </h1>
        <p className="text-[15px] leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.72)" }}>
          Your work is saved. Try again, and if it keeps happening, head back to
          the dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-8 py-3 rounded-full text-[14px] font-medium text-white transition-all hover:opacity-90"
            style={{ background: "#FF5500" }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-8 py-3 rounded-full text-[14px] font-medium text-white border border-white/20 transition-all hover:bg-white/5"
          >
            Back to dashboard
          </Link>
        </div>

        {error.digest ? (
          <p className="mt-8 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.50)" }}>
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
