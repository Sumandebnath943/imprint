import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { RESEARCH, ALL_STUDIES } from "@/lib/content/research";
import { WEBSITE_ID, PERSON_ID, ORG_ID } from "@/lib/seo/schema";
import JsonLd from "@/components/seo/JsonLd";
import { PageShell, Section, Note, InlineLink } from "@/components/content/ContentPage";

const URL = `${SITE_URL}/research`;

export const metadata: Metadata = {
  title: "The Research on AI and Cognition",
  description:
    "An organised, honestly-caveated index of the research behind cognitive drift: the MIT cognitive-debt study, the offloading and critical-thinking work, and attempts to measure AI reliance directly.",
  alternates: { canonical: "/research" },
};

/**
 * ItemList of ScholarlyArticle references.
 *
 * The list is the citable object here — the individual papers already have
 * canonical homes, and IMPRINT should not claim to publish them. What this page
 * contributes is the selection, the summaries and the caveats, so the ItemList
 * is authored while its members are plain references.
 */
function researchSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": `${URL}#list`,
        url: URL,
        name: "The research on AI and cognition",
        description:
          "A curated index of studies on cognitive offloading, cognitive debt and skill atrophy under AI delegation, each summarised with its stated limitations.",
        isPartOf: { "@id": WEBSITE_ID },
        author: { "@id": PERSON_ID },
        publisher: { "@id": ORG_ID },
        numberOfItems: ALL_STUDIES.length,
        itemListElement: ALL_STUDIES.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "ScholarlyArticle",
            name: s.title,
            author: s.authors,
            datePublished: String(s.year),
            publication: s.venue,
            ...(s.url ? { url: s.url, sameAs: s.url } : {}),
            abstract: s.finding,
          },
        })),
      },
    ],
  };
}

export default function ResearchPage() {
  return (
    <>
      <JsonLd data={researchSchema()} />

      <PageShell
        eyebrow="Research"
        title="The research on AI and cognition"
        lede="What the studies actually found, what they do not establish, and where the evidence is thinner than the headlines. Every entry carries its own caveat, because a summary that drops the sample size is how a modest result becomes a certainty."
        byline
        updated="5 September 2026"
        breadcrumbs={[{ name: "Research", path: "/research" }]}
      >
        <Note>
          <strong className="text-white">How to read this page.</strong> The
          evidence that AI delegation reduces cognitive engagement{" "}
          <em>during a task</em> is reasonably good. The evidence that it causes
          lasting capability loss is not — it is inferred from skill-decay
          research that predates AI. IMPRINT is built on the first claim and is
          agnostic about the second. Anyone telling you the science is settled
          in either direction has not read it.
        </Note>

        {RESEARCH.map((group) => (
          <Section key={group.id} id={group.id} title={group.title}>
            <p>{group.blurb}</p>

            <div className="space-y-6 pt-2">
              {group.studies.map((s) => (
                <article
                  key={s.id}
                  id={s.id}
                  className="scroll-mt-28 rounded-2xl p-6"
                  style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <h3 className="text-white font-semibold mb-1" style={{ fontSize: 17, lineHeight: 1.35 }}>
                    {s.url ? <InlineLink href={s.url}>{s.title}</InlineLink> : s.title}
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13.5, marginBottom: 12 }}>
                    {s.authors} · {s.year} · {s.venue}
                    {!s.url ? " · link unverified" : ""}
                  </p>

                  <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 15, lineHeight: 1.7 }}>
                    <strong className="text-white">What it found. </strong>
                    {s.finding}
                  </p>
                  <p className="mt-3" style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.7 }}>
                    <strong style={{ color: "rgba(255,255,255,0.8)" }}>What it does not show. </strong>
                    {s.limits}
                  </p>
                  <p className="mt-3" style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.6 }}>
                    <em>Why it is here: {s.relevance}</em>
                  </p>
                </article>
              ))}
            </div>
          </Section>
        ))}

        <Section id="corrections" title="Corrections welcome">
          <p>
            Studies are listed with a link only where the canonical URL has been
            checked. Where it has not, the entry is marked and the finding is
            described without one — a wrong citation on a page like this costs
            more than a missing one.
          </p>
          <p>
            If something here is misdescribed, out of date, or missing a paper
            that belongs, <InlineLink href="/contact">say so</InlineLink>. How
            IMPRINT applies this research is set out on the{" "}
            <InlineLink href="/methodology">methodology page</InlineLink>, along
            with what its own measurements cannot do.
          </p>
        </Section>
      </PageShell>
    </>
  );
}
