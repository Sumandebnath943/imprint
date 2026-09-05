/**
 * Formats a visit into a Telegram message and sends it.
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
import type { Identity } from "./identity";

const API = "https://api.telegram.org";

// Measured at 5.6s round-trip on a cold connection from India (1.3s connect,
// 1.9s TLS). A 4s budget dropped alerts silently.
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
  if (m < 60) return s % 60 ? `${m}m ${s % 60}s` : `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
  // Account ages run to months; "1776h 0m old" is not a readable answer.
  const d = Math.floor(h / 24);
  if (d < 30) return h % 24 ? `${d}d ${h % 24}h` : `${d}d`;
  const mo = Math.floor(d / 30);
  return d % 30 ? `${mo}mo ${d % 30}d` : `${mo}mo`;
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
      timeZone: tz, day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(now);
    return `${local} local (${tz})`;
  } catch {
    return utc;
  }
}

/**
 * Location, stated only as precisely as it was actually resolved.
 *
 * A country-level result gets no coordinates and no map link: a provider's
 * country centroid is not a position, and presenting it as one put a Pune
 * visitor on the map outside Nagpur.
 */
function locationBlock(geo: Geo): string[] {
  const lines: string[] = [];
  const link = mapLink(geo);

  if (geo.precision === "city" || geo.precision === "region") {
    lines.push(`📍 <b>${esc(describePlace(geo))}</b>${geo.flag ? ` ${geo.flag}` : ""}`);
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
  } else if (geo.precision === "country") {
    lines.push(
      `📍 <b>${esc(describePlace(geo))}</b>${geo.flag ? ` ${geo.flag}` : ""} — <i>country only</i>`
    );
    lines.push("   ⚠️ no city resolved for this address; no map pin shown");
  } else {
    lines.push("📍 <b>Location unavailable</b>");
    lines.push("   private or unroutable address (local request)");
  }

  const net = [geo.isp ? esc(clip(geo.isp, 42)) : null, geo.asn ? esc(geo.asn) : null]
    .filter(Boolean)
    .join(" · ");
  lines.push(`🛰 <code>${esc(geo.ip)}</code>${net ? ` · ${net}` : ""}`);

  if (geo.mobile) lines.push("   📶 mobile network — city may be the carrier gateway, not the visitor");
  if (geo.datacenter) lines.push("   ⚠️ datacenter / hosting network");
  if (geo.disagreement) lines.push(`   ℹ️ sources differ: ${esc(geo.disagreement)}`);
  if (link) lines.push(`   <a href="${link}">open in maps</a>`);

  return lines;
}

/** Who they are, if the session says so. */
function identityBlock(id: Identity): string[] {
  if (!id.signedIn) return ["👤 <b>Not signed in</b> — anonymous visitor"];

  const who = [id.name, id.email].filter(Boolean).map((s) => esc(clip(String(s), 60)));
  const lines = [`👤 <b>${who[0] ?? "Signed in"}</b>${who[1] ? ` · ${who[1]}` : ""}`];

  const facts: string[] = [];
  if (id.isNewAccount) facts.push("🆕 <b>new account</b>");
  else if (id.accountAgeMs !== undefined) facts.push(`account ${duration(id.accountAgeMs)} old`);

  if (id.onboardingCompleted === true) facts.push("onboarding complete");
  else if (id.onboardingCompleted === false) {
    facts.push(`onboarding step ${id.onboardingStep ?? 0}/7`);
  }
  if (typeof id.driftScore === "number") facts.push(`drift ${id.driftScore}`);
  if (typeof id.imprintScore === "number") facts.push(`imprint ${id.imprintScore}`);

  if (facts.length) lines.push(`   ${facts.join(" · ")}`);
  return lines;
}

/** Not honoured as an opt-out, but always worth knowing it was asked for. */
function dntLine(payload: BeaconPayload): string[] {
  return payload.signals.doNotTrack
    ? ["🔕 <i>This visitor's browser sends Do Not Track</i>"]
    : [];
}

