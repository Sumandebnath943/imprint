"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden text-white font-sans selection:bg-white/30"
      style={{
        // Using a vibrant orange-red gradient as fallback, expecting the hero image to be placed here
        background: "linear-gradient(135deg, #FF4500 0%, #D92600 100%)",
      }}
    >
      {/* Mobile Background Image (Hidden on Desktop) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-90 mix-blend-luminosity md:hidden"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
      />

      {/* Desktop Background Media - Video with Image Fallback (Hidden on Mobile) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/hero-bg.png"
        className="hidden md:block absolute inset-0 z-0 w-full h-full object-cover opacity-90 mix-blend-luminosity scale-[1.15]"
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Add an overlay to ensure text contrast if the image is too bright */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 mix-blend-multiply pointer-events-none" />

      {/* Giant Background Text */}
      <div className="absolute bottom-[-4%] left-0 w-full text-center pointer-events-none z-0">
        <motion.h1
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-[22vw] font-bold leading-none tracking-tighter text-white/10 select-none mix-blend-overlay"
        >
          IMPRINT
        </motion.h1>
      </div>

      {/* Main Content Container */}
      <div className="relative z-20 flex-1 w-full max-w-[1600px] mx-auto px-8 md:px-16 pt-32 pb-16 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-0">

        {/* LEFT COLUMN */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full lg:w-[420px] flex flex-col gap-10"
        >
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-[42px] font-light leading-[1.1] tracking-tight mb-5 uppercase">
              Preserve your<br />
              human identity<br />
              with <span className="font-semibold">our expert<br />engine.</span>
            </h2>
            <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-[340px]">
              From cognitive baseline mapping to voice preservation, we provide the tools to anchor your identity before AI replaces it.
            </p>
          </div>

          <Link href="/signup" className="bg-[#8A1C00] text-white text-[11px] font-bold tracking-[0.2em] px-10 py-4 rounded-full w-max hover:bg-[#A32200] transition-colors shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 duration-200">
            BEGIN IMPRINT
          </Link>

          {/* Left Cards */}
          <div className="flex gap-4 mt-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 w-[170px] shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                  <span className="text-xs">⚡</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              </div>
              <div className="text-4xl font-light mb-1 mt-4">12+</div>
              <div className="text-[11px] text-white/70 leading-tight">Identity Signals tracked & monitored</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 w-[170px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <span className="text-4xl">⌘</span>
              </div>
              <div className="text-xs text-white/60 mb-2">Start your preservation</div>
              <div className="text-4xl font-light mb-1 mt-6">100%</div>
              <div className="text-[11px] text-white/70 leading-tight">Human verification guaranteed</div>
            </div>
          </div>
        </motion.div>

        {/* CENTER SPACER (For the silhouette image) */}
        <div className="hidden lg:block flex-1 min-w-[300px]" />

        {/* RIGHT COLUMN */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full lg:w-[480px] flex flex-col items-start lg:items-end text-left lg:text-right gap-10"
        >
          <div>
            <h2 className="text-5xl md:text-6xl lg:text-[72px] font-light leading-[0.9] tracking-tighter uppercase mb-6">
              Identity<br />
              <span className="font-bold">Preservation</span><br />
              Engine
            </h2>

            <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-[360px] lg:ml-auto">
              In a world where AI thinks for you, writes for you, and decides for you — IMPRINT is your resistance. Your skills. Your voice. Your identity.
            </p>
          </div>

          {/* Right Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 w-[340px] text-left shadow-2xl mt-4 relative">
            <div className="absolute top-6 right-6">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            </div>
            <div className="text-[11px] text-white/60 uppercase tracking-widest mb-3">Your Drift Score</div>
            <div className="text-3xl font-semibold mb-2">Anchored</div>
            <p className="text-[13px] text-white/70 mb-6 leading-relaxed">
              Your identity is intact. Regular journaling and vault challenges are keeping you grounded.
            </p>

            {/* Mini progress bars/stats */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] text-white/60 mb-1">
                  <span>Baseline Consistency</span>
                  <span>92%</span>
                </div>
                <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/90 w-[92%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-white/60 mb-1">
                  <span>Vault Activity</span>
                  <span>84%</span>
                </div>
                <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/70 w-[84%]" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
