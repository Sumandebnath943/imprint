import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { CONTACT_EMAIL, ORG_NAME, ORG_URL, ORG_SOCIALS, PERSON_NAME, PERSON_URL } from "@/lib/seo/entity";
import { contactPageNode } from "@/lib/seo/schema";
import JsonLd from "@/components/seo/JsonLd";
import { PageShell, Section, Row, InlineLink } from "@/components/content/ContentPage";

const URL = `${SITE_URL}/contact`;

export const metadata: Metadata = {
  title: "Contact IMPRINT",
  description:
    "How to reach IMPRINT: product questions, privacy and data requests, press and partnerships. IMPRINT is built by Suman Debnath and published by House of Namus.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", ...contactPageNode(URL) }} />

      <PageShell
        eyebrow="Contact"
        title="Get in touch"
        lede="One address, read by a person. IMPRINT is a small project, so replies come from whoever built the thing you are asking about."
        breadcrumbs={[{ name: "Contact", path: "/contact" }]}
      >
        <Section id="email" title="Email">
          <p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-white hover:underline underline-offset-4"
              style={{ fontSize: 20, fontWeight: 600 }}
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <div className="pt-2">
            <Row
              what="Product questions"
              why="Anything about baseline capture, calibration, the Drift Score or the Mirror. Check the FAQ first — thirty of the common ones are answered there."
            />
            <Row
              what="Privacy and data"
              why="Requests to see, correct or delete what is held about you. Account deletion is also available directly from your settings page."
            />
            <Row
              what="Disagreeing with the method"
              why="The scoring formulas and their weaknesses are published in full. Corrections to the arithmetic or the research it cites are genuinely welcome."
            />
            <Row
              what="Press and partnerships"
              why="Same address. Mention what you are working on and a deadline if you have one."
            />
          </div>
        </Section>

        <Section id="who" title="Who you are writing to">
          <p>
            IMPRINT is built by{" "}
            <InlineLink href={PERSON_URL}>{PERSON_NAME}</InlineLink> and published by{" "}
            <InlineLink href={ORG_URL}>{ORG_NAME}</InlineLink>, an AI-first creative and
            digital studio based in India.
          </p>
          <p>
            The source code is public, and the way the Drift Score is computed is set out
            on the <InlineLink href="/methodology">methodology page</InlineLink> — if
            your question is &ldquo;how does this actually work&rdquo;, that page probably
            answers it faster than an email would.
          </p>
        </Section>

        <Section id="elsewhere" title="Elsewhere">
          <p>{ORG_NAME} is on these platforms:</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-1 list-none p-0">
            {ORG_SOCIALS.map((s) => (
              <li key={s.platform}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="me noopener noreferrer"
                  className="hover:underline underline-offset-2"
                  style={{ color: "#FF5500", fontSize: 15 }}
                >
                  {s.platform === "x"
                    ? "X"
                    : s.platform.charAt(0).toUpperCase() + s.platform.slice(1)}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      </PageShell>
    </>
  );
}
