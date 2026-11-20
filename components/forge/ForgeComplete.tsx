"use client";

import { motion } from "framer-motion";
import type { ForgeTool } from "@/lib/forge/types";
import { formatTime } from "@/lib/forge/types";
import ForgeMetrics from "./ForgeMetrics";

interface ForgeCompleteProps {
  tool: ForgeTool;
  content: string;
  elapsed: number;
  audioSaved?: boolean;
  fileSaved?: boolean;
  onReturn: () => void;
  onDashboard: () => void;
}

function Stat({ label, value, color = "white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", minWidth: 120 }}>
      <span className="font-bold" style={{ fontSize: 32, color, fontFamily: "'Courier New', monospace" }}>{value}</span>
      <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.66)" }}>{label}</span>
    </div>
  );
}

const isTextTool = (t: ForgeTool) =>
  t === "free-write" || t === "timed-write" || t === "memory-recall" || t === "vault-challenge";

export default function ForgeComplete({
  tool, content, elapsed, audioSaved, fileSaved,
  onReturn, onDashboard,
}: ForgeCompleteProps) {
  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-8 overflow-y-auto"
      style={{ background: "rgba(4,4,4,0.97)", backdropFilter: "blur(20px)" }}
    >
      {/* Icon */}
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,85,0,0.15)", border: "2px solid rgba(255,85,0,0.40)" }}>
          <motion.div
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity }}>
            <div className="w-4 h-4 rounded-full" style={{ background: "#FF5500", boxShadow: "0 0 20px rgba(255,85,0,0.8)" }} />
          </motion.div>
        </div>
      </motion.div>

      {/* Headline */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
        <h2 className="font-bold" style={{ fontSize: 40, lineHeight: 1.1 }}>
          <span className="text-white">Session </span>
          <span style={{ color: "#FF5500" }}>complete.</span>
        </h2>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="flex gap-4 flex-wrap justify-center">
        {isTextTool(tool) ? (
          <div className="w-full min-w-[280px]"><ForgeMetrics content={content} elapsed={elapsed} /></div>
        ) : tool === "voice-note" ? (
          <>
            <Stat label="Duration" value={formatTime(elapsed)} color="#FF5500" />
            <Stat label="Recording" value={audioSaved ? "✓ Saved" : "—"} color="#00D97E" />
          </>
        ) : (
          <>
            <Stat label="File Saved" value={fileSaved ? "✓" : "—"} color="#00D97E" />
            <Stat label="Gallery" value="Added ✓" color="#00D97E" />
          </>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
        className="flex gap-4">
        <button onClick={onReturn}
          className="rounded-full h-11 px-7 text-sm font-medium transition-all hover:bg-white/5"
          style={{ border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.70)" }}>
          Return to Forge
        </button>
        <button onClick={onDashboard}
          className="rounded-full h-11 px-7 text-sm font-medium text-on-accent"
          style={{ background: "#FF5500" }}>
          Go to Dashboard
        </button>
      </motion.div>
    </motion.div>
  );
}
