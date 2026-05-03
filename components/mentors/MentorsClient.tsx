"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, Star, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface MentorProfile {
  id: string; full_name: string; imprint_score: number;
  accepting_mentees: boolean; max_mentees: number;
  mentor_bio: string | null; mentoring_style: string[];
}

interface Mentorship {
  id: string; mentor_id: string; mentee_id: string; status: string;
  started_at: string; check_in_streak: number; last_checkin: string | null;
  mentor?: MentorProfile;
  mentee?: MentorProfile;
}

interface MentorsClientProps {
  userId: string;
  myMentorship: Mentorship | null;
  myMentees: Mentorship[];
  eligibleToMentor: boolean;
  availableMentors: MentorProfile[];
}

export default function MentorsClient({ userId, myMentorship, myMentees, eligibleToMentor, availableMentors }: MentorsClientProps) {
  const [showApply, setShowApply] = useState(false);
  const [showProfile, setShowProfile] = useState<MentorProfile | null>(null);

  // Apply form state
  const [bio, setBio] = useState("");
  const [maxMentees, setMaxMentees] = useState(2);
  const [style, setStyle] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);

  // Request state
  const [requestMsg, setRequestMsg] = useState("");
  const [requesting, setRequesting] = useState(false);

  const toggleStyle = (s: string) => setStyle(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleApply = async () => {
    setApplying(true);
    await fetch("/api/mentors/apply", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentor_bio: bio, mentoring_style: style, max_mentees: maxMentees, accepting_mentees: true }),
    });
    setApplying(false);
    setShowApply(false);
    // Ideally router.refresh() here
  };

  const handleRequest = async (mentorId: string) => {
    setRequesting(true);
    await fetch("/api/mentors/request", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentor_id: mentorId, message: requestMsg }),
    });
    setRequesting(false);
    setShowProfile(null);
  };

  return (
    <div className="relative" style={{ background: "#080808", minHeight: "100%", padding: "40px 48px 80px" }}>
      <div className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
        style={{ fontSize: 160, fontWeight: 700, color: "#fff", opacity: 0.025, lineHeight: 1, zIndex: 0 }}>MENTOR</div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-bold text-white mb-1" style={{ fontSize: 32 }}>Mentor Network</h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.40)" }}>Guided by humans. Measured by IMPRINT.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowApply(true)} className="rounded-full font-medium transition-all hover:bg-white/5"
              style={{ height: 42, padding: "0 20px", border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.70)", fontSize: 14 }}>Become a Mentor</button>
            <button className="rounded-full font-medium text-white"
              style={{ height: 42, padding: "0 20px", background: "#FF5500", fontSize: 14 }}>Find a Mentor</button>
          </div>
        </motion.div>

        {/* Existing Mentor */}
        {myMentorship && myMentorship.mentor && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="mb-10 rounded-[20px] p-8 relative overflow-hidden"
            style={{ background: "#111111", border: "1px solid rgba(255,85,0,0.15)" }}>
            <div className="absolute top-0 bottom-0 left-0 w-1" style={{ background: "#FF5500" }} />
            <p className="text-[11px] font-bold tracking-widest uppercase mb-4" style={{ color: "#FF5500" }}>YOUR MENTOR</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: "rgba(255,85,0,0.15)", color: "#FF5500" }}>
                  {myMentorship.mentor.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{myMentorship.mentor.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,85,0,0.10)", color: "#FF5500" }}>IMPRINT: {myMentorship.mentor.imprint_score}</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.40)" }}>Mentoring you for {Math.floor((Date.now() - new Date(myMentorship.started_at).getTime()) / 86400000)} days</p>
                <div className="flex items-center justify-center gap-1.5 text-sm font-medium" style={{ color: "#FF5500" }}>
                  <span>🔥</span> {myMentorship.check_in_streak} consecutive
                </div>
              </div>
              <div className="flex gap-2">
                <button className="rounded-full px-4 py-2 text-sm transition-all" style={{ border: "1px solid rgba(255,255,255,0.20)", color: "white" }}>Message</button>
                <button className="rounded-full px-4 py-2 text-sm text-white font-medium" style={{ background: "#FF5500" }}>Schedule Check-in</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Eligibility Banner */}
        {eligibleToMentor && myMentees.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center justify-between p-6 rounded-2xl mb-10" style={{ background: "rgba(0,217,126,0.04)", border: "1px solid rgba(0,217,126,0.20)" }}>
            <div className="flex gap-4 items-start">
              <Star size={24} style={{ color: "#00D97E", marginTop: 2 }} />
              <div>
                <p className="font-semibold text-white text-base mb-1">You&apos;re eligible to become a mentor.</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>Your IMPRINT Score and Drift history qualify you to guide others.</p>
              </div>
            </div>
            <button onClick={() => setShowApply(true)} className="rounded-full font-medium text-white px-5 py-2.5 text-sm transition-all hover:opacity-90" style={{ background: "#00D97E" }}>Apply to Mentor →</button>
          </motion.div>
        )}

        {/* Browse Mentors */}
        <h2 className="font-semibold text-white mb-4" style={{ fontSize: 20 }}>Browse Mentors</h2>
        <div className="grid gap-5 mb-12" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {availableMentors.filter(m => m.id !== userId).map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setShowProfile(m)}
              className="cursor-pointer group relative overflow-hidden flex flex-col"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 24, transition: "all 200ms ease" }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0 relative" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>
                  {m.full_name.charAt(0)}
                  {m.imprint_score > 600 && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#FF5500", border: "2px solid #111111" }}>
                      <UserCheck size={10} color="white" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{m.full_name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[11px] rounded-full px-2 py-0.5" style={{ background: "rgba(255,85,0,0.10)", color: "#FF5500" }}>IMPRINT: {m.imprint_score}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm mb-4 line-clamp-3 flex-1" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{m.mentor_bio || "Experienced user offering guidance."}</p>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full" style={{ background: m.accepting_mentees ? "#00D97E" : "#FFB800" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.60)" }}>{m.accepting_mentees ? `Accepting mentees (${m.max_mentees} spots)` : "Limited availability"}</span>
              </div>
              <button className="w-full rounded-full py-2.5 text-sm font-medium text-white transition-all group-hover:bg-[#FF5500]" style={{ border: "1px solid #FF5500", background: "transparent" }}>Request Mentorship →</button>
            </motion.div>
          ))}
          {availableMentors.length === 0 && (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>No mentors available at the moment.</p>
          )}
        </div>
      </div>

      {/* Profile Modal / Request Overlay */}
      <AnimatePresence>
        {showProfile && (
          <motion.div className="fixed inset-0 z-50 flex" style={{ background: "rgba(4,4,4,0.97)", backdropFilter: "blur(24px)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfile(null)}>
            <div className="m-auto w-full max-w-lg rounded-3xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", padding: 40 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>{showProfile.full_name.charAt(0)}</div>
                  <div>
                    <h2 className="font-bold text-white text-2xl">{showProfile.full_name}</h2>
                    <span className="text-xs rounded-full px-2 py-0.5 mt-1 inline-block" style={{ background: "rgba(255,85,0,0.10)", color: "#FF5500" }}>IMPRINT Score: {showProfile.imprint_score}</span>
                  </div>
                </div>
                <button onClick={() => setShowProfile(null)}><X size={20} style={{ color: "rgba(255,255,255,0.40)" }} /></button>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-white mb-2">Why I mentor:</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.60)", lineHeight: 1.6 }}>{showProfile.mentor_bio}</p>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-white mb-2">Mentoring Style:</p>
                <div className="flex flex-wrap gap-2">
                  {showProfile.mentoring_style?.map(s => (
                    <span key={s} className="text-xs rounded-full px-3 py-1" style={{ background: "#1A1A1A", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.08)" }}>{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24 }}>
                <p className="text-sm mb-3 text-white font-medium">Request Mentorship</p>
                <textarea value={requestMsg} onChange={e => setRequestMsg(e.target.value)} placeholder="What are you working on? What do you want to preserve?" className="w-full rounded-xl p-3 text-sm outline-none resize-none mb-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", color: "white", minHeight: 100 }} />
                <button onClick={() => handleRequest(showProfile.id)} disabled={requesting || !requestMsg.trim()} className="w-full rounded-full h-12 font-medium text-white disabled:opacity-50" style={{ background: "#FF5500" }}>
                  {requesting ? "Sending…" : "Send Request →"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Apply Modal */}
        {showApply && (
           <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.80)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowApply(false)}>
            <motion.div className="w-full max-w-lg rounded-3xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", padding: 40 }} onClick={e => e.stopPropagation()} initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
              <h2 className="font-bold text-white mb-1" style={{ fontSize: 24 }}>Become a Mentor</h2>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.40)" }}>Help others preserve their identity.</p>

              <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.60)" }}>Bio (Why do you mentor?)</p>
              <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full rounded-xl px-4 py-3 text-[14px] outline-none resize-none mb-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.70)", minHeight: 80 }} />

              <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.60)" }}>Mentoring Style</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {["Async check-ins", "Weekly calls", "Text-based only", "Flexible"].map(s => (
                  <button key={s} onClick={() => toggleStyle(s)} className="rounded-full text-xs px-3 py-1.5 transition-all" style={{ background: style.includes(s) ? "#FF5500" : "#1A1A1A", color: style.includes(s) ? "white" : "rgba(255,255,255,0.50)", border: `1px solid ${style.includes(s) ? "#FF5500" : "rgba(255,255,255,0.08)"}` }}>{s}</button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-8">
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>Max mentees at once</p>
                <div className="flex gap-2">
                  {[1,2,3].map(n => (
                    <button key={n} onClick={() => setMaxMentees(n)} className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all" style={{ background: maxMentees === n ? "white" : "#1A1A1A", color: maxMentees === n ? "black" : "white" }}>{n}</button>
                  ))}
                </div>
              </div>

              <button onClick={handleApply} disabled={applying || !bio.trim()} className="w-full rounded-full h-14 font-medium text-white disabled:opacity-50" style={{ background: "#FF5500", fontSize: 16 }}>{applying ? "Submitting…" : "Submit Application →"}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
