"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface ProfessionCard {
  title: string;
  body: string;
  cluster: string;
  glowColor: string;
  icon: string;
  featured?: boolean;
}

const CARDS: ProfessionCard[] = [
  { title: "Writer", body: "Your voice is your identity. The Forge keeps it raw. The Mirror catches when you start writing like a machine.", cluster: "Language & Voice", glowColor: "rgba(255,85,0,0.35)", icon: "✍️" },
  { title: "Software Developer", body: "Can you still reason through a problem without Stack Overflow? The Forge will tell you.", cluster: "Technical & Analytical", glowColor: "rgba(255,85,0,0.25)", icon: "⚡" },
  { title: "Designer", body: "Your creative instinct is irreplaceable. IMPRINT tracks it across every session.", cluster: "Visual & Creative", glowColor: "rgba(255,85,0,0.45)", icon: "🎨", featured: true },
  { title: "Doctor", body: "Clinical reasoning without AI crutches. Your diagnostic instinct preserved.", cluster: "Human & Social", glowColor: "rgba(255,85,0,0.20)", icon: "🩺" },
  { title: "Entrepreneur", body: "Your decision-making pattern is your greatest asset. Don't let it erode.", cluster: "Leadership & Strategy", glowColor: "rgba(255,85,0,0.28)", icon: "🚀" },
  { title: "Musician", body: "Composition from memory. Rhythm from instinct. Your creative fingerprint, intact.", cluster: "Visual & Creative", glowColor: "rgba(255,85,0,0.22)", icon: "🎵" },
  { title: "Educator", body: "Can you still explain anything from memory? The Forge will challenge you weekly.", cluster: "Human & Social", glowColor: "rgba(255,85,0,0.20)", icon: "📚" },
  { title: "Student", body: "Build your identity before AI builds it for you. Start now, while it still matters.", cluster: "Life & Personal", glowColor: "rgba(255,85,0,0.18)", icon: "🎓" },
];

function ProfCard({ card, index, isActive }: { card: ProfessionCard; index: number; isActive: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={`relative flex-shrink-0 overflow-hidden flex flex-col rounded-[32px] transition-all duration-500 ease-out cursor-pointer ${
        isActive 
          ? 'bg-white shadow-[0_20px_60px_rgba(255,69,0,0.15)] z-10' 
          : 'bg-[#141414] opacity-80 hover:opacity-100 z-0'
      }`}
      style={{
        width: isActive ? 360 : 300,
        height: isActive ? 420 : 340,
        margin: "0 10px",
      }}
    >
      {/* Top Image area - Sophisticated Light Leaks */}
      <div className="w-full h-[40%] relative overflow-hidden bg-black flex justify-center items-center">
        {/* Deep background */}
        <div className={`absolute inset-0 transition-colors duration-700 ${isActive ? 'bg-[#0a0500]' : 'bg-[#050505]'}`} />
        
        {/* Main dramatic streak/blob */}
        <div className={`absolute top-0 right-0 w-64 h-32 blur-[48px] mix-blend-screen transition-all duration-1000 transform rotate-12 ${isActive ? 'bg-[#FF4500] translate-x-10 -translate-y-4' : 'bg-[#8A1C00]/50 translate-x-20 -translate-y-10'}`} />
        
        {/* Secondary softer light leak */}
        <div className={`absolute bottom-10 left-[-20%] w-56 h-40 blur-[56px] mix-blend-screen transition-all duration-1000 transform -rotate-12 ${isActive ? 'bg-[#FFAA00]/40' : 'bg-[#FF3300]/20'}`} />
        
        {/* Deep shadow overlay to ground it */}
        <div className={`absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black via-black/50 to-transparent`} />
        
        {/* Subtle Icon in the corner */}
        <div className="absolute top-6 left-6 text-2xl opacity-90 drop-shadow-lg transform hover:scale-110 transition-transform">
          {card.icon}
        </div>
      </div>

      {/* Bottom Content area */}
      <div className={`w-full flex-1 p-6 md:p-8 flex flex-col justify-start relative -mt-6 rounded-t-[24px] transition-colors duration-500 ${
        isActive ? 'bg-white' : 'bg-[#141414] border-t border-white/5'
      }`}>
        <div className="mb-2">
          <span className={`text-[10px] uppercase tracking-widest font-semibold transition-colors duration-500 ${
            isActive ? 'text-[#FF4500]' : 'text-[#FF4500]/70'
          }`}>
            @{card.cluster.replace(/\s+/g, '').toLowerCase()}
          </span>
        </div>
        <h3 className={`font-bold mb-2 tracking-tight transition-colors duration-500 ${
          isActive ? 'text-black text-2xl md:text-[28px]' : 'text-white text-xl md:text-2xl'
        }`}>
          {card.title}
        </h3>
        <p className={`text-[13px] leading-relaxed transition-colors duration-500 ${
          isActive ? 'text-gray-600' : 'text-gray-400'
        }`}>
          {card.body}
        </p>
      </div>
    </motion.div>
  );
}

export default function ForEveryHumanSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(2);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const center = container.scrollLeft + container.clientWidth / 2;
    
    // Find the child closest to the center
    let closestIndex = 0;
    let minDistance = Infinity;
    
    Array.from(container.children).forEach((child, index) => {
      const childElement = child as HTMLElement;
      const childCenter = childElement.offsetLeft + childElement.offsetWidth / 2;
      const distance = Math.abs(center - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
    }
  };

  return (
    <section id="for-you" className="relative py-32 overflow-hidden" style={{ background: "#080808" }}>


      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-16 max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: "#FF5500" }}
          >
            /03 — Built For
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            className="font-bold mb-5" style={{ fontSize: "clamp(40px,4.5vw,56px)", lineHeight: 1.05 }}
          >
            <span className="text-white">Not just for writers.</span>
            <br />
            <span style={{ color: "#FF5500" }}>For every thinking human.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
            style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", maxWidth: 560, lineHeight: 1.7 }}
          >
            IMPRINT adapts to your profession, your skills, and your unique identity — not the other way around.
          </motion.p>
        </div>
      </div>

      {/* Horizontal scroll cards — full bleed */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex items-center px-6 md:px-12 overflow-x-auto py-10"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", cursor: "grab", scrollSnapType: "x mandatory" }}
      >
        {CARDS.map((card, i) => (
          <div key={card.title} style={{ scrollSnapAlign: "center" }}>
            <ProfCard card={card} index={i} isActive={activeIndex === i} />
          </div>
        ))}
      </div>

      {/* Footer label */}
      <motion.div
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
        viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-10 text-center px-6"
      >
        <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.40)" }}>33 professions. 6 clusters. One engine built for all of them.</p>
        <Link href="/signup" className="text-sm font-medium" style={{ color: "#FF5500" }}>+ See all professions</Link>
      </motion.div>
    </section>
  );
}
