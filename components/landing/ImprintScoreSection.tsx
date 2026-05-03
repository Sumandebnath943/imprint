"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

function DriftScoreCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  // Drift score is 12%
  const driftScore = 12;

  return (
    <div ref={ref} className="relative w-full rounded-3xl p-8 md:p-10 flex flex-col justify-between overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]" style={{ background: "#FFFFFF" }}>
      <div className="flex justify-between items-start mb-12">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-[#111111] tracking-tight mb-1">Drift Score</h3>
          <p className="text-[#666666] text-sm font-medium">Cognitive deviation</p>
        </div>
        <div className="text-[56px] md:text-[64px] font-bold text-[#FF5500] font-[Space_Grotesk,sans-serif] leading-none tracking-tighter">
          {driftScore}<span className="text-3xl text-[#FF5500]/60">%</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-end mb-3">
          <span className="text-sm font-bold text-[#111111]">Anchored</span>
          <span className="text-xs font-semibold text-[#FF5500] uppercase tracking-wider px-2 py-1 bg-[#FF5500]/10 rounded-md">At Risk</span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="w-full h-4 bg-[#E5E5E5] rounded-full overflow-hidden relative shadow-inner">
           {/* Animated Orange Fill */}
           <motion.div 
             className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF8800] to-[#FF4500] rounded-full"
             initial={{ width: 0 }}
             animate={inView ? { width: `${driftScore}%` } : { width: 0 }}
             transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
           />
        </div>
      </div>
    </div>
  );
}

export default function ImprintScoreSection() {
  return (
    <section className="relative py-32 overflow-hidden" style={{ background: "#080808" }}>
      {/* Ghost text */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none select-none" style={{ fontSize: "clamp(100px,14vw,180px)", fontWeight: 700, color: "#FFFFFF", opacity: 0.04, lineHeight: 1, letterSpacing: "-0.04em", whiteSpace: "nowrap" }}>
        SCORE
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center lg:items-stretch">
          
          {/* Left Side — Text & Score Ring */}
          <div className="w-full lg:w-5/12 flex flex-col justify-between">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5 }}
                className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: "#FF5500" }}
              >
                /04 — Your IMPRINT Score
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
                className="font-bold mb-6" style={{ fontSize: "clamp(40px,4vw,56px)", lineHeight: 1.05 }}
              >
                <span className="text-white">Your identity,</span>
                <br />
                <span style={{ color: "#FF5500" }}>quantified.</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-12 leading-relaxed" style={{ fontSize: 17, color: "rgba(255,255,255,0.60)", maxWidth: 480, lineHeight: 1.8 }}
              >
                Every session. Every challenge. Every reflection. IMPRINT builds a living picture of your authentic self — and measures how much of it you&apos;ve preserved. Your IMPRINT Score is proof of who you still are.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
              className="flex justify-center lg:justify-start"
            >
              <DriftScoreCard />
            </motion.div>
          </div>

          {/* Right Side — Bento Grid Stats */}
          <div className="w-full lg:w-7/12 flex flex-col gap-4 justify-center">
            {/* Top Full Width Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}
              className="w-full relative rounded-3xl overflow-hidden p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between group"
              style={{ background: "linear-gradient(145deg, rgba(30,30,30,0.4) 0%, rgba(10,10,10,0.9) 100%)", border: "1px solid rgba(255,255,255,0.04)", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)" }}
            >
              {/* Subtle Background Glow */}
              <div className="absolute right-0 bottom-0 w-[80%] h-[80%] bg-[#FF4500]/10 blur-[80px] mix-blend-screen pointer-events-none group-hover:opacity-100 transition-opacity duration-1000" />
              
              {/* Number Stack */}
              <div className="relative z-10 flex flex-col justify-end pt-24 md:pt-32 pb-4 w-full md:w-1/2">
                <span className="text-[60px] md:text-[80px] opacity-[0.03] absolute top-[-10px] md:top-[-20px] blur-[2px] font-bold font-[Space_Grotesk,sans-serif] text-white select-none leading-none tracking-tighter">58</span>
                <span className="text-[60px] md:text-[80px] opacity-[0.1] absolute top-[30px] md:top-[40px] blur-[1px] font-bold font-[Space_Grotesk,sans-serif] text-white select-none leading-none tracking-tighter">68</span>
                <div className="flex items-baseline gap-2 md:gap-4 text-[70px] md:text-[100px] font-bold font-[Space_Grotesk,sans-serif] text-[#FF5500] leading-none drop-shadow-[0_0_25px_rgba(255,85,0,0.3)] tracking-tighter">
                  <span className="text-[#FF5500]/50 text-4xl md:text-6xl font-medium tracking-normal mb-2 md:mb-4">~</span> 78
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 w-full md:w-1/2 mt-6 md:mt-0 text-sm md:text-base text-white/50 leading-relaxed md:pl-8 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0">
                <span className="block text-white text-lg md:text-xl font-medium mb-2">Skill Vault Strength</span>
                The core retention rate of your cognitive models. Maintain strong verification loops to push this closer to 100.
              </div>
            </motion.div>

            {/* Bottom Row - 2 Columns */}
            <div className="grid grid-cols-2 gap-4">
                {/* Card 1 */}
                <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }}
                className="relative rounded-[24px] p-6 md:p-8 flex flex-col justify-end overflow-hidden group min-h-[180px] md:min-h-[220px]"
                style={{ background: "linear-gradient(145deg, rgba(20,20,20,0.4) 0%, rgba(5,5,5,0.9) 100%)", border: "1px solid rgba(255,255,255,0.03)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
                >
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#FF5500]/10 blur-[60px] pointer-events-none group-hover:bg-[#FF5500]/15 transition-all duration-700" />
                  <div className="relative z-10 text-[48px] md:text-[64px] font-bold text-[#FF5500] font-[Space_Grotesk,sans-serif] leading-none mb-3 md:mb-4 tracking-tighter">
                    91
                  </div>
                  <div className="relative z-10 text-xs md:text-sm text-white/40 leading-snug max-w-[200px]">
                    <span className="block text-white/90 font-medium mb-1 md:mb-1.5 text-sm md:text-base">Baseline Consistency</span>
                    Adherence to your unique voice.
                  </div>
                </motion.div>

                {/* Card 2 */}
                <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.6 }}
                className="relative rounded-[24px] p-6 md:p-8 flex flex-col justify-end overflow-hidden group min-h-[180px] md:min-h-[220px]"
                style={{ background: "linear-gradient(145deg, rgba(20,20,20,0.4) 0%, rgba(5,5,5,0.9) 100%)", border: "1px solid rgba(255,255,255,0.03)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
                >
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#FF5500]/10 blur-[60px] pointer-events-none group-hover:bg-[#FF5500]/15 transition-all duration-700" />
                  <div className="relative z-10 text-[48px] md:text-[64px] font-bold text-[#FF5500] font-[Space_Grotesk,sans-serif] leading-none mb-3 md:mb-4 tracking-tighter">
                    65
                  </div>
                  <div className="relative z-10 text-xs md:text-sm text-white/40 leading-snug max-w-[200px]">
                    <span className="block text-white/90 font-medium mb-1 md:mb-1.5 text-sm md:text-base">Weekly Activity</span>
                    Recent interactions mapped.
                  </div>
                </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
