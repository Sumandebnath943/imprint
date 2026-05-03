"use client";

import { motion } from "framer-motion";

const TriangleGraphic = () => (
  <div className="relative flex items-center justify-center w-full h-32">
    {/* Outer ring */}
    <div className="absolute w-24 h-24 rounded-full border border-[#FF4500]/20" />
    <div className="absolute w-16 h-16 rounded-full border border-[#FF4500]/40 bg-[#FF4500]/10 flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(255,69,0,0.2)]">
      <div className="relative flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
          <path d="M12 3L22 20H2L12 3Z" fill="#FFF" stroke="#FFF" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <div className="absolute inset-0 bg-white blur-[10px] opacity-50" />
      </div>
    </div>
    {/* Glowing light base */}
    <div className="absolute bottom-2 w-24 h-4 bg-[#FF4500] blur-[20px] opacity-80" />
  </div>
);

const NodesGraphic = () => (
  <div className="relative flex items-center justify-center w-full h-32 gap-6">
    {/* Connection line */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-[2px] bg-gradient-to-r from-[#FF4500]/0 via-[#FF4500] to-[#FF4500]/0 shadow-[0_0_8px_rgba(255,69,0,1)]" />

    {/* Node 1 */}
    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#8A1C00] flex items-center justify-center shadow-[0_0_20px_rgba(255,69,0,0.5)] z-10">
      <div className="absolute inset-0 rounded-full border border-white/30" />
      <span className="text-white/90 text-sm font-bold tracking-tighter">AI</span>
    </div>

    {/* Node 2 */}
    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#FF8800] to-[#D93800] flex items-center justify-center shadow-[0_0_25px_rgba(255,85,0,0.8)] z-10">
      <div className="absolute inset-0 rounded-full border border-white/50" />
      <span className="text-white text-sm font-bold tracking-tighter drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]">YOU</span>
    </div>
  </div>
);

const ChartGraphic = ({ value }: { value: string }) => (
  <div className="relative w-full h-32 flex items-end justify-between px-2 pb-2">
    <div className="absolute inset-0 flex items-end opacity-60">
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="w-full h-24">
        <path d="M0,100 L0,70 Q40,80 80,50 T150,20 T200,5 L200,100 Z" fill="url(#chartGrad)" />
        <path d="M0,70 Q40,80 80,50 T150,20 T200,5" fill="none" stroke="#FF5500" strokeWidth="2.5" className="drop-shadow-[0_0_6px_rgba(255,85,0,0.8)]" />
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF4500" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF4500" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div className="relative z-10 bg-black/60 backdrop-blur-md border border-[#FF4500]/40 rounded-xl px-3 py-1.5 mb-4 ml-2 flex items-center gap-3 shadow-[0_0_20px_rgba(255,69,0,0.25)]">
      <div>
        <div className="text-[9px] text-[#FF8800] uppercase tracking-widest mb-0.5">Atrophy Rate</div>
        <div className="text-white font-bold text-lg leading-none">{value}</div>
      </div>
      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] animate-pulse" />
    </div>
    <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,1)] mb-[75px] mr-1" />
  </div>
);

const PyramidGraphic = () => (
  <div className="relative flex flex-col items-center justify-end w-full h-32 pb-3 gap-[3px]">
    {/* Glowing top */}
    <div className="absolute top-6 w-16 h-16 bg-[#FF5500] blur-[24px] opacity-70" />
    <div className="w-6 h-1.5 rounded-[1px] bg-white shadow-[0_-4px_12px_rgba(255,255,255,0.9)] z-10" />
    <div className="w-12 h-2.5 rounded-[2px] bg-gradient-to-r from-[#FFAA00] to-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.6)] z-10" />
    <div className="w-20 h-3.5 rounded-[2px] bg-gradient-to-r from-[#FF5500] to-[#A32200] shadow-[0_0_12px_rgba(255,69,0,0.4)] z-10" />
    <div className="w-28 h-4.5 rounded-[3px] bg-gradient-to-r from-[#A32200] to-[#4A0E00] z-10" />
    <div className="w-36 h-5 rounded-[3px] bg-gradient-to-r from-[#5C1300] to-[#1A0500] z-10" />
    {/* Base reflection */}
    <div className="w-48 h-1 bg-[#FF4500] blur-[4px] mt-1 opacity-40" />
  </div>
);

