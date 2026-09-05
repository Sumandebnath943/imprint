import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { techArticleNode, faqPageNode, WEBSITE_ID, SOFTWARE_ID } from "@/lib/seo/schema";
import JsonLd from "@/components/seo/JsonLd";
import { PageShell, Section, Row, Note, InlineLink } from "@/components/content/ContentPage";

const URL = `${SITE_URL}/drift-score`;

export const metadata: Metadata = {
  title: "The Drift Score — Test Your AI Dependency",
  description:
    "The Drift Score measures how far your thinking has moved from your own baseline under AI delegation. What the number means, what the bands are, and how to get one in about 25 minutes. Free.",
  alternates: { canonical: "/drift-score" },
};

/**
 * Answers marked up here are also the visible copy below, same as /faq — the
 * requirement that FAQPage content appear on the page applies wherever the
 * markup is used, not just on the page called FAQ.
 */
const FAQS = [
  {
    id: "what-is-a-drift-score",
    question: "What is a Drift Score?",
    answer:
      "The IMPRINT Drift Score is a 0–100 measurement of how far your current thinking sits from your own recorded baseline. Zero to 39 is Anchored, 40 to 59 Drifting, 60 to 79 Critical, 80 to 100 Identity Crisis. Higher means further from yourself, not worse than other people.",
  },
  {
    id: "how-do-i-get-one",
    question: "How do I get a Drift Score?",
    answer:
      "Create a free IMPRINT account and complete baseline capture, which takes 20 to 30 minutes and records how you write and decide. Your first Drift Score is produced by your first calibration, which compares a fresh set of responses against that baseline.",
  },
  {
    id: "is-it-an-ai-dependency-test",
    question: "Is this an AI dependency test?",
    answer:
      "Partly. One of the four signals measures AI dependence directly, at 20 percent of the score. The rest measure what has happened to your own output and practice habits — which is the more useful question, because the amount of AI you use matters less than whether your capability is changing.",
  },
  {
    id: "how-accurate",
    question: "How accurate is the Drift Score?",
    answer:
      "It is a structured, repeatable prompt to look at your own work, not a clinical measure. The metrics are lexical and proxy reasoning depth rather than measuring it, there are no population norms, and the weights are a judgement rather than a fitted result. All of that is published.",
  },
];

function schema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      techArticleNode({
        url: URL,
        headline: "The Drift Score: measuring how far you have moved from your own baseline",
        description:
          "What the IMPRINT Drift Score measures, what each band means, and how to produce one.",
        datePublished: "2026-09-05",
        dateModified: "2026-09-05",
        section: "Product",
      }),
      {
        "@type": "HowTo",
        "@id": `${URL}#howto`,
        name: "How to get your Drift Score",
        description:
          "Produce an IMPRINT Drift Score by capturing a cognitive baseline and completing a calibration against it.",
        totalTime: "PT30M",
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": SOFTWARE_ID },
        estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
        supply: [],
        tool: [],
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Create a free account",
            text: "Sign up with an email address or with Google. No payment details are required.",
            url: `${URL}#step-1`,
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Capture your baseline",
            text: "Answer a seven-step set of prompts covering opinion, decision-making, memory and your profession cluster. Responses can be text, voice or file upload. Takes 20 to 30 minutes.",
            url: `${URL}#step-2`,
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Run your first calibration",
            text: "Answer the same modules again. Your responses are compared against the baseline and the four signals are computed.",
            url: `${URL}#step-3`,
          },
          {
            "@type": "HowToStep",
            position: 4,
            name: "Recalibrate fortnightly",
            text: "Two of the four signals use a rolling 14-day window, so calibrating at least fortnightly keeps the score describing the period it covers.",
            url: `${URL}#step-4`,
          },
        ],
      },
      faqPageNode(URL, FAQS),
    ],
  };
}

