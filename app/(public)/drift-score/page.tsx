import type { Metadata } from "next";
import { PageShell, Section, InlineLink } from "@/components/content/ContentPage";

export const metadata: Metadata = {
  title: "Track change with Imprint",
  description: "Establish your role baseline and track changes in the skills you want to protect or rebuild.",
  alternates: { canonical: "/drift-score" },
};

export default function PublicProgressPage() {
  return (
    <PageShell eyebrow="Progress" title="See how your skills change"
      lede="Start with evidence of what you can do independently. Return to an equivalent task to see how your work changes."
      breadcrumbs={[{ name: "Progress", path: "/drift-score" }]}>
      <Section id="baseline" title="Set your first Imprint">
        <p>Choose the profession and skills you want to assess. Profession-specific scoring is being evaluated in pilots. When your track is available, your first scored work sample establishes your starting proficiency.</p>
      </Section>
      <Section id="recovery" title="Maintain or rebuild a skill">
        <p>Your progress page connects the evidence behind each criterion to practice, AI-use check-ins, and reassessment. Eligible skills can also be compared with reviewed earlier work.</p>
      </Section>
      <Section id="details" title="Understand your results">
        <p>Read the <InlineLink href="/methodology">assessment methodology</InlineLink> or <InlineLink href="/dashboard/drift">open your progress</InlineLink>. Older Drift scores are available in legacy history.</p>
      </Section>
    </PageShell>
  );
}
