import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { techArticleNode } from "@/lib/seo/schema";
import JsonLd from "@/components/seo/JsonLd";
import {
  PageShell,
  Section,
  Note,
  Formula,
  Row,
  InlineLink,
} from "@/components/content/ContentPage";

const URL = `${SITE_URL}/methodology`;

export const metadata: Metadata = {
  title: "How the Drift Score Is Calculated",
  description:
    "The complete IMPRINT scoring method: four weighted signals, the exact formula for each, the fallback values, the score bands, and an honest account of where a lexical measure breaks down.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...techArticleNode({
            url: URL,
            headline: "How the IMPRINT Drift Score is calculated",
            description:
              "The complete scoring method behind the IMPRINT Drift Score: four weighted signals, the exact formula for each, and the known limitations of a lexical measure.",
            datePublished: "2026-09-05",
            dateModified: "2026-09-05",
            section: "Methodology",
          }),
        }}
      />

      <PageShell
        eyebrow="Methodology"
        title="How the Drift Score is calculated"
        lede="Every number IMPRINT shows you comes from the arithmetic on this page. It is published in full — including the parts that do not work well — because a score you cannot inspect is a score you have to take on faith."
        byline
        updated="5 September 2026"
        breadcrumbs={[{ name: "Methodology", path: "/methodology" }]}
      >
        <Section id="what-it-measures" title="What the Drift Score measures">
          <p>
            The IMPRINT Drift Score is a 0–100 composite describing how far your current
            thinking sits from your own recorded baseline. Higher means further from
            yourself. It is a measure of distance, not of quality, and it is not
            comparable between people.
          </p>
          <p>
            That last point is the one most often misread. Two people with a Drift Score
            of 60 have moved the same relative distance from completely different
            starting points. The number is only interpretable against your own history,
            which is why IMPRINT shows a series rather than a verdict.
          </p>
          <div className="pt-2">
            <Row what="0 – 39" why="Anchored. Recent work sits close to your baseline." />
            <Row what="40 – 59" why="Drifting. A measurable gap has opened." />
            <Row what="60 – 79" why="Critical. The gap is large and consistent across signals." />
            <Row what="80 – 100" why="Identity Crisis. Recent work bears little resemblance to your baseline." />
          </div>
        </Section>

        <Section id="the-composite" title="The composite">
          <p>
            Four signals are computed independently, each on its own 0–100 scale where
            higher means more drift, then combined by weight and rounded. The result is
            clamped to the 0–100 range.
          </p>
          <Formula>{`drift_score = round(
    baseline_divergence   * 0.40
  + vault_inactivity      * 0.25
  + ai_dependence         * 0.20
  + journal_irregularity  * 0.15
)

drift_score = max(0, min(100, drift_score))`}</Formula>
          <p>
            Baseline divergence carries the heaviest weight because language degrades
            earliest and most visibly under delegation — it is the signal that moves
            first. The remaining three are behavioural, and they move slower.
          </p>
          <Note>
            <strong className="text-white">On the weights.</strong> The 40/25/20/15 split
            is a considered judgement, not an empirically fitted result. There is no
            dataset behind those specific numbers, and a different weighting would
            produce different scores from identical inputs. They are published so you can
            disagree with them.
          </Note>
        </Section>

        <Section id="signal-1" title="Signal 1 — Baseline divergence (40%)">
          <p>
            Baseline divergence measures how far a calibration&rsquo;s language sits from
            the same measures in your baseline. Two sub-signals are used, weighted
            equally: vocabulary richness and average sentence length.
          </p>
          <Formula>{`vocabulary_richness = unique_words / total_words     // type–token ratio
avg_sentence_length = total_words / sentence_count

vocab_divergence    = |cal_richness  - baseline_richness|  / baseline_richness
sentence_divergence = |cal_sent_len  - baseline_sent_len|  / baseline_sent_len

baseline_divergence = min(100,
  round((vocab_divergence * 50 + sentence_divergence * 50) * 100)
)`}</Formula>
          <p>
            Divergence is relative rather than absolute — the difference is divided by
            the baseline value — so the signal means the same thing for someone who
            writes long, dense sentences and someone who writes short, plain ones. The
            baseline figures are the mean across all baseline responses.
          </p>
          <p>
            Where a baseline is missing or empty, the calculation falls back to a
            vocabulary richness of 0.5 and an average sentence length of 15 words. Those
            are placeholders that let scoring proceed, not norms derived from data.
          </p>
        </Section>

        <Section id="signal-2" title="Signal 2 — Vault inactivity (25%)">
          <p>
            Vault inactivity is the share of your tracked skills that have not been
            practised in the last 14 days.
          </p>
          <Formula>{`vault_inactivity = round(
  100 - (skills_practised_in_last_14_days / total_tracked_skills) * 100
)

// with no tracked skills at all:
vault_inactivity = 50`}</Formula>
          <p>
            The 14-day window is deliberately shorter than any decay threshold in the
            skill-retention literature, which puts measurable decline at roughly 60 to 90
            days. The signal is meant to flag a gap while it is still a gap.
          </p>
          <p>
            The empty-vault default of 50 is worth understanding: an empty Skill Vault is
            treated as an unknown rather than as evidence of perfect practice. A new
            account therefore carries a mid-range contribution on this component — about
            12.5 points of the composite — until skills are added.
          </p>
        </Section>

        <Section id="signal-3" title="Signal 3 — AI dependence (20%)">
          <p>
            AI dependence counts dependency flags raised by the Mirror in the last 14
            days. The Mirror is constrained to ask questions; when it detects that you
            are asking it to decide, recommend or produce, it redirects the question back
            to you and records a flag.
          </p>
          <Formula>{`ai_dependence = min(100, dependency_flags_last_14_days * 10)`}</Formula>
          <p>
            The flags record reaching for an answer, not AI use as such. Heavy,
            deliberate AI use outside the Mirror produces none of them.
          </p>
          <Note>
            <strong className="text-white">This scale is arbitrary.</strong> Ten points
            per flag, saturating at ten flags a fortnight, is a design choice with no
            calibration behind it. Someone who uses the Mirror constantly has more
            opportunity to be flagged than someone who barely opens it, so this signal
            partly measures Mirror usage rather than dependence alone.
          </Note>
        </Section>

        <Section id="signal-4" title="Signal 4 — Journal irregularity (15%)">
          <p>
            Journal irregularity is the share of the last 14 days with no journal entry,
            counted by distinct days rather than by number of entries.
          </p>
          <Formula>{`journal_days = count(distinct days with >= 1 entry, last 14 days)

journal_irregularity = round(max(0, 100 - (journal_days / 14) * 100))`}</Formula>
          <p>
            This is the lightest signal at 15 percent, and the most assumption-laden: it
            treats daily writing as the norm and everything below it as irregular. That
            suits some people&rsquo;s working habits and not others.
          </p>
        </Section>

        <Section id="limitations" title="What this does not measure">
          <p>
            The honest account. Each of these is a real weakness in the method as it
            currently stands, not a hypothetical.
          </p>

          <div className="pt-2">
            <Row
              what="Lexical, not semantic"
              why="Type–token ratio, sentence length and latency are proxies for reasoning depth, not measurements of it. You can write with a rich vocabulary and think poorly, and the reverse. Embedding-based semantic signals are the obvious next step and are not implemented."
            />
            <Row
              what="Type–token ratio falls with length"
              why="TTR decreases mechanically as text gets longer, because common words repeat. A calibration substantially longer than your baseline responses will register divergence created by length rather than by any change in thinking. Length-corrected measures such as MTLD exist precisely for this reason and are not used here."
            />
            <Row
              what="Divergence is directionless"
              why="The formula takes an absolute difference, so writing more richly than your baseline registers exactly as much drift as writing less richly. A deliberate improvement in your writing reads as drift."
            />
            <Row
              what="Sentence splitting is naive"
              why="Sentences are counted by splitting on . ! and ?, which miscounts abbreviations, decimals, ellipses and dialogue. Average sentence length inherits that error."
            />
            <Row
              what="Three of four signals measure habits"
              why="Vault inactivity, AI dependence and journal irregularity together carry 60 percent of the score and are all measures of engagement with IMPRINT itself. A fortnight away from the product raises your Drift Score whether or not your thinking changed."
            />
            <Row
              what="No population norms"
              why="There is no comparison group, no validation study and no evidence that a given score corresponds to any external measure of capability. The bands are labels, not diagnostic thresholds."
            />
          </div>

          <Note>
            <strong className="text-white">What that adds up to.</strong> The Drift Score
            is a structured, repeatable prompt to look at your own work, not a clinical
            measure of cognition. It is most useful read as a series, where the habit
            signals are stable and a change in baseline divergence means something. It is
            least useful read as a single number.
          </Note>
        </Section>

        <Section id="why-published" title="Why this is published">
          <p>
            A score you cannot inspect asks for trust it has not earned. Publishing the
            formulas means you can check whether the number means what the interface
            implies, and disagree with the weighting on specific grounds rather than
            general suspicion.
          </p>
          <p>
            The implementation is open source, so the arithmetic above can be checked
            against the code that runs it. Definitions for the terms used here are in the{" "}
            <InlineLink href="/glossary">glossary</InlineLink>, and the common questions
            are answered in the <InlineLink href="/faq">FAQ</InlineLink>.
          </p>
        </Section>
      </PageShell>
    </>
  );
}
