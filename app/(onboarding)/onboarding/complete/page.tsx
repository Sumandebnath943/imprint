"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import { useUserStore } from "@/lib/store/user.store";
import { createClient } from "@/lib/supabase/client";

export default function CompletePage() {
  const router = useRouter();
  const { answers, totalWordCount, reset } = useOnboardingStore();
  const { profile } = useUserStore();
  const [entering, setEntering] = useState(false);

  const moduleCount = Object.keys(answers.baselineResponses).length;
  const skillCount = answers.skills.length;

  const handleEnter = async () => {
    if (!profile?.id) { router.push("/dashboard"); return; }
    setEntering(true);

    try {
      const supabase = createClient();
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);

      // Mark onboarding complete + save all collected profile data
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          onboarding_step: 7,
          age_group: answers.ageGroup ?? null,
          profession: answers.profession ?? null,
          profession_cluster: answers.professionCluster ?? null,
          ai_exposure_level: answers.aiExposureLevel ?? null,
        })
        .eq("id", profile.id);

      // Insert starting drift score (0 = anchored)
      await supabase.from("drift_scores").insert({
        user_id: profile.id,
        score: 0,
        score_label: "anchored",
        delta_from_previous: 0,
        contributing_signals: {},
        week_number: weekNumber,
        year: now.getFullYear(),
      });

      // Insert skills
      if (answers.skills.length > 0) {
        const skillRows = answers.skills.map((s) => ({
          user_id: profile.id,
          skill_name: s.name,
          skill_category: "general",
          cluster: answers.professionCluster,
          strength_level: s.strengthLevel,
          times_practiced: 0,
          decay_rate: 0.5,
        }));
        await supabase.from("skill_vault").insert(skillRows);
      }

      // Clear store
      reset();

      setTimeout(() => router.push("/dashboard"), 700);
    } catch {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 py-20">
      {/* Ghost word */}
      <div
        className="fixed select-none pointer-events-none"
        style={{ fontSize: 160, fontWeight: 700, color: "#FFFFFF", opacity: 0.03, top: "50%", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap", letterSpacing: "-0.04em", zIndex: 0 }}
      >
        IMPRINTED
      </div>

      {/* Large orange glow bloom */}
      <motion.div
        className="fixed pointer-events-none"
        style={{ width: 800, height: 800, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(255,85,0,0.18) 0%, transparent 65%)", filter: "blur(60px)", zIndex: 0 }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.06, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Fade overlay on enter */}
      <AnimatePresence>
        {entering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50"
            style={{ background: "#080808" }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center text-center max-w-[600px] w-full"
      >
        {/* Sonar pulse icon */}
        <div className="relative w-20 h-20 flex items-center justify-center mb-10">
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute rounded-full"
              style={{ border: "1px solid rgba(255,85,0,0.25)" }}
              animate={{ width: [20 + ring * 18, 20 + ring * 36], height: [20 + ring * 18, 20 + ring * 36], opacity: [0.7, 0] }}
              transition={{ duration: 2, delay: ring * 0.5, repeat: Infinity, ease: "easeOut" }}
            />
          ))}
          <div className="w-4 h-4 rounded-full" style={{ background: "#FF5500", boxShadow: "0 0 16px rgba(255,85,0,0.8)" }} />
        </div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-bold mb-6"
          style={{ fontSize: "clamp(44px,6vw,64px)", lineHeight: 0.95 }}
        >
          <span className="text-white block">Your Imprint</span>
          <span style={{ color: "#FF5500" }}>is set.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mb-10"
          style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, maxWidth: 480 }}
        >
          You&apos;ve created your Baseline Imprint. This is the fingerprint of your authentic mind — right now, today.
          <br /><br />
          Every session, challenge, and reflection from here will be measured against this moment.
        </motion.p>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex gap-4 mb-10 flex-wrap justify-center"
        >
          {[
            { label: "Modules Completed", value: moduleCount, color: "white" },
            { label: "Words Written", value: totalWordCount, color: "#FF5500" },
            { label: "Skills Tracked", value: skillCount, color: "white" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl text-center"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", padding: "20px 28px", minWidth: 140 }}
            >
              <p className="font-bold mb-1" style={{ fontSize: 36, color, lineHeight: 1 }}>{value}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.5 }}>{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Drift score ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55, type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center mb-10"
        >
          <svg width={120} height={120} viewBox="0 0 120 120">
            <circle cx={60} cy={60} r={52} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
            <motion.circle
              cx={60} cy={60} r={52}
              fill="none"
              stroke="#00D97E"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 52 * 0.95 }}
              transition={{ duration: 1.5, delay: 0.7, ease: "easeOut" }}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
            <text x={60} y={60} textAnchor="middle" dy="0.3em" fill="white" fontSize={28} fontWeight={700} fontFamily="Space Grotesk, sans-serif">0</text>
          </svg>
          <p className="text-sm mt-3" style={{ color: "rgba(255,255,255,0.45)" }}>Your starting Drift Score</p>
          <p className="text-sm font-medium mt-1" style={{ color: "#00D97E" }}>Anchored. Completely you.</p>
        </motion.div>

        {/* CTA */}
        <motion.button
          onClick={handleEnter}
          disabled={entering}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(255,85,0,0.40)" }}
          whileTap={{ scale: 0.97 }}
          className="h-14 px-10 rounded-pill text-white font-medium text-base mb-5"
          style={{ background: "#FF5500", boxShadow: "0 0 24px rgba(255,85,0,0.25)" }}
        >
          Enter IMPRINT →
        </motion.button>

        <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>
          Your first Vault Challenge drops in 24 hours.
        </p>
      </motion.div>
    </div>
  );
}
