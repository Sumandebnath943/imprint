/**
 * What the request was actually asking for.
 *
 * Middleware runs *before* routes are resolved — that is the whole point of the
 * file, and Next is explicit that middleware cannot see the downstream
 * response. Without this module the alert can only ever say "fetched a page",
 * so a request for `/.git/HEAD` and a request for `/methodology` read
 * identically: two probes that got a 404 look exactly like two real visits.
 *
 * So the path is classified here instead, by two independent questions. They
 * fail in opposite directions and must not be collapsed:
 *
 *   known  — does this match the shape of a real route? Errs toward "yes". A
 *            mistyped note slug reported as a page is a shrug; a real page
 *            reported as a 404 is a lie.
 *   probe  — is this a recognised attack target? Errs toward "no". Nothing on
 *            this site begins with a dot or mentions wp-admin, so a hit here is
 *            never ambiguous.
 *
 * Resolving real slugs would mean importing `lib/content/notes.ts` — and with
 * it `node:fs` — into a bundle that runs on the edge for every request, to
 * answer a question worth one word in a Telegram message. Shapes are the right
 * trade.
 */

/**
 * Paths worth reporting at all.
 *
 * Assets are noise: a crawler pulling a font or an OG image says nothing about
 * what it is reading, and one page view would otherwise fan out into a dozen
 * messages.
 *
 * `/robots.txt` and `/sitemap.xml` are excluded for the same reason and it
 * costs something real — every well-behaved crawler fetches robots.txt before
 * anything else, so leaving them in roughly doubles the volume to say
 * "a crawler is about to crawl". The arrival that follows carries the same news
 * with a path attached.
 *
 * `/llms.txt` and `/llms-full.txt` are deliberately kept despite being files:
 * an agent fetching those is the most interesting arrival this site can log,
 * because it means something is reading the AI context on purpose rather than
 * stumbling onto a page.
 */
export function isReportablePath(pathname: string): boolean {
  if (pathname.startsWith("/_next/") || pathname.startsWith("/api/")) return false;
  if (pathname === "/llms.txt" || pathname === "/llms-full.txt") return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return false;
  // Next's generated share-card routes are assets with no file extension —
  // `/about/opengraph-image-17nj2n` and friends — so the extension rule below
  // cannot see them. They matter: an unfurler fetches the card right after the
  // page, and without this the card arrives as a second alert reporting a 404
  // for a route that very much exists.
  if (/(^|\/)(opengraph-image|twitter-image)(-[a-z0-9]+)?$/i.test(pathname)) return false;
  // Anything else carrying a file extension is an asset, not a page.
  return !/\.[a-z0-9]{2,5}$/i.test(pathname);
}

/**
 * Every fixed route the site actually serves — public, auth and dashboard
 * alike. Non-indexable pages belong here too: `/signin` is absent from the
 * sitemap on purpose, but a crawler that fetches it got a page, and the alert
 * must not call that a 404.
 *
 * ⚠ Add a route, add it here. This list cannot be derived from
 * `lib/seo/routes.ts` — that module reads MDX off disk and would drag
 * `node:fs` into the middleware bundle — so drift is caught by review, not by
 * the compiler. The failure mode is mild in one direction (a real page
 * reported as a 404) and absent in the other.
 */
const STATIC_ROUTES = new Set([
  "/",
  "/about",
  "/methodology",
  "/drift-score",
  "/research",
  "/faq",
  "/glossary",
  "/notes",
  "/contact",
  "/courses",
  "/privacy",
  "/terms",
  "/signin",
  "/signup",
  "/reset-password",
  "/dashboard",
  "/auth/callback",
  // Reached through isReportablePath's explicit allowance above.
  "/llms.txt",
  "/llms-full.txt",
]);

const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";

/** The dynamic families, as shapes rather than lookups. */
const ROUTE_SHAPES = [
  new RegExp(`^/notes/${SLUG}$`),
  new RegExp(`^/glossary/${SLUG}$`),
  new RegExp(`^/for/${SLUG}$`),
  // Credential codes are opaque and may carry upper case, so this is looser
  // than SLUG on purpose.
  /^\/credential\/[A-Za-z0-9-]{4,64}$/,
  // Signed-in areas. Two segments deep covers /dashboard/mirror/history and
  // /dashboard/profile/credential.
  new RegExp(`^/dashboard/${SLUG}(?:/${SLUG})?$`),
  new RegExp(`^/onboarding/${SLUG}$`),
];

/**
 * Recognised probe targets, each with what the scanner was hoping to find.
 *
 * ⚠ Every pattern is anchored to whole path segments, never a bare substring.
 * An unanchored `/secrets/` would happily flag a published article about
 * keeping secrets out of AI-built apps as an attack, and an alert that cries
 * wolf over its own writing is worse than no alert. If a pattern cannot be
 * segment-anchored it does not belong here.
 */
const SEG = "(?:^|/)";
const PROBES: [RegExp, string][] = [
  [/^\/\.git(\/|$)/i, "git repository — source and history"],
  [/^\/\.env(\.|\/|$)/i, "env file — API keys, Supabase service role, bot token"],
  [/^\/\.(aws|ssh|npmrc|docker|htpasswd|svn|hg|vscode|idea)(\/|$)/i, "developer credentials"],
  [new RegExp(`${SEG}(wp-admin|wp-login\\.php|wp-content|wp-includes|xmlrpc\\.php|wordpress)(/|$)`, "i"), "WordPress"],
  [new RegExp(`${SEG}(phpmyadmin|phpinfo\\.php|eval-stdin\\.php|cgi-bin|vendor|phpunit)(/|$)`, "i"), "PHP tooling"],
  [/^\/(administrator|admin|cpanel|webmail|manager)(\/|$)/i, "admin panel"],
  [new RegExp(`${SEG}(backup|backups|dump|db|database)(/|$)|\\.(sql|bak|dump)$`, "i"), "database backup"],
  [new RegExp(`${SEG}(config\\.json|credentials|secrets?)(/|$)|\\.(pem|key|p12|pfx)$|${SEG}id_rsa`, "i"), "secrets file"],
  [new RegExp(`${SEG}(actuator|server-status|telescope|_profiler|debug)(/|$)`, "i"), "framework debug endpoint"],
];

export interface PathVerdict {
  /** Matches a real route, so something was genuinely served. */
  known: boolean;
  /** What the request was fishing for, or null if it is not a known probe. */
  probe: string | null;
}

export function classifyPath(pathname: string): PathVerdict {
  const known =
    STATIC_ROUTES.has(pathname) ||
    STATIC_ROUTES.has(pathname.replace(/\/$/, "")) ||
    ROUTE_SHAPES.some((re) => re.test(pathname));

  // A path that resolves to a real route cannot be a probe, whatever it is
  // called. This guard is what makes the patterns above safe to extend: the
  // worst a careless one can now do is miss an attack, not libel an article.
  if (known) return { known, probe: null };

  for (const [re, what] of PROBES) {
    if (re.test(pathname)) return { known, probe: what };
  }
  // /.well-known/ is the one dotted path that is a standard rather than an
  // intrusion — security.txt, apple-app-site-association and friends. Nothing
  // is served there today, so this is not marked `known`; it is only kept out
  // of the catch-all below, so a request for it reports as an ordinary 404
  // instead of an attack.
  if (pathname.startsWith("/.well-known/")) return { known, probe: null };

  // Any other dotted segment. Nothing this site serves looks like that, and
  // scanners try hundreds of them, so a catch-all beats a longer list.
  if (/(^|\/)\.[^/]/.test(pathname)) return { known, probe: "hidden dotfile" };

  return { known, probe: null };
}
