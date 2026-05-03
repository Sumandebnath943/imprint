"use client";

import { motion } from "framer-motion";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  badge: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "I used IMPRINT for 6 weeks. I wrote my first solo report in 14 months without touching AI once. I didn't realize how dependent I'd become.",
    name: "Priya S.",
    role: "Product Manager, Mumbai",
    badge: "Drift Score dropped from 67 → 21",
  },
  {
    quote: "The Forge is brutal and I love it. Timed prompts with no autocorrect — I remembered I actually have a voice.",
    name: "Marcus T.",
    role: "Senior Writer, London",
    badge: "Baseline Consistency: 94%",
  },
  {
    quote: "As a data scientist I thought this wasn't for me. Then I failed my own Fermi estimation challenge. That was the wake-up call.",
    name: "Anya K.",
    role: "Data Scientist, Berlin",
    badge: "Vault Strength: 82%",
  },
];

export default function SocialProofSection() {
  return (
    <section className="relative py-32 overflow-hidden" style={{ background: "#080808" }}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: "#FF5500" }}
          >
            /05 — Early Users
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            className="font-bold text-white" style={{ fontSize: "clamp(36px,4vw,48px)", lineHeight: 1.1, maxWidth: 640 }}
          >
            What happens when you stop letting AI think for you.
          </motion.h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: "easeOut" }}
              className="relative overflow-hidden rounded-[32px] p-8 md:p-10 flex flex-col group min-h-[400px]"
              style={{
                background: "linear-gradient(160deg, #1a0b05 0%, #0a0300 100%)",
                border: "1px solid rgba(255,85,0,0.15)",
                boxShadow: "0 20px 50px -10px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {/* Top-Right Ambient Glow */}
              <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-[#FF4500] blur-[90px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-1000" />
              
              {/* Hexagon Pattern Overlay */}
              <div 
                className="absolute top-0 right-0 w-full h-[60%] opacity-[0.07] pointer-events-none group-hover:opacity-[0.12] transition-opacity duration-1000"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z' fill='%23FF5500' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                  backgroundSize: "36px",
                  backgroundPosition: "top right",
                  maskImage: "linear-gradient(225deg, black 0%, transparent 70%)",
                  WebkitMaskImage: "linear-gradient(225deg, black 0%, transparent 70%)"
                }}
              />

              {/* Pill Badge */}
              <div className="mb-10 relative z-10">
                 <span className="inline-block text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest text-white whitespace-nowrap" style={{ background: "linear-gradient(90deg, #FF6B00 0%, #FF4500 100%)", boxShadow: "0 4px 15px rgba(255,69,0,0.3)" }}>
                   {t.badge}
                 </span>
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 relative z-10" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.0))", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 22H22L12 2Z" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinejoin="round"/>
                  <circle cx="12" cy="15" r="3" fill="#111" />
                </svg>
              </div>

              {/* Title & Role */}
              <div className="mb-6 relative z-10">
                <h3 className="text-[28px] font-bold text-white mb-1 tracking-tight leading-none">{t.name}</h3>
                <p className="text-[13px] text-white/50 font-medium">{t.role}</p>
              </div>

              {/* Quote text */}
              <div className="flex-1 relative z-10">
                <p className="text-white/70 leading-relaxed text-[15px]">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Bottom Glowing Button / Verified Tag */}
              <div className="mt-8 relative z-10">
                <div className="w-full py-3.5 rounded-full text-center text-sm font-bold text-white transition-all cursor-pointer hover:brightness-110" style={{ background: "linear-gradient(180deg, rgba(255,85,0,0.3) 0%, rgba(255,85,0,0.1) 100%)", border: "1px solid rgba(255,85,0,0.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 10px 20px -5px rgba(255,69,0,0.2)" }}>
                  Verified Human
                </div>
              </div>

            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
