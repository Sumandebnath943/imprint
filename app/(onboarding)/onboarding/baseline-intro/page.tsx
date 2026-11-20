"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Timer, Lock, Brain } from "lucide-react";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import { buildModuleList } from "@/lib/onboarding/modules";
import BottomNav from "@/components/onboarding/BottomNav";
import StepLayout from "@/components/onboarding/StepLayout";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { getOnboardingWorkspace } from "@/lib/onboarding/workspace-catalog";
import { workspaceRequest } from "@/components/onboarding/WorkspaceFlow";

const STEP = 4;
const TOTAL = 7;

const RULE_CARDS = [
  {
    icon: Timer,
    title: "Timed prompts.",
    sub: "Work at your own pace within each window.",
  },
  {
    icon: Lock,
    title: "Fully private.",
    sub: "Only you see this. Never used for training AI.",
  },
  {
    icon: Brain,
    title: "No AI. Just you.",
    sub: "No autocorrect. No suggestions. Pure you.",
  },
];

export default function BaselineIntroPage() {
  const router = useRouter();
  const { answers, setStep, setBaselineModules, setWorkspaceId } = useOnboardingStore();
  const role = findRoleTrack(answers.profession);
  const legacy = Boolean(!answers.workspaceId && (answers.baselineModules.length || Object.keys(answers.baselineResponses).length));
  const [difficulty, setDifficulty] = useState("Basic");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const handleBegin = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (legacy) {
        const modules = buildModuleList(answers.professionCluster);
        if (answers.baselineModules.map(({ id }) => id).join() !== modules.map(({ id }) => id).join()) setBaselineModules(modules);
      } else {
        const { workspace } = await workspaceRequest({ action: "open", difficulty });
        if (!workspace) throw new Error("Your workspace could not be opened.");
        setWorkspaceId(workspace.id);
      }
      setStep(5);
      router.push("/onboarding/baseline");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Your workspace could not be opened.");
      setBusy(false);
    }
  };

  const handleBack = () => {
    setStep(3);
    router.push("/onboarding/ai-exposure");
  };

  return (
    <>
      <StepLayout
        title="Capture your baseline"
        description={legacy ? "Continue the seven questions in your saved baseline." : "Answer seven questions. Questions 5 and 6 use your profession’s workspace. At the end you can choose whether to send your work samples for evaluation."}
      >
        {/* Beside the rules rather than under them, which is what keeps this
            step on one screen without a scroll region. */}
        <div className="flex flex-col gap-3 lg:justify-center lg:h-full">
          {role && !legacy && <section className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-medium text-white">{role.name} workspace</h2>
            {[5, 6].map((question) => <p key={question} className="text-sm text-white/75">Question {question} · {getOnboardingWorkspace(role.id, question)?.name}</p>)}
            {role.id === "software-developer" && !answers.workspaceId && <div className="text-sm text-white/75">
              <label htmlFor="workspace-difficulty">Level</label>
              <select id="workspace-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="ml-3 rounded-lg border border-white/10 bg-[#171717] px-3 py-2">
                {["Basic", "Intermediate", "Advanced"].map((level) => <option key={level}>{level}</option>)}
              </select>
            </div>}
          </section>}
          {(legacy ? RULE_CARDS : RULE_CARDS.slice(1).map((card) => card.icon === Lock ? {
            ...card, title: "Private reflections", sub: "Emotional and personal reflections stay private. Evaluation always requires your consent.",
          } : { ...card, title: "Use your own work", sub: "Use the provided fictional scenario or materials you have permission to share." })).map(({ icon: Icon, title, sub }) => (
            <div
              key={title}
              className="rounded-2xl p-5 flex items-start gap-4"
              style={{
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <Icon
                size={20}
                style={{ color: "#FF5500", flexShrink: 0, marginTop: 2 }}
              />
              <div>
                <p className="text-[15px] font-medium text-white mb-1">{title}</p>
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {sub}
                </p>
              </div>
            </div>
          ))}
          {error && <p role="alert" className="text-sm text-[#ffad89]">{error}</p>}
        </div>
      </StepLayout>

      <BottomNav
        step={STEP}
        total={TOTAL}
        onBack={handleBack}
        onContinue={handleBegin}
        continueLabel={busy ? "Opening workspace…" : "Begin My Baseline →"}
        continueDisabled={busy}
      />
    </>
  );
}
