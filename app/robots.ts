import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Private areas. Nothing here is useful in an index and some of it is a
 * signed-in user's own data.
 *
 * `/credential/` is deliberately NOT in this list. Those pages carry
 * `robots: { index: false }` in their metadata, and a crawler has to fetch a
 * page to see a meta tag — blocking the path here would leave them
 * unfetchable, un-noindexable, and eligible to appear in results as a bare URL
 * with no title. Disallow and noindex are alternatives, not a pair.
 */
const PRIVATE_PATHS = ["/dashboard/", "/onboarding/", "/api/", "/auth/"];

/**
 * AI crawlers, named explicitly.
 *
 * All of these are already permitted by the `*` rule, so this changes no
 * access. It states a position: IMPRINT wants to be read by assistants, and a
 * named rule is a decision on the record rather than a default nobody chose.
 * The practical benefit is that revoking one later is a one-line edit to a
 * list that already exists, rather than a design question under pressure.
 *
 * They are split by what a visit means, because the two groups answer
 * different questions and you will want to treat them differently one day:
 */
const AI_TRAINING_AND_INDEX = [
  "GPTBot", // OpenAI, corpus
  "OAI-SearchBot", // OpenAI, ChatGPT search index
  "ClaudeBot", // Anthropic, corpus
  "Claude-SearchBot", // Anthropic, search index
  "PerplexityBot", // Perplexity index
  "Google-Extended", // Gemini grounding + AI Overviews eligibility
  "Applebot-Extended", // Apple Intelligence
  "CCBot", // Common Crawl, feeds many downstream models
];

/**
 * Live fetchers: a hit means a real person asked a question and the assistant
 * went to this site to answer it. These are the ones worth alerting on.
 */
const AI_LIVE_FETCHERS = ["ChatGPT-User", "Claude-User", "Perplexity-User"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: AI_TRAINING_AND_INDEX,
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: AI_LIVE_FETCHERS,
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    // `host` dropped: a Yandex extension that Google and Bing both ignore.
    // Canonical origin is asserted by the canonical tags instead.
  };
}
