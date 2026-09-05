import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { getNoteMeta } from "@/lib/content/notes";
import { blogNode } from "@/lib/seo/schema";
import JsonLd from "@/components/seo/JsonLd";
import { PageShell } from "@/components/content/ContentPage";

const URL = `${SITE_URL}/notes`;

export const metadata: Metadata = {
  title: "Notes",
  description:
    "Long-form writing on cognitive drift, AI delegation, and what the research on cognitive offloading actually establishes — including where the evidence is thinner than the headlines.",
  alternates: { canonical: "/notes" },
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function NotesIndexPage() {
  const notes = getNoteMeta();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...blogNode(
            URL,
            notes.map((n) => ({
              slug: n.slug,
              title: n.title,
              description: n.description,
              published: n.published,
            }))
          ),
        }}
      />

      <PageShell
        eyebrow="Notes"
        title="Writing on cognitive drift"
        lede="What the research establishes, what it does not, and what any of it means for the way you actually work. Nothing here is generated — which would be an odd thing to do on this particular subject."
        breadcrumbs={[{ name: "Notes", path: "/notes" }]}
      >
        <ul className="list-none p-0 m-0">
          {notes.map((n) => (
            <li key={n.slug} style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
              <Link href={`/notes/${n.slug}`} className="block py-7 group">
                <p
                  style={{
                    color: "rgba(255,255,255,0.42)",
                    fontSize: 13,
                    marginBottom: 8,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatDate(n.published)} · {n.readingMinutes} min read
                </p>
                <h2
                  className="text-white font-semibold mb-2 group-hover:underline underline-offset-4"
                  style={{ fontSize: "clamp(20px,2.2vw,25px)", lineHeight: 1.25, letterSpacing: "-0.02em" }}
                >
                  {n.title}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 16, lineHeight: 1.65, maxWidth: 640 }}>
                  {n.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </PageShell>
    </>
  );
}
