"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function FinalCTASection() {
  return (
    <section className="relative py-40 overflow-hidden text-center" style={{ background: "#080808" }}>

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-12">
        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }}
          className="font-bold mx-auto mb-8"
          style={{ fontSize: "clamp(48px,6vw,72px)", lineHeight: 0.95, letterSpacing: "-0.03em", maxWidth: 700 }}
        >
          <span className="block text-white">The machine is not</span>
          <span className="block text-white">replacing you.</span>
          <span className="block" style={{ color: "#FF5500" }}>Not today.</span>
        </motion.h2>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-12"
          style={{ fontSize: 20, color: "rgba(255,255,255,0.55)", maxWidth: 480, lineHeight: 1.7 }}
        >
          Your Baseline Imprint takes 12 minutes.{" "}
          <br className="hidden sm:block" />
          Your identity is worth more than that.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-14 px-10 rounded-pill font-bold text-white text-base"
              style={{ background: "#FF5500", boxShadow: "0 0 40px rgba(255,85,0,0.35), 0 4px 20px rgba(255,85,0,0.20)" }}
            >
              Begin Your Imprint
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/signin"
              className="inline-flex items-center justify-center h-14 px-10 rounded-pill font-medium text-white text-base hover:bg-white/5 transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.20)" }}
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5 }}
          className="text-xs"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Used by 2,400+ humans across 47 professions
        </motion.p>
      </div>
    </section>
  );
}
