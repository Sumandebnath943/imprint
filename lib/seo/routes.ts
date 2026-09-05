/**
 * The indexable route registry. Single source for the sitemap.
 *
 * `lastModified` is an explicit date rather than something derived at build
 * time, which is a deliberate trade. The two automatic options both lie:
 *
 *   `new Date()`      — what this used to be. Every URL claims it changed on
 *                       every deploy, including the terms page nobody touched.
 *                       Crawlers calibrate against that, find nothing changed,
 *                       and discount the signal for the whole domain.
 *   filesystem mtime  — on Vercel every file is written at checkout, so all
 *                       dates collapse to the deploy time. Same lie.
 *
 * Reading git at build time is closer to honest but depends on the deploy
 * having history, which a shallow clone may not. An explicit date is the only
 * option that is true on every host, so the cost is remembering to bump it.
 *
 * Rule: when a page's *content* changes, change its date here. Restyling,
 * refactors and dependency bumps are not content changes — the date should
 * answer "is there something new to read", not "did the bytes move".
 *
 * Dates below were seeded from the last commit that touched each route's page
 * and its components.
 */

export type IndexableRoute = {
  path: string;
  lastModified: string; // ISO date, YYYY-MM-DD
};

export const INDEXABLE_ROUTES: IndexableRoute[] = [
  { path: "/", lastModified: "2026-09-05" },
  { path: "/about", lastModified: "2026-09-03" },
  { path: "/courses", lastModified: "2026-09-03" },
  { path: "/signup", lastModified: "2026-09-03" },
  { path: "/privacy", lastModified: "2026-09-05" },
  { path: "/terms", lastModified: "2026-09-05" },
];

/**
 * Deliberately absent:
 *
 *   /signin            A door, not a destination. It was listed at priority
 *                      0.4, which spent crawl budget on a form.
 *   /credential/[code] noindex, and a member's name and score besides. Listing
 *                      them would be publishing the roster.
 *   /reset-password    Same reasoning as /signin.
 *   /dashboard/*       Disallowed in robots.txt.
 *   /onboarding/*      Disallowed in robots.txt.
 */
