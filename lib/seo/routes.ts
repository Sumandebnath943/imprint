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

import { GLOSSARY } from "@/lib/content/glossary";
import { getNoteMeta } from "@/lib/content/notes";
import { CLUSTER_PAGES } from "@/lib/content/clusters";

const STATIC_ROUTES: IndexableRoute[] = [
  { path: "/", lastModified: "2026-09-05" },
  { path: "/about", lastModified: "2026-09-05" },
  { path: "/methodology", lastModified: "2026-09-05" },
  { path: "/drift-score", lastModified: "2026-09-05" },
  { path: "/research", lastModified: "2026-09-05" },
  { path: "/faq", lastModified: "2026-09-05" },
  { path: "/glossary", lastModified: "2026-09-05" },
  { path: "/notes", lastModified: "2026-09-05" },
  { path: "/contact", lastModified: "2026-09-05" },
  { path: "/courses", lastModified: "2026-09-03" },
  { path: "/signup", lastModified: "2026-09-03" },
  { path: "/privacy", lastModified: "2026-09-05" },
  { path: "/terms", lastModified: "2026-09-05" },
];

/**
 * Articles carry their own dates in frontmatter, so unlike everything above
 * these are genuinely accurate rather than maintained by hand — `updated` is
 * the field an author has to touch anyway when revising a piece.
 */
const NOTE_ROUTES: IndexableRoute[] = getNoteMeta().map((n) => ({
  path: `/notes/${n.slug}`,
  lastModified: n.updated,
}));

/**
 * Glossary terms are generated from the content file rather than listed by
 * hand, so adding a term cannot leave it out of the sitemap. Their date is the
 * glossary's own — the pages ship and change together as one document.
 */
const GLOSSARY_ROUTES: IndexableRoute[] = GLOSSARY.map((t) => ({
  path: `/glossary/${t.slug}`,
  lastModified: "2026-09-05",
}));

/** Audience pages, generated so a new cluster cannot go unlisted. */
const CLUSTER_ROUTES: IndexableRoute[] = CLUSTER_PAGES.map((c) => ({
  path: `/for/${c.slug}`,
  lastModified: "2026-09-05",
}));

export const INDEXABLE_ROUTES: IndexableRoute[] = [
  ...STATIC_ROUTES,
  ...NOTE_ROUTES,
  ...GLOSSARY_ROUTES,
  ...CLUSTER_ROUTES,
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
