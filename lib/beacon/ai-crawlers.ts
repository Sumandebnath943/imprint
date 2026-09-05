/**
 * AI crawler detection, for the server side.
 *
 * This deliberately does not live in the visitor beacon. The beacon is a client
 * component that reports after hydration, and none of these agents execute
 * JavaScript — extending it would have produced a detector that could never
 * fire. Detection happens in middleware instead, where the request itself is
 * visible.
 *
 * The two groups answer different questions, and the distinction is the whole
 * reason this exists:
 *
 *   Index crawlers    are building a corpus. Frequent, impersonal, and a sign
 *                     the site is known — nothing more.
 *   Live fetchers     are dispatched mid-conversation. A hit means a person
 *                     asked something and the assistant came here to answer it.
 *                     That is the GEO work paying off, observably.
 *
 * User agents are self-declared and trivially spoofed, so treat a match as
 * "claims to be" rather than proof. Verifying by reverse DNS would mean a
 * lookup inside middleware on every request, which is not a trade worth making
 * for telemetry.
 */

export type CrawlerKind = "index" | "live";

export type AiCrawler = {
  /** Canonical agent name, as the vendor documents it. */
  name: string;
  vendor: string;
  kind: CrawlerKind;
};

/**
 * Matched longest-token-first, because several agents share a prefix —
 * "ChatGPT-User" would otherwise be swallowed by a looser "GPTBot" test, and
 * "Claude-SearchBot" by "ClaudeBot".
 */
const AGENTS: { token: string; crawler: AiCrawler }[] = [
  // Live fetchers — checked first; these are the ones that mean something.
  { token: "chatgpt-user", crawler: { name: "ChatGPT-User", vendor: "OpenAI", kind: "live" } },
  { token: "claude-user", crawler: { name: "Claude-User", vendor: "Anthropic", kind: "live" } },
  { token: "perplexity-user", crawler: { name: "Perplexity-User", vendor: "Perplexity", kind: "live" } },

  // Index and corpus crawlers.
  { token: "oai-searchbot", crawler: { name: "OAI-SearchBot", vendor: "OpenAI", kind: "index" } },
  { token: "claude-searchbot", crawler: { name: "Claude-SearchBot", vendor: "Anthropic", kind: "index" } },
  { token: "perplexitybot", crawler: { name: "PerplexityBot", vendor: "Perplexity", kind: "index" } },
  { token: "applebot-extended", crawler: { name: "Applebot-Extended", vendor: "Apple", kind: "index" } },
  { token: "google-extended", crawler: { name: "Google-Extended", vendor: "Google", kind: "index" } },
  { token: "gptbot", crawler: { name: "GPTBot", vendor: "OpenAI", kind: "index" } },
  { token: "claudebot", crawler: { name: "ClaudeBot", vendor: "Anthropic", kind: "index" } },
  { token: "ccbot", crawler: { name: "CCBot", vendor: "Common Crawl", kind: "index" } },
  { token: "bytespider", crawler: { name: "Bytespider", vendor: "ByteDance", kind: "index" } },
  { token: "meta-externalagent", crawler: { name: "Meta-ExternalAgent", vendor: "Meta", kind: "index" } },
  { token: "amazonbot", crawler: { name: "Amazonbot", vendor: "Amazon", kind: "index" } },
  { token: "youbot", crawler: { name: "YouBot", vendor: "You.com", kind: "index" } },
  { token: "cohere-ai", crawler: { name: "cohere-ai", vendor: "Cohere", kind: "index" } },
  { token: "diffbot", crawler: { name: "Diffbot", vendor: "Diffbot", kind: "index" } },
  { token: "timpibot", crawler: { name: "Timpibot", vendor: "Timpi", kind: "index" } },
];

/** Returns the agent this request claims to be, or null. */
export function identifyAiCrawler(userAgent: string | null): AiCrawler | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  for (const { token, crawler } of AGENTS) {
    if (ua.includes(token)) return crawler;
  }
  return null;
}

/**
 * Paths worth reporting. Assets are noise — a crawler pulling a font or an OG
 * image says nothing about what it is reading.
 */
export function isReportablePath(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) return false;
  if (pathname.startsWith("/api/")) return false;
  return !/\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|mp4|css|js|map)$/i.test(pathname);
}
