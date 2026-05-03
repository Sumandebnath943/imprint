"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, PlusCircle } from "lucide-react";
import type { VaultSkill } from "@/lib/vault/types";
import { SUGGESTED_SKILLS } from "@/lib/vault/types";

interface AddSkillPanelProps {
  userCluster: string;
  existingSkills: VaultSkill[];
  onAdd: (name: string, strength: number) => Promise<void>;
}

export function AddSkillPanel({ userCluster, existingSkills, onAdd }: AddSkillPanelProps) {
  const [open, setOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [strength, setStrength] = useState(60);
  const [adding, setAdding] = useState(false);

  const existingNames = new Set(existingSkills.map((s) => s.skill_name.toLowerCase()));
  const suggested = (SUGGESTED_SKILLS[userCluster] ?? SUGGESTED_SKILLS.life_personal)
    .filter((s) => !existingNames.has(s.toLowerCase()));

  const clusterLabel = userCluster.replace(/_/g, " ");

  const handleAdd = async (name: string, str: number) => {
    if (!name.trim() || adding) return;
    setAdding(true);
    await onAdd(name.trim(), str);
    setCustomName("");
    setStrength(60);
    setAdding(false);
  };

  return (
    <div className="mt-4">
      {/* Toggle */}
      <button onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 transition-colors duration-150 group"
        style={{ color: "rgba(255,255,255,0.40)" }}
        onMouseOver={(e) => (e.currentTarget as HTMLElement).style.color = "white"}
        onMouseOut={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.40)"}>
        <PlusCircle size={16} />
        <span style={{ fontSize: 16 }}>Add a skill to your Vault</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} />
        </motion.div>
      </button>

      {/* Expandable */}
      <AnimatePresence>
        {open && (
          <motion.div key="add-panel"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}>
            <div className="mt-4 rounded-2xl p-7" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              {/* Suggested */}
              {suggested.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#FF5500" }}>
                    Suggested for {clusterLabel}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggested.map((s) => (
                      <button key={s} onClick={() => handleAdd(s, 60)}
                        className="rounded-full text-xs transition-all hover:border-orange-500/30 hover:text-orange-400"
                        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.70)", padding: "7px 14px" }}>
                        + {s}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs italic mt-3" style={{ color: "rgba(255,255,255,0.30)" }}>
                    These are human skills AI is actively replacing in your field.
                  </p>
                </div>
              )}

              {/* Custom skill */}
              <div className="flex items-end gap-4 flex-wrap">
                <div className="flex-1" style={{ minWidth: 200 }}>
                  <label className="text-xs mb-2 block" style={{ color: "rgba(255,255,255,0.40)" }}>Skill name</label>
                  <input value={customName} onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Public speaking"
                    className="w-full outline-none text-sm"
                    style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "white" }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAdd(customName, strength); }}
                  />
                </div>
                <div style={{ minWidth: 160 }}>
                  <label className="text-xs mb-2 block" style={{ color: "rgba(255,255,255,0.40)" }}>
                    Current strength: <span style={{ color: "#FF5500" }}>{strength}%</span>
                  </label>
                  <input type="range" min={0} max={100} value={strength} onChange={(e) => setStrength(parseInt(e.target.value))}
                    className="w-full accent-orange-500" style={{ height: 4 }} />
                </div>
                <button onClick={() => handleAdd(customName, strength)} disabled={!customName.trim() || adding}
                  className="rounded-full h-10 px-6 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "#FF5500", whiteSpace: "nowrap" }}>
                  {adding ? "Adding..." : "Add to Vault"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Vault History ─────────────────────────────────────────────────────────

import type { VaultHistoryRow } from "@/lib/vault/types";
import { ArrowUp, ArrowDown } from "lucide-react";

interface VaultHistoryProps {
  history: VaultHistoryRow[];
}

export function VaultHistory({ history }: VaultHistoryProps) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(10);

  if (history.length === 0) return null;

  const statusBadge = (status: string) => {
    if (status === "completed") return <span className="text-xs rounded-full px-2 py-0.5" style={{ background: "rgba(0,217,126,0.12)", color: "#00D97E" }}>✓ Completed</span>;
    if (status === "missed")    return <span className="text-xs rounded-full px-2 py-0.5" style={{ background: "rgba(255,45,45,0.12)", color: "#FF2D2D" }}>✗ Missed</span>;
    return <span className="text-xs rounded-full px-2 py-0.5" style={{ background: "rgba(255,184,0,0.12)", color: "#FFB800" }}>In Progress</span>;
  };

  return (
    <div className="mt-8">
      <button onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-3 w-full text-left mb-4">
        <span className="font-semibold text-white" style={{ fontSize: 16 }}>Vault History</span>
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>{history.length} sessions total</span>
        <motion.div className="ml-auto" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.40)" }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div key="history" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Date", "Skill", "Type", "Result", "Strength Δ"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3"
                        style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, shown).map((row, i) => (
                    <tr key={row.id}
                      style={{ background: i % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.60)" }}>
                        {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-xs text-white">{row.skill_name}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>{row.challenge_type?.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">{statusBadge(row.status)}</td>
                      <td className="px-4 py-3 text-xs">
                        {row.strength_change > 0
                          ? <span className="flex items-center gap-1" style={{ color: "#00D97E" }}><ArrowUp size={10} />+{row.strength_change}</span>
                          : <span className="flex items-center gap-1" style={{ color: "#FF2D2D" }}><ArrowDown size={10} />{row.strength_change}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {shown < history.length && (
              <div className="flex justify-center mt-4">
                <button onClick={() => setShown((p) => p + 10)}
                  className="rounded-full h-9 px-6 text-sm transition-all hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)" }}>
                  Load more
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