/** Dashboard routes seen this visit, in order, deduplicated. */
function dashboardTrail(payload: BeaconPayload): string[] {
  const seen: string[] = [];
  for (const p of payload.pages) {
    if (!p.path.startsWith("/dashboard")) continue;
    const label = p.path === "/dashboard" ? "overview" : p.path.replace("/dashboard/", "");
    if (!seen.includes(label)) seen.push(label);
  }
  return seen;
}

export function formatArrival(
  payload: BeaconPayload,
  geo: Geo,
  verdict: Verdict,
  ua: string,
  id: Identity
): string {
  const lines: string[] = [];
  const vis = payload.visitor;
  lines.push(
    vis.returning
      ? `🔁 <b>Returning visit</b> — visit #${vis.visitCount}` +
          (vis.sinceLastMs !== null ? ` · last seen ${duration(vis.sinceLastMs)} ago` : "")
      : "🟢 <b>New visit</b> — first time here"
  );
  lines.push("");
  lines.push(...identityBlock(id));
  lines.push("");
  lines.push(...locationBlock(geo));
  lines.push("");
  lines.push(`📄 <b>${esc(clip(payload.path, 90))}</b>`);
  if (payload.title) lines.push(`   ${esc(clip(payload.title, 70))}`);
  lines.push(`↩️ ${payload.referrer ? esc(clip(payload.referrer, 80)) : "direct / no referrer"}`);
  lines.push("");
  lines.push(
    `💻 ${esc(describeClient(ua))} · ${payload.device.viewportW}×${payload.device.viewportH}` +
      `${payload.signals.language ? ` · ${esc(payload.signals.language)}` : ""}`
  );
  lines.push(
    `${verdictIcon(verdict)} <b>${verdict.label}</b> ${verdict.score}/100 <i>(provisional)</i>` +
      (verdict.reasons.length ? ` — ${esc(verdict.reasons.join(", "))}` : "")
  );
  lines.push(...dntLine(payload));
  lines.push("");
  lines.push(`🕒 ${localTime(payload.signals.timezone)}`);
  return lines.join("\n");
}

const EVENT_TITLES: Record<string, string> = {
  signed_in: "🔑 <b>Signed in</b>",
  signed_out: "🚪 <b>Signed out</b>",
  entered_dashboard: "📊 <b>Entered the dashboard</b>",
  onboarding_complete: "🎯 <b>Finished onboarding</b>",
  cta_click: "🔥 <b>Clicked a primary call to action</b>",
};

export function formatEvent(
  payload: BeaconPayload,
  geo: Geo,
  ua: string,
  id: Identity
): string {
  // A sign-in on a minutes-old account is a sign-up. The server decides this
  // from the profile row, not from anything the browser claimed.
  const isSignup = payload.event === "signed_in" && id.isNewAccount;
  const title = isSignup
    ? "✨ <b>New account created</b>"
    : EVENT_TITLES[payload.event ?? ""] ?? "📌 <b>Event</b>";

  const lines: string[] = [title + " — IMPRINT", ""];
  lines.push(...identityBlock(id));
  lines.push("");
  lines.push(`📄 <b>${esc(clip(payload.path, 90))}</b>`);

  const trail = dashboardTrail(payload);
  if (trail.length) lines.push(`🧭 dashboard so far: ${esc(trail.join(" → "))}`);

  lines.push("");
  lines.push(...locationBlock(geo));
  lines.push("");
  lines.push(`💻 ${esc(describeClient(ua))}`);
  lines.push(...dntLine(payload));
  lines.push(`🕒 ${localTime(payload.signals.timezone)}`);
  return lines.join("\n");
}

