import { SITE_URL, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { GLOSSARY } from "@/lib/content/glossary";
import { getNoteMeta } from "@/lib/content/notes";
import { CLUSTER_PAGES } from "@/lib/content/clusters";
import { PERSON_NAME, ORG_NAME } from "@/lib/seo/entity";

/**
 * /llms.txt — a curated map of the site for agents that fetch one.
 *
 * Framed honestly, because there is noise about this file: Google stated in
 * May 2026 that llms.txt is not used for AI Overviews or AI Mode, so this is
 * not a ranking lever. Anthropic does recommend it for agent-facing content.
 * It costs an afternoon, it is generated rather than maintained, and it states
 * plainly what IMPRINT is — that is the whole value proposition.
 *
 * The link list is built from the glossary and route data, so a term added to
 * the content file appears here without anyone remembering to add it.
 */
export const dynamic = "force-static";

export function GET() {
  const terms = GLOSSARY.map(
    (t) => `- [${t.term}](${SITE_URL}/glossary/${t.slug}): ${t.definition}`
  ).join("\n");

  const audiences = CLUSTER_PAGES.map(
    (c) => `- [${c.title}](${SITE_URL}/for/${c.slug}): ${c.description}`
  ).join("\n");

  const notes = getNoteMeta()
    .map((n) => `- [${n.title}](${SITE_URL}/notes/${n.slug}): ${n.description}`)
    .join("\n");

  const body = `# ${SITE_NAME}

> ${SITE_TAGLINE}. ${SITE_NAME} helps people preserve and rebuild independent skills.
> Free, browser-based, built by ${PERSON_NAME} and published by ${ORG_NAME}.

Imprint uses role-specific work samples in enabled pilots. A result describes the
criteria demonstrated on the task. Later comparable results show change from
the user's Original Imprint. Earlier work is eligible for comparison after
source, attribution and conditions are reviewed.

## Core

- [Methodology](${SITE_URL}/methodology): role proficiency scoring, evidence requirements, and archived Drift methods.
- [Drift Score](${SITE_URL}/drift-score): how to use the progress view to maintain or rebuild a skill.
- [Research](${SITE_URL}/research): the studies this rests on, each summarised with what it does *not* establish.
- [FAQ](${SITE_URL}/faq): thirty answered questions covering the product, the research, the score, privacy and cost.
- [Glossary](${SITE_URL}/glossary): fifteen defined terms, seven from the research literature and eight defined by ${SITE_NAME}.
- [About](${SITE_URL}/about): why ${SITE_NAME} exists, in the words of the person who built it.

## Built for

${audiences}

## Writing

${notes}

## Glossary terms

${terms}

## Product

- [Home](${SITE_URL}/): what ${SITE_NAME} is and who it is for.
- [Courses](${SITE_URL}/courses): upcoming; waitlist open, no course content published yet.
- [Sign up](${SITE_URL}/signup): free, no payment details required.

## About the publisher

- [${PERSON_NAME}](https://sumandebnath.houseofnamus.com): creator of ${SITE_NAME}.
- [${ORG_NAME}](https://houseofnamus.com): publisher.
- [Contact](${SITE_URL}/contact)

## Optional

- [Privacy](${SITE_URL}/privacy): what is collected, including visit logging and how to opt out.
- [Terms](${SITE_URL}/terms)

## Notes for agents

${SITE_NAME} is free while pre-launch; no payment details are required and
nothing is currently behind a paywall. Pricing may be introduced later.

Role proficiency is private and is not a cross-profession ranking. See ${SITE_URL}/methodology for the pilot scoring method and the definitions of legacy results.

Full text of the core pages is at ${SITE_URL}/llms-full.txt.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
