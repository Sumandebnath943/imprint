import Link from "next/link";
import PublicCoursesClient from "@/components/courses/PublicCoursesClient";
import JsonLd from "@/components/seo/JsonLd";
import { faqPageNode, WEBSITE_ID, SOFTWARE_ID, PERSON_ID, ORG_ID } from "@/lib/seo/schema";
import { CLUSTER_PAGES } from "@/lib/content/clusters";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";

const URL = `${SITE_URL}/courses`;

export const metadata: Metadata = {
  title: "IMPRINT Learning Hub",
  description:
    "Structured courses built by humans, for humans. No AI tutors, no generated content. Currently in development with a waitlist open — nothing is published yet, and this page says so.",
  alternates: { canonical: "/courses",
  },
  // No Course schema until courses exist. Marking up a waitlist as a course
  // catalogue would describe content the page does not have.
};

const FAQS = [
  {
    id: "are-courses-available",
    question: "Are IMPRINT courses available yet?",
    answer:
      "No. IMPRINT courses are in development and no course content has been published. The waitlist is open and signing up costs nothing; you will be told when the first course is ready. Nothing on this page is currently purchasable.",
  },
  {
    id: "what-makes-them-different",
    question: "What makes IMPRINT courses different?",
    answer:
      "Three rules: every instructor is a practising human rather than generated curriculum, courses are built around doing rather than watching, and progress is measured through IMPRINT rather than certified by completion. You do not finish a course by reaching the end of a video.",
  },
  {
    id: "will-they-be-free",
    question: "Will IMPRINT courses be free?",
    answer:
      "Undecided. The core IMPRINT product is free while pre-launch, and courses have not been priced. Anyone on the waitlist will be told what the terms are before being asked for anything.",
  },
  {
    id: "do-i-need-courses",
    question: "Do I need the courses to use IMPRINT?",
    answer:
      "No. Baseline capture, calibration, the Drift Score, the Skill Vault, the Mirror and the Forge are all available now and free. Courses are an additional layer, not a prerequisite for measuring your own drift.",
  },
];

export default function PublicCoursesPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": `${URL}#webpage`,
              url: URL,
              name: "IMPRINT Learning Hub",
              description:
                "Courses on protecting human capability, in development. Waitlist open; no course content published yet.",
              isPartOf: { "@id": WEBSITE_ID },
              about: { "@id": SOFTWARE_ID },
              author: { "@id": PERSON_ID },
              publisher: { "@id": ORG_ID },
            },
            faqPageNode(URL, FAQS),
          ],
        }}
      />

      <PublicCoursesClient />

      {/*
        Server-rendered prose beneath the marketing page.

        The page above is a client component built around motion, and it says
        very little a search engine or an assistant can use — the substance is
        in the design. This section adds what was missing: an unambiguous
        statement of what actually exists today, answers to the questions a
        waitlist page raises, and links into the audience pages, which are the
        content that does exist.
      */}
      <div className="max-w-[880px] mx-auto px-6 md:px-12 pb-24">
        <div className="space-y-14">
          <section id="status" className="scroll-mt-28">
            <h2
              className="text-white font-semibold mb-4"
              style={{ fontSize: "clamp(22px,2.4vw,28px)", letterSpacing: "-0.02em" }}
            >
              What exists today
            </h2>
            <div
              className="space-y-4"
              style={{ color: "rgba(255,255,255,0.72)", fontSize: 16, lineHeight: 1.75 }}
            >
              <p>
                Plainly: no course content has been published. The courses above are in
                development, the waitlist is open, and joining it costs nothing and
                commits you to nothing.
              </p>
              <p>
                What is available now is the measurement product — baseline capture, the
                recurring calibration that produces a{" "}
                <Link href="/drift-score" className="hover:underline underline-offset-2" style={{ color: "#FF5500" }}>
                  Drift Score
                </Link>
                , the Skill Vault, the Mirror and the Forge. All of it is free, and{" "}
                <Link href="/methodology" className="hover:underline underline-offset-2" style={{ color: "#FF5500" }}>
                  how the scoring works
                </Link>{" "}
                is published in full.
              </p>
            </div>
          </section>

          <section id="tracks" className="scroll-mt-28">
            <h2
              className="text-white font-semibold mb-4"
              style={{ fontSize: "clamp(22px,2.4vw,28px)", letterSpacing: "-0.02em" }}
            >
              The six tracks, and what they map to
            </h2>
            <div
              className="space-y-4"
              style={{ color: "rgba(255,255,255,0.72)", fontSize: 16, lineHeight: 1.75 }}
            >
              <p>
                The tracks above follow the same six profession clusters the product
                already sorts people into during onboarding. Each has a page describing
                what delegation specifically erodes in that kind of work, and which
                baseline prompts you will actually answer:
              </p>
              <ul className="grid gap-3 md:grid-cols-2 pt-1 list-none p-0">
                {CLUSTER_PAGES.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/for/${c.slug}`}
                      className="block rounded-xl p-4 transition-colors"
                      style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <span className="text-white font-medium block mb-1" style={{ fontSize: 15 }}>
                        {c.title.replace("IMPRINT for ", "")}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.5 }}>
                        {c.atStake}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section id="questions" className="scroll-mt-28">
            <h2
              className="text-white font-semibold mb-4"
              style={{ fontSize: "clamp(22px,2.4vw,28px)", letterSpacing: "-0.02em" }}
            >
              Questions
            </h2>
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
                  <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 16, lineHeight: 1.75 }}>
                    {f.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
