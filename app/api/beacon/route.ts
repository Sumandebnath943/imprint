import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/api/rate-limit";
import { BeaconSchema } from "@/lib/validations/beacon.schema";
import { describeClient, judge } from "@/lib/beacon/bot";
import { resolveGeo } from "@/lib/beacon/geo";
import { resolveIdentity } from "@/lib/beacon/identity";
import {
  formatArrival,
  formatEnded,
  formatEvent,
  formatSummary,
  sendTelegram,
  telegramConfigured,
} from "@/lib/beacon/telegram";

// Geolocation comes from per-request edge headers and identity from the
// session cookie, so this must never be cached or statically evaluated.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Worst case is a 2s geolocation lookup followed by an 8s Telegram send. The
// platform default of 10s leaves no margin for a cold start, so ask for more.
export const maxDuration = 20;

// Per visitor: enough for a long browse plus milestones, not enough to flood.
const PER_IP_LIMIT = 20;
const PER_IP_WINDOW_MS = 10 * 60_000;

// A crawl arrives from many addresses, so cap the endpoint as a whole too.
const GLOBAL_LIMIT = 150;
const GLOBAL_WINDOW_MS = 10 * 60_000;

const MAX_BODY_BYTES = 24_000;

export async function GET(req: NextRequest) {
  // Health check: proves the credentials are present on this deploy and shows
  // exactly what the server resolved for the caller. Visiting /api/beacon from
  // a phone is the quickest way to verify geolocation in production. It reveals
  // only the caller's own network facts, and never the bot token.
  const geo = await resolveGeo(req.headers);
  if (!rateLimit(`beacon-check:${geo.ip}`, 20, 10 * 60_000).allowed) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }
  const identity = await resolveIdentity();

  // Everything the server sees about *this* request, so a wrong alert can be
  // diagnosed by opening this URL in the browser that produced it rather than
  // by guessing from the alert text.
  const ua = req.headers.get("user-agent") ?? "";
  const dnt = req.headers.get("dnt");
  return NextResponse.json(
    {
      ok: true,
      telegramConfigured: telegramConfigured(),
      geo,
      signedIn: identity.signedIn,
      request: {
        userAgent: ua,
        client: describeClient(ua),
        acceptLanguage: req.headers.get("accept-language"),
        doNotTrackHeader: dnt,
      },
      // The reasons a real visit produces no alert at all.
      // Do Not Track no longer suppresses; the opt-out is ?notrack=1, which is
      // enforced in the browser, so the server cannot see it from here.
      doNotTrackSuppresses: false,
      optOutUrl: "https://imprint.houseofnamus.com/?notrack=1",
    },
    { headers: { "cache-control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  // Fire-and-forget by design: the visitor's page must never see an error, and
  // a failure here must never surface to them. Every path returns 204.
  try {
    if (!telegramConfigured()) return new NextResponse(null, { status: 204 });

    const raw = await req.text();
    if (!raw || raw.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 204 });

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return new NextResponse(null, { status: 204 });
    }

    const parsed = BeaconSchema.safeParse(json);
    if (!parsed.success) return new NextResponse(null, { status: 204 });
    const payload = parsed.data;

    // Do Not Track is reported in the alert but does not suppress it; the
    // opt-out is ?notrack=1, which the client enforces before sending at all.
    // See the note in components/beacon/Beacon.tsx for why.

    const geo = await resolveGeo(req.headers);
    const ua = req.headers.get("user-agent") ?? "";
    const verdict = judge(payload, geo, ua, req.headers.get("accept-language"));

    // Crawlers are dropped before anything else. They were both filling the
    // chat with alerts that looked like a visitor — US datacenter, Linux, "bot"
    // — and consuming the shared budget below, which then silenced the real
    // visits. Set BEACON_ALERT_BOTS=1 to see them anyway.
    if (process.env.BEACON_ALERT_BOTS !== "1") {
      if (verdict.crawler) return new NextResponse(null, { status: 204 });
      if (verdict.score < 20 && geo.datacenter) return new NextResponse(null, { status: 204 });
    }

    // Separate buckets, so automated traffic can never starve a real visitor of
    // their alert — which is what a single shared counter allowed.
    const bucket = verdict.score >= 40 ? "human" : "suspect";
    if (!rateLimit(`beacon:${bucket}:${geo.ip}`, PER_IP_LIMIT, PER_IP_WINDOW_MS).allowed) {
      return new NextResponse(null, { status: 204 });
    }
    if (!rateLimit(`beacon:global:${bucket}`, GLOBAL_LIMIT, GLOBAL_WINDOW_MS).allowed) {
      return new NextResponse(null, { status: 204 });
    }

    // Identity is read from the session, never from the payload — a browser can
    // claim anything, but it cannot forge a session cookie.
    const identity = await resolveIdentity();

    let text: string;
    if (payload.kind === "event") {
      if (!payload.event) return new NextResponse(null, { status: 204 });
      // A sign-out event legitimately has no session left to read.
      if (!identity.signedIn && payload.event !== "signed_out") {
        return new NextResponse(null, { status: 204 });
      }
      text = formatEvent(payload, geo, ua, identity);
    } else if (payload.kind === "arrival") {
      text = formatArrival(payload, geo, verdict, ua, identity);
    } else if (payload.kind === "ended") {
      text = formatEnded(payload, geo, ua, identity);
    } else {
      text = formatSummary(payload, geo, verdict, ua, identity);
    }

    // Awaited rather than backgrounded: work started after the response is
    // returned is killed on serverless, so the message would silently vanish.
    const sent = await sendTelegram(text);
    if (!sent.ok) console.error("[beacon] telegram send failed:", sent.error);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[beacon] unhandled:", err);
    return new NextResponse(null, { status: 204 });
  }
}
