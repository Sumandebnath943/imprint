"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { DashboardSkill } from "@/lib/dashboard/types";
import { getSkillColor } from "@/lib/dashboard/types";
import { getDaysSinceExercised, getRelativeTime, isPracticeOverdue } from "@/lib/vault/types";

interface SkillsRowProps { skills: DashboardSkill[]; }

export default function SkillsRow({ skills }: SkillsRowProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white" style={{ fontSize: 18 }}>Skill Vault</h3>
        <Link href="/dashboard/vault" className="text-sm font-medium" style={{ color: "#FF5500" }}>View All →</Link>
      </div>
      {skills.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.66)" }}>No skills tracked yet.</p>
          <Link href="/dashboard/vault" className="text-sm" style={{ color: "#FF5500" }}>Add your first skill →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {skills.slice(0, 4).map((skill, i) => {
            const color = getSkillColor(skill.strength_level);
            const overdue = isPracticeOverdue(getDaysSinceExercised(skill.last_exercised));
            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                className="rounded-2xl p-5 transition-all duration-200"
                style={{
                  background: "#111111",
                  border: `1px solid ${overdue ? "rgba(255,45,45,0.25)" : "rgba(255,255,255,0.07)"}`,
                  borderLeft: overdue ? "2px solid #FF2D2D" : undefined,
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <p className="font-medium text-white" style={{ fontSize: 15 }}>{skill.skill_name}</p>
                  <span className="font-semibold text-xs" style={{ color }}>{skill.strength_level}% self-rating</span>
                </div>
                <div className="w-full h-1.5 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: color }}
                    initial={{ width: "0%" }} animate={{ width: `${skill.strength_level}%` }}
                    transition={{ duration: 1.0, delay: 0.3 + i * 0.08 }} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.58)" }}>
                    {getRelativeTime(skill.last_exercised)}
                  </p>
                  {overdue && (
                    <span className="text-xs rounded-full px-2 py-0.5"
                      style={{ background: "rgba(255,45,45,0.15)", border: "1px solid rgba(255,45,45,0.30)", color: "#FF2D2D" }}>
                      Practice overdue
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
