import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms you agree to when using IMPRINT, while it is free and pre-launch.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "5 September 2026";
const CONTACT = "defy@houseofnamus.com";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2
        className="text-white font-semibold mb-4"
        style={{ fontSize: "clamp(22px,2.4vw,28px)", letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      <div
        className="space-y-4"
        style={{ color: "rgba(255,255,255,0.72)", fontSize: 16, lineHeight: 1.75 }}
      >
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="max-w-[880px] mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-24">
      <p
        className="uppercase tracking-widest font-medium mb-4"
        style={{ fontSize: 12, letterSpacing: "0.22em", color: "#FF5500" }}
      >
        Legal
      </p>
      <h1
        className="text-white font-bold mb-4"
        style={{ fontSize: "clamp(36px,5vw,56px)", lineHeight: 1.08, letterSpacing: "-0.03em" }}
      >
        Terms of Use
      </h1>
      <p style={{ color: "rgba(255,255,255,0.66)", fontSize: 16, lineHeight: 1.7 }}>
        Last updated {UPDATED}. IMPRINT is operated by House of Namus. By
        creating an account or using the service you agree to what follows.
      </p>

      <div
        className="mt-8 mb-14 rounded-2xl p-6"
        style={{
          background: "rgba(255,85,0,0.07)",
          border: "1px solid rgba(255,85,0,0.22)",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 15, lineHeight: 1.7 }}>
          <strong className="text-white">Where this stands.</strong> IMPRINT is
          pre-launch and free. There is no paid plan, nothing to cancel, and no
          service level we are promising to meet. Features may change or
          disappear, and there may be interruptions. Please do not rely on it as
          the only copy of anything you care about.
        </p>
      </div>

      <div className="space-y-14">
        <Section id="what-it-is" title="1. What IMPRINT is">
          <p>
            IMPRINT records a baseline of how you write and reason, then measures
            the distance from it over time. It produces a Drift Score and a set
            of contributing signals.
          </p>
          <p>
            Those numbers are a measurement of your own writing against your own
            earlier writing. They are not a clinical, psychological, educational
            or diagnostic assessment, they are not a measure of intelligence or
            worth, and they should not be used to make decisions about anyone
            else &mdash; hiring, admission or otherwise.
          </p>
        </Section>

        <Section id="your-account" title="2. Your account">
          <p>
            You need an account to use the product. Keep your credentials to
            yourself; you are responsible for what happens under your account.
            One account per person, and you must be old enough to consent to the
            processing described in the{" "}
            <Link href="/privacy" className="hover:underline" style={{ color: "#FF5500" }}>
              privacy policy
            </Link>
            .
          </p>
          <p>You can delete your account at any time from Settings.</p>
        </Section>

        <Section id="your-content" title="3. Your writing stays yours">
          <p>
            Everything you write in IMPRINT &mdash; baseline responses, journal
            entries, beliefs, time capsules, Forge sessions, uploads &mdash;
            remains yours. You grant us only the permission needed to run the
            service: to store it, to compute your metrics from it, and to show it
            back to you.
          </p>
          <p>
            <strong className="text-white">
              We do not use your writing to train machine-learning models, and we
              do not sell it.
            </strong>{" "}
            Messages you send in the Mirror are passed to OpenAI to generate the
            next question; nothing else in the product sends your writing to a
            model. The privacy policy sets out every processor involved.
          </p>
          <p>
            If you choose to make your credential public, join a circle, or
            appear on the leaderboard, you are choosing to show a limited part of
            your record to other people. Those settings are off unless you turn
            them on.
          </p>
        </Section>

        <Section id="acceptable-use" title="4. Acceptable use">
          <p>Please do not:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Submit someone else&rsquo;s writing as your baseline, or otherwise try to fake the measurement.</li>
            <li>Attempt to access another account&rsquo;s data, or probe the service for vulnerabilities without asking us first.</li>
            <li>Automate, scrape or load-test the service, or route it through scripts rather than a browser.</li>
            <li>Upload anything unlawful, or anything you do not have the right to share.</li>
            <li>Resell the service or present it as your own.</li>
          </ul>
          <p>
            If you find a security problem, tell us at the address below before
            telling anyone else. We will not pursue you for reporting something
            you found in good faith.
          </p>
        </Section>

        <Section id="availability" title="5. Availability and change">
          <p>
            The service is provided as it is, without warranty. We do not
            guarantee that it will be available, that it will be free of faults,
            or that any measurement it produces is fit for a particular purpose.
          </p>
          <p>
            Because it is pre-launch, we may add, change or remove features, and
            we may suspend or end the service. If we shut it down we will make a
            reasonable effort to let account holders retrieve their data first.
          </p>
        </Section>

        <Section id="liability" title="6. Liability">
          <p>
            To the extent the law allows, House of Namus is not liable for
            indirect or consequential loss, lost profits, or lost data arising
            from your use of the service. Nothing here limits liability that
            cannot lawfully be limited &mdash; including for death, personal
            injury, or fraud.
          </p>
          <p>
            Because the service is free, our total liability to you is limited to
            the amount you have paid us, which is nothing.
          </p>
        </Section>

        <Section id="suspension" title="7. Ending the agreement">
          <p>
            You can stop using IMPRINT and delete your account whenever you like.
            We may suspend or close an account that breaches section 4, or where
            we are required to by law. Sections 3, 6 and 8 survive.
          </p>
        </Section>

        <Section id="law" title="8. Governing law">
          <p>
            These terms are governed by the laws of India, and the courts of
            India have jurisdiction over any dispute. If you are a consumer
            elsewhere, this does not remove protections you have under your own
            local law.
          </p>
        </Section>

        <Section id="changes" title="9. Changes to these terms">
          <p>
            If we change these terms materially we will update this page and the
            date at the top. Continuing to use the service after that means you
            accept the change.
          </p>
        </Section>

        <Section id="contact" title="10. Contact">
          <p>
            Write to{" "}
            <a
              href={`mailto:${CONTACT}`}
              className="hover:underline"
              style={{ color: "#FF5500" }}
            >
              {CONTACT}
            </a>
            .
          </p>
          <p className="pt-2">
            <Link href="/privacy" className="hover:underline" style={{ color: "#FF5500" }}>
              Privacy Policy
            </Link>
            {"  ·  "}
            <Link href="/" className="hover:underline" style={{ color: "#FF5500" }}>
              Back to IMPRINT
            </Link>
          </p>
        </Section>
      </div>
    </div>
  );
}
