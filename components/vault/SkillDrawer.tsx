"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { VaultSkill } from "@/lib/vault/types";
import { getStrengthColor } from "@/lib/vault/types";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface SkillDrawerProps {
  skill: VaultSkill | null;
  decayedStrength: number;
  onClose: () => void;
  onGenerateChallenge: (skill: VaultSkill) => void;
}

function StrengthRing({ strength, color }: { strength: number; color: string }) {
  const r = 50, circ = 2 * Math.PI * r;
  const fill = (strength / 100) * circ;
  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      <circle cx={60} cy={60} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
      <circle cx={60} cy={60} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 60 60)" style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x={60} y={66} textAnchor="middle" fill={color} fontSize={22} fontWeight={700}>{strength}%</text>
    </svg>
  );
}

export default function SkillDrawer({ skill, decayedStrength, onClose, onGenerateChallenge }: SkillDrawerProps) {
  const router = useRouter();
  const color = skill ? getStrengthColor(decayedStrength) : "#FF5500";

  const [realHistory, setRealHistory] = useState<{ date: string; type: string; completed: boolean }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!skill) return;
    const currentSkill = skill;
    
    async function loadHistory() {
      setLoadingHistory(true);
      const supabase = createClient();
      try {
        const [challengesRes, practicesRes] = await Promise.all([
          supabase
            .from("vault_challenges")
            .select("completed_at, strength_gained")
            .eq("skill_id", currentSkill.id)
            .eq("status", "completed"),
          supabase
            .from("journal_entries")
            .select("created_at")
            .eq("is_forge_entry", true)
            .contains("drift_signals", { practiced_skill_id: currentSkill.id })
        ]);

        const combined = [];
        if (challengesRes.data) {
          for (const c of challengesRes.data) {
            combined.push({ date: c.completed_at, type: "Vault Challenge", completed: true });
          }
        }
        if (practicesRes.data) {
          for (const p of practicesRes.data) {
            combined.push({ date: p.created_at, type: "Practice Session", completed: true });
          }
        }

        combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRealHistory(combined);
      } catch (e) {
        console.error("Error loading history", e);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, [skill]);

  return (
    <AnimatePresence>
      {skill && (
        <>
          {/* Backdrop */}
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.50)" }}
            onClick={onClose} />

          {/* Drawer */}
          <motion.div key="drawer"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-y-auto"
            style={{ width: 400, background: "#0D0D0D", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>

            {/* Header */}
            <div className="p-6 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-bold text-white mb-1" style={{ fontSize: 22 }}>{skill.skill_name}</h2>
                  <span className="text-xs rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.66)", padding: "3px 10px" }}>
                    {skill.cluster.replace(/_/g, " ")}
                  </span>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
                  <X size={16} style={{ color: "rgba(255,255,255,0.50)" }} />
                </button>
              </div>
              {/* Strength ring */}
              <div className="flex flex-col items-center gap-2">
                <StrengthRing strength={decayedStrength} color={color} />
                <p className="text-sm font-medium" style={{ color }}>Self-rating</p>
              </div>
            </div>

            <div className="flex-1 p-6 flex flex-col gap-6">
              {/* Challenge history */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.58)" }}>Practice & Challenge History</p>
                <div className="flex flex-col gap-2">
                  {loadingHistory ? (
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.58)" }}>Loading...</p>
                  ) : realHistory.length > 0 ? (
                    realHistory.map((item, i) => {
                      const d = new Date(item.date);
                      return (
                        <div key={i} className="flex items-center justify-between py-2"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <div>
                            <p className="text-xs text-white">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>{item.type}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.completed
                              ? <>
                                  <span className="text-xs" style={{ color: "#00D97E" }}>✓ Completed</span>
                                </>
                              : <>
                                  <span className="text-xs" style={{ color: "#FF2D2D" }}>✗ Missed</span>
                                </>
                            }
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.58)" }}>No challenges or practices completed yet.</p>
                  )}
                </div>
                {skill.times_practiced > 0 && (
                  <div className="mt-3">
                    <span className="text-xs rounded-full px-3 py-1" style={{
                      background: "rgba(0,217,126,0.10)", border: "1px solid rgba(0,217,126,0.20)", color: "#00D97E"
                    }}>
                      {Math.round(Math.min(100, (skill.times_practiced / Math.max(1, skill.times_practiced + 2)) * 100))}% completion rate
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky bottom actions */}
            <div className="p-6 flex flex-col gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => router.push(`/dashboard/forge?practice_skill_id=${skill.id}&practice_skill_name=${encodeURIComponent(skill.skill_name)}`)}
                className="w-full rounded-full h-11 text-sm font-medium text-on-accent"
                style={{ background: "#FF5500" }}>
                Practice in Forge
              </button>
              <button onClick={() => { onGenerateChallenge(skill); onClose(); }}
                className="w-full rounded-full h-11 text-sm font-medium transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.70)" }}>
                Generate Challenge
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
