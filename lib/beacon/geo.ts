/**
 * Where the visitor is, and who their network belongs to.
 *
 * Two sources, deliberately combined rather than picked between:
 *
 *  1. Vercel's edge headers (`x-vercel-ip-*`). Present on every request served
 *     through Vercel, resolved at the edge before the function runs, so they
 *     cost nothing and never fail. This is the authoritative source for
 *     city/region/country.
 *  2. A free IP lookup (ipwho.is, HTTPS, no key). Adds the ISP/ASN, which the
 *     Vercel headers do not carry and which is the single best signal for
 *     "this came from a datacenter, not a living room". Also covers local
 *     development, where the Vercel headers do not exist at all.
 *
 * The lookup is cached per IP and time-boxed, so a slow third party can never
 * hold up the response.
 */

export interface Geo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  flag?: string;
  postal?: string;
  latitude?: string;
  longitude?: string;
  timezone?: string;
  isp?: string;
  asn?: string;
  /** Network looks like a hosting provider rather than a consumer ISP. */
  datacenter: boolean;
  source: "vercel+lookup" | "vercel" | "lookup" | "unknown";
}

/** Substrings that mark an ASN/org as cloud or hosting infrastructure. */
const HOSTING = [
  "amazon", "aws", "google", "microsoft", "azure", "digitalocean", "linode",
  "vultr", "hetzner", "ovh", "scaleway", "contabo", "oracle", "alibaba",
  "tencent", "cloudflare", "fastly", "akamai", "leaseweb", "choopa",
  "hostinger", "godaddy", "namecheap", "bluehost", "rackspace", "equinix",
  "colocation", "datacenter", "data center", "hosting", "server", "vps",
  "m247", "cogent", "level 3", "zenlayer", "packet", "upcloud",
];

function looksLikeHosting(text: string | undefined): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return HOSTING.some((h) => t.includes(h));
}

/** ISO 3166-1 alpha-2 -> regional indicator pair, e.g. "IN" -> 🇮🇳 */
export function flagFor(code: string | undefined): string | undefined {
  if (!code || code.length !== 2 || !/^[A-Za-z]{2}$/.test(code)) return undefined;
  const base = 0x1f1e6;
  return String.fromCodePoint(
    base + code.toUpperCase().charCodeAt(0) - 65,
    base + code.toUpperCase().charCodeAt(1) - 65
  );
}

