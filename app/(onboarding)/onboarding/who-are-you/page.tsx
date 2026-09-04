"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import BottomNav from "@/components/onboarding/BottomNav";
import StepLayout from "@/components/onboarding/StepLayout";
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
    <>
      <StepLayout
        ghost="HUMAN"
        eyebrow="Step 2 · About you"
        title={
          <>
            Tell us who <span style={{ color: "#FF5500" }}>you are.</span>
          </>
        }
        description={
          <>
            Not your job title. Not your LinkedIn bio.
            <br />
            Who you actually are, right now.
          </>
        }
        aside={
          <AnimatePresence>
            {answers.profession && answers.professionCluster && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm"
                style={{ color: "rgba(255,255,255,0.66)" }}
              >
                You&apos;re in the{" "}
                <span
                  className="font-medium"
                  style={{ color: CLUSTER_COLORS[answers.professionCluster] }}
                >
                  {CLUSTER_LABELS[answers.professionCluster]}
                </span>{" "}
                cluster. Your baseline will be tailored for you.
              </motion.p>
            )}
          </AnimatePresence>
        }
        wide
      >
        {/* Age — a short row, so it stays fixed above the scrolling grid. */}
        <div className="shrink-0 mb-6">
          <p
            className="uppercase tracking-widest text-[11px] font-medium mb-3"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            How old are you?
          </p>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map((g) => {
              const selected = answers.ageGroup === g.value;
              return (
                <button
                  key={g.value}
                  onClick={() => setAgeGroup(g.value)}
                  className="rounded-full px-5 h-11 text-sm font-medium transition-all duration-200"
                  style={{
                    background: selected ? "rgba(255,85,0,0.12)" : "#141414",
                    border: `1px solid ${selected ? "rgba(255,85,0,0.45)" : "rgba(255,255,255,0.08)"}`,
                    color: selected ? "#FF5500" : "rgba(255,255,255,0.72)",
                  }}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search — pinned, so filtering never scrolls out of reach. */}
        <div className="shrink-0 mb-3">
          <div className="flex items-baseline justify-between mb-3">
            <p
              className="uppercase tracking-widest text-[11px] font-medium"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              What do you do?
            </p>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              {filteredProfessions.length} of {PROFESSIONS.length}
            </span>
          </div>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "rgba(255,255,255,0.5)" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your profession..."
              className="w-full h-12 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200"
              style={{
                background: "#141414",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12,
                caretColor: "#FF5500",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid rgba(255,85,0,0.50)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid rgba(255,255,255,0.10)";
              }}
            />
          </div>
        </div>

        {/* The list is 35 items — it cannot fit on one screen and should not
            try. It scrolls in its own pane with a floor of 260px, so there is
            always more than a sliver of it visible. */}
        <div
          className="scroll-pane grid grid-cols-2 sm:grid-cols-3 gap-2.5 content-start pr-2 -mr-2 min-h-[260px] lg:flex-1 lg:min-h-[260px]"
        >
          {filteredProfessions.map((p) => {
            const selected = answers.profession === p.name;
            const clusterColor = CLUSTER_COLORS[p.cluster] ?? "#FF5500";
            return (
              <button
                key={p.name}
                onClick={() => setProfession(p.name, p.cluster)}
                className="relative text-left rounded-xl p-3.5 transition-all duration-200 h-fit"
                style={{
                  background: selected ? "rgba(255,85,0,0.10)" : "#111111",
                  border: `1px solid ${selected ? "rgba(255,85,0,0.45)" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: clusterColor }}
                  />
                  <span
                    className="text-[10px] truncate"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {CLUSTER_LABELS[p.cluster]}
                  </span>
                </div>
                <p className="text-[13px] font-medium text-white leading-snug">
                  {p.name}
                </p>
              </button>
            );
          })}

          {filteredProfessions.length === 0 && (
            <p
              className="col-span-full text-sm py-8 text-center"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              No profession matches “{search}”. Try a broader word.
            </p>
          )}
        </div>
      </StepLayout>

      <BottomNav
        step={STEP}
        total={TOTAL}
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!canContinue}
      />
    </>
  );
}
