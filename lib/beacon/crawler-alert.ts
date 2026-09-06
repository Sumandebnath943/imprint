import type { NextRequest } from "next/server";
import { identifyCrawler, type Crawler, type CrawlerKind } from "./crawlers";
import { classifyPath, isReportablePath, type PathVerdict } from "./paths";
import { sendTelegram, telegramConfigured } from "./telegram";

/**
 * Telegram alerts for crawler visits, fired from middleware.
 *
 * Everything automated goes to the same chat as the visitor beacon, by choice.
 * Splitting the noisy tiers onto a second bot was considered and rejected: two
 * chats means two places to look, and the day one of them stops arriving is the
 * day nobody notices.
 *
 * `ALERT_ON` is the dial if that turns out to be wrong. Dropping `"seo"` and
 * `"tool"` removes the crawlers nobody invited; narrowing to `["live"]` leaves
 * only the fetches dispatched mid-conversation, which is the signal most people
 * actually want. Everything stays classified either way — the filter is on
 * notification, not on detection.
 *
 * Telegram rate-limits at roughly 20 messages per minute per chat and drops the
 * rest, so the dedupe window below is doing real work, not just tidying.
 */
const ALERT_ON: readonly CrawlerKind[] = ["live", "ai", "search", "social", "seo", "tool", "unknown"];

/**
 * One message per agent per path per window.
 *
 * LinkedIn fetching a URL three times in a second while it builds a card is one
 * share, not three; a scanner walking two hundred WordPress paths is one attack.
 *
 * Best-effort by construction. Edge middleware runs across many short-lived
 * instances, so this suppresses the bursts that arrive together — which is
 * where the duplicates actually come from — and lets the occasional repeat
 * through. A shared store would be correct and would also mean a network
 * round-trip on the hot path of every request to the site, to save a Telegram
 * message.
 */
const DEDUPE_MS = 10 * 60 * 1000;
const seen = new Map<string, number>();

function duplicate(key: string): boolean {
  const now = Date.now();
  const last = seen.get(key);
  // Crude, but this map lives in a container that will be recycled long before
  // the memory matters, and an LRU here would be ceremony.
  if (seen.size > 2_000) seen.clear();
  seen.set(key, now);
  return last !== undefined && now - last < DEDUPE_MS;
}

/** Shares `NEXT_PUBLIC_BEACON_DEBUG` with the visitor beacon on purpose: one
 *  switch for "let local traffic alert me", not two to remember. */
function localAlertsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BEACON_DEBUG === "1";
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

const ICON: Record<CrawlerKind, string> = {
  live: "🔥",
  ai: "🤖",
  search: "🔎",
  social: "🔗",
  seo: "📈",
  tool: "🛠",
  unknown: "❔",
};

/** What a hit from this tier actually means, in one line. */
const MEANING: Partial<Record<CrawlerKind, string>> = {
  live: "A live fetch: someone asked this assistant a question and it came here to answer it.",
  social: "Somebody pasted an IMPRINT link somewhere and the platform is building a preview card.",
};

function verb(kind: CrawlerKind): string {
  return kind === "live" ? "fetched a page"
    : kind === "social" ? "built a link preview"
    : "crawled a page";
}

function format(crawler: Crawler, req: NextRequest, pathname: string, verdict: PathVerdict): string {
  const h = req.headers;
  const { known, probe } = verdict;
  // Absent means "assume it was served". A route added to the site but not yet
  // to lib/beacon/paths.ts must never be reported as a 404 that never happened
  // — but an unknown path that is also a recognised probe target is the one
  // case where the 404 is the whole point, so probes say it outright.
  const served = known;

  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const place = [decodeURIComponent(h.get("x-vercel-ip-city") || ""), h.get("x-vercel-ip-country-region"), h.get("x-vercel-ip-country")]
    .filter(Boolean)
    .join(", ");
  const asn = h.get("x-vercel-ip-as-number");
  const referer = h.get("referer");
  const ua = h.get("user-agent") || "";

  const headline = probe
    ? `🚨 <b>${esc(crawler.name)}</b> probed for something that is not here`
    : served
      ? `${ICON[crawler.kind]} <b>${esc(crawler.name)}</b> ${verb(crawler.kind)}`
      : `${ICON[crawler.kind]} <b>${esc(crawler.name)}</b> requested a page that does not exist`;

  const lines = [
    headline,
    "",
    served ? `📄 <code>${esc(pathname)}</code>` : `📄 <code>${esc(pathname)}</code> — <b>404</b>, no such route`,
    probe ? `⚠️ Fishing for: ${esc(probe)}` : "",
    crawler.vendor ? `🏷 ${esc(crawler.name)} · ${esc(crawler.vendor)}` : "",
    place ? `📍 ${esc(place)}` : "",
    asn ? `🏢 AS${esc(asn)}` : "",
    `🌐 <code>${esc(ip)}</code>`,
    referer ? `↩️ ${esc(clip(referer, 200))}` : "",
    ua ? `🖥 <code>${esc(clip(ua, 300))}</code>` : "",
  ].filter(Boolean);

  const meaning = probe
    ? "<i>Nothing was served. Worth knowing only as background noise — every public domain gets this.</i>"
    : MEANING[crawler.kind]
      ? `<i>${MEANING[crawler.kind]}</i>`
      : "";
  if (meaning) lines.push("", meaning);

  return lines.join("\n");
}

/**
 * Returns a promise to hand to `NextFetchEvent.waitUntil`, or null when there
 * is nothing to report.
 *
 * Everything that decides *whether* to send happens synchronously here — the
 * user-agent match, the path filter, the dedupe — so it is covered by the
 * `try/catch` in `middleware.ts` and cannot be lost to a request that ends
 * before `waitUntil` is drained. Only the send itself is deferred.
 *
 * Never awaited in the request path: an alert must not add latency to a page
 * load, and a Telegram outage must not turn into a slow site. Errors are
 * swallowed for the same reason — telemetry failing is not a reason to fail a
 * request.
 */
export function crawlerAlert(req: NextRequest): Promise<void> | null {
  if (!telegramConfigured()) return null;

  const { pathname, hostname } = new URL(req.url);

  // Local work must not alert anyone — the same promise the visitor beacon
  // makes, and the same switch to override it. This matters more than it looks:
  // `curl` and `python-requests` are recognised agents now, so without this a
  // single `curl localhost:3000` during development sends a Telegram message.
  if (!localAlertsEnabled() && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(hostname)) return null;

  const crawler = identifyCrawler(req.headers.get("user-agent"));
  if (!crawler) return null;
  if (!ALERT_ON.includes(crawler.kind)) return null;

  // Order matters, and getting it wrong makes the probe list dead code. Every
  // interesting probe target ends in something the asset rule reads as a file
  // extension — `.env`, `wp-login.php`, `dump.sql`, `id_rsa.pem` — so filtering
  // assets first silently discards exactly the requests worth seeing. A
  // recognised probe is always reportable; everything else still has to earn it.
  const verdict = classifyPath(pathname);
  if (!verdict.probe && !isReportablePath(pathname)) return null;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
  if (duplicate(`${crawler.name}|${ip}|${pathname}`)) return null;

  return sendTelegram(format(crawler, req, pathname, verdict))
    .then(() => undefined)
    .catch(() => undefined);
}
