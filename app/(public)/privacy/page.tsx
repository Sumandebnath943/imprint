import type { Metadata } from "next";
import Link from "next/link";
import TrackingOptOut from "@/components/legal/TrackingOptOut";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What IMPRINT collects, why, who it is shared with, and how to have it deleted.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "20 November 2026";
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

function Row({ what, why }: { what: string; why: string }) {
  return (
    <div
      className="grid gap-2 md:grid-cols-[minmax(0,240px)_1fr] py-3.5"
      style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
    >
      <div className="text-white font-medium" style={{ fontSize: 15 }}>
        {what}
      </div>
      <div style={{ color: "rgba(255,255,255,0.66)", fontSize: 15, lineHeight: 1.65 }}>
        {why}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
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
        Privacy Policy
      </h1>
      <p style={{ color: "rgba(255,255,255,0.66)", fontSize: 16, lineHeight: 1.7 }}>
        Last updated {UPDATED}. IMPRINT is operated by House of Namus. This page
        describes what we collect, why we collect it, who processes it on our
        behalf, and how to have it removed.
      </p>

      <div
        className="mt-8 mb-14 rounded-2xl p-6"
        style={{
          background: "rgba(255,85,0,0.07)",
          border: "1px solid rgba(255,85,0,0.22)",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 15, lineHeight: 1.7 }}>
          <strong className="text-white">In short.</strong> IMPRINT measures how
          your thinking changes over time, so most of what we hold is what you
          wrote and the numbers derived from it. We do not sell data, we do not
          run advertising, and Imprint does not use your writing to train models.
          We do log visits to this site, including IP address and
          approximate city, as described in section&nbsp;3.
        </p>
      </div>

      <div className="space-y-14">
        <Section id="what-we-collect" title="1. What we collect from account holders">
          <p>
            Everything below is created by you using the product, or derived
            directly from it.
          </p>
          <div className="mt-2">
            <Row
              what="Account details"
              why="Email address and password (handled by our authentication provider — we never see or store the password ourselves), plus the name, username, age group, profession, location and biography you choose to enter."
            />
            <Row
              what="Baseline responses"
              why="The text, voice recordings or files you submit during the seven-step baseline capture, and the metrics computed from them: word count, average sentence length, vocabulary richness and time taken to compose."
            />
            <Row
              what="Role assessments and progress"
              why="Private onboarding responses, submitted work and attachments, isolated code test outcomes, rubric ratings and evidence, independent review corrections, legacy results, and task and AI-use check-ins."
            />
            <Row what="Earlier work and score reviews" why="Selected work, dated source references, your contribution and tool disclosures, and any evidence or explanation you choose to share with an authorized reviewer." />
            <Row what="Optional onboarding reflection" why="If you leave a note about your AI use, Imprint saves it privately when you finish onboarding. It appears in your progress page 90 days later and is included in your export. Imprint keeps it out of AI inputs, public pages, notifications and visit logging." />
            <Row
              what="Your own records"
              why="Journal entries, beliefs, time capsules, tracked skills and their practice history, and anything you upload to the gallery or write in the Forge."
            />
            <Row
              what="The Mirror"
              why="Messages, questions returned, and the duration of reflections you save. The current Mirror does not assign dependency flags."
            />
            <Row
              what="Community activity"
              why="Public circles display their directory details to signed-in users. Circle members see their own private assignment responses and admins see completion totals. Mentor applications go to approved reviewers, and approved mentors may opt into the signed-in directory. Mentorship requests are visible to their participants."
            />
          </div>
        </Section>

        <Section id="how-we-use-it" title="2. How we use it">
          <p>
            We use this data to establish and compare proficiency, assign practice and reassessment, operate Mirror, and show your history. To keep the service working and secure —
            rate limiting, abuse prevention and diagnosing faults.
          </p>
          <p>
            Your baseline is the measuring stick the product compares you
            against. It is read server-side precisely so that it cannot be
            altered by anything sent from your browser.
          </p>
          <p>
            <strong className="text-white">
              We do not sell personal data, we do not serve advertising, and we
              do not use your writing to train machine-learning models.
            </strong>
          </p>
        </Section>

        <Section id="visit-logging" title="3. Visit logging">
          <p>
            When you load a page on this site we record the visit and send it to
            the operator as an alert. This is first-party analytics; it is not
            shared with an advertising network. It covers:
          </p>
          <div className="mt-2">
            <Row
              what="Network"
              why="Your IP address, the approximate city and country it resolves to, your internet provider and network operator, and your time zone. Location is derived from the IP address and is accurate only to city level — we do not use your device's precise location, and we never ask for it."
            />
            <Row
              what="Request"
              why="The pages you view, the page that referred you, your browser and operating system, and your screen and window size."
            />
            <Row
              what="Behaviour"
              why="How long you stayed and how much of that was active, how far you scrolled, and the buttons and links you clicked. We record that an element was clicked and its visible label — not anything you type into a field."
            />
            <Row
              what="Automated-traffic score"
              why="A score indicating whether the visit looks like a person or a crawler, so that bot traffic can be separated from real interest."
            />
            <Row
              what="Account, if signed in"
              why="When you are signed in, the alert identifies the account — your name, email, how long ago it was created, whether onboarding is finished, and your current scores. It also notes when you sign in, create an account, finish onboarding, and which dashboard pages you opened. Signed out, the visit is not linked to any account."
            />
          </div>
          <p className="pt-2">
            This is retained only as messages in a private operator chat. It is
            not written to the product database and is not used to build a
            profile of you beyond what the product already holds.
          </p>
          <p>
            <strong className="text-white">How to switch this off.</strong>{" "}
            Visit{" "}
            <Link href="/?notrack=1" className="hover:underline" style={{ color: "#FF5500" }}>
              imprint.houseofnamus.com/?notrack=1
            </Link>{" "}
            once, or use the control below. Either way this browser stops being
            logged immediately &mdash; nothing is collected and nothing is sent
            &mdash; and it stays that way until you reverse it. No account is
            needed and you do not have to ask us.
          </p>

          <TrackingOptOut />

          <p>
            <strong className="text-white">
              On &ldquo;Do Not Track&rdquo;.
            </strong>{" "}
            Some browsers can send a &ldquo;Do Not Track&rdquo; signal. We record
            that it was sent, but it does not by itself switch off logging, and
            we would rather say so than imply a protection we do not provide.
            The signal is off by default everywhere, is frequently switched on by
            extensions without the person knowing, and is ignored across most of
            the web &mdash; so it is a poor indication of what someone actually
            wants. The link above is our real opt-out: unambiguous, immediate,
            and reversible.
          </p>
        </Section>

        <Section id="processors" title="4. Who else processes it">
          <p>We use a small number of providers to run the service:</p>
          <div className="mt-2">
            <Row what="Supabase" why="Database, authentication and file storage." />
            <Row what="Vercel" why="Hosting and content delivery. Supplies the approximate location associated with your IP address." />
            <Row what="Google Gemini" why="When AI features are enabled, processes recent Mirror dialogue for safety checks, questions and requested summaries. With your consent, processes selected profession work samples and any reasoning you choose to share. Your emotional and personal onboarding reflections stay in Imprint." />
            <Row what="Groq" why="Handles the same processing if Gemini is temporarily unavailable. Provider retention depends on the endpoint and account configuration." />
            <Row what="Resend" why="Delivers signup confirmation and password reset emails when configured as our authentication email sender. It also delivers opted-in task reminders. Reminder emails do not include assessment scores or submitted work." />
            <Row what="ipwho.is" why="Resolves an IP address to an approximate location and network operator for the visit logging described above." />
            <Row what="Telegram" why="Delivers visit alerts to the operator." />
          </div>
        </Section>

        <Section id="security" title="5. How it is protected">
          <p>
            Authorisation is enforced in the database rather than only in the
            application. Every table carries row-level security scoped to your
            own account, so one account cannot read another&rsquo;s rows even if
            the application were to ask it to.
          </p>
          <p>
            Uploaded files live in private storage and are served through
            short-lived signed links; every stored object path is bound to the
            account that owns it. Where other people can see something about you
            — the leaderboard, the mentor directory, a shared credential — it is
            read through a restricted view that exposes neither your email
            address nor your account state, and only if you have opted in.
          </p>
        </Section>

        <Section id="your-rights" title="6. Your choices and rights">
          <p>
            You can edit your profile at any time, and choose individually
            whether your credential is public, whether you appear on the
            leaderboard, and whether you are listed as a mentor. All three are
            off unless you turn them on.
          </p>
          <p>
            You can remove individual historical samples or delete your account from Settings. Account deletion removes application records and uploaded files. Provider processing records follow the provider’s applicable retention terms.
            It cannot be undone, and we do not keep a backup copy for you.
          </p>
          <p>
            Depending on where you live you may also have the right to access a
            copy of your data, correct it, restrict or object to its processing,
            or complain to your local data protection authority. There is no
            self-service export yet; write to us and we will provide one.
          </p>
        </Section>

        <Section id="retention" title="7. How long we keep it">
          <p>
            Account data is kept until you delete your account. Because the
            product measures change over time, the value of your record grows
            with its length — but that is a reason for you to keep it, not for us
            to retain it after you have asked us to stop.
          </p>
          <p>
            Visit alerts are messages in a private chat and are deleted as the
            operator clears them; they are not retained on a schedule.
          </p>
        </Section>

        <Section id="children" title="8. Age eligibility">
          <p>
            IMPRINT is for people aged 18 and older. We store your age confirmation
            and the age range you choose during onboarding. If you believe
            someone under 18 has created an account, please contact us so we can
            review it and remove it where appropriate.
          </p>
        </Section>

        <Section id="status" title="9. Current status">
          <p>
            IMPRINT is pre-launch. We are a two-person team and have not
            appointed a data protection officer. If our processors or practices
            change materially we will update this page and change the date at the
            top.
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
            </a>{" "}
            for anything on this page — access, correction, deletion, or to have
            your visits excluded from logging.
          </p>
          <p className="pt-2">
            <Link href="/" className="hover:underline" style={{ color: "#FF5500" }}>
              Back to IMPRINT
            </Link>
          </p>
        </Section>
      </div>
    </div>
  );
}