const STATS = [
  {
    title: "Cognitive Atrophy",
    value: "73%",
    label: "Report reduced independent problem-solving after 18 months of AI use.",
    type: "triangle"
  },
  {
    title: "Zero Protection",
    value: "0",
    label: "Existing tools measure or protect your creative identity over time.",
    type: "nodes"
  },
  {
    title: "Accelerated Decay",
    value: "2.4×",
    label: "Faster skill atrophy when AI completes tasks you could have done.",
    type: "chart"
  },
  {
    title: "Total Verification",
    value: "100%",
    label: "Human verification and cognitive mapping guaranteed with IMPRINT.",
    type: "pyramid"
  }
];

function GraphicCard({ stat, index }: { stat: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      className="relative rounded-[24px] bg-[#0c0500] border border-[#FF4500]/10 overflow-hidden group hover:border-[#FF4500]/40 transition-colors p-5 flex flex-col justify-between h-[280px]"
    >
      {/* Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#1c0a00] to-black opacity-80" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4500]/10 blur-[40px] pointer-events-none group-hover:bg-[#FF4500]/20 transition-colors duration-500" />

      {/* Edge highlight on top */}
      <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-[#FF6B00]/40 to-transparent" />

      {/* Text Top */}
      <div className="relative z-10">
        <h3 className="text-lg font-medium text-white mb-2 tracking-tight">{stat.title}</h3>
        <p className="text-xs text-white/50 leading-relaxed">{stat.label}</p>
      </div>

      {/* Graphic Bottom */}
      <div className="relative z-10 w-full mt-4">
        {stat.type === 'pyramid' && <PyramidGraphic />}
        {stat.type === 'chart' && <ChartGraphic value={stat.value} />}
        {stat.type === 'triangle' && <TriangleGraphic />}
        {stat.type === 'nodes' && <NodesGraphic />}
      </div>
    </motion.div>
  );
}

export default function ProblemSection() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-32" style={{ background: "#080808" }}>
      {/* Ghost text */}
      <div className="absolute left-[-5%] top-[40%] -translate-y-1/2 pointer-events-none select-none blur-[6px]" style={{ fontSize: "clamp(150px,20vw,280px)", fontWeight: 800, color: "#FFFFFF", opacity: 0.04, lineHeight: 1, letterSpacing: "-0.04em", whiteSpace: "nowrap" }}>
        DRIFT
      </div>

      {/* Diffused Geometric Background - Contour Lines (Entire Left Side) */}
      <div className="absolute top-0 left-0 w-full lg:w-1/2 h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#FF5500]/10 blur-[150px]" />

        {/* Fixed aspect SVG anchored to bottom-left to prevent cropping issues */}
        <svg viewBox="0 0 800 800" className="absolute bottom-0 left-0 w-[800px] h-[800px] opacity-100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="contourFade" cx="0%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#FF6B00" stopOpacity="1" />
              <stop offset="60%" stopColor="#FF4500" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FF4500" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Dense parallel curves radiating from bottom left */}
          {Array.from({ length: 40 }).map((_, i) => {
            const radius = 100 + i * 24;
            return (
              <circle
                key={i}
                cx="0"
                cy="800"
                r={radius}
                stroke="url(#contourFade)"
                strokeWidth="3"
              />
            );
          })}
        </svg>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-16 lg:gap-20 items-center">
          {/* Left Text */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="text-xs uppercase tracking-widest font-medium mb-6"
              style={{ color: "#FF5500" }}
            >
              /01
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
              className="font-bold mb-8" style={{ fontSize: "clamp(40px,4.5vw,56px)", lineHeight: 1.05, maxWidth: 560 }}
            >
              <span className="text-white">AI is quietly</span>
              <br />
              <span style={{ color: "#FF5500" }}>replacing you.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
              className="leading-relaxed" style={{ fontSize: 17, color: "rgba(255,255,255,0.60)", maxWidth: 480, lineHeight: 1.8 }}
            >
              Every time you ask AI to write your email, draft your report, solve your problem — a small piece of your capability quietly atrophies. You don&apos;t notice it happening. Until one day, you can&apos;t do it without the machine. We call this{" "}
              <span className="text-white font-medium">Echo Drift.</span>
            </motion.p>
          </div>

          {/* Right — 2x2 Grid Graphic Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STATS.map((stat, i) => (
              <GraphicCard key={stat.title} stat={stat} index={i} />
            ))}
          </div>
        </div>

        {/* Bottom callout - Premium Glowing CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }}
          className="mt-20 relative w-full rounded-[32px] overflow-hidden flex flex-col items-center justify-center py-12 md:py-16 px-6 text-center group"
          style={{
            background: "linear-gradient(180deg, #0c0400 0%, #030100 100%)",
            boxShadow: "0 40px 100px -20px rgba(0,0,0,0.8)",
          }}
        >
          {/* Texture overlay (subtle dots/noise) */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-screen pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }} />

          {/* Top Center Intense Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[1px] bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent opacity-80" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#FF4500] blur-[100px] opacity-40 mix-blend-screen pointer-events-none group-hover:opacity-60 transition-opacity duration-1000" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[200px] h-[120px] bg-white blur-[80px] opacity-15 mix-blend-screen pointer-events-none" />

          {/* Bottom Edge Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[1px] bg-gradient-to-r from-transparent via-[#FF4500]/40 to-transparent" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[700px] h-[100px] bg-[#FF4500] blur-[80px] opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity duration-1000" />

          {/* Center Glowing Icon */}
          <div className="relative mb-6 z-10">
            <div className="w-14 h-14 rounded-full bg-gradient-to-b from-[#330A00] to-black border border-[#FF6B00]/30 flex items-center justify-center shadow-[0_0_40px_rgba(255,69,0,0.5)] backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#FF8800] blur-[12px] opacity-40" />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
                <path d="M12 3L21 19H3L12 3Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                <circle cx="12" cy="13.5" r="3" fill="#110500" />
              </svg>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white blur-[20px] opacity-40 pointer-events-none" />
          </div>

          {/* Typography */}
          <h3 className="text-3xl md:text-[40px] font-bold text-white tracking-tight mb-3 relative z-10 drop-shadow-md">
            Echo Drift is real.
          </h3>
          <p className="text-[#FF6B00] font-medium text-base md:text-lg mb-3 relative z-10 drop-shadow-[0_0_10px_rgba(255,85,0,0.3)]">
            IMPRINT is the only engine built to stop it.
          </p>
          <p className="text-white/40 text-sm md:text-[15px] max-w-xl mb-8 relative z-10 leading-relaxed font-light">
            Secure your creative instinct. Build your cognitive vault today, and prevent the machine from quietly replacing you.
          </p>

          {/* Glowing Pill Button */}
          <a href="/signup" className="relative group z-10 cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF8800] via-[#FF4500] to-[#8A1C00] rounded-full blur-[12px] opacity-50 group-hover:opacity-100 transition duration-500" />
            <div className="relative px-8 py-3 bg-gradient-to-b from-[#4A0E00] to-[#0A0200] border border-[#FF6B00]/50 rounded-full text-white font-medium text-sm flex items-center gap-2 group-hover:border-[#FF8800] transition-colors shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <span className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Get Started Now</span>
            </div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
