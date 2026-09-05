/**
 * Where the visitor is, how confident we are, and who their network belongs to.
 *
 * Sources, in order of authority for *location*:
 *
 *  1. Vercel's edge headers (`x-vercel-ip-*`). Resolved at the edge before the
 *     function runs, so they cost nothing and never fail. Accurate at city
 *     level — verified against a known address, which resolved correctly.
 *  2. A free IP lookup (ipwho.is, then ipapi.co). Only consulted for location
 *     when Vercel gave no city; otherwise it supplies the ISP and ASN, which
 *     Vercel does not carry.
 *
 * Two rules, both learned the hard way:
 *
 *  - **Never interleave the two.** Taking the city from one and the postcode
 *    from the other produced "Bengaluru … postal 600079" — a Chennai postcode.
 *  - **Never invent precision.** When no city resolves, a provider will happily
 *    return the country's centroid. Reported as coordinates that reads as a
 *    real position: for India it lands near Nagpur, which is roughly 700km from
 *    anyone in Pune. Coordinates are dropped unless a city or region was
 *    actually resolved, and the alert says what precision it had.
 */

/** How specific the location actually is. Drives whether a map pin is shown. */
export type Precision = "city" | "region" | "country" | "unknown";

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
  /** Mobile carrier — IP geolocation is materially less accurate on these. */
  mobile: boolean;
  precision: Precision;
  /** Which source the location came from. */
  source: "vercel" | "lookup" | "none";
  /** Set when the two sources named different cities — worth knowing. */
  disagreement?: string;
}

const HOSTING = [
  "amazon", "aws", "google", "microsoft", "azure", "digitalocean", "linode",
  "vultr", "hetzner", "ovh", "scaleway", "contabo", "oracle", "alibaba",
  "tencent", "cloudflare", "fastly", "akamai", "leaseweb", "choopa",
  "hostinger", "godaddy", "namecheap", "bluehost", "rackspace", "equinix",
  "colocation", "datacenter", "data center", "hosting", "server", "vps",
  "m247", "cogent", "level 3", "zenlayer", "packet", "upcloud",
];

/** Consumer mobile carriers, where the address often resolves to a regional
 *  gateway hundreds of kilometres from the handset. */
const MOBILE = [
  "jio", "airtel", "vodafone", "idea", "bsnl", "vi india",
  "t-mobile", "verizon wireless", "at&t mobility", "sprint",
  "orange", "telefonica", "movistar", "o2", "ee limited", "three",
  "telstra", "optus", "rogers", "bell mobility", "telus mobility",
];

function matches(list: string[], text: string | undefined): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return list.some((h) => t.includes(h));
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

