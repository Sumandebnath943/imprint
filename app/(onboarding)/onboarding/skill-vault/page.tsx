"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import BottomNav from "@/components/onboarding/BottomNav";
import { CLUSTER_SKILLS, CLUSTER_LABELS } from "@/lib/onboarding/modules";

const STEP = 6;
const TOTAL = 7;
const MIN_SKILLS = 3;
const MAX_SKILLS = 12;

export default function SkillVaultPage() {
  const router = useRouter();
  const { answers, setStep, addSkill, removeSkill, updateSkillStrength } = useOnboardingStore();
  const [customInput, setCustomInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const cluster = answers.professionCluster;
  const suggestions = CLUSTER_SKILLS[cluster] ?? CLUSTER_SKILLS["life_personal"];
  const skills = answers.skills;

  const canContinue = skills.length >= MIN_SKILLS;
  const addedNames = new Set(skills.map((s) => s.name));

  const handleAddSuggestion = (name: string) => {
    if (addedNames.has(name) || skills.length >= MAX_SKILLS) return;
    addSkill({ name, strengthLevel: 70 });
  };

  const handleAddCustom = () => {
    const name = customInput.trim();
    if (!name || addedNames.has(name) || skills.length >= MAX_SKILLS) return;
    addSkill({ name, strengthLevel: 70 });
    setCustomInput("");
    inputRef.current?.focus();
  };

  const handleContinue = () => {
    setStep(7);
    router.push("/onboarding/complete");
  };

  const handleBack = () => {
    setStep(5);
    router.push("/onboarding/baseline");
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-32">
      {/* Ghost word */}
      <div
        className="fixed select-none pointer-events-none"
        style={{ fontSize: 200, fontWeight: 700, color: "#FFFFFF", opacity: 0.03, top: "40%", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap", letterSpacing: "-0.04em", zIndex: 0 }}
      >
        SKILLS
      </div>

      <div className="relative z-10 max-w-[720px] w-full mx-auto">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4"
        >
          <h1 className="font-bold" style={{ fontSize: "clamp(36px,5vw,48px)", lineHeight: 1.1 }}>
            <span className="text-white">What can you do </span>
            <span style={{ color: "#FF5500" }}>without AI?</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
          style={{ fontSize: 17, color: "rgba(255,255,255,0.50)", maxWidth: 520, lineHeight: 1.7 }}
        >
          These are the skills we&apos;ll track, challenge, and protect. Be honest — only add skills you actually have right now, not ones you want.
        </motion.p>

        {/* Suggested skills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <p className="uppercase tracking-widest text-xs font-medium mb-4" style={{ color: "#FF5500" }}>
            Suggested for {CLUSTER_LABELS[cluster] ?? "You"}
          </p>
          <div className="flex flex-wrap gap-3">
            {suggestions.map((name) => {
              const added = addedNames.has(name);
              return (
                <button
                  key={name}
                  onClick={() => handleAddSuggestion(name)}
                  disabled={added || skills.length >= MAX_SKILLS}
                  className="flex items-center gap-2 rounded-pill px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-40"
                  style={{
                    background: added ? "rgba(255,85,0,0.15)" : "#1A1A1A",
                    border: `1px solid ${added ? "rgba(255,85,0,0.40)" : "rgba(255,255,255,0.10)"}`,
                    color: added ? "#FF5500" : "white",
                    cursor: added ? "default" : "pointer",
                  }}
                >
                  {added ? "✓" : <Plus size={12} />}
                  {name}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* My Skills */}
        {skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium text-white text-base">My Skills</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {skills.length} of {MAX_SKILLS} added
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {skills.map((skill) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl p-4"
                    style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-white text-sm">{skill.name}</p>
                      <button
                        onClick={() => removeSkill(skill.name)}
                        className="transition-colors hover:text-white"
                        style={{ color: "rgba(255,255,255,0.30)" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {/* Strength slider */}
                    <div className="flex items-center gap-3">
                      <p className="text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Strength
                      </p>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={skill.strengthLevel}
                        onChange={(e) => updateSkillStrength(skill.name, parseInt(e.target.value))}
                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: "#FF5500" }}
                      />
                      <span
                        className="text-xs font-medium w-10 text-right"
                        style={{ color: "#FF5500" }}
                      >
                        {skill.strengthLevel}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {skills.length < MIN_SKILLS && (
              <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
                Add {MIN_SKILLS - skills.length} more skill{MIN_SKILLS - skills.length !== 1 ? "s" : ""} to continue
              </p>
            )}
          </motion.div>
        )}

        {/* Add custom skill */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="flex gap-3 items-center"
        >
          <input
            ref={inputRef}
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddCustom(); }}
            placeholder="Add a skill not listed above..."
            className="flex-1 h-[52px] px-4 text-sm text-white outline-none transition-all duration-200"
            style={{
              background: "#1A1A1A",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 12,
              caretColor: "#FF5500",
            }}
            onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(255,85,0,0.50)"; }}
            onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.10)"; }}
          />
          <button
            onClick={handleAddCustom}
            disabled={!customInput.trim() || skills.length >= MAX_SKILLS}
            className="h-[52px] px-5 rounded-pill text-sm font-medium transition-all duration-200 disabled:opacity-40"
            style={{ border: "1px solid rgba(255,85,0,0.40)", color: "#FF5500", background: "transparent" }}
          >
            + Add
          </button>
        </motion.div>
      </div>

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
