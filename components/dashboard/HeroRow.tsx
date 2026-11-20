"use client";

import Link from "next/link";
import LocalDate from "@/components/shared/LocalDate";
import type { DashboardChallenge } from "@/lib/dashboard/types";
import type { AssessmentSummary } from "@/lib/assessment/comparison";
import ProficiencySummary from "@/components/assessment/ProficiencySummary";

export default function HeroRow({ proficiency, nextChallenge, dueTask }: {
  proficiency?: AssessmentSummary | null;
  nextChallenge: DashboardChallenge | null;
  dueTask?: { kind: string; due_at: string } | null;
}) {
  return (
    <div className="my-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <section className="rounded-2xl border border-white/10 bg-[#111010] p-6">
        <ProficiencySummary summary={proficiency} />
        {proficiency?.current && <Link className="mt-4 inline-block text-[#ff9c77] underline" href="/dashboard/drift">View your progress</Link>}
      </section>
      <section className="rounded-2xl border border-white/10 bg-[#111010] p-6">
        <h2 className="text-xl font-semibold">Next action</h2>
        {dueTask ? <>
          <p className="mt-3 text-white/80">{dueTask.kind === "check-in" ? "AI-use check-in" : dueTask.kind === "practice" ? "Targeted practice" : "Reassessment"} · Due <LocalDate value={dueTask.due_at} /></p>
          <Link className="mt-4 inline-block text-[#ff9c77] underline" href="/dashboard/drift">Open your tasks</Link>
        </> : nextChallenge ? <>
          <p className="mt-3 text-white/80">{nextChallenge.title ?? "Vault practice"}</p>
          <Link className="mt-4 inline-block text-[#ff9c77] underline" href="/dashboard/vault">Open Skill Vault</Link>
        </> : <>
          <p className="mt-3 text-white/70">{proficiency?.current ? "Review your assessment and practice options." : proficiency?.nextAction ?? "Choose your profession to get started."}</p>
          <Link className="mt-4 inline-block text-[#ff9c77] underline" href="/dashboard/calibration">See assessment and practice options</Link>
        </>}
      </section>
    </div>
  );
}
