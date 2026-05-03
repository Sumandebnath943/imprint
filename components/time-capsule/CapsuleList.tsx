"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Unlock, Plus } from "lucide-react";

export interface TimeCapsule {
  id: string; user_id: string; title: string; content: string;
  unlock_date: string; is_unlocked: boolean;
  drift_score_at_writing?: number; created_at: string;
}

export function capsuleIsUnlocked(c: TimeCapsule) { return new Date(c.unlock_date) <= new Date(); }
export function daysRemaining(unlockDate: string) {
  return Math.max(0, Math.ceil((new Date(unlockDate).getTime() - Date.now()) / 86400000));
}
export function progressPct(c: TimeCapsule) {
  const total = new Date(c.unlock_date).getTime() - new Date(c.created_at).getTime();
  const elapsed = Date.now() - new Date(c.created_at).getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}
export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface CapsuleListProps {
  capsules: TimeCapsule[];
  selectedId: string | null;
  onSelect: (c: TimeCapsule) => void;
  onNew: () => void;
}

export default function CapsuleList({ capsules, selectedId, onSelect, onNew }: CapsuleListProps) {
  const [currentTab, setCurrentTab] = useState<"locked" | "unlocked">("locked");

  const locked = capsules.filter((c) => !capsuleIsUnlocked(c));
  const unlocked = capsules.filter((c) => capsuleIsUnlocked(c));
  const list = currentTab === "locked" ? locked : unlocked;

  return (
    <div className="flex flex-col h-full" style={{ width: 300, minWidth: 300, borderRight: "1px solid rgba(255,255,255,0.06)", background: "#0D0D0D" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="font-bold text-white" style={{ fontSize: 17 }}>Time Capsule</span>
        <button onClick={onNew}
          className="flex items-center gap-1 rounded-full px-3 text-white text-xs font-medium"
          style={{ height: 30, background: "#FF5500" }}>
          <Plus size={12} /> Write
        </button>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {(["locked", "unlocked"] as const).map((t) => (
          <button key={t} onClick={() => setCurrentTab(t)}
            className="flex-1 py-3 text-sm font-medium capitalize transition-all"
            style={{
              color: currentTab === t ? "white" : "rgba(255,255,255,0.40)",
              borderBottom: currentTab === t ? "2px solid #FF5500" : "2px solid transparent",
            }}>
            {t} ({t === "locked" ? locked.length : unlocked.length})
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 px-6 text-center">
            {currentTab === "locked"
              ? <Lock size={28} style={{ color: "rgba(255,255,255,0.15)" }} />
              : <Unlock size={28} style={{ color: "rgba(255,255,255,0.15)" }} />}
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              {currentTab === "locked" ? "No locked capsules." : "No capsules unlocked yet."}
            </p>
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.20)" }}>
              {currentTab === "locked" ? "Write one for your future self." : "Your first one will appear here when its time comes."}
            </p>
          </div>
        ) : (
          list.map((c, i) => {
            const days = daysRemaining(c.unlock_date);
            const pct = progressPct(c);
            const sel = selectedId === c.id;
            return (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                onClick={() => onSelect(c)}
                className="px-4 py-3.5 cursor-pointer transition-all"
                style={{
                  background: sel ? "rgba(255,255,255,0.04)" : "transparent",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  borderLeft: sel ? "2px solid #FF5500" : "2px solid transparent",
                }}>
                {/* Row 1 */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {capsuleIsUnlocked(c)
                      ? <Unlock size={11} style={{ color: "#00D97E", flexShrink: 0 }} />
                      : <Lock size={11} style={{ color: "rgba(255,255,255,0.30)", flexShrink: 0 }} />}
                    <span className="text-sm font-medium text-white truncate">{c.title || "Untitled Capsule"}</span>
                  </div>
                  {capsuleIsUnlocked(c) ? (
                    <span className="text-xs rounded-full px-2 py-0.5 shrink-0 ml-1"
                      style={{ background: "rgba(0,217,126,0.10)", border: "1px solid rgba(0,217,126,0.25)", color: "#00D97E" }}>Open</span>
                  ) : (
                    <span className="text-xs rounded-full px-2 py-0.5 shrink-0 ml-1"
                      style={{ background: "rgba(255,85,0,0.10)", border: "1px solid rgba(255,85,0,0.25)", color: "#FF5500" }}>
                      {days}d
                    </span>
                  )}
                </div>
                {/* Row 2 */}
                <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {capsuleIsUnlocked(c) ? `Unlocked ${fmtDate(c.unlock_date)}` : `Opens ${fmtDate(c.unlock_date)}`}
                </p>
                {/* Row 3 — progress bar (locked only) */}
                {!capsuleIsUnlocked(c) && (
                  <div className="h-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#FF5500" }} />
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
