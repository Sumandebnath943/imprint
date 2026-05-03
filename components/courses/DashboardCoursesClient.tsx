"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Lock, User, Brain, Shield } from "lucide-react";

interface DashboardCoursesClientProps {
  waitlistJoined: boolean;
  userEmail: string | null;
}

const COURSES = [
  {
    category: "Language & Voice", color: "#FF5500",
    title: "Your Voice: Writing Without AI",
    desc: "Rebuild your natural writing voice from the ground up. Timed sessions, memory exercises, and structured challenges that remind you what your prose actually sounds like — without autocomplete finishing your sentences.",
    practices: ["Daily timed writing with no AI assistance", "Voice signature analysis and refinement", "Editing instinct exercises from memory"],
    duration: "6 weeks", level: "Intermediate"
  },
  {
    category: "Technical & Analytical", color: "#00D97E",
    title: "The Thinking Practitioner",
    desc: "Can you still reason through a hard problem without Stack Overflow? This course rebuilds your raw analytical instinct — Fermi estimation, systems thinking, and debugging from first principles.",
    practices: ["Estimation challenges without calculators", "Systems design from memory", "Logic problem solving in plain language"],
    duration: "4 weeks", level: "Advanced"
  },
  {
    category: "Visual & Creative", color: "#FFB800",
    title: "Creative Identity for Designers",
    desc: "Your creative instinct is irreplaceable — but only if you keep using it. Sketch exercises, process documentation, and instinct challenges designed to keep your creative fingerprint sharp and AI-free.",
    practices: ["Daily 10-minute sketch challenges", "Process documentation without tools", "Visual memory and recall exercises"],
    duration: "5 weeks", level: "All levels"
  }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function DashboardCoursesClient({ waitlistJoined, userEmail }: DashboardCoursesClientProps) {
  const [joined, setJoined] = useState(waitlistJoined);
  const [email, setEmail] = useState(userEmail || "");
  const [joining, setJoining] = useState(false);
  
  const [suggestion, setSuggestion] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState(false);

  const handleJoin = async () => {
    if (!email || joined) return;
    setJoining(true);
    const res = await fetch("/api/courses/waitlist", { method: "POST" });
    setJoining(false);
    if (res.ok) setJoined(true);
  };

  const handleSuggest = async () => {
    if (!suggestion.trim()) return;
    setSuggesting(true);
    const res = await fetch("/api/courses/suggestion", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestion_text: suggestion }),
    });
    setSuggesting(false);
    if (res.ok) {
      setSuggested(true);
      setSuggestion("");
      setTimeout(() => setSuggested(false), 3000);
    }
  };

  return (
    <div className="relative" style={{ background: "#080808", minHeight: "100%", paddingBottom: 100 }}>
      {/* Ghost text */}
      <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none select-none overflow-hidden pt-10" style={{ zIndex: 0 }}>
        <span style={{ fontSize: 180, fontWeight: 700, color: "#fff", opacity: 0.03, lineHeight: 1 }}>LEARN</span>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 pt-[120px]">
        {/* HERO SECTION */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="text-center mb-24">
          <motion.div variants={{ hidden: { scale: 0 }, show: { scale: 1, transition: { type: "spring", stiffness: 300, damping: 15 } } }}
            className="inline-block px-4 py-1.5 rounded-full mb-8 font-bold tracking-widest uppercase"
            style={{ background: "rgba(255,184,0,0.12)", border: "1px solid rgba(255,184,0,0.30)", color: "#FFB800", fontSize: 12 }}>
            Coming Soon
          </motion.div>
          <motion.h1 variants={itemVariants} className="font-bold mb-6 mx-auto" style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 0.95, maxWidth: 800 }}>
            <span className="text-white block md:inline">The IMPRINT </span>
            <span style={{ color: "#FF5500" }}>Learning Hub.</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="mx-auto mb-16 text-[18px] md:text-[20px]" style={{ color: "rgba(255,255,255,0.55)", maxWidth: 560, lineHeight: 1.7 }}>
            Structured courses built by humans, for humans. No AI tutors. No generated content. No shortcuts. Real expertise, taught the way knowledge was always meant to be passed — from one mind to another.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            {[
              { val: "3", label: "courses in development", color: "white" },
              { val: "100%", label: "human-taught", color: "#FF5500" },
              { val: "Q4 2026", label: "Launching", color: "white" }
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="font-bold text-[24px] mb-1" style={{ color: s.color }}>{s.val}</p>
                <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.40)" }}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* WAITLIST SECTION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="max-w-[560px] mx-auto mb-32">
          <div className="rounded-[20px] p-8 md:p-10 text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            {joined ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-4">
                <svg width="48" height="48" viewBox="0 0 48 48" className="mb-4">
                  <circle cx="24" cy="24" r="22" fill="transparent" stroke="rgba(0,217,126,0.2)" strokeWidth="4" />
                  <motion.path
                    d="M14 24 L21 31 L34 16"
                    fill="transparent"
                    stroke="#00D97E"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                </svg>
                <p className="font-medium text-[16px]" style={{ color: "#00D97E" }}>You&apos;re on the list. We&apos;ll be in touch.</p>
              </motion.div>
            ) : (
              <>
                <h3 className="font-semibold text-white mb-2" style={{ fontSize: 18 }}>Be first when courses go live.</h3>
                <p className="text-[14px] mb-6" style={{ color: "rgba(255,255,255,0.40)" }}>We&apos;ll notify you the moment your first course is ready. No spam. Ever.</p>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full text-[15px] outline-none text-white mb-3"
                  style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, height: 52, padding: "0 20px" }}
                />
                <button
                  onClick={handleJoin} disabled={joining || !email}
                  className="w-full rounded-full font-medium text-white mb-4 disabled:opacity-50 transition-all hover:opacity-90"
                  style={{ background: "#FF5500", height: 52 }}>
                  {joining ? "Joining..." : "Join Waitlist"}
                </button>
                <p className="text-[12px] italic" style={{ color: "rgba(255,255,255,0.40)" }}>Only used for course launch notification.</p>
              </>
            )}
          </div>
        </motion.div>

        {/* COURSE PREVIEWS */}
        <div className="mb-32">
          <div className="text-center mb-12">
            <h2 className="font-semibold text-white mb-2" style={{ fontSize: 24 }}>A glimpse of what&apos;s coming.</h2>
            <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.40)" }}>These aren&apos;t finalized. They&apos;re a signal of what IMPRINT is building.</p>
          </div>
          
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={{ show: { transition: { staggerChildren: 0.15 } } }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COURSES.map(c => (
              <motion.div key={c.title} variants={cardVariants} className="relative rounded-[20px] p-7 overflow-hidden group" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Blur Overlay */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-black/50" style={{ background: "rgba(8,8,8,0.60)", backdropFilter: "blur(3px)" }}>
                  <Lock size={20} className="mb-2" style={{ color: "rgba(255,255,255,0.40)" }} />
                  <span className="text-[13px] font-medium tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.40)" }}>Coming Soon</span>
                </div>

                {/* Content (behind blur) */}
                <div className="relative opacity-60">
                  <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase mb-4" style={{ background: `${c.color}15`, color: c.color }}>{c.category}</span>
                  <h3 className="font-bold text-white mb-4" style={{ fontSize: 22, lineHeight: 1.2 }}>{c.title}</h3>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }} />
                    <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.40)" }}>Taught by a human expert</span>
                  </div>
                  <p className="text-[14px] mb-5 line-clamp-3" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.6 }}>{c.desc}</p>
                  <ul className="mb-6 flex flex-col gap-2">
                    {c.practices.map(p => (
                      <li key={p} className="flex items-start gap-2 text-[13px]" style={{ color: "rgba(255,255,255,0.40)" }}>
                        <span style={{ color: "#FF5500", marginTop: 2 }}>•</span> {p}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-[13px]" style={{ color: "rgba(255,255,255,0.40)" }}>
                    <span>{c.duration}</span><span>·</span><span>{c.level}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* 3 RULES SECTION */}
        <div className="mb-32">
          <div className="text-center mb-12">
            <h2 className="font-semibold text-white mb-2" style={{ fontSize: 28 }}>Not another online course.</h2>
            <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.40)" }}>Every course on IMPRINT follows 3 rules that no other platform follows.</p>
          </div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <User size={32} color="#FF5500" />, title: "Taught by verified humans", body: "Every instructor is a practitioner with demonstrated expertise — no AI-generated content, no synthesized curriculum. Real knowledge from real minds." },
              { icon: <Brain size={32} color="#FF5500" />, title: "Practiced, not consumed", body: "Courses are built around doing, not watching. Every lesson has a Forge challenge. You don't graduate until you've proven the skill from memory." },
              { icon: <Shield size={32} color="#FF5500" />, title: "Measured by IMPRINT", body: "Completing a course updates your Skill Vault and contributes to your IMPRINT Score. Your learning is tracked — not by a certificate, but by real, recurring skill measurement." }
            ].map(p => (
              <motion.div key={p.title} variants={itemVariants} className="text-left">
                <div className="mb-5">{p.icon}</div>
                <h3 className="font-semibold text-white mb-3" style={{ fontSize: 18 }}>{p.title}</h3>
                <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.50)", lineHeight: 1.7 }}>{p.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* SUGGESTION BOX */}
        <div className="rounded-[16px] p-7 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-semibold text-white mb-2" style={{ fontSize: 18 }}>What do you want to learn?</h3>
            <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.40)" }}>We&apos;re building the curriculum now. Tell us which skills matter most to you.</p>
          </div>
          <div className="flex-1 w-full flex flex-col md:flex-row items-end gap-3">
            <textarea value={suggestion} onChange={e => setSuggestion(e.target.value)} placeholder="I want a course on..." maxLength={200}
              className="w-full flex-1 rounded-[10px] outline-none text-[14px] resize-none"
              style={{ background: "#1A1A1A", padding: "12px 14px", color: "white", minHeight: 48 }} rows={2} />
            <button onClick={handleSuggest} disabled={suggesting || !suggestion.trim()} className="shrink-0 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "#FF5500" }}>
              {suggested ? "Received ✓" : suggesting ? "Sending…" : "Submit Suggestion"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
