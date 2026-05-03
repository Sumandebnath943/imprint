"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

const COURSES = [
  { title: "Your Voice: Writing Without AI", duration: "8 modules" },
  { title: "The Thinking Practitioner", duration: "6 modules" },
  { title: "Creative Identity for Designers", duration: "10 modules" },
];

export default function CoursesSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <section id="courses" className="relative pt-20 pb-20 overflow-hidden" style={{ background: "#080808" }}>
      
      {/* Dramatic Studio Light Effect (Right Side) */}
      <div 
        className="absolute top-0 right-0 w-[120%] md:w-[80%] h-full pointer-events-none mix-blend-screen"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 40%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 40%)"
        }}
      >
        <div className="absolute inset-0 bg-[#FF3300] blur-[150px] opacity-[0.15]" />
        {/* Slanted vertical light bands */}
        <div className="absolute top-[-20%] right-[30%] w-[100px] h-[140%] bg-gradient-to-r from-transparent via-[#FF5500] to-transparent blur-[10px] opacity-20 transform rotate-[15deg] origin-bottom" />
        <div className="absolute top-[-20%] right-[15%] w-[150px] h-[140%] bg-gradient-to-r from-transparent via-[#FF4500] to-transparent blur-[15px] opacity-40 transform rotate-[15deg] origin-bottom" />
        <div className="absolute top-[-20%] right-[-5%] w-[250px] h-[140%] bg-gradient-to-r from-transparent via-[#FF2200] to-transparent blur-[25px] opacity-70 transform rotate-[15deg] origin-bottom" />
        <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[140%] bg-gradient-to-r from-transparent via-[#FF1100] to-transparent blur-[35px] opacity-100 transform rotate-[15deg] origin-bottom" />
      </div>

      <div className="max-w-[1440px] mx-auto px-8 md:px-16 relative z-10">
        
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16 md:mb-24">
          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1"
          >
            <h2 className="font-bold text-white uppercase tracking-tighter" style={{ fontSize: "clamp(50px, 9vw, 130px)", lineHeight: 0.85, fontFamily: "Space Grotesk, sans-serif" }}>
              THE IMPRINT
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60">LEARNING HUB</span>
            </h2>
          </motion.div>

          {/* Top Right: Status */}
          <motion.div
            initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-start lg:items-end gap-2 pt-2 lg:pt-6"
          >
            <div className="flex items-center gap-4">
              <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" style={{ boxShadow: "0 0 12px #FF4500" }} />
              <span className="text-[13px] font-bold text-white/90 uppercase tracking-widest">
                Coming Soon
              </span>
            </div>
            <p className="text-white/40 text-[12px] uppercase tracking-widest text-left lg:text-right mt-3 leading-relaxed">
              Curriculum Development
              <br/>In Progress
            </p>
          </motion.div>
        </div>

        {/* Bottom Description & Form Row */}
        <div className="flex flex-col lg:flex-row justify-between items-end gap-16 mb-16 md:mb-20">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-lg"
          >
            <p className="text-white/60 text-[16px] md:text-[18px] leading-relaxed font-medium">
              Structured courses built by humans, for humans. No AI tutors. No generated content. Real expertise, preserved and taught the way knowledge was always meant to be passed — from one mind to another.
            </p>
          </motion.div>

          {/* CTA Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full lg:w-auto min-w-[320px] max-w-md"
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {submitted ? (
                <div className="w-full flex items-center justify-center h-16 rounded-full text-[15px] font-bold" style={{ background: "rgba(0,217,126,0.12)", border: "1px solid rgba(0,217,126,0.25)", color: "#00D97E" }}>
                  You&apos;re on the waitlist ✓
                </div>
              ) : (
                <div className="relative flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full h-16 px-6 rounded-full text-[15px] text-white placeholder-white/40 outline-none transition-colors"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.12)" }}
                    required
                  />
                  <button
                    type="submit"
                    className="h-16 px-8 rounded-full text-[15px] font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] sm:absolute sm:right-1.5 sm:top-1.5 sm:h-[52px]"
                    style={{ background: "linear-gradient(90deg, #FF6B00 0%, #FF2200 100%)", boxShadow: "0 10px 30px -10px rgba(255,69,0,0.6)" }}
                  >
                    Join Waitlist
                  </button>
                </div>
              )}
              <p className="text-[12px] text-white/30 text-center sm:text-right mt-2 mr-4 uppercase tracking-widest font-semibold">Early Access Pass</p>
            </form>
          </motion.div>
        </div>

        {/* Locked course cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {COURSES.map((course, i) => (
            <motion.div
              key={course.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: "easeOut" }}
              className="relative overflow-hidden flex flex-col items-center justify-center text-center group min-h-[300px] p-8 md:p-10"
              style={{
                background: "linear-gradient(160deg, #0d0402 0%, #020101 100%)",
                border: "1px solid rgba(255,85,0,0.12)",
                borderRadius: "32px",
                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              {/* Tighter Intense Corner/Bottom Glows */}
              <div className="absolute -bottom-20 -left-20 w-[160px] h-[160px] bg-[#FF4500] blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-[100px] h-[100px] bg-[#FF6B00] blur-[40px] opacity-15 pointer-events-none" />

              <div className="relative z-10 w-full flex flex-col items-center">
                {/* Glowing Lock Icon Container */}
                <div className="mb-10 relative flex items-center justify-center">
                  {/* The intense "bulb" glow behind the icon, tightened */}
                  <div className="absolute w-20 h-20 bg-[#FF4500] blur-[25px] opacity-[0.4] group-hover:opacity-[0.6] transition-opacity duration-500" />
                  <div className="absolute w-10 h-10 bg-[#FFaa00] blur-[12px] opacity-80" />
                  <div className="absolute w-5 h-5 bg-[#FFFFFF] blur-[6px] opacity-100" />
                  
                  {/* The Glass Ring */}
                  <div 
                    className="relative w-16 h-16 rounded-full flex items-center justify-center" 
                    style={{ 
                      border: "1px solid rgba(255,255,255,0.2)", 
                      background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.0) 100%)",
                      boxShadow: "inset 0 1px 3px rgba(255,255,255,0.2)",
                      backdropFilter: "blur(2px)"
                    }}
                  >
                    <Lock size={22} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" strokeWidth={2.5} />
                  </div>
                </div>
                
                <h3 className="text-[22px] font-bold text-white mb-3 tracking-tight leading-[1.2] drop-shadow-md px-2">
                  {course.title}
                </h3>
                <p className="text-[14px] text-white/50 font-medium">
                  {course.duration}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
