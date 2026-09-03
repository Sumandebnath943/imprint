import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden" style={{ background: "#080808" }}>
      <span
        aria-hidden
        className="absolute select-none pointer-events-none font-bold leading-none"
        style={{ fontSize: "clamp(180px, 34vw, 420px)", color: "#fff", opacity: 0.03 }}
      >
        404
      </span>

      <div className="relative z-10 max-w-[520px]">
        <p className="text-[12px] uppercase tracking-[0.25em] mb-4" style={{ color: "#FF5500" }}>
          Nothing imprinted here
        </p>
        <h1 className="text-white font-light text-[34px] md:text-[44px] leading-tight tracking-tight mb-4">
          This page doesn&apos;t exist.
        </h1>
        <p className="text-[15px] leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.72)" }}>
          The link may be broken, or the credential you&apos;re looking for was
          set back to private by its owner.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="px-8 py-3 rounded-full text-[14px] font-medium text-white transition-all hover:opacity-90"
            style={{ background: "#FF5500" }}
          >
            Back to home
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3 rounded-full text-[14px] font-medium text-white border border-white/20 transition-all hover:bg-white/5"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
