"use client";

import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import type { VaultSkill, VaultChallenge } from "@/lib/vault/types";
import { getStrengthColor, getDaysSinceExercised } from "@/lib/vault/types";

// ── Summary Stats Row ────────────────────────────────────────────────────

interface SummaryStatsProps {
  skills: VaultSkill[];
  decayedStrengths: Record<string, number>;
}

export function VaultSummaryStats({ skills, decayedStrengths }: SummaryStatsProps) {
  const total = skills.length;
  const avg = total > 0
    ? Math.round(Object.values(decayedStrengths).reduce((s, v) => s + v, 0) / total)
    : 0;
  const decaying = skills.filter((s) => (decayedStrengths[s.id] ?? s.strength_level) < 50).length;
  const avgColor = getStrengthColor(avg);

  const lastDays = skills.length > 0
    ? Math.min(...skills.map((s) => getDaysSinceExercised(s.last_exercised)))
    : null;
  const lastLabel = lastDays === null ? "—" : lastDays === 0 ? "Today" : `${lastDays}d ago`;

  const cards = [
    {
      value: String(total),
      label: "Skills tracked",
      sub: total > 0 ? `${total} in your vault` : "Add your first skill",
      subColor: "rgba(255,85,0,0.70)",
      valueColor: "white",
    },
    {
      value: `${avg}%`,
      label: "Average strength",
      bar: avg,
      valueColor: avgColor,
      sub: null,
    },
    {
      value: String(decaying),
      label: "Need attention",
      sub: decaying > 0 ? "Practice these this week" : "All skills healthy",
      subColor: decaying > 0 ? "#FFB800" : "#00D97E",
      valueColor: decaying > 0 ? "#FF2D2D" : "#00D97E",
    },
    {
      value: lastLabel,
      label: "Last vault session",
      sub: `${skills.filter((s) => getDaysSinceExercised(s.last_exercised) === 0).length} practiced today`,
      subColor: "rgba(255,255,255,0.30)",
      valueColor: "white",
      smallValue: true,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
      {cards.map((c, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="rounded-2xl p-5"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="font-bold mb-0.5" style={{ fontSize: c.smallValue ? 24 : 36, color: c.valueColor, lineHeight: 1 }}>
            {c.value}
          </p>
          {c.bar !== undefined && (
            <div className="w-full h-1 rounded-full my-2" style={{ background: "rgba(255,255,255,0.08)" }}>
              <motion.div className="h-full rounded-full" style={{ background: getStrengthColor(c.bar) }}
                initial={{ width: 0 }} animate={{ width: `${c.bar}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }} />
            </div>
          )}
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>{c.label}</p>
          {c.sub && <p className="text-xs mt-1" style={{ color: c.subColor }}>{c.sub}</p>}
        </motion.div>
      ))}
    </div>
  );
}

// ── Active Challenge Banner ───────────────────────────────────────────────

interface ChallengeBannerProps {
  challenge: VaultChallenge;
  onBegin: () => void;
}

export function VaultChallengeBanner({ challenge, onBegin }: ChallengeBannerProps) {
  const daysUntilDue = Math.ceil(
    (new Date(challenge.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isToday = daysUntilDue <= 0;
  const isTomorrow = daysUntilDue === 1;

  const dueBadgeStyle = isToday
    ? { bg: "rgba(255,45,45,0.15)", border: "rgba(255,45,45,0.30)", color: "#FF2D2D" }
    : isTomorrow
    ? { bg: "rgba(255,184,0,0.15)", border: "rgba(255,184,0,0.30)", color: "#FFB800" }
    : { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.50)" };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="flex items-center justify-between rounded-2xl mb-6"
      style={{
        background: "rgba(255,85,0,0.06)", border: "1px solid rgba(255,85,0,0.25)",
        borderLeft: isToday ? "3px solid #FF2D2D" : "1px solid rgba(255,85,0,0.25)",
        padding: "20px 28px",
        boxShadow: isToday ? "inset 0 0 20px rgba(255,45,45,0.05)" : "none",
      }}>
      <div className="flex-1 min-w-0 pr-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#FF5500" }}>
          Active Vault Challenge
        </p>
        <p className="font-semibold text-white mb-1" style={{ fontSize: 20 }}>{challenge.challenge_title}</p>
        <p className="text-sm mb-3 max-w-2xl" style={{ color: "rgba(255,255,255,0.50)", lineHeight: 1.6 }}>
          {challenge.challenge_description}
        </p>
        <div className="flex items-center gap-2">
          {challenge.skill_name && (
            <span className="text-xs rounded-full px-3 py-1"
              style={{ background: "rgba(255,85,0,0.12)", border: "1px solid rgba(255,85,0,0.25)", color: "#FF5500" }}>
              {challenge.skill_name}
            </span>
          )}
          <span className="text-xs rounded-full px-3 py-1"
            style={{ background: dueBadgeStyle.bg, border: `1px solid ${dueBadgeStyle.border}`, color: dueBadgeStyle.color }}>
            {isToday ? "Due today" : isTomorrow ? "Due tomorrow" : `Due ${new Date(challenge.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-4 shrink-0">
        <div className="flex items-center gap-1.5">
          <ArrowUp size={14} style={{ color: "#00D97E" }} />
          <span className="text-sm font-semibold" style={{ color: "#00D97E" }}>
            +{challenge.strength_gained} strength on completion
          </span>
        </div>
        <button onClick={onBegin}
          className="rounded-full h-9 px-5 text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: "#FF5500" }}>
          Begin Challenge →
        </button>
      </div>
    </motion.div>
  );
}
