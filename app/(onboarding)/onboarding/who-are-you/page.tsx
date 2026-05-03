"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import BottomNav from "@/components/onboarding/BottomNav";
import {
  AGE_GROUPS,
  PROFESSIONS,
  CLUSTER_COLORS,
  CLUSTER_LABELS,
} from "@/lib/onboarding/modules";

const STEP = 2;
const TOTAL = 7;

export default function WhoAreYouPage() {
  const router = useRouter();
  const { answers, setStep, setAgeGroup, setProfession } = useOnboardingStore();

  const [search, setSearch] = useState("");

  const filteredProfessions = useMemo(() => {
    if (!search.trim()) return PROFESSIONS;
    return PROFESSIONS.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const canContinue = !!answers.ageGroup && !!answers.profession;

  const handleContinue = () => {
    setStep(3);
    router.push("/onboarding/ai-exposure");
  };

  const handleBack = () => {
    setStep(1);
    router.push("/onboarding/welcome");
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden px-6 py-32">
      {/* Ghost word */}
      <div
        className="fixed select-none pointer-events-none"
        style={{ fontSize: 200, fontWeight: 700, color: "#FFFFFF", opacity: 0.03, top: "40%", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap", letterSpacing: "-0.04em", zIndex: 0 }}
      >
        HUMAN
      </div>

      <div className="relative z-10 max-w-[720px] w-full mx-auto">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4"
        >
          <h1 className="font-bold leading-tight" style={{ fontSize: "clamp(36px,5vw,48px)" }}>
            <span className="text-white">Tell us who </span>
            <span style={{ color: "#FF5500" }}>you are.</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mb-12"
          style={{ fontSize: 17, color: "rgba(255,255,255,0.50)", maxWidth: 500, lineHeight: 1.7 }}
        >
          Not your job title. Not your LinkedIn bio.<br />Who you actually are, right now.
        </motion.p>

        {/* Age Group */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14 }}
          className="mb-10"
        >
          <p className="uppercase tracking-widest text-xs font-medium mb-4" style={{ color: "rgba(255,255,255,0.50)" }}>
            How old are you?
          </p>
          <div className="flex flex-wrap gap-3">
            {AGE_GROUPS.map((ag) => {
              const selected = answers.ageGroup === ag.value;
              return (
                <button
                  key={ag.value}
                  onClick={() => setAgeGroup(ag.value)}
                  className="rounded-pill px-6 py-3 text-sm font-medium transition-all duration-200"
                  style={{
                    background: selected ? "rgba(255,85,0,0.15)" : "#1A1A1A",
                    border: `1px solid ${selected ? "rgba(255,85,0,0.50)" : "rgba(255,255,255,0.10)"}`,
                    color: selected ? "#FF5500" : "white",
                  }}
                >
                  {ag.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Profession */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.20 }}
        >
          <p className="uppercase tracking-widest text-xs font-medium mb-4" style={{ color: "rgba(255,255,255,0.50)" }}>
            What do you do?
          </p>

          {/* Search */}
          <div className="relative mb-5">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.30)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your profession..."
              className="w-full h-[52px] pl-10 pr-4 text-sm text-white outline-none transition-all duration-200"
              style={{
                background: "#1A1A1A",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12,
                caretColor: "#FF5500",
              }}
              onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(255,85,0,0.50)"; }}
              onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.10)"; }}
            />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {filteredProfessions.map((p) => {
              const selected = answers.profession === p.name;
              const clusterColor = CLUSTER_COLORS[p.cluster] ?? "#FF5500";
              return (
                <button
                  key={p.name}
                  onClick={() => setProfession(p.name, p.cluster)}
                  className="relative text-left rounded-2xl p-4 transition-all duration-200"
                  style={{
                    background: selected ? "rgba(255,85,0,0.10)" : "#111111",
                    border: `1px solid ${selected ? "rgba(255,85,0,0.40)" : "rgba(255,255,255,0.07)"}`,
                    boxShadow: selected ? "0 0 20px rgba(255,85,0,0.08)" : "none",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: clusterColor }} />
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {CLUSTER_LABELS[p.cluster]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                </button>
              );
            })}
          </div>

          {/* Cluster confirmation */}
          <AnimatePresence>
            {answers.profession && answers.professionCluster && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm italic"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                You&apos;re in the{" "}
                <span className="font-medium" style={{ color: CLUSTER_COLORS[answers.professionCluster] }}>
                  {CLUSTER_LABELS[answers.professionCluster]}
                </span>{" "}
                cluster. Your baseline will be tailored for you.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Bottom spacer */}
      <div className="h-28" />

      <BottomNav
        step={STEP}
        total={TOTAL}
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!canContinue}
      />
    </div>
  );
}
