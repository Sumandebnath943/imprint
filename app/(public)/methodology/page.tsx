import type { Metadata } from "next";
import { PageShell, Section, Note, Formula, InlineLink } from "@/components/content/ContentPage";

export const metadata: Metadata = {
  title: "How Imprint measures proficiency",
  description: "Role-based work samples, independent practice, and comparisons against your own evidence.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <PageShell eyebrow="Methodology" title="How Imprint measures proficiency"
      lede="Imprint records what you can demonstrate independently today and follows your progress through comparable tasks."
      breadcrumbs={[{ name: "Methodology", path: "/methodology" }]}>
      <Section id="assessment" title="Your role determines the assessment">
        <p>Each profession track uses a work sample and a second task with published criteria. A tester can demonstrate risk-based test design and defect reporting. A developer can demonstrate a change to software behavior and how they would verify it. Scoring is being evaluated in profession-specific pilots.</p>
      </Section>
      <Section id="scoring" title="Your starting proficiency">
        <p>Every criterion receives an evidence-based rubric rating from 0 to 4. Where a task has a built-in objective check, the rubric rating contributes 75% of the criterion score and the check contributes 25%. Both skill scores have equal weight in the current pilots.</p>
        <Formula>{`rubric score = rating × 25
criterion score = round(0.75 × rubric score + 25 × objective check) when a check applies
overall proficiency = round(mean of criterion scores)`}</Formula>
        <p>A first score requires usable evidence for every required criterion. Review the evidence and feedback behind each result, and request an independent review if needed. Pilot results describe the tasks demonstrated. Differences between pilot attempts are descriptive while comparability is being evaluated.</p>
      </Section>
      <Section id="change" title="Change and ongoing practice">
        <p>The first scored attempt is your Original Imprint. Later results are stored separately. The progress page shows differences only across matching role, rubric, and evaluator versions. Practice attendance and reflection habits have their own activity measures. AI Independence counts assessed criteria met under stated independent-attempt conditions. Brief, role-specific check-ins separately record how you report using AI outside Imprint.</p>
      </Section>
      <Section id="history" title="Comparison with earlier work">
        <p>Eligible skills can be compared with at least two dated pieces from the same earlier period. An independent reviewer checks the sources, contribution, and conditions before material is scored. The signed gap uses the shared rubric criteria. The result describes the evidence from the submitted period.</p>
      </Section>
      <Section id="ai" title="How AI is used">
        <p>When AI features are enabled, Gemini assists with rubric scoring, selected media transcription, approved earlier work, and Mirror reflection. Groq handles requests if Gemini is temporarily unavailable. Imprint publishes the criteria, validates scoring inputs, and stores the evidence behind results. Mirror contributes zero scoring points. See the <InlineLink href="/privacy">privacy policy</InlineLink> for processing, access, and deletion details.</p>
      </Section>
      <Section id="legacy" title="Earlier Drift and IMPRINT scores">
        <Note>Older accounts may retain Drift comparison scores and an IMPRINT activity score. The original Drift formula used baseline text divergence (40%), Vault inactivity (25%), Mirror flags (20%), and journal irregularity (15%). The legacy text and activity v2 comparison matches available text modules, removes Mirror flags, and uses the other contributors in their original relative proportions. These methods are marked in the history and describe different evidence from role proficiency.</Note>
      </Section>
    </PageShell>
  );
}
