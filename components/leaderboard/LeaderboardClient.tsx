"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getZoneColor, getZoneShortLabel } from "@/lib/drift/types";
import { useRouter } from "next/navigation";

export interface RankedProfile {
  id: string; full_name: string; imprint_score: number;
  latest_drift?: { score: number; } | null;
}

interface LeaderboardProps {
  userId: string;
  isOptedIn: boolean;
  rankings: RankedProfile[];
  userRank: number | null;
}

const CLUSTERS = ["All Clusters", "Language & Voice", "Technical & Analytical", "Visual & Creative", "Human & Social", "Leadership & Strategy", "Life & Personal"];

export default function LeaderboardClient({ userId, isOptedIn, rankings, userRank }: LeaderboardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState("All Clusters");
  const [optingIn, setOptingIn] = useState(false);

  const handleOptIn = async () => {
    setOptingIn(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ leaderboard_opt_in: true }).eq("id", userId);
    setOptingIn(false);
    router.refresh();
  };

  const handleOptOut = async () => {
    if (!confirm("Remove yourself from the leaderboard?")) return;
    const supabase = createClient();
    await supabase.from("profiles").update({ leaderboard_opt_in: false }).eq("id", userId);
    router.refresh();
  };

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  return (
    <div className="relative" style={{ background: "#080808", minHeight: "100%", paddingBottom: isOptedIn ? 120 : 80 }}>
      <div className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
        style={{ fontSize: 180, fontWeight: 700, color: "#fff", opacity: 0.025, lineHeight: 1, zIndex: 0 }}>RANK</div>

      <div className="relative z-10 max-w-6xl mx-auto pt-10 px-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-bold text-white mb-1" style={{ fontSize: 32 }}>Leaderboard</h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.40)" }}>Ranked by who&apos;s doing the work. Opt-in only.</p>
          </div>
          {isOptedIn && (
            <button onClick={handleOptOut} className="text-[13px] transition-all hover:text-white" style={{ color: "rgba(255,255,255,0.40)" }}>Opt out</button>
          )}
        </motion.div>

        {!isOptedIn && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center justify-between p-6 rounded-2xl mb-10" style={{ background: "rgba(255,85,0,0.04)", border: "1px solid rgba(255,85,0,0.15)" }}>
            <div>
              <p className="font-semibold text-white text-base mb-1">You&apos;re not on the leaderboard.</p>
              <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.60)" }}>Join to see how you rank against other humans doing the same work.</p>
            </div>
            <div className="text-right">
              <button onClick={handleOptIn} disabled={optingIn} className="rounded-full font-medium text-white px-5 py-2.5 text-sm transition-all mb-2 disabled:opacity-50" style={{ background: "#FF5500" }}>{optingIn ? "Joining…" : "Join Leaderboard"}</button>
              <p className="text-[12px] italic" style={{ color: "rgba(255,255,255,0.40)" }}>Only username & IMPRINT Score visible.</p>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between mb-10">
          <div className="flex gap-2">
            {["All Time", "This Month", "This Week"].map(t => (
              <button key={t} className="rounded-full text-xs px-3 py-1.5 transition-all" style={{ background: t === "All Time" ? "rgba(255,255,255,0.08)" : "transparent", color: t === "All Time" ? "white" : "rgba(255,255,255,0.40)" }}>{t}</button>
            ))}
          </div>
          <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.40)" }}>Showing {rankings.length} humans</p>
        </div>

        {/* Podium */}
        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-4 mb-16 pt-10 h-[320px]">
            {/* Rank 2 */}
            {top3[1] && (
              <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 150, damping: 20 }}
                className="flex flex-col items-center w-36 relative z-10">
                <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-lg font-bold mb-3 z-20" style={{ background: "#C0C0C0", color: "black", border: "3px solid #080808" }}>{top3[1].full_name.charAt(0)}</div>
                <div className="w-full flex flex-col items-center pt-8 pb-4 rounded-t-xl" style={{ background: "rgba(255,255,255,0.06)", borderTop: "1px solid rgba(255,255,255,0.12)", borderLeft: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)", height: 160, marginTop: -26 }}>
                  <p className="font-semibold text-white text-[14px] mb-1">{top3[1].full_name}</p>
                  <p className="font-bold text-white text-[22px]">{top3[1].imprint_score}</p>
                  <div className="absolute top-1/2 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold" style={{ background: "#C0C0C0", color: "black", marginTop: -16 }}>2</div>
                </div>
              </motion.div>
            )}
            
            {/* Rank 1 */}
            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 150, damping: 20 }}
              className="flex flex-col items-center w-40 relative z-20">
              <div className="text-[#FFD700] mb-1">👑</div>
              <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center text-xl font-bold mb-3 z-20" style={{ background: "#FFD700", color: "black", border: "4px solid #080808" }}>{top3[0].full_name.charAt(0)}</div>
              <div className="w-full flex flex-col items-center pt-10 pb-4 rounded-t-xl" style={{ background: "rgba(255,85,0,0.15)", borderTop: "1px solid rgba(255,85,0,0.30)", borderLeft: "1px solid rgba(255,85,0,0.15)", borderRight: "1px solid rgba(255,85,0,0.15)", height: 200, marginTop: -32 }}>
                <p className="font-bold text-white text-[16px] mb-1">{top3[0].full_name}</p>
                <p className="font-bold text-[#FF5500] text-[28px]">{top3[0].imprint_score}</p>
                <div className="absolute top-1/2 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold" style={{ background: "#FFD700", color: "black", marginTop: -20 }}>1</div>
              </div>
            </motion.div>

            {/* Rank 3 */}
            {top3[2] && (
              <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 150, damping: 20 }}
                className="flex flex-col items-center w-36 relative z-10">
                <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center text-base font-bold mb-3 z-20" style={{ background: "#CD7F32", color: "white", border: "3px solid #080808" }}>{top3[2].full_name.charAt(0)}</div>
                <div className="w-full flex flex-col items-center pt-6 pb-4 rounded-t-xl" style={{ background: "rgba(255,184,0,0.08)", borderTop: "1px solid rgba(255,184,0,0.20)", borderLeft: "1px solid rgba(255,184,0,0.08)", borderRight: "1px solid rgba(255,184,0,0.08)", height: 130, marginTop: -24 }}>
                  <p className="font-semibold text-white text-[14px] mb-1">{top3[2].full_name}</p>
                  <p className="font-bold text-white text-[20px]">{top3[2].imprint_score}</p>
                  <div className="absolute top-1/2 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold" style={{ background: "#CD7F32", color: "white", marginTop: -16 }}>3</div>
                </div>
              </motion.div>
            )}
          </div>
        )}
        
        {rankings.length > 0 && <div className="h-px w-full mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />}
        <p className="text-center text-[13px] mb-10" style={{ color: "rgba(255,255,255,0.30)" }}>{rankings.length} humans competing this month</p>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden mb-12" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="grid grid-cols-6 p-4" style={{ background: "#0D0D0D", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-[11px] uppercase tracking-wide col-span-1" style={{ color: "rgba(255,255,255,0.40)" }}>Rank</div>
            <div className="text-[11px] uppercase tracking-wide col-span-2" style={{ color: "rgba(255,255,255,0.40)" }}>User</div>
            <div className="text-[11px] uppercase tracking-wide col-span-2 text-right" style={{ color: "rgba(255,255,255,0.40)" }}>IMPRINT Score</div>
            <div className="text-[11px] uppercase tracking-wide col-span-1 text-right" style={{ color: "rgba(255,255,255,0.40)" }}>Drift</div>
          </div>
          {rest.map((r, i) => {
            const rank = i + 4;
            const driftScore = r.latest_drift?.score || 0;
            return (
              <div key={r.id} className="grid grid-cols-6 p-4 items-center transition-all hover:bg-white/5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="col-span-1 text-[15px] font-bold" style={{ color: rank <= 10 ? "#FF5500" : "rgba(255,255,255,0.30)" }}>#{rank}</div>
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>{r.full_name.charAt(0)}</div>
                  <span className="text-[14px] font-medium text-white flex items-center gap-2">
                    {r.full_name}
                    {r.id === userId && <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/20 text-[#FF5500]">You</span>}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-[15px] font-bold text-white">{r.imprint_score}</p>
                  <div className="w-[60px] h-[3px] rounded-full ml-auto mt-1" style={{ background: "rgba(255,255,255,0.10)" }}>
                    <div className="h-full rounded-full" style={{ background: "#FF5500", width: `${Math.min(100, (r.imprint_score / 1000) * 100)}%` }} />
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  {driftScore > 0 ? (
                    <span className="text-[13px] font-bold rounded-full px-2 py-1" style={{ background: `${getZoneColor(driftScore)}15`, color: getZoneColor(driftScore) }}>{driftScore}</span>
                  ) : <span className="text-[13px] text-gray-500">—</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      {isOptedIn && userRank !== null && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 px-12 py-4 flex items-center justify-between"
          style={{ background: "rgba(8,8,8,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,85,0,0.20)" }}>
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <div>
              <p className="text-[16px] font-bold text-white mb-0.5">Your rank: #{userRank}</p>
              <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.40)" }}>of {rankings.length} humans</p>
            </div>
            <div className="text-center">
              <p className="text-[20px] font-bold" style={{ color: "#FF5500" }}>{rankings.find(r => r.id === userId)?.imprint_score || 0}</p>
              <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.40)" }}>IMPRINT Score</p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.40)" }}>— No change</span>
              <button className="rounded-full px-4 py-2 text-sm transition-all hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.20)", color: "white" }}>View My Profile →</button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
