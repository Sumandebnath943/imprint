/**
 * Canonical origin for this deployment.
 *
 * Order of preference:
 *  1. NEXT_PUBLIC_APP_URL      — set this explicitly in production.
 *  2. NEXT_PUBLIC_VERCEL_URL   — Vercel provides this for preview deploys.
 *  3. localhost                — local development.
 *
 * Used for metadataBase, OG image URLs, robots.txt and the sitemap, so that
 * share cards and canonical links resolve correctly on every environment
 * instead of pointing at a hardcoded domain.
 */
export const SITE_URL: string = (() => {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
})();

export const SITE_NAME = "IMPRINT";

export const SITE_TAGLINE = "Remember Who You Are";

export const SITE_DESCRIPTION =
  "The identity preservation engine for humans in the age of AI. Map your cognitive baseline, track how far your thinking drifts, and keep the skills that make you you.";
