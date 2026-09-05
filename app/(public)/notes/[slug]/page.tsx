import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { SITE_URL } from "@/lib/site";
import { getNotes, getNote } from "@/lib/content/notes";
import { articleNode, faqPageNode } from "@/lib/seo/schema";
import JsonLd from "@/components/seo/JsonLd";
import { PageShell, Section, InlineLink } from "@/components/content/ContentPage";
import { mdxComponents } from "@/components/content/mdx";

export function generateStaticParams() {
  return getNotes().map((n) => ({ slug: n.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const note = getNote(params.slug);
  if (!note) return { title: "Not found", robots: { index: false, follow: true } };

  return {
    title: note.title,
    description: note.description,
    alternates: { canonical: `/notes/${note.slug}` },
    openGraph: {
      type: "article",
      title: note.title,
      description: note.description,
      publishedTime: note.published,
      modifiedTime: note.updated,
      authors: [note.author],
    },
  };
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function NotePage({ params }: { params: { slug: string } }) {
  const note = getNote(params.slug);
  if (!note) notFound();

  const url = `${SITE_URL}/notes/${note.slug}`;
  const wordCount = note.body.split(/\s+/).filter(Boolean).length;

  // Article stacked with FAQPage, from the frontmatter `faqs` array. The
  // questions are rendered visibly below, because marked-up answers that do not
  // appear on the page are a guidelines violation rather than a shortcut.
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      articleNode({
        url,
        headline: note.title,
        description: note.description,
        datePublished: note.published,
        dateModified: note.updated,
        wordCount,
        readingMinutes: note.readingMinutes,
        keywords: note.primaryKeyword,
      }),
      ...(note.faqs.length
        ? [
            faqPageNode(
              url,
              note.faqs.map((f, i) => ({
                id: `faq-${i + 1}`,
                question: f.q,
                answer: f.a,
              }))
            ),
          ]
        : []),
    ],
  };

  return (
    <>
      <JsonLd data={graph} />

      <PageShell
        eyebrow={`${formatDate(note.published)} · ${note.readingMinutes} min read`}
        title={note.title}
        lede={note.description}
        byline
        updated={note.updated !== note.published ? formatDate(note.updated) : undefined}
        breadcrumbs={[
          { name: "Notes", path: "/notes" },
          { name: note.title, path: `/notes/${note.slug}` },
        ]}
      >
        <article>
          <MDXRemote source={note.body} components={mdxComponents} />
        </article>

        {note.faqs.length ? (
          <Section id="questions" title="Questions this raises">
            <div>
              {note.faqs.map((f, i) => (
                <div
                  key={f.q}
                  id={`faq-${i + 1}`}
                  className="scroll-mt-28 py-5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <h3 className="text-white font-semibold mb-2" style={{ fontSize: 17 }}>
                    {f.q}
                  </h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {note.sources.length ? (
          <Section id="sources" title="Sources">
            <ul className="space-y-2 pl-5" style={{ listStyle: "disc" }}>
              {note.sources.map((s) => (
                <li key={s.title}>
                  {s.url ? <InlineLink href={s.url}>{s.title}</InlineLink> : s.title}
                </li>
              ))}
            </ul>
            <p className="pt-2" style={{ fontSize: 15, color: "rgba(255,255,255,0.55)" }}>
              Every study referenced here, with what it does and does not
              establish, is indexed on the{" "}
              <InlineLink href="/research">research page</InlineLink>.
            </p>
          </Section>
        ) : null}

        <div className="pt-4">
          <Link
            href="/notes"
            className="hover:underline underline-offset-2"
            style={{ color: "#FF5500", fontSize: 15 }}
          >
            ← All notes
          </Link>
        </div>
      </PageShell>
    </>
  );
}
