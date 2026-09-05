import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${SITE_URL}/`,        lastModified: now, changeFrequency: "weekly",  priority: 1 },
    { url: `${SITE_URL}/about`,   lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/courses`, lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${SITE_URL}/signin`,  lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${SITE_URL}/signup`,  lastModified: now, changeFrequency: "yearly",  priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/terms`,   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
