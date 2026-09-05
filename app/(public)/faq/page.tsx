import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { FAQ_GROUPS, ALL_FAQS } from "@/lib/content/faq";
import { faqPageNode } from "@/lib/seo/schema";
import JsonLd from "@/components/seo/JsonLd";
import { PageShell, QA, InlineLink } from "@/components/content/ContentPage";

const URL = `${SITE_URL}/faq`;

export const metadata: Metadata = {
  title: "IMPRINT FAQ",
  description:
    "Thirty answered questions about IMPRINT: what cognitive drift is, how the Drift Score is calculated, what the research does and does not show, what data is collected, and what it costs.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      {/* Page-level node alongside the site graph emitted by the public
          layout. Two script blocks rather than one, because a layout cannot
          know its children's nodes — the cross-references resolve regardless,
          since @id lookup is per-document and not per-script. */}
      <JsonLd data={{ "@context": "https://schema.org", ...faqPageNode(URL, ALL_FAQS) }} />

      <PageShell
        eyebrow="Answers"
        title="Frequently asked questions"
        lede="What IMPRINT measures, how the number is produced, what the research actually establishes, and what happens to your data. The uncomfortable questions are answered here too."
        byline
        updated="5 September 2026"
        breadcrumbs={[{ name: "FAQ", path: "/faq" }]}
      >
        {FAQ_GROUPS.map((group) => (
          <section key={group.id} id={group.id} className="scroll-mt-28">
            <h2
              className="text-white font-semibold mb-2"
              style={{ fontSize: "clamp(22px,2.4vw,28px)", letterSpacing: "-0.02em" }}
            >
              {group.title}
            </h2>
            <div>
              {group.faqs.map((faq) => (
                <QA key={faq.id} id={faq.id} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </section>
        ))}

        <section id="more" className="scroll-mt-28">
          <h2
            className="text-white font-semibold mb-4"
            style={{ fontSize: "clamp(22px,2.4vw,28px)", letterSpacing: "-0.02em" }}
          >
            Still unanswered
          </h2>
          <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 16, lineHeight: 1.75 }}>
            <p>
              The arithmetic behind every number here is published in full on the{" "}
              <InlineLink href="/methodology">methodology page</InlineLink>, including the
              parts that do not work well. Definitions for the vocabulary are in the{" "}
              <InlineLink href="/glossary">glossary</InlineLink>. Anything else,{" "}
              <InlineLink href="/contact">get in touch</InlineLink>.
            </p>
          </div>
        </section>
      </PageShell>
    </>
  );
}
