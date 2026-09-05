import Link from "next/link";
import JsonLd from "./JsonLd";
import { breadcrumbNode } from "@/lib/seo/schema";

export type Crumb = { name: string; path: string };

/**
 * Visible trail plus its BreadcrumbList schema, from one array.
 *
 * Deliberately not built until now: with six flat routes there was no
 * hierarchy to express, and a trail reading "Home / About" is decoration.
 * /glossary/[term] is the first real depth on the site.
 *
 * Emitting the markup and the schema from the same source is the point — a
 * BreadcrumbList that disagrees with the visible trail is the kind of mismatch
 * that gets structured data discounted rather than trusted.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ name: "Home", path: "/" }, ...items];
  const last = trail.length - 1;

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", ...breadcrumbNode(trail) }} />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2" style={{ fontSize: 13 }}>
          {trail.map((crumb, i) => (
            <li key={crumb.path} className="flex items-center gap-2">
              {i === last ? (
                // The current page is not a link — a link to where you already
                // are is a dead control.
                <span aria-current="page" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className="hover:underline underline-offset-2"
                  style={{ color: "rgba(255,255,255,0.62)" }}
                >
                  {crumb.name}
                </Link>
              )}
              {i < last ? (
                <span aria-hidden="true" style={{ color: "rgba(255,255,255,0.25)" }}>
                  /
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