/** Short: the visit is over. The detail follows in the report. */
export function formatEnded(
  payload: BeaconPayload,
  geo: Geo,
  ua: string,
  id: Identity
): string {
  const lines: string[] = [];
  const vis = payload.visitor;
  lines.push("⚪️ <b>Visit ended</b> — IMPRINT");
  lines.push("");
  lines.push(...identityBlock(id));
  lines.push("");
  lines.push(
    `⏱ <b>${duration(payload.sessionMs)}</b> on site · <b>${duration(payload.activeMs)}</b> active`
  );
  lines.push(
    `🧭 ${payload.pages.length} page${payload.pages.length === 1 ? "" : "s"}` +
      ` · ${payload.actions.length} action${payload.actions.length === 1 ? "" : "s"}` +
      ` · left from <b>${esc(clip(payload.path, 60))}</b>`
  );
  if (vis.returning) lines.push(`🔁 visit #${vis.visitCount} from this browser`);
  lines.push("");
  lines.push(...locationBlock(geo));
  lines.push(...dntLine(payload));
  lines.push("");
  lines.push("<i>Full report follows.</i>");
  return lines.join("\n");
}

export function formatSummary(
  payload: BeaconPayload,
  geo: Geo,
  verdict: Verdict,
  ua: string,
  id: Identity
): string {
  const lines: string[] = [];
  const s = payload.signals;

  lines.push("📋 <b>Visit report</b> — IMPRINT");
  lines.push("");
  lines.push(...identityBlock(id));
  lines.push("");
  lines.push(`⏱ <b>${duration(payload.sessionMs)}</b> on site · <b>${duration(payload.activeMs)}</b> active`);
  lines.push(
    `🚪 entered on <b>${esc(clip(payload.pages[0]?.path ?? payload.path, 50))}</b>` +
      ` · ${payload.visitor.pageLoads} page load${payload.visitor.pageLoads === 1 ? "" : "s"}`
  );

  if (payload.pages.length) {
    const journey = payload.pages
      .map((p) => `${esc(clip(p.path, 34))}${p.ms ? ` (${duration(p.ms)})` : ""}`)
      .join("  →  ");
    lines.push(`🧭 <b>${payload.pages.length} page${payload.pages.length === 1 ? "" : "s"}</b>`);
    lines.push(`   ${clip(journey, 380)}`);
  }

  const trail = dashboardTrail(payload);
  if (trail.length) {
    lines.push(`📊 <b>dashboard explored (${trail.length})</b>`);
    lines.push(`   ${esc(clip(trail.join(" · "), 300))}`);
  }

  const sc = payload.scroll;
  lines.push(
    `📜 scroll <b>${sc.maxPct}%</b>${sc.maxPx ? ` (${sc.maxPx}px)` : ""}` +
      `${sc.milestones.length ? ` · hit ${sc.milestones.join("/")}` : ""} · ${sc.events} events`
  );

  if (payload.actions.length) {
    lines.push(`🖱 <b>${payload.actions.length} action${payload.actions.length === 1 ? "" : "s"}</b>`);
    for (const a of payload.actions.slice(0, 12)) {
      lines.push(`   ${duration(a.t).padStart(5)} · ${a.type} · ${esc(clip(a.label, 52))}`);
    }
    if (payload.actions.length > 12) lines.push(`   …and ${payload.actions.length - 12} more`);
  } else {
    lines.push("🖱 no actions taken");
  }

  const timing = [
    s.firstActionMs !== null ? `first ${duration(s.firstActionMs)}` : null,
    s.lastActionMs !== null ? `last ${duration(s.lastActionMs)}` : null,
  ].filter(Boolean);
  if (timing.length) lines.push(`⌛ ${timing.join(" · ")}`);

  lines.push(`🎛 ${s.pointerMoves} moves · ${s.clicks} clicks · ${s.keys} keys · ${s.touches} touches`);
  lines.push("");
  lines.push(...locationBlock(geo));
  lines.push("");
  lines.push(`💻 ${esc(describeClient(ua))}`);
  lines.push(
    `${verdictIcon(verdict)} <b>${verdict.label}</b> ${verdict.score}/100` +
      (verdict.reasons.length ? ` — ${esc(verdict.reasons.join(", "))}` : "")
  );
  lines.push(...dntLine(payload));
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
  // handshake, and that is exactly the request carrying the first alert after a
  // deploy. A rejected message (bad token, bad chat id) is not retried.
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
