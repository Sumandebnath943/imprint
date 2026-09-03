/**
 * Minimal in-process sliding-window rate limiter.
 *
 * Scope and limits: state lives in the module, so on a serverless platform it
 * is per-instance rather than global. That is enough to stop one user hammering
 * an expensive endpoint in a loop — which is the actual exposure here, since
 * /api/mirror calls gpt-4o on every message — but it is not a substitute for a
 * shared store (Upstash/Redis) if this ever needs a hard global guarantee.
 */

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

// Opportunistic cleanup so the map cannot grow without bound.
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 5 * 60_000;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  const expired: string[] = [];
  buckets.forEach((win, key) => {
    if (win.resetAt <= now) expired.push(key);
  });
  expired.forEach((key) => buckets.delete(key));
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfter: 0,
  };
}
