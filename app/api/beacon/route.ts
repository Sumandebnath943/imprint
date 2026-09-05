import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/api/rate-limit";
import { BeaconSchema } from "@/lib/validations/beacon.schema";
import { judge } from "@/lib/beacon/bot";
import { resolveGeo } from "@/lib/beacon/geo";
import { resolveIdentity } from "@/lib/beacon/identity";
import {
  formatArrival,
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
  return NextResponse.json(
    {
      ok: true,
      telegramConfigured: telegramConfigured(),
      geo,
      signedIn: identity.signedIn,
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

    // Honour Do Not Track: the browser asked not to be recorded, so stop before
    // resolving anything about them.
    if (payload.signals.doNotTrack) return new NextResponse(null, { status: 204 });

    const geo = await resolveGeo(req.headers);

    if (!rateLimit(`beacon:${geo.ip}`, PER_IP_LIMIT, PER_IP_WINDOW_MS).allowed) {
      return new NextResponse(null, { status: 204 });
    }
    if (!rateLimit("beacon:global", GLOBAL_LIMIT, GLOBAL_WINDOW_MS).allowed) {
      return new NextResponse(null, { status: 204 });
    }

    // Identity is read from the session, never from the payload — a browser can
    // claim anything, but it cannot forge a session cookie.
    const identity = await resolveIdentity();
    const ua = req.headers.get("user-agent") ?? "";

    let text: string;
    if (payload.kind === "event") {
      if (!payload.event) return new NextResponse(null, { status: 204 });
      // A sign-out event legitimately has no session left to read.
      if (!identity.signedIn && payload.event !== "signed_out") {
        return new NextResponse(null, { status: 204 });
      }
      text = formatEvent(payload, geo, ua, identity);
    } else {
      const verdict = judge(payload, geo, ua, req.headers.get("accept-language"));
      text =
        payload.kind === "arrival"
          ? formatArrival(payload, geo, verdict, ua, identity)
          : formatSummary(payload, geo, verdict, ua, identity);
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
