/**
 * Formats a visit into a Telegram message and sends it.
 *
 * Credentials come from the environment and are never exposed to the client:
 *
 *   TELEGRAM_BOT_TOKEN   from @BotFather
 *   TELEGRAM_CHAT_ID     your own chat, or a group/channel the bot is in
 *
 * With either missing the beacon degrades to a no-op rather than throwing, so a
 * misconfigured deploy never breaks a page load.
 */
import type { BeaconPayload } from "@/lib/validations/beacon.schema";
import { describeClient, type Verdict } from "./bot";
import { describePlace, mapLink, type Geo } from "./geo";

const API = "https://api.telegram.org";

// Measured at 5.6s round-trip on a cold connection from India (1.3s connect,
// 1.9s TLS). A 4s budget dropped alerts silently, so this allows for a slow
// path while still finishing inside the route's own duration limit.
const SEND_TIMEOUT_MS = 8_000;

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/** Telegram's HTML mode only needs these three escaped. */
function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function clip(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function duration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return rem ? `${m}m ${rem}s` : `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function verdictIcon(v: Verdict): string {
  return v.score >= 80 ? "🧑" : v.score >= 62 ? "🙂" : v.score >= 40 ? "❔" : v.score >= 20 ? "🤖" : "⛔️";
}

/** The visitor's own wall-clock time — more useful than the server's UTC. */
function localTime(tz: string | undefined): string {
  const now = new Date();
  const utc = now.toUTCString().replace("GMT", "UTC");
  if (!tz) return utc;
  try {
    const local = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);
    return `${local} local (${tz}) · ${utc}`;
  } catch {
    return utc;
  }
}

function locationBlock(geo: Geo): string[] {
  const lines: string[] = [];
  const place = describePlace(geo);
  const link = mapLink(geo);

  lines.push(`📍 <b>${esc(place)}</b>${geo.flag ? ` ${geo.flag}` : ""}`);

  const coords =
    geo.latitude && geo.longitude
      ? `${Number(geo.latitude).toFixed(3)}, ${Number(geo.longitude).toFixed(3)}`
      : null;
  const bits = [
    geo.postal ? `postal ${esc(geo.postal)}` : null,
    coords,
    geo.timezone ? esc(geo.timezone) : null,
  ].filter(Boolean);
  if (bits.length) lines.push(`   ${bits.join(" · ")}`);

  const net = [geo.isp ? esc(clip(geo.isp, 42)) : null, geo.asn ? esc(geo.asn) : null]
    .filter(Boolean)
    .join(" · ");
  lines.push(`🛰 <code>${esc(geo.ip)}</code>${net ? ` · ${net}` : ""}`);
  if (geo.datacenter) lines.push("   ⚠️ datacenter / hosting network");
  if (link) lines.push(`   <a href="${link}">open in maps</a>`);

  return lines;
}

export function formatArrival(
  payload: BeaconPayload,
  geo: Geo,
  verdict: Verdict,
  ua: string
): string {
  const lines: string[] = [];
  lines.push("🟢 <b>New visit</b> — IMPRINT");
  lines.push("");
  lines.push(...locationBlock(geo));
  lines.push("");
  lines.push(`📄 <b>${esc(clip(payload.path, 90))}</b>`);
  if (payload.title) lines.push(`   ${esc(clip(payload.title, 70))}`);
  lines.push(
    `↩️ ${payload.referrer ? esc(clip(payload.referrer, 80)) : "direct / no referrer"}`
  );
  lines.push("");
  lines.push(
    `💻 ${esc(describeClient(ua))} · ${payload.device.viewportW}×${payload.device.viewportH}` +
      `${payload.signals.language ? ` · ${esc(payload.signals.language)}` : ""}`
  );
  // Behaviour has not happened yet at arrival, so this reads on environment
  // and network only. The end-of-visit summary carries the real judgement.
  lines.push(
    `${verdictIcon(verdict)} <b>${verdict.label}</b> ${verdict.score}/100 <i>(provisional)</i>` +
      (verdict.reasons.length ? ` — ${esc(verdict.reasons.join(", "))}` : "")
  );
  if (payload.signals.doNotTrack) lines.push("   🔕 Do Not Track is on");
  lines.push("");
  lines.push(`🕒 ${localTime(payload.signals.timezone)}`);
  lines.push(`<i>geo: ${geo.source}</i>`);
  return lines.join("\n");
}

export function formatSummary(
  payload: BeaconPayload,
  geo: Geo,
  verdict: Verdict,
  ua: string
): string {
  const lines: string[] = [];
  const s = payload.signals;

  lines.push("⚪️ <b>Visit ended</b> — IMPRINT");
  lines.push("");
  lines.push(`⏱ <b>${duration(payload.sessionMs)}</b> on site · <b>${duration(payload.activeMs)}</b> active`);

  if (payload.pages.length) {
    const journey = payload.pages
      .map((p) => `${esc(clip(p.path, 34))}${p.ms ? ` (${duration(p.ms)})` : ""}`)
      .join("  →  ");
    lines.push(`🧭 <b>${payload.pages.length} page${payload.pages.length === 1 ? "" : "s"}</b>`);
    lines.push(`   ${clip(journey, 380)}`);
  }

  const sc = payload.scroll;
  lines.push(
    `📜 scroll <b>${sc.maxPct}%</b>` +
      `${sc.maxPx ? ` (${sc.maxPx}px)` : ""}` +
      `${sc.milestones.length ? ` · hit ${sc.milestones.join("/")}` : ""}` +
      ` · ${sc.events} events`
  );

  if (payload.actions.length) {
    lines.push(`🖱 <b>${payload.actions.length} action${payload.actions.length === 1 ? "" : "s"}</b>`);
    for (const a of payload.actions.slice(0, 12)) {
      lines.push(`   ${duration(a.t).padStart(5)} · ${a.type} · ${esc(clip(a.label, 52))}`);
    }
    if (payload.actions.length > 12) {
      lines.push(`   …and ${payload.actions.length - 12} more`);
    }
  } else {
    lines.push("🖱 no actions taken");
  }

  const timing = [
    s.firstActionMs !== null ? `first ${duration(s.firstActionMs)}` : null,
    s.lastActionMs !== null ? `last ${duration(s.lastActionMs)}` : null,
  ].filter(Boolean);
  if (timing.length) lines.push(`⌛ ${timing.join(" · ")}`);

  lines.push(
    `🎛 ${s.pointerMoves} moves · ${s.clicks} clicks · ${s.keys} keys · ${s.touches} touches`
  );
  lines.push("");
  lines.push(...locationBlock(geo));
  lines.push("");
  lines.push(`💻 ${esc(describeClient(ua))}`);
  lines.push(
    `${verdictIcon(verdict)} <b>${verdict.label}</b> ${verdict.score}/100` +
      (verdict.reasons.length ? ` — ${esc(verdict.reasons.join(", "))}` : "")
  );
  return lines.join("\n");
}

export async function sendTelegram(text: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, error: "not configured" };

  const body = JSON.stringify({
    chat_id: chatId,
    text: clip(text, 4000), // Telegram hard-caps a message at 4096 characters.
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });

  // Two attempts. The first request from a cold container pays the TCP and TLS
  // handshake — measured at ~3.2s of the round-trip — and that is exactly the
  // request that carries the first alert after a deploy. A rejected message
  // (bad token, bad chat id) is not retried; only a timeout or transport error.
  let lastError = "send failed";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), SEND_TIMEOUT_MS);
      const res = await fetch(`${API}/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: ctl.signal,
        cache: "no-store",
      });
      clearTimeout(timer);

      if (res.ok) return { ok: true };

      const detail = await res.text().catch(() => "");
      return { ok: false, error: `telegram ${res.status} ${clip(detail, 160)}` };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "send failed";
    }
  }
  return { ok: false, error: lastError };
}
