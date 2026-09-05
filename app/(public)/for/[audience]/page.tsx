import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { CLUSTER_PAGES, CLUSTER_BY_SLUG } from "@/lib/content/clusters";
import {
  getBaselineModulesForCluster,
  getVaultChallengePrompt,
  CLUSTER_PROFESSIONS,
} from "@/lib/utils/profession";
import { faqPageNode, WEBSITE_ID, SOFTWARE_ID, PERSON_ID, ORG_ID } from "@/lib/seo/schema";
import JsonLd from "@/components/seo/JsonLd";
import { PageShell, Section, Row, Note, InlineLink } from "@/components/content/ContentPage";

export function generateStaticParams() {
  return CLUSTER_PAGES.map((c) => ({ audience: c.slug }));
}

export function generateMetadata({ params }: { params: { audience: string } }): Metadata {
  const c = CLUSTER_BY_SLUG.get(params.audience);
  if (!c) return { title: "Not found", robots: { index: false, follow: true } };

  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/for/${c.slug}` },
    openGraph: { title: c.title, description: c.description },
  };
}

/** "software_developer" → "Software developer" */
function humanise(profession: string): string {
  const s = profession.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function AudiencePage({ params }: { params: { audience: string } }) {
  const c = CLUSTER_BY_SLUG.get(params.audience);
  if (!c) notFound();

  const url = `${SITE_URL}/for/${c.slug}`;

  // Pulled from the product rather than restated in the content file, so the
  // modules and challenge shown here are literally what this visitor gets. If
  // the prompts change, these pages change with them — which is the property
  // that makes an audience page honest rather than a doorway.
  const modules = getBaselineModulesForCluster(c.cluster);
  const professions = CLUSTER_PROFESSIONS[c.cluster] ?? [];
  // The templates interpolate a skill name inside quotes, so the placeholder
  // has to read as one. "the skill you are protecting" produced "Solve a 'the
  // skill you are protecting' problem"; a bracketed token reads as the template
  // slot it actually is.
  const challenge = getVaultChallengePrompt(c.cluster, "[your skill]");

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: c.title,
        description: c.description,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": SOFTWARE_ID },
        author: { "@id": PERSON_ID },
        publisher: { "@id": ORG_ID },
        audience: {
          "@type": "Audience",
          audienceType: professions.map(humanise).join(", "),
        },
      },
      faqPageNode(
        url,
        c.faqs.map((f, i) => ({ id: `faq-${i + 1}`, question: f.q, answer: f.a }))
      ),
    ],
  };

  return (
    <>
      <JsonLd data={graph} />

      <PageShell
        eyebrow="Built for"
        title={c.h1}
        lede={c.lede}
        byline
        updated="5 September 2026"
        breadcrumbs={[{ name: c.title.replace("IMPRINT for ", ""), path: `/for/${c.slug}` }]}
      >
        <Section id="what-erodes" title="What delegation takes from this work">
          {c.erosion.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <Note>
            <strong className="text-white">What is actually at stake. </strong>
            {c.atStake}
          </Note>
        </Section>

        <Section id="who" title="Who this covers">
          <p>
            IMPRINT sorts people into six profession clusters during onboarding, and the
            baseline prompts change accordingly. This page describes the{" "}
            <strong>{c.cluster.replace(/_/g, " and ")}</strong> cluster, which covers:
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1 list-none p-0">
            {professions.map((p) => (
              <li key={p} style={{ color: "rgba(255,255,255,0.62)", fontSize: 15 }}>
                {humanise(p)}
              </li>
            ))}
          </ul>
          <p className="pt-2" style={{ fontSize: 15, color: "rgba(255,255,255,0.55)" }}>
            Not listed here? The other clusters are{" "}
            {CLUSTER_PAGES.filter((x) => x.slug !== c.slug).map((x, i, arr) => (
              <span key={x.slug}>
                <InlineLink href={`/for/${x.slug}`}>
                  {x.title.replace("IMPRINT for ", "")}
                </InlineLink>
                {i < arr.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        </Section>

        <Section id="what-you-answer" title="What your baseline actually asks">
          <p>
            Everyone answers four universal modules — opinion and belief, decision under
            pressure, memory and recall, emotional fingerprint. On top of those, this
            cluster gets{" "}
            {modules.length === 1 ? "one module" : `${modules.length} modules`} written
            for it:
          </p>
          <div className="pt-2">
            {modules.map((m) => (
              <Row
                key={m.id}
                what={m.name}
                why={
                  <>
                    <span style={{ color: "rgba(255,255,255,0.82)" }}>
                      &ldquo;{m.prompt}&rdquo;
                    </span>
                    <br />
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>{m.description}</span>
                  </>
                }
              />
            ))}
          </div>
        </Section>

        <Section id="practice" title="How the practice works here">
          {c.practice.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <div
            className="rounded-xl p-5 mt-2"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p
              style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}
            >
              Your vault challenge — generated per skill
            </p>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 1.6 }}>
              {challenge}
            </p>
          </div>
        </Section>

        <Section id="questions" title="Questions">
          <div>
            {c.faqs.map((f, i) => (
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

        <Section id="start" title="Getting a baseline">
          <p>
            Baseline capture takes 20 to 30 minutes and is free. How the resulting
            score is calculated — and what it gets wrong — is published on the{" "}
            <InlineLink href="/methodology">methodology page</InlineLink>; the research
            behind it is indexed on the{" "}
            <InlineLink href="/research">research page</InlineLink>.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-block rounded-full px-8 py-3.5 font-medium text-on-accent transition-all hover:opacity-90"
              style={{ background: "#FF5500" }}
            >
              Capture your baseline →
            </Link>
          </div>
        </Section>
      </PageShell>
    </>
  );
}