/** "IN" -> "India", without needing a lookup provider to have answered. */
export function countryName(code: string | undefined): string | undefined {
  if (!code) return undefined;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/**
 * The client's address. `x-forwarded-for` is a chain; the left-most entry is
 * the original client. Vercel's `x-real-ip` is already resolved, so it wins.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = headers.get("x-vercel-forwarded-for") ?? headers.get("x-forwarded-for");
  const first = fwd?.split(",")[0]?.trim();
  return first || "unknown";
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

interface Place {
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  postal?: string;
  latitude?: string;
  longitude?: string;
  timezone?: string;
}

interface Lookup extends Place {
  isp?: string;
  asn?: string;
}

function fromVercel(headers: Headers): Place {
  // Vercel percent-encodes city and region: "New Delhi" arrives "New%20Delhi".
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

const cache = new Map<string, { at: number; value: Lookup | null }>();
const CACHE_TTL_MS = 60 * 60_000;
// Losing the ISP is a cheap price for a faster alert: the location itself comes
// from Vercel's headers, not from here, and this runs before the Telegram send.
const LOOKUP_TIMEOUT_MS = 1_500;

async function getJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), LOOKUP_TIMEOUT_MS);
    const res = await fetch(url, { signal: ctl.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const num = (v: unknown) => (typeof v === "number" ? String(v) : undefined);

async function lookup(ip: string): Promise<Lookup | null> {
  const hit = cache.get(ip);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  let value: Lookup | null = null;

  const a = await getJson(`https://ipwho.is/${encodeURIComponent(ip)}`);
  if (a && a.success !== false) {
    const conn = (a.connection ?? {}) as Record<string, unknown>;
    const tz = (a.timezone ?? {}) as Record<string, unknown>;
    value = {
      city: str(a.city),
      region: str(a.region),
      country: str(a.country),
      countryCode: str(a.country_code),
      postal: str(a.postal),
      latitude: num(a.latitude),
      longitude: num(a.longitude),
      timezone: str(tz.id),
      isp: str(conn.isp) ?? str(conn.org),
      asn: conn.asn ? `AS${String(conn.asn)}` : undefined,
    };
  }

  // Second opinion only when the first could not name a city — that is the
  // case where we would otherwise fall back to country-level and lose the pin.
  if (!value?.city) {
    const b = await getJson(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
    if (b && !b.error && str(b.city)) {
      value = {
        city: str(b.city),
        region: str(b.region),
        country: str(b.country_name),
        countryCode: str(b.country_code),
        postal: str(b.postal),
        latitude: num(b.latitude),
        longitude: num(b.longitude),
        timezone: str(b.timezone),
        isp: str(b.org) ?? value?.isp,
        asn: str(b.asn) ?? value?.asn,
      };
    }
  }

  cache.set(ip, { at: Date.now(), value });
  return value;
}

export async function resolveGeo(headers: Headers): Promise<Geo> {
  const ip = clientIp(headers);
  const v = fromVercel(headers);
  const l = isPrivate(ip) ? null : await lookup(ip);

  const network = {
    isp: l?.isp,
    asn: l?.asn,
    datacenter: matches(HOSTING, l?.isp) || matches(HOSTING, l?.asn),
    mobile: matches(MOBILE, l?.isp) || matches(MOBILE, l?.asn),
  };

  const disagreement =
    v.city && l?.city && v.city.toLowerCase() !== l.city.toLowerCase()
      ? `lookup says ${l.city}`
      : undefined;

  // Location comes from exactly one provider, chosen here and not merged.
  const place: Place | null = v.city ? v : l?.city ? l : null;
  const source: Geo["source"] = v.city ? "vercel" : l?.city ? "lookup" : "none";

  if (place) {
    const countryCode = place.countryCode ?? v.countryCode;
    // Vercel's region is an ISO subdivision code ("MH"); the lookup carries the
    // full name ("Maharashtra"). Borrowing just that label is safe *only* when
    // both providers agree on the city — it is the same place, better spelled,
    // not a field merged in from a different result.
    const region =
      source === "vercel" && l?.city && !disagreement && l.region
        ? l.region
        : place.region;
    return {
      ip,
      city: place.city,
      region,
      country: place.country ?? countryName(countryCode),
      countryCode,
      flag: flagFor(countryCode),
      postal: place.postal,
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone ?? v.timezone,
      ...network,
      precision: "city",
      source,
      disagreement,
    };
  }

  // No city anywhere. Report the country honestly and drop the coordinates —
  // a provider's country centroid is not a position, and rendering it as one
  // is how a Pune visitor ended up pinned outside Nagpur.
  const countryCode = v.countryCode ?? l?.countryCode;
  if (countryCode) {
    return {
      ip,
      country: l?.country ?? countryName(countryCode),
      countryCode,
      flag: flagFor(countryCode),
      timezone: v.timezone ?? l?.timezone,
      ...network,
      precision: "country",
      source: "none",
    };
  }

  return { ip, ...network, precision: "unknown", source: "none" };
}

/** "Bengaluru, Karnataka, India" — whatever parts we actually have. */
export function describePlace(geo: Geo): string {
  const parts = [geo.city, geo.region, geo.country ?? countryName(geo.countryCode)]
    .filter((p): p is string => Boolean(p));
  const seen = new Set<string>();
  const unique = parts.filter((p) => {
    const k = p.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return unique.length ? unique.join(", ") : "Unknown location";
}

/** Only ever a real position — never a country centroid. */
export function mapLink(geo: Geo): string | undefined {
  if (geo.precision !== "city" && geo.precision !== "region") return undefined;
  if (!geo.latitude || !geo.longitude) return undefined;
  return `https://www.google.com/maps?q=${geo.latitude},${geo.longitude}`;
}
