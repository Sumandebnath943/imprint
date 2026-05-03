"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, ArrowLeft } from "lucide-react";
import type { HumanCircle, CircleMember } from "@/components/circles/CirclesClient";
import { createClient } from "@/lib/supabase/client";
import { getZoneColor, getZoneShortLabel } from "@/lib/drift/types";

interface Checkin {
  id: string; user_id: string; checkin_type: string; content: string; drift_score_shared: number | null; created_at: string;
  profiles: { full_name: string; };
  reactions: { reaction_type: "strong" | "keep_going" | "eyes"; user_id: string; }[];
}

interface CircleDetailProps {
  circle: HumanCircle;
  userId: string;
  onClose: () => void;
}

const CHECKIN_TYPES = ["Vault Practice", "Forge Session", "Mirror Reflection", "Challenge Complete", "Accountability Update"];

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CircleDetail({ circle, userId, onClose }: CircleDetailProps) {
  const [activeTab, setActiveTab] = useState<"Feed" | "Members" | "Challenges" | "Leaderboard">("Feed");
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [members, setMembers] = useState<CircleMember[]>([]);

  // Composer state
  const [cType, setCType] = useState("Vault Practice");
  const [cContent, setCContent] = useState("");
  const [cDrift, setCDrift] = useState(false);
  const [posting, setPosting] = useState(false);
  const [userScore, setUserScore] = useState<number | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: cData } = await supabase.from("circle_checkins")
        .select(`*, profiles(full_name), reactions:checkin_reactions(reaction_type, user_id)`)
        .eq("circle_id", circle.id).order("created_at", { ascending: false }).limit(20);
      if (cData) setCheckins(cData as unknown as Checkin[]);

      const { data: mData } = await supabase.from("circle_members")
        .select(`*, profile:profiles(full_name, imprint_score)`)
        .eq("circle_id", circle.id);
      if (mData) setMembers(mData as unknown as CircleMember[]);

      const { data: sData } = await supabase.from("drift_scores")
        .select("score").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).single();
      if (sData) setUserScore(sData.score);
    }
    load();
  }, [circle.id, supabase, userId]);

  const handlePost = async () => {
    if (!cContent.trim() || cContent.length > 280) return;
    setPosting(true);
    const res = await fetch("/api/circles/checkin", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ circle_id: circle.id, checkin_type: cType, content: cContent, drift_score_shared: cDrift ? userScore : null }),
    });
    setPosting(false);
    if (res.ok) {
      const data = await res.json();
      setCheckins(p => [{ ...data, profiles: { full_name: "You" }, reactions: [] }, ...p]);
      setCContent("");
    }
  };

  const isAdmin = members.find(m => m.user_id === userId)?.role === "admin";

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#080808" }}
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}>
      {/* Header */}
      <div className="shrink-0 px-10 py-6" style={{ background: "#0D0D0D", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm mb-4 transition-all hover:text-white" style={{ color: "rgba(255,255,255,0.40)" }}>
          <ArrowLeft size={16} /> My Circles
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold text-white text-3xl mb-1">{circle.name}</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>{circle.cluster_focus} · {members.length} members</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(circle.invite_code)} className="rounded-full h-10 px-4 text-sm font-medium transition-all hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.70)" }}>
              Invite Code: {circle.invite_code}
            </button>
            {isAdmin && (
              <button className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.70)" }}>
                <Settings size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-10 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {(["Feed", "Members", "Challenges", "Leaderboard"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className="py-4 px-6 text-sm font-medium transition-all" style={{ color: activeTab === t ? "white" : "rgba(255,255,255,0.40)", borderBottom: activeTab === t ? "2px solid #FF5500" : "2px solid transparent" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        <div className="max-w-2xl mx-auto">
          {activeTab === "Feed" && (
            <div>
              {/* Composer */}
              <div className="rounded-2xl p-5 mb-8" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.40)" }}>Post a check-in</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {CHECKIN_TYPES.map(t => (
                    <button key={t} onClick={() => setCType(t)} className="rounded-full text-xs px-3 py-1.5 transition-all" style={{ background: cType === t ? "#FF5500" : "#1A1A1A", border: cType === t ? "1px solid #FF5500" : "1px solid rgba(255,255,255,0.08)", color: cType === t ? "white" : "rgba(255,255,255,0.55)" }}>{t}</button>
                  ))}
                </div>
                <textarea value={cContent} onChange={e => setCContent(e.target.value)} placeholder="What did you work on today?" className="w-full rounded-xl outline-none resize-none px-4 py-3 text-sm mb-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", color: "white", minHeight: 80 }} />
                <div className="flex items-center justify-between">
                  {userScore !== null && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={cDrift} onChange={e => setCDrift(e.target.checked)} className="accent-[#FF5500]" />
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>Share my Drift Score ({userScore})</span>
                    </label>
                  )}
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="text-xs font-mono" style={{ color: cContent.length > 280 ? "#FF2D2D" : "rgba(255,255,255,0.30)" }}>{cContent.length}/280</span>
                    <button onClick={handlePost} disabled={posting || !cContent.trim() || cContent.length > 280} className="rounded-full px-5 py-2 text-sm font-medium text-white disabled:opacity-50" style={{ background: "#FF5500" }}>{posting ? "Posting…" : "Post Check-in"}</button>
                  </div>
                </div>
              </div>

              {/* Feed Items */}
              {checkins.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>No check-ins yet. Be the first.</p>
                </div>
              ) : (
                checkins.map(ci => (
                  <div key={ci.id} className="rounded-2xl p-5 mb-3" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: "rgba(255,85,0,0.15)", color: "#FF5500" }}>{ci.profiles?.full_name?.charAt(0) || "?"}</div>
                        <span className="text-sm font-medium text-white">{ci.profiles?.full_name || "Unknown"}</span>
                        <span className="text-xs rounded-full px-2 py-0.5" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)" }}>{ci.checkin_type}</span>
                      </div>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{relTime(ci.created_at)}</span>
                    </div>
                    <p className="text-[15px] mb-3" style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>{ci.content}</p>
                    {ci.drift_score_shared !== null && (
                      <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium mb-3" style={{ background: `${getZoneColor(ci.drift_score_shared)}15`, border: `1px solid ${getZoneColor(ci.drift_score_shared)}30`, color: getZoneColor(ci.drift_score_shared) }}>
                        Drift: {ci.drift_score_shared} — {getZoneShortLabel(ci.drift_score_shared)}
                      </span>
                    )}
                    <div className="flex gap-2">
                      {(["strong", "keep_going", "eyes"] as const).map(rt => {
                        const count = ci.reactions?.filter(r => r.reaction_type === rt).length || 0;
                        const icon = rt === "strong" ? "💪" : rt === "keep_going" ? "🔥" : "👀";
                        return (
                          <button key={rt} className="flex items-center gap-1.5 rounded-full px-3 py-1 transition-all hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                            <span>{icon}</span> <span className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "Members" && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              {members.map((m, i) => (
                <div key={m.id} className="flex items-center justify-between p-4" style={{ borderBottom: i < members.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>{m.profile?.full_name?.charAt(0) || "?"}</div>
                    <div>
                      <p className="text-sm font-medium text-white">{m.profile?.full_name || "Unknown"}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>Joined {new Date(m.joined_at!).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-xs rounded-full px-2 py-0.5" style={{ background: m.role === "admin" ? "rgba(255,85,0,0.15)" : "transparent", color: m.role === "admin" ? "#FF5500" : "rgba(255,255,255,0.30)", border: m.role === "admin" ? "none" : "1px solid rgba(255,255,255,0.15)" }}>
                    {m.role}
                  </span>
                </div>
              ))}
              {members.length < circle.member_limit && (
                <div className="p-5 text-center" style={{ borderTop: "1px dashed rgba(255,255,255,0.10)" }}>
                  <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.40)" }}>+ Invite someone</p>
                  <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>{circle.invite_code}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "Leaderboard" && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "#0D0D0D" }}>
                <p className="text-sm font-medium text-white">{circle.name} Rankings</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>Based on IMPRINT Score</p>
              </div>
              {members.sort((a,b) => (b.profile?.imprint_score || 0) - (a.profile?.imprint_score || 0)).map((m, i) => (
                <div key={m.id} className="flex items-center justify-between p-4" style={{ borderBottom: i < members.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: m.user_id === userId ? "rgba(255,85,0,0.05)" : "transparent" }}>
                  <div className="flex items-center gap-4">
                    <span className="font-bold w-4 text-center" style={{ color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "rgba(255,255,255,0.20)", fontSize: i < 3 ? 18 : 14 }}>#{i+1}</span>
                    <span className="text-sm text-white">{m.profile?.full_name || "Unknown"}</span>
                  </div>
                  <span className="text-lg font-bold" style={{ color: "#FF5500" }}>{m.profile?.imprint_score || 0}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Challenges" && (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>No active challenges. Admins can assign circle challenges.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
