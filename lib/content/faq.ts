/**
 * The FAQ, as data.
 *
 * One array drives the rendered page and the FAQPage schema, because Google
 * requires every marked-up question and answer to be visibly present on the
 * page — generating both from the same source makes that true by construction
 * rather than by discipline.
 *
 * House rules for every answer here:
 *
 *  1. 40–55 words. A snippet engine lifts the answer and shows it alone.
 *  2. Self-contained. The subject is restated ("IMPRINT's Drift Score…", not
 *     "The score…") so a chunk retrieved without its heading still parses.
 *  3. Answer first. No preamble, no "great question", no setup.
 *  4. Honest about limits. Hedged, sourced text is more citable than
 *     confident marketing copy, and the hostile questions are answered
 *     properly rather than deflected.
 */

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

export type FaqGroup = {
  id: string;
  title: string;
  faqs: Faq[];
};

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "what-it-is",
    title: "What IMPRINT is",
    faqs: [
      {
        id: "what-is-imprint",
        question: "What is IMPRINT?",
        answer:
          "IMPRINT is a free web tool that measures cognitive drift — how far your thinking has moved from your own baseline as you delegate more work to AI. It captures a written baseline during onboarding, re-tests you on a recurring cadence, and reports the distance as a 0–100 Drift Score.",
      },
      {
        id: "what-problem",
        question: "What problem does IMPRINT solve?",
        answer:
          "IMPRINT addresses a measurement gap. AI erodes capability one delegated decision at a time, but there is no record of who you were before, so the change stays invisible until it is large. IMPRINT captures that “before” and keeps measuring the distance from it.",
      },
      {
        id: "not-screen-time",
        question: "Is IMPRINT just screen-time tracking for AI?",
        answer:
          "No. IMPRINT does not track which AI tools you open or how long you spend in them. It measures your own output — vocabulary richness, sentence length, practice frequency — against your recorded baseline. The question is not how much AI you use, but whether your own capability is changing.",
      },
      {
        id: "who-for",
        question: "Who is IMPRINT for?",
        answer:
          "IMPRINT is for anyone whose work depends on judgement, language or creative instinct: writers, developers, designers, students, analysts, founders. During onboarding you pick a profession cluster and the baseline prompts adapt to it, so a developer and a novelist are measured against relevant work rather than one generic test.",
      },
      {
        id: "who-built",
        question: "Who built IMPRINT?",
        answer:
          "IMPRINT was built by Suman Debnath, a brand marketing manager and AI-native product builder, and is published by House of Namus, an AI-first creative and digital studio in India. The source code is public on GitHub and the full scoring method is published on the methodology page.",
      },
    ],
  },
  {
    id: "the-science",
    title: "The science",
    faqs: [
      {
        id: "real-research",
        question: "Is there real research behind cognitive drift?",
        answer:
          "Yes. An MIT Media Lab study of 54 participants found that LLM-assisted writers showed the weakest neural connectivity of three groups and could not quote their own essays. A 2025 study by Gerlich of 666 participants found frequent AI use correlated negatively with critical thinking, mediated by cognitive offloading.",
      },
      {
        id: "cognitive-offloading",
        question: "What is cognitive offloading?",
        answer:
          "Cognitive offloading is delegating a mental task to an external tool instead of performing it yourself. Researchers distinguish beneficial offloading, which frees attention for higher-order work, from detrimental offloading, which bypasses the thinking itself and removes the difficulty that builds durable understanding.",
      },
      {
        id: "does-ai-make-you-worse",
        question: "Does using AI actually make you worse at thinking?",
        answer:
          "No study has shown that AI reduces measured intelligence. What the research shows is reduced cognitive engagement during AI-assisted tasks and weaker recall of AI-assisted work. The observed effect is a collapse of practice rather than of capacity — the skill goes unused, not destroyed.",
      },
      {
        id: "pseudoscience",
        question: "Isn’t this pseudoscience?",
        answer:
          "A fair challenge. IMPRINT's metrics are lexical — type-token ratio, sentence length, response latency — and lexical measures proxy reasoning depth rather than measure it directly. IMPRINT publishes its exact formulas and its known limitations instead of asking you to take the number on trust.",
      },
      {
        id: "cognitive-debt",
        question: "What is cognitive debt?",
        answer:
          "Cognitive debt is a term from MIT Media Lab's 2025 study “Your Brain on ChatGPT”. It describes the accumulated cost of repeatedly outsourcing mental effort: each delegation saves time now and leaves a deficit in learning and critical engagement that compounds across subsequent tasks.",
      },
      {
        id: "how-long-to-lose-skill",
        question: "How long does it take to lose a skill?",
        answer:
          "Skill decay research suggests measurable decline in an unused capability within roughly 60 to 90 days, and significant degradation over six months or more. IMPRINT's Skill Vault uses a 14-day practice window as its inactivity signal — a deliberately conservative early warning, not a decay threshold.",
      },
    ],
  },
  {
    id: "drift-score",
    title: "The Drift Score",
    faqs: [
      {
        id: "what-is-drift-score",
        question: "What is the Drift Score?",
        answer:
          "The Drift Score is IMPRINT's headline measurement: a 0–100 number describing how far your current thinking sits from your own recorded baseline. Zero to 39 is labelled Anchored, 40 to 59 Drifting, 60 to 79 Critical, and 80 to 100 Identity Crisis.",
      },
      {
        id: "how-calculated",
        question: "How is the Drift Score calculated?",
        answer:
          "The IMPRINT Drift Score is a weighted composite of four signals: baseline divergence at 40 percent, vault inactivity at 25 percent, AI dependence at 20 percent, and journal irregularity at 15 percent. Each signal is computed on its own 0–100 scale, then combined and rounded.",
      },
      {
        id: "good-score",
        question: "What is a good Drift Score?",
        answer:
          "A Drift Score below 40 is labelled Anchored and means your recent work sits close to your baseline. There is no universally good score, because the number measures distance from yourself rather than performance. A rising trend is more informative than any single reading.",
      },
      {
        id: "why-higher-worse",
        question: "Why is a higher Drift Score worse?",
        answer:
          "Higher means further from your baseline, not worse than other people. The scale is directionless by design: it measures distance, not quality. A Drift Score of 12 is evidence you still write and reason like yourself; 71 is a prompt to look at what changed.",
      },
      {
        id: "trust-lexical",
        question: "Why should I trust a score built on lexical metrics?",
        answer:
          "Trust it exactly as far as it claims. Vocabulary richness and sentence length are cheap, transparent and computable, but they proxy reasoning depth rather than measure it. IMPRINT publishes the full arithmetic so you can judge the number yourself instead of accepting it.",
      },
      {
        id: "compare-scores",
        question: "Can I compare my Drift Score to someone else’s?",
        answer:
          "No, and the comparison would be meaningless. Every Drift Score is computed against that person's own baseline, so two people with identical scores have moved the same relative distance from completely different starting points. The score is only interpretable against your own history.",
      },
    ],
  },
  {
    id: "using-it",
    title: "Using it",
    faqs: [
      {
        id: "baseline-length",
        question: "How long does the baseline take?",
        answer:
          "IMPRINT's baseline capture is a seven-step flow and takes most people 20 to 30 minutes. You answer prompts drawn from four universal modules — opinion and belief, decision under pressure, memory and recall, emotional fingerprint — plus modules specific to your profession cluster.",
      },
      {
        id: "recalibrate-often",
        question: "How often do I need to recalibrate?",
        answer:
          "Calibration is the recurring re-test that produces each new Drift Score. Because IMPRINT's inactivity signals use a 14-day window, calibrating at least fortnightly keeps the score meaningful. Calibrating less often means the vault and journal signals describe a period the score no longer covers.",
      },
      {
        id: "what-is-mirror",
        question: "What is the Mirror?",
        answer:
          "The Mirror is IMPRINT's reflection surface, built on GPT-4o and constrained to ask questions only. It will not answer, advise, recommend or write for you. When it detects that you are asking it to decide something, it redirects the question back and records a dependency flag.",
      },
      {
        id: "what-is-skill-vault",
        question: "What is the Skill Vault?",
        answer:
          "The Skill Vault is where you list the capabilities you are deliberately protecting. Each skill carries a strength value and generated practice challenges. Skills not exercised within 14 days count toward vault inactivity, which contributes 25 percent of your Drift Score.",
      },
      {
        id: "must-stop-ai",
        question: "Do I have to stop using AI to use IMPRINT?",
        answer:
          "No. IMPRINT is not an AI blocker and takes no position on how much AI you should use. It measures what happens to your own capability so you can decide with evidence rather than guesswork. Some people pair it with a self-imposed AI Reduction Protocol, which is optional.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy and data",
    faqs: [
      {
        id: "do-you-read",
        question: "Do you read what I write?",
        answer:
          "Your writing is stored so IMPRINT can compare it against your baseline and show you your own history, protected by row-level security scoped to your account. Mirror sessions are processed by OpenAI to generate questions. IMPRINT does not sell personal data and does not run advertising.",
      },
      {
        id: "train-models",
        question: "Do you use my writing to train AI models?",
        answer:
          "No. IMPRINT does not use your writing to train machine-learning models, does not sell personal data, and does not serve advertising. Your baseline and calibration text exist to compute your own score and to show you your own record over time.",
      },
      {
        id: "visit-logging",
        question: "What does IMPRINT collect when I just visit the site?",
        answer:
          "IMPRINT logs visits, including IP address, city-level location, pages viewed, scroll depth and clicks, and sends them to the operator as a private alert. This is disclosed in the privacy policy, and you can switch it off permanently for your browser by visiting the site once with ?notrack=1.",
      },
      {
        id: "delete-data",
        question: "Can I delete my data?",
        answer:
          "Yes. IMPRINT provides account deletion from the settings page, which removes your account and the records attached to it. The privacy policy sets out exactly what is held, which processors touch it, and how to request removal by email instead.",
      },
    ],
  },
  {
    id: "cost",
    title: "Cost and access",
    faqs: [
      {
        id: "is-it-free",
        question: "Is IMPRINT free?",
        answer:
          "Yes. IMPRINT is free while it is pre-launch, with no card required and no trial period that expires. Pricing may be introduced later; if it is, existing accounts will be told before anything changes. Nothing in the product is currently held behind payment.",
      },
      {
        id: "credit-card",
        question: "Do I need a credit card?",
        answer:
          "No. IMPRINT requires no payment details to sign up. You create an account with an email address and password, or with Google, and go straight into baseline capture. There is no trial that converts into a paid plan.",
      },
      {
        id: "mobile-app",
        question: "Is there a mobile app?",
        answer:
          "Not yet. IMPRINT runs in the browser and works on phones, but there is no native iOS or Android app. Baseline capture accepts text, voice recordings and file uploads, so the capture flow is usable on mobile even though it is not a native experience.",
      },
      {
        id: "export-data",
        question: "Can I export my data?",
        answer:
          "Not yet as a one-click export. Your journal entries, beliefs, time capsules and calibration history are all visible and readable in the dashboard, and account deletion removes everything. A structured export is a known gap rather than deliberate lock-in.",
      },
    ],
  },
];

/** Flattened, for the FAQPage schema. */
export const ALL_FAQS: Faq[] = FAQ_GROUPS.flatMap((g) => g.faqs);
