"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Info, X } from "lucide-react";
import CircleDetail from "@/components/circles/CircleDetail";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface HumanCircle {
  id: string; name: string; description: string; cluster_focus: string;
  member_limit: number; invite_code: string;
}

export interface CircleMember {
  id: string; circle_id: string; user_id: string; role: "admin" | "member"; joined_at: string;
  profile?: { full_name: string; imprint_score: number; };
}

interface CirclesClientProps {
  userId: string;
  circles: HumanCircle[];
  memberships: CircleMember[];
}

const CLUSTERS = [
  { name: "Language & Voice", color: "#FFB800" },
  { name: "Technical & Analytical", color: "#4FC3F7" },
  { name: "Visual & Creative", color: "#CE93D8" },
  { name: "Human & Social", color: "#00D97E" },
  { name: "Leadership & Strategy", color: "#FF5500" },
  { name: "Life & Personal", color: "#FF2D2D" },
];

export default function CirclesClient({ userId, circles, memberships }: CirclesClientProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [activeCircle, setActiveCircle] = useState<HumanCircle | null>(null);

  const [bannerSeen, setBannerSeen] = useState(true);

  useEffect(() => {
    setBannerSeen(localStorage.getItem("imprint_circles_banner_seen") === "1");
  }, []);

  const dismissBanner = () => {
    localStorage.setItem("imprint_circles_banner_seen", "1");
    setBannerSeen(true);
  };

  // Create Form State
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createCluster, setCreateCluster] = useState("Language & Voice");
  const [createPrivate, setCreatePrivate] = useState(true);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Join Form State
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/circles/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName, description: createDesc, clusterFocus: createCluster, isPrivate: createPrivate }),
    });
    setCreating(false);
    if (res.ok) {
      const data = await res.json();
      setCreatedCode(data.inviteCode);
    } else {
      const data = await res.json();
      console.error('Circle create failed:', data);
      toast.error('Failed: ' + (data.error || 'Unknown error'));
    }
  };

  const copyCode = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = async () => {
    if (joinCode.length !== 6) return;
    setJoining(true); setJoinError("");
    const res = await fetch("/api/circles/join", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite_code: joinCode }),
    });
    setJoining(false);
    if (res.ok) {
      setShowJoin(false);
      setJoinCode("");
      router.refresh();
    } else {
      const data = await res.json();
      setJoinError(data.error || "Failed to join");
    }
  };

  return (
    <div className="relative" style={{ background: "#080808", minHeight: "100%", padding: "40px 48px 80px" }}>
      <div className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
        style={{ fontSize: 180, fontWeight: 700, color: "#fff", opacity: 0.025, lineHeight: 1, zIndex: 0 }}>CIRCLE</div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-bold text-white mb-1" style={{ fontSize: 32 }}>Human Circles</h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.40)" }}>Small groups. Real accountability. No algorithms.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowJoin(true)} className="rounded-full font-medium transition-all hover:bg-white/5"
              style={{ height: 42, padding: "0 20px", border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.70)", fontSize: 14 }}>Join with Code</button>
            <button onClick={() => setShowCreate(true)} className="rounded-full font-medium text-white"
              style={{ height: 42, padding: "0 20px", background: "#FF5500", fontSize: 14 }}>Create Circle</button>
          </div>
        </motion.div>

        {!bannerSeen && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-start justify-between mb-8"
            style={{ background: "rgba(255,85,0,0.04)", border: "1px solid rgba(255,85,0,0.15)", borderRadius: 14, padding: "16px 20px" }}>
            <div className="flex gap-3 items-start">
              <Info size={18} style={{ color: "#FF5500", marginTop: 2 }} />
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.60)", lineHeight: 1.5 }}>
                Circles are capped at 8 members. This is intentional. Accountability only works at human scale.
              </p>
            </div>
            <button onClick={dismissBanner}><X size={16} style={{ color: "rgba(255,255,255,0.40)" }} /></button>
          </motion.div>
        )}

        {circles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center" style={{ border: "1px dashed rgba(255,255,255,0.10)", borderRadius: 20 }}>
            <Users size={64} style={{ color: "rgba(255,255,255,0.08)", marginBottom: 16 }} />
            <h2 className="font-semibold text-white mb-2" style={{ fontSize: 24 }}>You&apos;re not in any circles.</h2>
            <p className="mb-6" style={{ fontSize: 16, color: "rgba(255,255,255,0.40)", maxWidth: 400 }}>Circles are where accountability lives. Create one or join with an invite code.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(true)} className="rounded-full text-white font-medium px-6 py-2.5" style={{ background: "#FF5500" }}>Create a Circle</button>
              <button onClick={() => setShowJoin(true)} className="rounded-full px-6 py-2.5 transition-all hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.65)" }}>Join with Code</button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="font-semibold text-white mb-4" style={{ fontSize: 20 }}>My Circles ({circles.length})</h2>
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
              {circles.map((c, i) => {
                const memCount = memberships.filter((m) => m.circle_id === c.id).length || 1;
                const isFull = memCount >= c.member_limit;
                const isAdmin = memberships.find((m) => m.circle_id === c.id && m.user_id === userId)?.role === "admin";
                const clusterColor = CLUSTERS.find(cl => cl.name === c.cluster_focus)?.color || "#FF5500";

                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => setActiveCircle(c)}
                    className="cursor-pointer group relative overflow-hidden"
                    style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 24, transition: "all 200ms ease" }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: "0 0 30px rgba(255,85,0,0.05)", pointerEvents: "none" }} />
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-white text-lg">{c.name}</h3>
                      <span className="text-xs rounded-full px-2 py-0.5" style={{ background: isFull ? "rgba(255,45,45,0.12)" : "rgba(0,217,126,0.10)", border: `1px solid ${isFull ? "rgba(255,45,45,0.25)" : "rgba(0,217,126,0.25)"}`, color: isFull ? "#FF2D2D" : "#00D97E" }}>
                        {memCount}/{c.member_limit} members
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: clusterColor }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.70)" }}>{c.cluster_focus}</span>
                    </div>
                    <p className="mb-4 line-clamp-2" style={{ fontSize: 14, color: "rgba(255,255,255,0.50)", lineHeight: 1.6 }}>{c.description || "No description provided."}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Active this week</span>
                      {isAdmin && <span className="text-xs rounded-full px-2 py-0.5" style={{ background: "rgba(255,85,0,0.10)", color: "#FF5500" }}>Admin</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && !createdCode && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.80)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)}>
            <motion.div className="w-full max-w-lg rounded-3xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", padding: 40 }} onClick={e => e.stopPropagation()} initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
              <h2 className="font-bold text-white mb-1" style={{ fontSize: 24 }}>Create a Circle</h2>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.40)" }}>Keep it small. Keep it real.</p>
              
              <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Give your circle a name" maxLength={40} className="w-full rounded-xl px-4 py-3 text-[15px] text-white outline-none mb-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }} />
              
              <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.60)" }}>What cluster is this circle for?</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {CLUSTERS.map(c => (
                  <button key={c.name} onClick={() => setCreateCluster(c.name)} className="flex items-center gap-2 rounded-xl p-2.5 transition-all text-left" style={{ background: createCluster === c.name ? `${c.color}20` : "#1A1A1A", border: `1px solid ${createCluster === c.name ? c.color : "transparent"}` }}>
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="text-xs truncate" style={{ color: createCluster === c.name ? "white" : "rgba(255,255,255,0.50)" }}>{c.name}</span>
                  </button>
                ))}
              </div>
              
              <textarea value={createDesc} onChange={e => setCreateDesc(e.target.value)} placeholder="What does this circle stand for?" maxLength={200} className="w-full rounded-xl px-4 py-3 text-[14px] outline-none resize-none mb-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.70)", minHeight: 80 }} />
              
              <label className="flex items-center gap-3 mb-6 cursor-pointer">
                <input type="checkbox" checked={createPrivate} onChange={e => setCreatePrivate(e.target.checked)} className="accent-[#FF5500]" />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>Private circle — join by invite only</span>
              </label>

              <button onClick={handleCreate} disabled={creating || !createName.trim()} className="w-full rounded-full h-14 font-medium text-white disabled:opacity-50" style={{ background: "#FF5500", fontSize: 16 }}>{creating ? "Creating…" : "Create Circle →"}</button>
            </motion.div>
          </motion.div>
        )}

        {createdCode && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.80)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-lg rounded-3xl text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", padding: 40 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
              <h2 className="font-bold text-white mb-1" style={{ fontSize: 24 }}>Invite your people</h2>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.40)" }}>Share this code. Max 7 more members.</p>
              
              <div className="rounded-2xl py-8 mb-6" style={{ background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="font-mono font-bold mb-2" style={{ fontSize: 48, color: "#FF5500", letterSpacing: "0.15em" }}>{createdCode}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>Invite code</p>
              </div>

              <div className="flex gap-3 mb-6 justify-center">
                <button onClick={copyCode} className="rounded-full px-6 py-2.5 transition-all text-sm" style={{ border: "1px solid rgba(255,255,255,0.20)", color: "white" }}>{copied ? "Copied! ✓" : "Copy Code"}</button>
              </div>

              <button onClick={() => { setShowCreate(false); setCreatedCode(null); router.refresh(); }} className="w-full rounded-full h-14 font-medium text-white" style={{ background: "#FF5500", fontSize: 16 }}>Done</button>
            </motion.div>
          </motion.div>
        )}

        {showJoin && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.80)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowJoin(false)}>
            <motion.div className="w-full max-w-md rounded-3xl text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", padding: 40 }} onClick={e => e.stopPropagation()} initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
              <h2 className="font-bold text-white mb-1" style={{ fontSize: 24 }}>Join a Circle</h2>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.40)" }}>Enter the 6-character invite code.</p>
              
              <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} placeholder="XXXXXX" className="w-full text-center font-mono font-bold outline-none rounded-xl mb-4" style={{ background: "#1A1A1A", border: "2px solid rgba(255,255,255,0.10)", fontSize: 32, padding: "20px", color: "white", letterSpacing: "0.2em" }} />
              
              {joinError && <p className="text-sm text-red-500 mb-4">{joinError}</p>}
              
              <button onClick={handleJoin} disabled={joining || joinCode.length !== 6} className="w-full rounded-full h-14 font-medium text-white disabled:opacity-50" style={{ background: "#FF5500", fontSize: 16 }}>{joining ? "Checking..." : "Join Circle →"}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Overlay */}
      <AnimatePresence>
        {activeCircle && (
          <CircleDetail circle={activeCircle} userId={userId} onClose={() => setActiveCircle(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
