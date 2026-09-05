import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { GLOSSARY, GLOSSARY_BY_SLUG } from "@/lib/content/glossary";
import { definedTermNode } from "@/lib/seo/schema";
import JsonLd from "@/components/seo/JsonLd";
import { PageShell, Section, Note, InlineLink } from "@/components/content/ContentPage";

const SET_URL = `${SITE_URL}/glossary`;

/** Every term is known at build time, so all fifteen pages are static. */
export function generateStaticParams() {
  return GLOSSARY.map((t) => ({ term: t.slug }));
}

export function generateMetadata({ params }: { params: { term: string } }): Metadata {
  const t = GLOSSARY_BY_SLUG.get(params.term);
  if (!t) return { title: "Term not found", robots: { index: false, follow: true } };

  return {
    title: `${t.term} — definition`,
    // The definition doubles as the meta description. It is already written to
    // stand alone in 30–45 words, which is exactly what this field wants.
    description: t.definition,
    alternates: { canonical: `/glossary/${t.slug}` },
    // No `openGraph` block. Declaring one replaces the parent's entirely,
    // which dropped the inherited share image and left every term page with a
    // blank card. Without it, Next fills og:title and og:description from the
    // title and description above and the root image is inherited.
  };
}

export default function GlossaryTermPage({ params }: { params: { term: string } }) {
  const t = GLOSSARY_BY_SLUG.get(params.term);
  if (!t) notFound();

  const related = t.related
    .map((slug) => GLOSSARY_BY_SLUG.get(slug))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...definedTermNode({
            url: `${SET_URL}/${t.slug}`,
            setUrl: SET_URL,
            term: t.term,
            definition: t.definition,
            alternateNames: t.alternateNames,
          }),
        }}
      />

      <PageShell
        eyebrow={t.origin === "imprint" ? "IMPRINT vocabulary" : "Glossary"}
        title={t.term}
        lede={t.definition}
        byline
        updated="5 September 2026"
        breadcrumbs={[
          { name: "Glossary", path: "/glossary" },
          { name: t.term, path: `/glossary/${t.slug}` },
        ]}
      >
        {t.origin === "imprint" ? (
          <Note>
            <strong className="text-white">IMPRINT&rsquo;s own term.</strong> This is
            product vocabulary, not established science. It is defined here so the
            measurement can be checked rather than taken on trust — the arithmetic is on
            the <InlineLink href="/methodology">methodology page</InlineLink>.
          </Note>
        ) : null}

        <Section id="explanation" title="In more detail">
          {t.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </Section>

        {t.sources?.length ? (
          <Section id="sources" title="Sources">
            <ul className="space-y-2 pl-5" style={{ listStyle: "disc" }}>
              {t.sources.map((s) => (
                <li key={s.title}>
                  {s.url ? (
                    <InlineLink href={s.url}>{s.title}</InlineLink>
                  ) : (
                    <span>{s.title}</span>
                  )}
                  {s.note ? (
                    <span style={{ color: "rgba(255,255,255,0.5)" }}> — {s.note}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {related.length ? (
          <Section id="related" title="Related terms">
            <ul className="grid gap-3 md:grid-cols-2 pt-1 list-none p-0">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/glossary/${r.slug}`}
                    className="block rounded-xl p-4 transition-colors"
                    style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <span className="text-white font-medium" style={{ fontSize: 15 }}>
                      {r.term}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
      </PageShell>
    </>
  );
}
