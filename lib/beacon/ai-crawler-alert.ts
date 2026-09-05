import type { NextRequest } from "next/server";
import { identifyAiCrawler, isReportablePath, type AiCrawler } from "./ai-crawlers";
import { sendTelegram, telegramConfigured } from "./telegram";

/**
 * Telegram alerts for AI crawler visits, fired from middleware.
 *
 * Every hit alerts, by explicit choice. Index crawlers are relentless once a
 * site is known, so if this becomes noise the dial is ALERT_ON below — set it
 * to ["live"] and only the fetchers dispatched mid-conversation will notify,
 * which is the signal most people actually want. Nothing else needs changing.
 */
const ALERT_ON: readonly ("index" | "live")[] = ["index", "live"];

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function format(crawler: AiCrawler, req: NextRequest): string {
  const url = new URL(req.url);
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const lines = [
    crawler.kind === "live"
      ? `🔥 <b>${esc(crawler.name)} fetched a page</b>`
      : `🤖 <b>${esc(crawler.name)} crawled a page</b>`,
    "",
    `<b>Path</b>  <code>${esc(url.pathname)}</code>`,
    `<b>Agent</b> ${esc(crawler.name)} · ${esc(crawler.vendor)}`,
    `<b>IP</b>    <code>${esc(ip)}</code>`,
  ];

  if (crawler.kind === "live") {
    lines.push(
      "",
      "<i>A live fetch: someone asked this assistant a question and it came here to answer it.</i>"
    );
  }

  return lines.join("\n");
}

/**
 * Returns a promise to hand to `NextFetchEvent.waitUntil`, or null when there
 * is nothing to report.
 *
 * Never awaited in the request path — an alert must not add latency to a page
 * load, and a Telegram outage must not turn into a slow site. Errors are
 * swallowed for the same reason: telemetry failing is not a reason to fail a
 * request.
 */
export function aiCrawlerAlert(req: NextRequest): Promise<void> | null {
  if (!telegramConfigured()) return null;

  const crawler = identifyAiCrawler(req.headers.get("user-agent"));
  if (!crawler) return null;
  if (!ALERT_ON.includes(crawler.kind)) return null;
  if (!isReportablePath(new URL(req.url).pathname)) return null;

  return sendTelegram(format(crawler, req))
    .then(() => undefined)
    .catch(() => undefined);
}
