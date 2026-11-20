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
        <p>Onboarding includes seven questions. Questions 5 and 6 use work samples and published criteria for your selected profession. Evaluation requires consent. You can separately choose feedback on the reasoning in Questions 1–3. Emotional and personal reflections stay private. Calibration provides practice and reassessment.</p>
        <p>Illustrator work samples use an original thumbnail and a revision to assess storytelling and composition. The Software Developer assessment uses an isolated runner to check behavior at Basic, Intermediate, or Advanced difficulty. A planning alternative receives separate feedback when it shows a different kind of evidence.</p>
      </Section>
      <Section id="scoring" title="Your starting proficiency">
        <p>Every criterion receives an evidence-based rubric rating from 0 to 4. Where a task has a built-in objective check, the rubric rating contributes 75% of the criterion score and the check contributes 25%. Both skill scores have equal weight in the current pilots.</p>
        <Formula>{`rubric score = rating × 25
criterion score = round(0.75 × rubric score + 25 × objective check) when a check applies
overall proficiency = round(mean of criterion scores)`}</Formula>
        <p>A first score requires usable evidence for every required criterion. Review the evidence and feedback behind each result, and request an independent review if needed. Pilot results describe the tasks demonstrated. Differences between pilot attempts are descriptive while comparability is being evaluated.</p>
      </Section>
      <Section id="change" title="Change and ongoing practice">
        <p>The first scored attempt in a series is your Original Imprint. Each reassessment produces its own result. Progress shows an observed difference for matching role, rubric, evaluator, primary model, difficulty, and evidence policy. A trend needs repeated comparable results and evidence of ordinary variation. Practice, attendance, and AI-use check-ins have separate activity records.</p>
      </Section>
      <Section id="history" title="Comparison with earlier work">
        <p>Eligible skills can be compared with at least two dated pieces from the same earlier period. An independent reviewer checks the sources, contribution, and conditions before material is scored. The signed gap uses the shared rubric criteria. The result describes the evidence from the submitted period.</p>
      </Section>
      <Section id="ai" title="How AI is used">
        <p>When AI features are enabled, Gemini assists with rubric scoring, selected media transcription, approved earlier work, and Mirror reflection. Groq retries eligible requests during a temporary Gemini failure. Fallback results remain available in your history while model equivalence is being evaluated. See the <InlineLink href="/privacy">privacy policy</InlineLink> for processing, access, and deletion details.</p>
      </Section>
      <Section id="legacy" title="Earlier Drift and IMPRINT scores">
        <Note>Older accounts may retain Drift comparison scores and an IMPRINT activity score. The original Drift formula used baseline text divergence (40%), Vault inactivity (25%), Mirror flags (20%), and journal irregularity (15%). The legacy text and activity v2 comparison matches available text modules, removes Mirror flags, and uses the other contributors in their original relative proportions. These methods are marked in the history and describe different evidence from role proficiency.</Note>
      </Section>
    </PageShell>
  );
}
