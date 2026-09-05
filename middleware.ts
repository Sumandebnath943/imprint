import { updateSession } from "@/lib/supabase/middleware";
import { aiCrawlerAlert } from "@/lib/beacon/ai-crawler-alert";
import type { NextRequest, NextFetchEvent } from "next/server";

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // AI crawler telemetry. Handed to waitUntil rather than awaited, so the alert
  // is sent after the response goes out and never adds latency to a page load.
  //
  // This runs here, not in the visitor beacon, because the beacon is a client
  // component and none of these agents execute JavaScript — a detector added
  // there could never have fired.
  //
  // Wrapped because this is the one code path that touches every single
  // request to the site. Async failures are already handled inside, but a
  // synchronous throw here — a malformed URL, an unexpected header — would
  // take down every page rather than lose one telemetry event. Analytics is
  // never worth a 500.
  try {
    const alert = aiCrawlerAlert(request);
    if (alert) event.waitUntil(alert);
  } catch {
    // Deliberately silent: nothing useful to do, and logging on every request
    // in a hot path is its own problem.
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT for static files, images, and Next.js internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
