/**
 * Human or bot, and why.
 *
 * There is no single tell, so this scores a handful of independent signals and
 * shows its working — the reason strings matter as much as the number, because
 * a score with no explanation is not actionable when you are looking at one
 * visitor in a Telegram message.
 *
 * Score runs 0 (certainly automated) to 100 (behaves like a person).
 */
import type { BeaconPayload } from "@/lib/validations/beacon.schema";
import type { Geo } from "./geo";

const BOT_UA = /(bot|crawl|spider|slurp|scrape|fetch|monitor|preview|headless|phantom|puppeteer|playwright|selenium|webdriver|python-requests|httpx|aiohttp|curl|wget|axios|node-fetch|go-http|java\/|okhttp|libwww|lighthouse|pingdom|uptime|semrush|ahrefs|mj12|dotbot|petal|bytespider|gptbot|claudebot|ccbot|perplexity)/i;

/** Well-behaved crawlers worth naming rather than lumping in with scrapers. */
const KNOWN_CRAWLER = /(googlebot|bingbot|duckduckbot|yandex|baiduspider|applebot|facebookexternalhit|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|whatsapp|gptbot|claudebot|ccbot|perplexitybot)/i;

export interface Verdict {
  /** 0-100, higher means more human. */
  score: number;
  label: "Human" | "Likely human" | "Uncertain" | "Likely bot" | "Bot";
  crawler?: string;
  reasons: string[];
}

function crawlerName(ua: string): string | undefined {
  const m = ua.match(KNOWN_CRAWLER);
  if (!m) return undefined;
  const n = m[0].toLowerCase();
  return n.charAt(0).toUpperCase() + n.slice(1);
}

export function judge(
  payload: BeaconPayload,
  geo: Geo,
  ua: string,
  acceptLanguage: string | null
): Verdict {
  const s = payload.signals;
  const human: string[] = [];
  const bot: string[] = [];
  // The arrival alert fires ~1.2s after load, before anyone has had time to
  // move a mouse or scroll. Judging it on absent behaviour marked every real
  // visitor "Uncertain", so behavioural penalties are held back for the
  // end-of-visit summary; the arrival is scored on environment and network.
  const final = payload.kind === "report";
  let score = 52;

  const crawler = crawlerName(ua);
  if (crawler) {
    return {
      score: 2,
      label: "Bot",
      crawler,
      reasons: [`declared crawler (${crawler})`],
    };
  }

  if (BOT_UA.test(ua)) {
    score -= 45;
    bot.push("automation in user agent");
  }

  // ── Hard tells ───────────────────────────────────────────────────────────
  if (s.webdriver) {
    score -= 40;
    bot.push("navigator.webdriver");
  }
  if (!ua) {
    score -= 20;
    bot.push("no user agent");
  }
  if (!acceptLanguage) {
    score -= 12;
    bot.push("no Accept-Language");
  }
  if (s.languages === 0) {
    score -= 10;
    bot.push("no browser languages");
  }
  if (payload.device.screenW === 0 || payload.device.screenH === 0) {
    score -= 15;
    bot.push("no screen dimensions");
  }
  if (geo.datacenter) {
    score -= 22;
    bot.push(`datacenter network${geo.isp ? ` (${geo.isp})` : ""}`);
  }

  // ── Environment: does this look like a real browser at all? ──────────────
  // Available immediately, so this is what the arrival alert is judged on.
  if (s.languages > 0) score += 6;
  if (s.plugins > 0) score += 5;
  if (s.hardwareConcurrency > 0 && s.deviceMemory > 0) score += 6;
  if (payload.device.screenW > 0 && payload.device.screenH > 0) score += 6;
  if (s.timezone) score += 4;
  if (s.cookiesEnabled) score += 4;

  // ── Interaction: the strongest evidence of a person ──────────────────────
  if (s.pointerMoves > 12) {
    score += 18;
    human.push("mouse movement");
  } else if (final && s.pointerMoves === 0 && !s.touchSupport) {
    score -= 18;
    bot.push("no pointer movement");
  }

  if (s.touches > 0) {
    score += 14;
    human.push("touch input");
  }
  if (s.clicks > 0) {
    score += 10;
    human.push(`${s.clicks} click${s.clicks === 1 ? "" : "s"}`);
  }
  if (s.keys > 0) {
    score += 8;
    human.push("typing");
  }
  if (s.visibilityChanges > 0) {
    score += 5;
    human.push("tab switching");
  }

  // ── Scroll shape ─────────────────────────────────────────────────────────
  if (payload.scroll.events > 4 && payload.scroll.maxPct > 15) {
    score += 12;
    human.push("progressive scrolling");
  }
  // Reaching the bottom of the page in a single scroll event is a script.
  if (final && payload.scroll.maxPct >= 95 && payload.scroll.events <= 2) {
    score -= 20;
    bot.push("jumped to page bottom");
  }

  // ── Dwell ────────────────────────────────────────────────────────────────
  if (payload.activeMs > 8_000) {
    score += 12;
    human.push("dwelled on page");
  } else if (final && payload.sessionMs > 0 && payload.sessionMs < 1_200) {
    score -= 12;
    bot.push("left almost immediately");
  }

  // Acting before a person could have read anything.
  if (s.firstActionMs !== null && s.firstActionMs < 250) {
    score -= 18;
    bot.push("acted within 250ms of load");
  }

  // ── Environment shape ────────────────────────────────────────────────────
  if (s.hardwareConcurrency === 0 && s.deviceMemory === 0) {
    score -= 6;
    bot.push("no hardware hints");
  }
  if (!s.cookiesEnabled) {
    score -= 8;
    bot.push("cookies disabled");
  }

  score = Math.max(0, Math.min(100, score));

  const label: Verdict["label"] =
    score >= 80 ? "Human"
    : score >= 62 ? "Likely human"
    : score >= 40 ? "Uncertain"
    : score >= 20 ? "Likely bot"
    : "Bot";

  // Lead with whichever side actually carried the decision.
  const reasons = score >= 62 ? [...human, ...bot] : [...bot, ...human];
  return { score, label, reasons: reasons.slice(0, 6) };
}

/** Rough browser/OS from the user agent — for the alert, not for logic. */
export function describeClient(ua: string): string {
  if (!ua) return "unknown client";

  const browser =
    /edg\//i.test(ua) ? "Edge"
    : /opr\/|opera/i.test(ua) ? "Opera"
    : /samsungbrowser/i.test(ua) ? "Samsung Internet"
    : /chrome|crios/i.test(ua) ? "Chrome"
    : /firefox|fxios/i.test(ua) ? "Firefox"
    : /safari/i.test(ua) ? "Safari"
    : "unknown browser";

  const os =
    /windows nt 10|windows nt 11/i.test(ua) ? "Windows"
    : /windows/i.test(ua) ? "Windows (old)"
    : /iphone|ipad|ipod/i.test(ua) ? "iOS"
    : /android/i.test(ua) ? "Android"
    : /mac os x/i.test(ua) ? "macOS"
    : /linux/i.test(ua) ? "Linux"
    : "unknown OS";

  const version = ua.match(/(?:chrome|firefox|version|edg)\/(\d+)/i)?.[1];
  return `${browser}${version ? ` ${version}` : ""} · ${os}`;
}
