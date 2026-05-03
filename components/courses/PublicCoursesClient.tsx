"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Lock, User, Brain, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

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

const PROFESSIONS = [
  { title: "The Writer", desc: "For those whose product is their syntax. Rebuild the instinct to find the right word, not just the predicted one." },
  { title: "The Developer", desc: "For engineers who need to maintain the ability to reason through architecture without an LLM acting as their pre-frontal cortex." },
  { title: "The Designer", desc: "For visual thinkers who want to protect their unique aesthetic from reverting to the median generated output." },
  { title: "The Doctor", desc: "For diagnosticians maintaining their clinical reasoning instinct against the rise of algorithmic suggestions." },
  { title: "The Entrepreneur", desc: "For founders who must maintain their ability to synthesize risk, strategy, and opportunity without a crutch." },
  { title: "The Teacher", desc: "For educators who need to preserve their ability to explain complex concepts from first principles." }
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

export default function PublicCoursesClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  
  const [bottomEmail, setBottomEmail] = useState("");
  const [bottomJoining, setBottomJoining] = useState(false);
  const [bottomJoined, setBottomJoined] = useState(false);

  const handleJoin = async (target: "top" | "bottom") => {
    const e = target === "top" ? email : bottomEmail;
    if (!e || !e.includes("@")) return;
    
    if (target === "top") setJoining(true); else setBottomJoining(true);
    
    const res = await fetch("/api/courses/public-waitlist", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: e }),
    });
    
    if (target === "top") setJoining(false); else setBottomJoining(false);
    
    if (res.ok) {
      if (target === "top") setJoined(true); else setBottomJoined(true);
    }
  };

  return (
    <div className="relative pt-[120px] pb-32">
      <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none select-none overflow-hidden pt-10" style={{ zIndex: 0 }}>
        <span style={{ fontSize: 160, fontWeight: 700, color: "#fff", opacity: 0.03, lineHeight: 1 }}>LEARN</span>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12">
        {/* HERO */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="text-center mb-24">
          <motion.div variants={{ hidden: { scale: 0 }, show: { scale: 1, transition: { type: "spring", stiffness: 300, damping: 15 } } }}
            className="inline-block px-4 py-1.5 rounded-full mb-8 font-bold tracking-widest uppercase"
            style={{ background: "rgba(255,184,0,0.12)", border: "1px solid rgba(255,184,0,0.30)", color: "#FFB800", fontSize: 12 }}>
            Coming Soon
          </motion.div>
          <motion.h1 variants={itemVariants} className="font-bold mb-6 mx-auto" style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.95, maxWidth: 800 }}>
            <span className="text-white block">Learn from humans.</span>
            <span style={{ color: "#FF5500" }}>Practice without AI.</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="mx-auto mb-16 text-[18px] md:text-[20px]" style={{ color: "rgba(255,255,255,0.55)", maxWidth: 520, lineHeight: 1.7 }}>
            The IMPRINT Learning Hub is where human expertise gets passed down the way it always should have been — directly, honestly, and without an algorithm in the middle.
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

        {/* TOP WAITLIST */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="max-w-[560px] mx-auto mb-32">
          <div className="rounded-[20px] p-8 md:p-10 text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            {joined ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-4">
                <svg width="48" height="48" viewBox="0 0 48 48" className="mb-4">
                  <circle cx="24" cy="24" r="22" fill="transparent" stroke="rgba(0,217,126,0.2)" strokeWidth="4" />
                  <motion.path d="M14 24 L21 31 L34 16" fill="transparent" stroke="#00D97E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
                </svg>
                <p className="font-medium text-[16px]" style={{ color: "#00D97E" }}>You&apos;re on the list. We&apos;ll be in touch.</p>
              </motion.div>
            ) : (
              <>
                <h3 className="font-semibold text-white mb-2" style={{ fontSize: 18 }}>Be first when courses go live.</h3>
                <p className="text-[14px] mb-6" style={{ color: "rgba(255,255,255,0.40)" }}>We&apos;ll notify you the moment your first course is ready. No spam. Ever.</p>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" className="w-full text-[15px] outline-none text-white mb-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, height: 52, padding: "0 20px" }} />
                <button onClick={() => handleJoin("top")} disabled={joining || !email} className="w-full rounded-full font-medium text-white mb-4 disabled:opacity-50 transition-all hover:opacity-90" style={{ background: "#FF5500", height: 52 }}>
                  {joining ? "Joining..." : "Join Waitlist"}
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* 3 RULES */}
        <div className="mb-32">
          <div className="text-center mb-12">
            <h2 className="font-semibold text-white mb-2" style={{ fontSize: 28 }}>Not another online course.</h2>
            <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.40)" }}>Every course on IMPRINT follows 3 rules that no other platform follows.</p>
          </div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={{ show: { transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <User size={32} color="#FF5500" />, title: "Taught by verified humans", body: "Every instructor is a practitioner with demonstrated expertise — no AI-generated content, no synthesized curriculum. Real knowledge from real minds." },
              { icon: <Brain size={32} color="#FF5500" />, title: "Practiced, not consumed", body: "Courses are built around doing, not watching. Every lesson has a Forge challenge. You don't graduate until you've proven the skill from memory." },
              { icon: <Shield size={32} color="#FF5500" />, title: "Measured by IMPRINT", body: "Every course includes IMPRINT integration — your learning is measured, not just certified." }
            ].map(p => (
              <motion.div key={p.title} variants={itemVariants} className="text-left">
                <div className="mb-5">{p.icon}</div>
                <h3 className="font-semibold text-white mb-3" style={{ fontSize: 18 }}>{p.title}</h3>
                <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.50)", lineHeight: 1.7 }}>{p.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* COURSE PREVIEWS */}
        <div className="mb-32">
          <div className="text-center mb-12">
            <h2 className="font-semibold text-white mb-2" style={{ fontSize: 24 }}>A glimpse of what&apos;s coming.</h2>
            <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.40)" }}>These aren&apos;t finalized. They&apos;re a signal of what IMPRINT is building.</p>
          </div>
          
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={{ show: { transition: { staggerChildren: 0.15 } } }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COURSES.map(c => (
              <motion.div key={c.title} variants={cardVariants} className="relative rounded-[20px] p-7 overflow-hidden group" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Blur Overlay & Hover Action */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center transition-all duration-300 bg-black/60 backdrop-blur-[3px] group-hover:bg-black/40">
                  <Lock size={20} className="mb-2 transition-transform group-hover:-translate-y-4" style={{ color: "rgba(255,255,255,0.40)" }} />
                  <span className="text-[13px] font-medium tracking-wide uppercase transition-transform group-hover:-translate-y-4" style={{ color: "rgba(255,255,255,0.40)" }}>Coming Soon</span>
                  
                  {/* Slide up button on hover */}
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center translate-y-[200%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 px-6">
                    <button onClick={() => router.push("/signup")} className="w-full rounded-full py-3 text-sm font-bold text-white shadow-lg" style={{ background: "#FF5500" }}>
                      Join Waitlist to Access →
                    </button>
                  </div>
                </div>

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

        {/* WHO IT'S FOR */}
        <div className="mb-40">
          <h2 className="font-semibold text-white mb-10 text-center" style={{ fontSize: 28 }}>Who IMPRINT Courses are for.</h2>
          <div className="flex overflow-x-auto pb-8 snap-x" style={{ margin: "0 -24px", padding: "0 24px", msOverflowStyle: "none", scrollbarWidth: "none" }}>
            <div className="flex gap-4">
              {PROFESSIONS.map(prof => (
                <div key={prof.title} className="shrink-0 snap-center w-[280px] p-6 rounded-[20px] flex flex-col justify-between" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", height: 280 }}>
                  <div>
                    <h3 className="font-bold text-white mb-3" style={{ fontSize: 20 }}>{prof.title}</h3>
                    <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.50)", lineHeight: 1.6 }}>{prof.desc}</p>
                  </div>
                  <button className="text-[14px] font-medium text-left mt-6 group relative self-start" style={{ color: "#FF5500" }}>
                    <span className="group-hover:opacity-0 transition-opacity">See {prof.title.split(" ")[1]} courses →</span>
                    <span className="absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-white">Coming soon</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="max-w-[600px] mx-auto text-center mb-10">
          <h2 className="font-bold mb-6" style={{ fontSize: "clamp(48px, 6vw, 64px)", lineHeight: 0.95 }}>
            <span className="text-white block">Be the first</span>
            <span style={{ color: "#FF5500" }}>to learn the human way.</span>
          </h2>
          <p className="text-[18px] mb-10" style={{ color: "rgba(255,255,255,0.50)" }}>Join the waitlist. No spam. We&apos;ll tell you when your course is ready.</p>
          
          <div className="rounded-[20px] p-8 bg-[#111111] border border-white/5 text-center max-w-[400px] mx-auto">
            {bottomJoined ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-2">
                 <svg width="48" height="48" viewBox="0 0 48 48" className="mb-4">
                  <circle cx="24" cy="24" r="22" fill="transparent" stroke="rgba(0,217,126,0.2)" strokeWidth="4" />
                  <motion.path d="M14 24 L21 31 L34 16" fill="transparent" stroke="#00D97E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
                </svg>
                <p className="font-medium text-[16px]" style={{ color: "#00D97E" }}>You&apos;re on the list.</p>
              </motion.div>
            ) : (
              <>
                <input type="email" value={bottomEmail} onChange={e => setBottomEmail(e.target.value)} placeholder="Your email address" className="w-full text-[15px] outline-none text-white mb-3 text-center" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, height: 52, padding: "0 20px" }} />
                <button onClick={() => handleJoin("bottom")} disabled={bottomJoining || !bottomEmail} className="w-full rounded-full font-medium text-white disabled:opacity-50 transition-all hover:opacity-90" style={{ background: "#FF5500", height: 52 }}>
                  {bottomJoining ? "Joining..." : "Join Waitlist"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