export default function DriftScorePage() {
  return (
    <>
      <JsonLd data={schema()} />

      <PageShell
        eyebrow="The measurement"
        title="The Drift Score"
        lede="A 0–100 number describing how far your current thinking sits from your own recorded baseline. Not a comparison against anyone else — a comparison against who you were before you started delegating."
        byline
        updated="5 September 2026"
        breadcrumbs={[{ name: "Drift Score", path: "/drift-score" }]}
      >
        <Section id="bands" title="What the number means">
          <p>
            The IMPRINT Drift Score runs from 0 to 100, where higher means further
            from your baseline. It is a measure of distance, not of quality, and it
            is not comparable between people — two identical scores describe the
            same relative movement from entirely different starting points.
          </p>
          <div className="pt-2">
            <Row what="0 – 39 · Anchored" why="Recent work sits close to your baseline. You still write and reason recognisably like yourself." />
            <Row what="40 – 59 · Drifting" why="A measurable gap has opened. Usually one signal moving rather than all four." />
            <Row what="60 – 79 · Critical" why="The gap is large and consistent across signals." />
            <Row what="80 – 100 · Identity Crisis" why="Recent work bears little resemblance to your baseline." />
          </div>
          <p>
            A single reading is the least useful way to read it. The score is built
            to be watched as a series, where the habit signals are stable and a
            change in baseline divergence means something.
          </p>
        </Section>

        <Section id="signals" title="What goes into it">
          <p>
            Four signals, each computed on its own 0–100 scale, combined by weight:
          </p>
          <div className="pt-2">
            <Row what="Baseline divergence · 40%" why="How far this calibration's vocabulary richness and sentence length sit from your baseline. Weighted heaviest because language moves first." />
            <Row what="Vault inactivity · 25%" why="The share of your tracked skills not practised in the last 14 days." />
            <Row what="AI dependence · 20%" why="Dependency flags raised by the Mirror when you ask it to decide rather than to reflect." />
            <Row what="Journal irregularity · 15%" why="The share of the last 14 days with no journal entry." />
          </div>
          <p>
            The exact arithmetic for each, including the fallback values and what
            each one gets wrong, is on the{" "}
            <InlineLink href="/methodology">methodology page</InlineLink>.
          </p>
        </Section>

        <Section id="how-to-get-one" title="How to get your Drift Score">
          <div className="space-y-4">
            <div id="step-1" className="scroll-mt-28">
              <h3 className="text-white font-semibold mb-1" style={{ fontSize: 17 }}>1 · Create a free account</h3>
              <p>Email and password, or Google. No payment details, and no trial that expires into a paid plan.</p>
            </div>
            <div id="step-2" className="scroll-mt-28">
              <h3 className="text-white font-semibold mb-1" style={{ fontSize: 17 }}>2 · Capture your baseline</h3>
              <p>
                Seven steps, 20 to 30 minutes. Prompts come from four universal modules
                — opinion and belief, decision under pressure, memory and recall,
                emotional fingerprint — plus modules matched to your profession. Answer
                without AI; that is the entire point of the exercise.
              </p>
            </div>
            <div id="step-3" className="scroll-mt-28">
              <h3 className="text-white font-semibold mb-1" style={{ fontSize: 17 }}>3 · Run your first calibration</h3>
              <p>
                The same modules again. Your responses are compared against the
                baseline per module, and the four signals produce your first score.
              </p>
            </div>
            <div id="step-4" className="scroll-mt-28">
              <h3 className="text-white font-semibold mb-1" style={{ fontSize: 17 }}>4 · Recalibrate fortnightly</h3>
              <p>
                Two signals use a rolling 14-day window, so calibrating at least every
                two weeks keeps them describing the period the score actually covers.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/signup"
              className="inline-block rounded-full px-8 py-3.5 font-medium text-on-accent transition-all hover:opacity-90"
              style={{ background: "#FF5500" }}
            >
              Get your Drift Score →
            </Link>
          </div>
        </Section>

        <Section id="questions" title="Common questions">
          <div>
            {FAQS.map((f) => (
              <div
                key={f.id}
                id={f.id}
                className="scroll-mt-28 py-5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
              >
                <h3 className="text-white font-semibold mb-2" style={{ fontSize: 17 }}>
                  {f.question}
                </h3>
                <p>{f.answer}</p>
              </div>
            ))}
          </div>
        </Section>

        <Note>
          <strong className="text-white">What this is not.</strong> The Drift
          Score is not a clinical or diagnostic instrument, not a measure of
          intelligence, and not validated against any external benchmark. It is a
          transparent, repeatable prompt to look at your own work. Everything it
          gets wrong is listed on the{" "}
          <InlineLink href="/methodology">methodology page</InlineLink> at the
          same length as everything it gets right.
        </Note>
      </PageShell>
    </>
  );
}
