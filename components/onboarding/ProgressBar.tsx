"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  step: number;
  total: number;
}

export default function ProgressBar({ step, total }: ProgressBarProps) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2px]" style={{ background: "rgba(255,255,255,0.08)" }}>
      <motion.div
        className="h-full"
        style={{ background: "#FF5500", boxShadow: "0 0 8px rgba(255,85,0,0.6)" }}
        initial={{ width: "0%" }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
