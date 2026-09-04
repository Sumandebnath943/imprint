import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/api/rate-limit";
import { BeaconSchema } from "@/lib/validations/beacon.schema";
import { judge } from "@/lib/beacon/bot";
import { resolveGeo } from "@/lib/beacon/geo";
import { formatArrival, formatSummary, sendTelegram, telegramConfigured } from "@/lib/beacon/telegram";

// Geolocation comes from per-request edge headers, so this must never be
// cached or statically evaluated.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Worst case is a 2s geolocation lookup followed by an 8s Telegram send. The
// platform default of 10s leaves no margin for a cold start, so ask for more.
export const maxDuration = 20;

// Per visitor: enough for a long browse, not enough to flood the chat.
const PER_IP_LIMIT = 12;
const PER_IP_WINDOW_MS = 10 * 60_000;

// A crawl hitting many pages arrives from many addresses, so cap the endpoint
// as a whole too. Per-instance on serverless, which is adequate here.
const GLOBAL_LIMIT = 150;
const GLOBAL_WINDOW_MS = 10 * 60_000;

const MAX_BODY_BYTES = 24_000;

/**
 * Health check: confirms the bot credentials are present on this deploy and
 * shows exactly what the server resolves for the caller's own address. Visiting
 * /api/beacon from a phone is the quickest way to prove geolocation works in
 * production. It reveals nothing but the caller's own network facts, and never
 * the bot token.
 */
export async function GET(req: NextRequest) {
  const geo = await resolveGeo(req.headers);
  if (!rateLimit(`beacon-check:${geo.ip}`, 20, 10 * 60_000).allowed) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }
  return NextResponse.json(
    { ok: true, telegramConfigured: telegramConfigured(), geo },
    { headers: { "cache-control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  // The beacon is fire-and-forget by design: the visitor's page must never see
  // an error, and a failure here must never surface to them. Every path below
  // returns 204.
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

    const geo = await resolveGeo(req.headers);

    if (!rateLimit(`beacon:${geo.ip}`, PER_IP_LIMIT, PER_IP_WINDOW_MS).allowed) {
      return new NextResponse(null, { status: 204 });
    }
    if (!rateLimit("beacon:global", GLOBAL_LIMIT, GLOBAL_WINDOW_MS).allowed) {
      return new NextResponse(null, { status: 204 });
    }

    const ua = req.headers.get("user-agent") ?? "";
    const verdict = judge(payload, geo, ua, req.headers.get("accept-language"));

    const text =
      payload.kind === "arrival"
        ? formatArrival(payload, geo, verdict, ua)
        : formatSummary(payload, geo, verdict, ua);

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
