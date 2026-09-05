import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { INDEXABLE_ROUTES } from "@/lib/seo/routes";

/**
 * Generated from the route registry in lib/seo/routes.ts.
 *
 * `priority` and `changeFrequency` are omitted on purpose. Google has stated
 * it ignores both, and Bing treats changeFrequency as a hint at best — so the
 * old values were describing the site to nobody. What remains is `lastModified`,
 * the one field crawlers do act on, and it now carries real dates instead of
 * the build timestamp.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path === "/" ? "/" : route.path}`,
    lastModified: new Date(`${route.lastModified}T00:00:00Z`),
  }));
}
