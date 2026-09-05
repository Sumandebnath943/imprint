import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { GLOSSARY, LITERATURE_TERMS, IMPRINT_TERMS, GlossaryTerm } from "@/lib/content/glossary";
import { definedTermSetNode } from "@/lib/seo/schema";
import JsonLd from "@/components/seo/JsonLd";
import { PageShell, Section } from "@/components/content/ContentPage";

const URL = `${SITE_URL}/glossary`;

export const metadata: Metadata = {
  title: "The Cognitive Drift Glossary",
  description:
    "Definitions for the vocabulary of cognitive drift: cognitive offloading, cognitive debt, skill atrophy, metacognitive laziness, automation bias, and the measurements IMPRINT defines.",
  alternates: { canonical: "/glossary" },
};

function TermCard({ t }: { t: GlossaryTerm }) {
  return (
    <li>
      <Link
        href={`/glossary/${t.slug}`}
        className="block rounded-2xl p-6 transition-colors h-full"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <h3 className="text-white font-semibold mb-2" style={{ fontSize: 18 }}>
          {t.term}
        </h3>
        <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 15, lineHeight: 1.65 }}>
          {t.definition}
        </p>
      </Link>
    </li>
  );
}

export default function GlossaryPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...definedTermSetNode(URL, GLOSSARY.map((t) => ({ slug: t.slug, term: t.term }))),
        }}
      />

      <PageShell
        eyebrow="Glossary"
        title="The vocabulary of cognitive drift"
        lede="Fifteen terms, defined. Seven come from the research literature on cognitive offloading and skill decay. Eight are measurements IMPRINT defines, and those are marked as such."
        byline
        updated="5 September 2026"
        breadcrumbs={[{ name: "Glossary", path: "/glossary" }]}
      >
        <Section id="from-the-literature" title="From the research literature">
          <p>
            Established terms with published research behind them. Where a source URL has
            been checked it is linked on the term&rsquo;s own page.
          </p>
          <ul className="grid gap-4 md:grid-cols-2 pt-2 list-none p-0">
            {LITERATURE_TERMS.map((t) => (
              <TermCard key={t.slug} t={t} />
            ))}
          </ul>
        </Section>

        <Section id="imprint-terms" title="Defined by IMPRINT">
          <p>
            Measurements and concepts specific to the product. These are IMPRINT&rsquo;s
            own vocabulary rather than established science, and the pages say so.
          </p>
          <ul className="grid gap-4 md:grid-cols-2 pt-2 list-none p-0">
            {IMPRINT_TERMS.map((t) => (
              <TermCard key={t.slug} t={t} />
            ))}
          </ul>
        </Section>
      </PageShell>
    </>
  );
}
