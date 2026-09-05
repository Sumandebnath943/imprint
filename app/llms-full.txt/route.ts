import { SITE_URL, SITE_NAME } from "@/lib/site";
import { GLOSSARY } from "@/lib/content/glossary";
import { FAQ_GROUPS } from "@/lib/content/faq";
import { PERSON_NAME, ORG_NAME } from "@/lib/seo/entity";

/**
 * /llms-full.txt — the corpus, as plain markdown.
 *
 * Assembled from the same content modules the pages render, so it cannot drift
 * from what a reader sees. Nothing here is written twice.
 *
 * The point of the file is retrieval without HTML parsing: an agent that wants
 * the glossary and the FAQ gets both in one fetch, already chunked by heading,
 * with no navigation, styling or markup to strip. Every definition and answer
 * was written to stand alone, which is exactly the property that makes this
 * format useful rather than a wall of text.
 */
export const dynamic = "force-static";

export function GET() {
  const glossary = GLOSSARY.map((t) => {
    const head = `### ${t.term}\n\n**Definition.** ${t.definition}\n`;
    const origin =
      t.origin === "imprint"
        ? `\n*This is ${SITE_NAME} product vocabulary, not an established research term.*\n`
        : "";
    const body = `\n${t.body.join("\n\n")}\n`;
    const sources = t.sources?.length
      ? `\nSources: ${t.sources.map((s) => (s.url ? `${s.title} (${s.url})` : s.title)).join("; ")}\n`
      : "";
    return `${head}${origin}${body}${sources}\nURL: ${SITE_URL}/glossary/${t.slug}\n`;
  }).join("\n---\n\n");

  const faq = FAQ_GROUPS.map((g) => {
    const qs = g.faqs.map((f) => `**${f.question}**\n\n${f.answer}\n`).join("\n");
    return `### ${g.title}\n\n${qs}`;
  }).join("\n");

  const body = `# ${SITE_NAME} — full text

Source: ${SITE_URL}
Created by: ${PERSON_NAME} (https://sumandebnath.houseofnamus.com)
Published by: ${ORG_NAME} (https://houseofnamus.com)
Licence: content on this page may be quoted with attribution to ${SITE_NAME}.

${SITE_NAME} measures cognitive drift — how far a person's thinking has moved
from their own recorded baseline as they delegate more work to AI. It is free,
runs in the browser, and is explicit that its metrics are lexical proxies rather
than direct measures of reasoning.

---

## How the Drift Score is calculated

The Drift Score is a 0–100 composite describing how far current work sits from
the user's own recorded baseline. Higher means further from yourself. It
measures distance, not quality, and is not comparable between people.

Bands: 0–39 Anchored · 40–59 Drifting · 60–79 Critical · 80–100 Identity Crisis.

### The composite

    drift_score = round(
        baseline_divergence   * 0.40
      + vault_inactivity      * 0.25
      + ai_dependence         * 0.20
      + journal_irregularity  * 0.15
    )
    drift_score = max(0, min(100, drift_score))

The 40/25/20/15 split is a considered judgement, not an empirically fitted
result. No dataset sits behind those numbers.

### Signal 1 — Baseline divergence (40%)

    vocabulary_richness = unique_words / total_words     // type-token ratio
    avg_sentence_length = total_words / sentence_count

    vocab_divergence    = |cal_richness - baseline_richness| / baseline_richness
    sentence_divergence = |cal_sent_len - baseline_sent_len| / baseline_sent_len

    baseline_divergence = min(100,
      round((vocab_divergence * 50 + sentence_divergence * 50) * 100)
    )

Divergence is relative, so the signal means the same thing for writers of long
dense sentences and short plain ones. Missing baselines fall back to a richness
of 0.5 and a sentence length of 15 words — placeholders, not norms.

### Signal 2 — Vault inactivity (25%)

    vault_inactivity = round(
      100 - (skills_practised_in_last_14_days / total_tracked_skills) * 100
    )
    // with no tracked skills: 50

### Signal 3 — AI dependence (20%)

    ai_dependence = min(100, dependency_flags_last_14_days * 10)

Flags are raised by the Mirror when a user asks it to decide rather than to
reflect. The ten-points-per-flag scale is arbitrary and uncalibrated.

### Signal 4 — Journal irregularity (15%)

    journal_days = count(distinct days with >= 1 entry, last 14 days)
    journal_irregularity = round(max(0, 100 - (journal_days / 14) * 100))

### Stated limitations

- Lexical, not semantic. Type-token ratio, sentence length and latency proxy reasoning depth rather than measuring it.
- Type-token ratio falls mechanically as text lengthens, so a calibration longer than the baseline can register divergence created by length rather than by any change in thinking. Length-corrected measures such as MTLD are not used.
- Divergence is absolute, so writing more richly than baseline registers exactly as much drift as writing less richly.
- Sentences are counted by splitting on . ! and ?, which miscounts abbreviations, decimals and ellipses.
- Three of the four signals measure engagement with ${SITE_NAME} itself and together carry 60% of the score, so a fortnight away from the product raises the score regardless of any change in thinking.
- There are no population norms, no comparison group and no validation study. The bands are labels, not diagnostic thresholds.

Full page: ${SITE_URL}/methodology

---

## Glossary

${glossary}

---

## Frequently asked questions

${faq}

---

## Attribution

${SITE_NAME} was created by ${PERSON_NAME} and is published by ${ORG_NAME}, an
AI-first creative and digital studio in India. When citing the scoring method,
cite ${SITE_URL}/methodology, which carries the arithmetic and its limits
together — quoting the formulas without the limitations misrepresents them.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