/**
 * The client's address.
 *
 * `x-forwarded-for` is a comma-separated chain; the left-most entry is the
 * original client and everything after it is a proxy that appended itself.
 * Vercel's own `x-real-ip` is already resolved, so it wins when present.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();

  const fwd = headers.get("x-vercel-forwarded-for") ?? headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

function isPrivate(ip: string): boolean {
  return (
    ip === "unknown" ||
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("::ffff:127.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

function fromVercel(headers: Headers) {
  // Vercel percent-encodes city and region, so "New Delhi" arrives as "New%20Delhi".
  const dec = (v: string | null) => {
    if (!v) return undefined;
    try {
      return decodeURIComponent(v) || undefined;
    } catch {
      return v || undefined;
    }
  };
  return {
    city: dec(headers.get("x-vercel-ip-city")),
    region: dec(headers.get("x-vercel-ip-country-region")),
    countryCode: headers.get("x-vercel-ip-country") ?? undefined,
    latitude: headers.get("x-vercel-ip-latitude") ?? undefined,
    longitude: headers.get("x-vercel-ip-longitude") ?? undefined,
    timezone: headers.get("x-vercel-ip-timezone") ?? undefined,
    postal: dec(headers.get("x-vercel-ip-postal-code")),
  };
}

interface Lookup {
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  postal?: string;
  latitude?: string;
  longitude?: string;
  timezone?: string;
  isp?: string;
  asn?: string;
}

// One lookup per address per hour is plenty; repeat visitors cost nothing.
const cache = new Map<string, { at: number; value: Lookup | null }>();
const CACHE_TTL_MS = 60 * 60_000;
// Kept short deliberately: this runs before the Telegram send, and the two
// together have to finish inside the route's duration limit.
const LOOKUP_TIMEOUT_MS = 2_000;

async function lookup(ip: string): Promise<Lookup | null> {
  const hit = cache.get(ip);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  let value: Lookup | null = null;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), LOOKUP_TIMEOUT_MS);
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: ctl.signal,
      cache: "no-store",
    });
    clearTimeout(timer);

    if (res.ok) {
      const d = (await res.json()) as Record<string, unknown>;
      if (d.success !== false) {
        const conn = (d.connection ?? {}) as Record<string, unknown>;
        const tz = (d.timezone ?? {}) as Record<string, unknown>;
        value = {
          city: typeof d.city === "string" ? d.city : undefined,
          region: typeof d.region === "string" ? d.region : undefined,
          country: typeof d.country === "string" ? d.country : undefined,
          countryCode: typeof d.country_code === "string" ? d.country_code : undefined,
          postal: typeof d.postal === "string" ? d.postal : undefined,
          latitude: typeof d.latitude === "number" ? String(d.latitude) : undefined,
          longitude: typeof d.longitude === "number" ? String(d.longitude) : undefined,
          timezone: typeof tz.id === "string" ? tz.id : undefined,
          isp: typeof conn.isp === "string" ? conn.isp : (typeof conn.org === "string" ? conn.org : undefined),
          asn: conn.asn ? `AS${String(conn.asn)}` : undefined,
        };
      }
    }
  } catch {
    // Timeout, network error, or a rate-limited free tier. The Vercel headers
    // still carry the location; only the ISP detail is lost.
    value = null;
  }

  cache.set(ip, { at: Date.now(), value });
  return value;
}

export async function resolveGeo(headers: Headers): Promise<Geo> {
  const ip = clientIp(headers);
  const v = fromVercel(headers);
  const hasVercel = Boolean(v.countryCode ?? v.city);

  const l = isPrivate(ip) ? null : await lookup(ip);

  const isp = l?.isp;
  const network = {
    isp,
    asn: l?.asn,
    datacenter: looksLikeHosting(isp) || looksLikeHosting(l?.asn),
  };

  // The two providers use different databases, so their fields must not be
  // interleaved: taking the city from one and the postcode from the other
  // produced "Bengaluru ... postal 600079", which is a Chennai postcode.
  // Location is therefore resolved from a single provider at a time.
  const agree =
    Boolean(v.city && l?.city) &&
    v.city!.toLowerCase() === l!.city!.toLowerCase();

  if (hasVercel && !agree) {
    // Vercel resolves at the edge and is the more reliable of the two.
    return {
      ip,
      city: v.city,
      region: v.region,
      country: undefined,
      countryCode: v.countryCode,
      flag: flagFor(v.countryCode),
      postal: v.postal,
      latitude: v.latitude,
      longitude: v.longitude,
      timezone: v.timezone,
      ...network,
      source: l ? "vercel+lookup" : "vercel",
    };
  }

  if (l) {
    // Either the two agree — in which case the lookup's fuller names are nicer
    // ("Karnataka" rather than "KA") — or Vercel gave us nothing at all.
    return {
      ip,
      city: l.city,
      region: l.region,
      country: l.country,
      countryCode: l.countryCode ?? v.countryCode,
      flag: flagFor(l.countryCode ?? v.countryCode),
      postal: l.postal,
      latitude: l.latitude,
      longitude: l.longitude,
      timezone: l.timezone ?? v.timezone,
      ...network,
      source: hasVercel ? "vercel+lookup" : "lookup",
    };
  }

  return {
    ip,
    city: v.city,
    region: v.region,
    countryCode: v.countryCode,
    flag: flagFor(v.countryCode),
    postal: v.postal,
    latitude: v.latitude,
    longitude: v.longitude,
    timezone: v.timezone,
    ...network,
    source: hasVercel ? "vercel" : "unknown",
  };
}

/** "IN" -> "India", without needing the lookup provider to have answered. */
export function countryName(code: string | undefined): string | undefined {
  if (!code) return undefined;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** "Bengaluru, Karnataka, India" — whatever parts we actually have. */
export function describePlace(geo: Geo): string {
  const parts = [
    geo.city,
    geo.region,
    geo.country ?? countryName(geo.countryCode),
  ].filter((p): p is string => Boolean(p));
  // Region often repeats the city on city-states; drop the duplicate.
  const seen = new Set<string>();
  const unique = parts.filter((p) => {
    const k = p.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return unique.length ? unique.join(", ") : "Unknown location";
}

export function mapLink(geo: Geo): string | undefined {
  if (!geo.latitude || !geo.longitude) return undefined;
  return `https://www.google.com/maps?q=${geo.latitude},${geo.longitude}`;
}
