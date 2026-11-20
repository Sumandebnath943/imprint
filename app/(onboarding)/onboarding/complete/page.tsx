"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StepLayout from "@/components/onboarding/StepLayout";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import { buildModuleList } from "@/lib/onboarding/modules";
import { WorkspaceScoring, workspaceRequest, type WorkspaceView } from "@/components/onboarding/WorkspaceFlow";

export default function CompletePage() {
  const router = useRouter();
  const { answers, reset, setStep, setBaselineModules } = useOnboardingStore();
  const [entering, setEntering] = useState(false);

  const [error, setError] = useState("");
  const [needsBaseline, setNeedsBaseline] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceView>();
  const skillCount = answers.skills.length;

  useEffect(() => {
    const controller = new AbortController();
    void workspaceRequest(undefined, true, controller.signal).then((view) => {
      if (!controller.signal.aborted) setWorkspace(view);
    }).catch(() => {});
    return () => controller.abort();
  }, []);

  const handleEnter = async () => {
    if (entering || scoring) return;
    setEntering(true);
    setError("");
    try {
      const response = await fetch("/api/onboarding/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profession: answers.profession,
          ageGroup: answers.ageGroup,
          aiExposureLevel: answers.aiExposureLevel,
          aiUseContext: answers.aiUseContext,
          reflection: answers.aiReflectionNote,
          skills: answers.skills,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        setNeedsBaseline(response.status === 409);
        throw new Error(data.error ?? "Could not finish onboarding.");
      }
      reset();
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not finish onboarding.");
      setEntering(false);
    }
  };

  return (
    <StepLayout title="Finish onboarding" description="Save your setup to open your dashboard and start practicing." variant="centered">
      <div className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <p className="text-white/80">{answers.profession} / {skillCount} skills selected</p>
        {workspace?.workspace && <WorkspaceScoring initial={workspace} onBusy={setScoring} onboarding />}
        {error && <p role="alert" className="text-sm text-[#ffad89]">{error}</p>}
        {needsBaseline ? (
          <button className="min-h-11 rounded-xl bg-[#ff713d] px-5 font-semibold text-on-accent" onClick={() => {
            if (!answers.workspaceId && !workspace?.workspace && !answers.baselineModules.length) setBaselineModules(buildModuleList(answers.professionCluster));
            setStep(5);
            router.push("/onboarding/baseline");
          }}>Return to baseline questions</button>
        ) : (
          <button onClick={handleEnter} disabled={entering || scoring} className="min-h-11 rounded-xl bg-[#ff713d] px-5 font-semibold text-on-accent disabled:opacity-60">
            {entering ? "Saving your setup..." : "Enter IMPRINT →"}
          </button>
        )}
      </div>
    </StepLayout>
  );
}
