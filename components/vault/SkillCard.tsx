"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import type { VaultSkill } from "@/lib/vault/types";
import {
  getStrengthColor, getStrengthLabel, getDecayStatus,
  getRelativeTime, getDaysSinceExercised,
} from "@/lib/vault/types";

interface SkillCardProps {
  skill: VaultSkill;
  decayedStrength: number;
  hasActiveChallenge: boolean;
  onDetails: (skill: VaultSkill) => void;
  onGenerateChallenge: (skill: VaultSkill) => void;
  index: number;
}

export default function SkillCard({ skill, decayedStrength, hasActiveChallenge, onDetails, onGenerateChallenge, index }: SkillCardProps) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();

  const color = getStrengthColor(decayedStrength);
  const label = getStrengthLabel(decayedStrength);
  const daysSince = getDaysSinceExercised(skill.last_exercised);
  const decayStatus = getDecayStatus(daysSince);
  const isCritical = decayedStrength < 25;
  const isDecaying = daysSince > 5;
  const practicedToday = daysSince === 0;
  const dots = Array.from({ length: 7 }, (_, i) => i < Math.min(skill.times_practiced, 7));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onDetails(skill)}
      className="relative overflow-hidden cursor-pointer"
      style={{
        background: "#111111",
        border: isCritical ? "1px solid rgba(255,45,45,0.20)" : "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: isCritical ? "0 0 30px rgba(255,45,45,0.08)" : hovered ? "0 0 30px rgba(255,85,0,0.05)" : "none",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "all 200ms ease",
      }}
    >
      {/* Left edge accent */}
      <div className="absolute left-0 top-0 bottom-0 rounded-tl-2xl rounded-bl-2xl" style={{ width: 3, background: color }} />

      {/* Challenge active ribbon */}
      {hasActiveChallenge && (
        <div className="absolute top-0 right-0 text-white text-xs font-semibold"
          style={{ background: "#FF5500", padding: "4px 10px", borderRadius: "0 16px 0 8px", fontSize: 10 }}>
          CHALLENGE ACTIVE
        </div>
      )}

      {/* Top row */}
      <div className="flex items-start justify-between mb-1">
        <p className="font-semibold text-white pr-2" style={{ fontSize: 16, lineHeight: 1.3 }}>{skill.skill_name}</p>
        <span className="rounded-full text-xs font-semibold shrink-0"
          style={{ background: `${color}26`, border: `1px solid ${color}59`, color, padding: "3px 10px" }}>
          {decayedStrength}%
        </span>
      </div>

      {/* Cluster badge */}
      <span className="text-xs rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.30)", padding: "2px 8px" }}>
        {skill.cluster.replace(/_/g, " ")}
      </span>

      {/* Strength bar */}
      <div className="my-4 relative" style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 100, overflow: "hidden" }}>
        <motion.div className="absolute inset-y-0 left-0 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${decayedStrength}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: index * 0.05 + 0.2 }}
          style={{
            background: isDecaying
              ? `repeating-linear-gradient(45deg, ${color}, ${color} 4px, rgba(0,0,0,0.25) 4px, rgba(0,0,0,0.25) 8px)`
              : color,
          }}
        />
        {/* Practiced today shimmer */}
        {practicedToday && (
          <motion.div className="absolute inset-0" style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }}
            animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: 1, ease: "easeInOut" }} />
        )}
      </div>

      {/* Decay indicator row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          Last practiced: {getRelativeTime(skill.last_exercised)}
        </span>
        <span className="text-xs font-medium" style={{ color: decayStatus.color }}>{decayStatus.label}</span>
      </div>

      {/* Times practiced + dots */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{skill.times_practiced} sessions completed</span>
        <div className="flex gap-1">
          {dots.map((filled, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: filled ? "#FF5500" : "rgba(255,255,255,0.12)" }} />
          ))}
        </div>
      </div>

      {/* Critical warning */}
      {isCritical && (
        <div className="mt-3 -mx-6 px-6 py-2" style={{ background: "rgba(255,45,45,0.08)", borderTop: "1px solid rgba(255,45,45,0.15)" }}>
          <p className="text-xs text-center" style={{ color: "#FF2D2D" }}>This skill is in critical decay. Practice today.</p>
        </div>
      )}

      {/* Hover actions */}
      <AnimatePresence>
        {hovered && (
          <motion.div key="actions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => router.push(`/dashboard/forge?practice_skill_id=${skill.id}&practice_skill_name=${encodeURIComponent(skill.skill_name)}`)}
              className="rounded-full text-xs font-medium transition-all hover:opacity-90"
              style={{ background: "rgba(255,85,0,0.15)", border: "1px solid rgba(255,85,0,0.30)", color: "#FF5500", padding: "5px 12px" }}>
              Practice Now
            </button>
            <button onClick={() => onGenerateChallenge(skill)}
              className="rounded-full text-xs font-medium transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.60)", padding: "5px 12px" }}>
              Challenge
            </button>
            <button onClick={() => onDetails(skill)}
              className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.35)" }}>
              Details →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
