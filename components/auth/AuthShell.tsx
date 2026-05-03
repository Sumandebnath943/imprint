"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
  topRightSlot: ReactNode;
}

export default function AuthShell({ children, topRightSlot }: AuthShellProps) {
  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{
        background: "#F5F0EB",
        fontFamily: "Space Grotesk, sans-serif",
      }}
    >
      {/* ── Background Orbs ──────────────────────────────────────────── */}
      <motion.div
        className="absolute pointer-events-none hidden sm:block"
        style={{
          width: 500,
          height: 500,
          top: "-120px",
          right: "-100px",
          background:
            "radial-gradient(circle, rgba(255,122,48,0.35) 0%, transparent 70%)",
          filter: "blur(60px)",
          borderRadius: "50%",
        }}
        animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute pointer-events-none hidden sm:block"
        style={{
          width: 300,
          height: 300,
          bottom: "-80px",
          left: "-60px",
          background:
            "radial-gradient(circle, rgba(255,85,0,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
          borderRadius: "50%",
        }}
      />

      {/* ── Ghost text ───────────────────────────────────────────────── */}
      <div
        className="absolute pointer-events-none select-none hidden sm:block"
        style={{
          fontSize: 180,
          fontWeight: 700,
          color: "#1A1A1A",
          opacity: 0.04,
          whiteSpace: "nowrap",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 0,
        }}
      >
        IMPRINT
      </div>

      {/* ── Top-left wordmark ────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 z-20 p-6">
        <Link
          href="/"
          className="flex items-center gap-0.5 group"
        >
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: "#1A1A1A" }}
          >
            IMPRINT
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full mb-2.5 ml-0.5"
            style={{
              background: "#FF5500",
              boxShadow: "0 0 6px rgba(255,85,0,0.7)",
            }}
          />
        </Link>
      </div>

      {/* ── Top-right link ───────────────────────────────────────────── */}
      <div className="fixed top-0 right-0 z-20 p-6">
        <div className="text-sm" style={{ color: "rgba(0,0,0,0.50)" }}>
          {topRightSlot}
        </div>
      </div>

      {/* ── Card ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full px-4 py-24">
        {children}
      </div>
    </div>
  );
}
