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

${SITE_NAME} helps people preserve and rebuild independent skills.

## Assessment and progress

Enabled role pilots use two work samples with published criteria. Each rating
is anchored from 0 to 4. The rubric rating times 25 gives the criterion score.
Where a task has an objective check, use 75 percent rubric and 25 percent check.
The overall proficiency score is the rounded average of the two criterion scores.

The first score is the user's Original Imprint. Practice is recorded alongside
new assessment results. AI-use check-ins describe reported behavior outside
Imprint. Mirror reflection contributes zero scoring points.

Eligible earlier work receives independent provenance review and shares a
criterion with the live assessment. A gap requires at least two approved pieces
from the same period. Results using legacy Drift calculations remain in archive.

Full method: ${SITE_URL}/methodology

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
