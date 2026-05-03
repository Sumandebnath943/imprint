"use client";

import { motion } from "framer-motion";
import Link from "next/link";

function FlameIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <path d="M16 3C16 3 20 9 20 14C20 14 22 12 22 10C22 10 26 15 26 20C26 25.523 21.523 29 16 29C10.477 29 6 25.523 6 20C6 14 12 9 12 9C12 9 12 12 14 13C14 13 12 10 16 3Z" fill="#FF5500" opacity="0.9"/>
      <path d="M16 16C16 16 18 19 18 21.5C18 23 17 24 16 24C15 24 14 23 14 21.5C14 19 16 16 16 16Z" fill="white" opacity="0.6"/>
    </svg>
  );
}

function MirrorIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <rect x={6} y={4} width={20} height={24} rx={3} stroke="rgba(255,120,50,0.7)" strokeWidth={1.5} fill="none"/>
      <line x1={16} y1={4} x2={16} y2={28} stroke="rgba(255,120,50,0.4)" strokeWidth={1} strokeDasharray="3 3"/>
      <circle cx={16} cy={16} r={4} stroke="rgba(255,120,50,0.7)" strokeWidth={1.5} fill="none"/>
    </svg>
  );
}


function ForgeCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, delay: 0.1 }}
      className="relative overflow-hidden group"
      style={{ 
        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(20,5,2,0.4) 100%)", 
        border: "1px solid rgba(255,255,255,0.08)", 
        borderRadius: 32, 
        padding: "48px", 
        flex: 1,
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        boxShadow: "0 30px 60px -15px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.15)"
      }}
    >
      {/* Subtle top edge light */}
      <div className="absolute top-0 left-[10%] w-[80%] h-[1px] bg-gradient-to-r from-transparent via-[#FF5500]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Inner ambient glow */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#FF4500] blur-[80px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-700" />

      <div className="relative z-10">
        <div className="mb-6"><FlameIcon /></div>
        <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: "#FF5500" }}>THE FORGE</p>
        <h3 className="font-bold text-white mb-5 tracking-tight" style={{ fontSize: 36, lineHeight: 1.1 }}>Your Zero-Silicon Workspace</h3>
        <p className="leading-relaxed mb-8 font-medium" style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }}>
          A raw, distraction-free environment where you work alone. No AI. No autocomplete. No shortcuts. Timed challenges, voice notes, handwriting uploads — all designed to keep your skills sharp and your voice entirely your own.
        </p>
        <ul className="space-y-4 mb-12">
          {["Timed writing and thinking prompts", "Raw voice capture (no AI transcription)", "Handwriting and sketch uploads"].map((item) => (
            <li key={item} className="flex items-center gap-4 text-[15px] font-medium" style={{ color: "rgba(255,255,255,0.70)" }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#FF5500", boxShadow: "0 0 8px #FF5500" }} />
              {item}
            </li>
          ))}
        </ul>
        <Link href="/dashboard/forge" className="inline-flex items-center text-[15px] font-bold transition-all hover:translate-x-1" style={{ color: "#FF5500" }}>
          Enter The Forge →
        </Link>
      </div>
    </motion.div>
  );
}

function MirrorCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, delay: 0.2 }}
      className="relative overflow-hidden group"
      style={{ 
        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(20,5,2,0.4) 100%)", 
        border: "1px solid rgba(255,255,255,0.08)", 
        borderRadius: 32, 
        padding: "48px", 
        flex: 1,
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        boxShadow: "0 30px 60px -15px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.15)"
      }}
    >
      {/* Subtle top edge light */}
      <div className="absolute top-0 left-[10%] w-[80%] h-[1px] bg-gradient-to-r from-transparent via-[#FF7832]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Inner ambient glow */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#FF7832] blur-[80px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-700" />

      <div className="relative z-10">
        <div className="mb-6"><MirrorIcon /></div>
        <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: "rgba(255,120,50,0.9)" }}>THE MIRROR</p>
        <h3 className="font-bold text-white mb-5 tracking-tight" style={{ fontSize: 36, lineHeight: 1.1 }}>Your AI Reflection Chamber</h3>
        <p className="leading-relaxed mb-8 font-medium" style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }}>
          The Mirror uses AI — but only to ask you questions. Never to answer them. It reflects your thinking back at you, tracks how your language and reasoning patterns compare to your baseline, and flags the moment you start sounding more like an AI than yourself.
        </p>
        <ul className="space-y-4 mb-12">
          {["Socratic AI — questions only, never answers", "Real-time drift detection vs your baseline", "Voice and vocabulary pattern comparison"].map((item) => (
            <li key={item} className="flex items-center gap-4 text-[15px] font-medium" style={{ color: "rgba(255,255,255,0.70)" }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "rgba(255,120,50,0.8)", boxShadow: "0 0 8px rgba(255,120,50,0.8)" }} />
              {item}
            </li>
          ))}
        </ul>
        <Link href="/dashboard/mirror" className="inline-flex items-center text-[15px] font-bold transition-all hover:translate-x-1" style={{ color: "rgba(255,120,50,0.9)" }}>
          Enter The Mirror →
        </Link>
      </div>
    </motion.div>
  );
}

export default function TwoFrontsSection() {
  return (
    <section id="engine" className="relative py-32 overflow-hidden" style={{ background: "#080808" }}>

      {/* Massive Ambient Background Glows for Glassmorphism */}
      <div className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] bg-[#FF4500] blur-[160px] opacity-[0.25] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[500px] bg-[#FF6B00] blur-[180px] opacity-[0.15] pointer-events-none mix-blend-screen" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <div className="mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-[13px] uppercase tracking-widest font-bold mb-4" style={{ color: "#FF5500" }}
          >
            /02 — How It Works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            className="font-bold text-white tracking-tighter" style={{ fontSize: "clamp(48px,5vw,64px)", lineHeight: 1.05 }}
          >
            Two fronts. One mission.
          </motion.h2>
        </div>

        {/* Cards */}
        <div className="flex flex-col lg:flex-row gap-8">
          <ForgeCard />
          <MirrorCard />
        </div>
      </div>
    </section>
  );
}
