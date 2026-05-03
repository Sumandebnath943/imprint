"use client";

import { motion } from "framer-motion";
import type { MirrorMessage as MirrorMessageType } from "@/lib/mirror/types";

// ── Typing indicator ────────────────────────────────────────────────────
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 max-w-[75%]">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "rgba(255,120,50,0.12)", border: "1px solid rgba(255,120,50,0.25)" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="rgba(255,120,50,0.80)" strokeWidth="1" />
          <circle cx="7" cy="7" r="2" stroke="rgba(255,120,50,0.50)" strokeWidth="1" />
        </svg>
      </div>
      <div>
        <p className="text-xs mb-1.5 uppercase tracking-wide" style={{ color: "rgba(255,120,50,0.60)", fontSize: 10 }}>THE MIRROR</p>
        <div className="rounded-[4px_16px_16px_16px] px-5 py-4 flex items-center gap-1.5"
          style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.06)" }}>
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: "rgba(255,120,50,0.60)" }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.8, delay: i * 0.18, repeat: Infinity, ease: "easeInOut" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Mirror message bubble ────────────────────────────────────────────────
function MirrorBubble({ msg }: { msg: MirrorMessageType }) {
  const time = new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return (
    <motion.div className="flex items-end gap-3 max-w-[75%]"
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "rgba(255,120,50,0.12)", border: "1px solid rgba(255,120,50,0.25)" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="rgba(255,120,50,0.80)" strokeWidth="1" />
          <circle cx="7" cy="7" r="2" stroke="rgba(255,120,50,0.50)" strokeWidth="1" />
        </svg>
      </div>
      <div>
        <p className="text-xs mb-1.5 uppercase tracking-wide" style={{ color: "rgba(255,120,50,0.60)", fontSize: 10 }}>THE MIRROR</p>
        <div className="rounded-[4px_16px_16px_16px] px-5 py-4"
          style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="italic" style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", lineHeight: 1.7 }}>
            {msg.content}
          </p>
        </div>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.20)" }}>{time}</p>
      </div>
    </motion.div>
  );
}

// ── User message bubble ──────────────────────────────────────────────────
function UserBubble({ msg }: { msg: MirrorMessageType }) {
  const time = new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return (
    <motion.div className="flex flex-col items-end self-end max-w-[75%]"
      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}>
      <div className="rounded-[16px_4px_16px_16px] px-5 py-4"
        style={{ background: "rgba(255,85,0,0.08)", border: "1px solid rgba(255,85,0,0.15)" }}>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.80)", lineHeight: 1.7 }}>{msg.content}</p>
      </div>
      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.20)" }}>{time}</p>
    </motion.div>
  );
}

// ── System / flag message ────────────────────────────────────────────────
function SystemBubble({ msg }: { msg: MirrorMessageType }) {
  return (
    <motion.div className="text-center w-full px-8"
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      <div className="rounded-[10px] px-5 py-2.5 inline-block"
        style={{ background: "rgba(255,184,0,0.06)", border: "1px solid rgba(255,184,0,0.20)" }}>
        <p className="italic" style={{ fontSize: 13, color: "rgba(255,184,0,0.80)" }}>{msg.content}</p>
      </div>
    </motion.div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────
export default function MirrorMessageBubble({ msg }: { msg: MirrorMessageType }) {
  if (msg.role === "mirror") return <MirrorBubble msg={msg} />;
  if (msg.role === "user") return <UserBubble msg={msg} />;
  return <SystemBubble msg={msg} />;
}
