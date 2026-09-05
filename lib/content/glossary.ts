/**
 * The IMPRINT glossary.
 *
 * Seven terms from the research literature and seven IMPRINT defines. Housing
 * both in one vocabulary is deliberate: a reader — or a retrieval system —
 * arriving for "cognitive offloading" meets "Echo Drift" in the same
 * authoritative context, which is what makes a coined term legible rather than
 * marketing vocabulary.
 *
 * `definition` is the field that ends up in DefinedTerm.description and is the
 * text most likely to be quoted verbatim by an assistant. Each one is written
 * to survive alone: one or two sentences, subject named, no dependence on the
 * page around it.
 *
 * Sources are listed only where the URL has been checked. A term whose
 * attribution is described in prose without a link is one where the finding is
 * reported accurately but the canonical link has not been verified — better a
 * missing link than a wrong one on a page whose whole value is being trustworthy.
 */

export type GlossaryTerm = {
  slug: string;
  term: string;
  alternateNames?: string[];
  /** One or two sentences. The liftable definition. */
  definition: string;
  /** Where the term comes from — shapes the page's framing. */
  origin: "literature" | "imprint";
  body: string[];
  related: string[];
  sources?: { title: string; url?: string; note?: string }[];
};

export const GLOSSARY: GlossaryTerm[] = [
  {
    slug: "cognitive-offloading",
    term: "Cognitive offloading",
    alternateNames: ["Mental offloading", "Cognitive delegation"],
    definition:
      "Cognitive offloading is the act of delegating a mental task to an external tool or person rather than performing it yourself. Researchers separate beneficial offloading, which frees attention for higher-order work, from detrimental offloading, which bypasses the thinking itself.",
    origin: "literature",
    body: [
      "Cognitive offloading long predates AI. Writing a shopping list, setting an alarm and using a calculator are all offloading: the work moves from your head to something outside it. What has changed is scope. Earlier tools absorbed storage and arithmetic; language models absorb synthesis, evaluation and judgement — the operations that constitute thinking rather than support it.",
      "The distinction that matters is not how much you offload but which part. Offloading grammar checking so you can concentrate on an argument is beneficial: the difficulty you keep is the difficulty that develops you. Offloading the argument itself is detrimental, because it removes the desirable difficulty that builds a durable mental model, while still producing an acceptable-looking output.",
      "That output quality is exactly what makes the pattern hard to notice. Detrimental offloading does not feel like a loss. It feels like efficiency, and the feedback that would tell you otherwise — struggling, revising, being wrong — is the very thing that has been removed.",
    ],
    related: ["cognitive-debt", "metacognitive-laziness", "desirable-difficulty", "echo-drift"],
    sources: [
      {
        title:
          "Cognitive offloading, critical thinking and attitudes towards AI in the era of ChatGPT",
        url: "https://pubmed.ncbi.nlm.nih.gov/42377671/",
      },
    ],
  },
  {
    slug: "cognitive-debt",
    term: "Cognitive debt",
    definition:
      "Cognitive debt is the accumulated cost of repeatedly outsourcing mental effort: each delegation saves time immediately and leaves a deficit in learning and critical engagement that compounds across subsequent tasks.",
    origin: "literature",
    body: [
      "The term comes from the MIT Media Lab's 2025 study “Your Brain on ChatGPT”, which asked 54 participants to write essays under three conditions — with an LLM, with a search engine, or unaided — while recording EEG. The LLM group showed the weakest and least distributed neural connectivity of the three, and performed worst at the neural, linguistic and scoring levels across four sessions.",
      "The finding that travels furthest is smaller and stranger than the brain data: when asked to quote from essays they had just submitted, participants in the LLM group frequently could not. They had produced the text without encoding it. The work existed; the learning did not.",
      "The debt metaphor is precise about the mechanism. Like financial debt, the cost is deferred rather than avoided, and it is paid later with interest — in this case as a weaker foundation for the next task, which then makes delegating that task more attractive. The study's own limits are worth stating: 54 participants, 18 in the final crossover session, and only ChatGPT tested.",
    ],
    related: ["cognitive-offloading", "skill-atrophy", "metacognitive-laziness"],
    sources: [
      {
        title:
          "Your Brain on ChatGPT: Accumulation of Cognitive Debt when Using an AI Assistant for Essay Writing Task",
        url: "https://arxiv.org/abs/2506.08872",
      },
      {
        title: "Project overview — MIT Media Lab",
        url: "https://www.media.mit.edu/projects/your-brain-on-chatgpt/overview/",
      },
    ],
  },
  {
    slug: "skill-atrophy",
    term: "Skill atrophy",
    alternateNames: ["Skill decay", "Capability decay"],
    definition:
      "Skill atrophy is the measurable decline of a capability that goes unpractised. Skill-decay research suggests detectable decline within roughly 60 to 90 days of disuse and significant degradation over six months or more.",
    origin: "literature",
    body: [
      "Skill atrophy is one of the better-established findings in the psychology of skill retention, studied for decades in aviation, surgery, military training and language learning long before AI existed. The shape is consistent: complex skills that combine judgement with execution decay faster than simple procedural ones, and skills learned to a lower initial standard decay faster than over-learned ones.",
      "What AI changes is the rate at which disuse accumulates. A capability is not lost through a decision to abandon it. It is lost through many small moments where using it was optional and not using it was easier — and a tool that makes the alternative available at every one of those moments compresses years of gradual disuse into months.",
      "IMPRINT's Skill Vault applies a deliberately short 14-day window as its inactivity signal. That is well inside any decay threshold in the literature, and intentionally so: the point is to flag a gap while it is still a gap rather than to confirm a loss after it has happened.",
    ],
    related: ["deskilling", "cognitive-debt", "skill-vault", "echo-drift"],
  },
  {
    slug: "metacognitive-laziness",
    term: "Metacognitive laziness",
    definition:
      "Metacognitive laziness is the tendency to accept fluent AI output without evaluating it, and the gradual erosion of the judgement needed to evaluate it at all. The more polished the output, the less it invites scrutiny.",
    origin: "literature",
    body: [
      "The term describes a feedback loop rather than a character flaw. Language model output is fluent by construction — that is what the training optimises — and fluency is one of the strongest heuristics people use to judge quality. Text that reads well is assumed to be well reasoned, and the assumption is usually close enough to be reinforced.",
      "Over time the loop tightens. Each accepted output is one skipped act of evaluation, and evaluation is itself a practised skill. The capacity to judge whether output is any good decays through the same disuse as every other capability, which means the signal that would break the loop degrades alongside it.",
      "This is why IMPRINT's Mirror refuses to answer. A surface that only asks questions cannot be accepted uncritically, because it never supplies anything to accept — the evaluation stays with you by design.",
    ],
    related: ["cognitive-offloading", "automation-bias", "cognitive-debt"],
  },
  {
    slug: "automation-bias",
    term: "Automation bias",
    definition:
      "Automation bias is the tendency to favour a machine's recommendation over your own judgement, including when the machine is wrong and the evidence to notice is available.",
    origin: "literature",
    body: [
      "Automation bias was documented in aviation and clinical decision support decades before generative AI, and it appears in two forms. Errors of commission are following an automated recommendation that contradicts other available evidence. Errors of omission are failing to notice a problem because the system did not flag it.",
      "Both matter more with language models than with earlier automation, because a model's confidence is uncorrelated with its accuracy. A cockpit alarm is either triggered or not; a model produces the same assured prose whether it is right or fabricating, so the surface cue people habitually rely on carries no information.",
      "Automation bias is distinct from metacognitive laziness but compounds with it. Bias is about trusting the output; laziness is about losing the capacity to check. Together they describe a state where you defer to a system you can no longer evaluate.",
    ],
    related: ["metacognitive-laziness", "cognitive-offloading", "ai-dependence"],
  },
  {
    slug: "deskilling",
    term: "Deskilling",
    definition:
      "Deskilling is the reduction of the skill a role requires when parts of it are automated. Unlike skill atrophy, which happens to an individual, deskilling happens to the job itself.",
    origin: "literature",
    body: [
      "Deskilling is an old concept from labour economics, describing how automation restructures work rather than simply removing it. A role is decomposed, the parts that can be automated are, and what remains asks less of the person doing it — often while producing more output.",
      "The distinction from skill atrophy is worth holding onto, because the remedies differ. Atrophy is individual and reversible through practice. Deskilling is structural: if the role no longer requires the judgement, no amount of personal discipline restores the context in which that judgement was exercised daily.",
      "This is the level at which the individual measurement IMPRINT provides runs out. A Drift Score can tell you your own capability is changing. It cannot tell you whether the work available to you still asks for it.",
    ],
    related: ["skill-atrophy", "cognitive-offloading"],
  },
  {
    slug: "desirable-difficulty",
    term: "Desirable difficulty",
    definition:
      "Desirable difficulty is a learning-science principle: conditions that make a task harder in the moment — retrieving from memory, spacing practice, struggling before being told — produce more durable learning than conditions that make it easy.",
    origin: "literature",
    body: [
      "The principle, from Robert and Elizabeth Bjork's work on learning and memory, explains a persistent gap between how learning feels and how it works. Conditions that feel productive — re-reading, immediate feedback, smooth progress — often produce the weakest retention, while conditions that feel like failure produce the strongest.",
      "It is the sharpest available frame for what AI delegation removes. The difficulty of composing an argument from a blank page is not an inefficiency in the writing process; it is the mechanism by which the argument becomes yours. Removing it produces the text and skips the encoding, which is precisely what the cognitive debt research observed.",
      "It also explains why IMPRINT's Forge is deliberately plain. A composition surface with no assistance is not a missing feature — the absence is the function.",
    ],
    related: ["cognitive-debt", "cognitive-offloading", "skill-atrophy"],
  },

  // ── IMPRINT's own vocabulary ────────────────────────────────────────────
  {
    slug: "echo-drift",
    term: "Echo Drift",
    definition:
      "Echo Drift is IMPRINT's term for the gradual narrowing of vocabulary, reasoning depth and creative instinct that follows sustained cognitive delegation. It is defined by its invisibility: it becomes apparent only in retrospect, because there is no record of the earlier state to compare against.",
    origin: "imprint",
    body: [
      "Echo Drift names the phenomenon the rest of this glossary explains the parts of. Cognitive offloading is the behaviour, cognitive debt is the cost, skill atrophy is the mechanism — Echo Drift is what it looks like from the inside, which is to say it does not look like anything.",
      "The name is literal. What returns when you reach for your own voice is increasingly an echo of the outputs you have been accepting: flatter, more general, more like everyone else's. The convergence is the symptom, and it is difficult to detect precisely because the standard you would compare against is the thing that moved.",
      "This is the entire reason IMPRINT starts with baseline capture rather than assessment. Drift can only be measured against a fixed earlier point, so the first thing the product does is create one.",
    ],
    related: ["drift-score", "cognitive-baseline", "cognitive-offloading", "skill-atrophy"],
  },
  {
    slug: "drift-score",
    term: "Drift Score",
    definition:
      "The Drift Score is IMPRINT's 0–100 measurement of how far your current thinking sits from your own recorded baseline. Higher means further from yourself, not worse than other people: 0–39 is Anchored, 40–59 Drifting, 60–79 Critical, 80–100 Identity Crisis.",
    origin: "imprint",
    body: [
      "The Drift Score is a weighted composite of four signals: baseline divergence at 40 percent, vault inactivity at 25 percent, AI dependence at 20 percent and journal irregularity at 15 percent. Baseline divergence carries the heaviest weight because language degrades earliest and most visibly under delegation.",
      "The scale is directionless by design. It measures distance from your baseline, not improvement or decline against anyone else, and it cannot be compared between people — two identical scores describe the same relative movement from entirely different starting points.",
      "It is also a lexical measurement, and IMPRINT is explicit that lexical signals proxy reasoning depth rather than measure it. The exact formulas, including their known weaknesses, are published in full on the methodology page.",
    ],
    related: ["cognitive-baseline", "baseline-divergence", "calibration", "echo-drift"],
  },
  {
    slug: "cognitive-baseline",
    term: "Cognitive baseline",
    alternateNames: ["Baseline capture", "Baseline"],
    definition:
      "A cognitive baseline is a recorded sample of how you think, write and decide, captured before measurement begins so later work has a fixed reference point. In IMPRINT it is created during a seven-step onboarding flow.",
    origin: "imprint",
    body: [
      "The baseline is the thing that makes drift measurable at all. Without a fixed earlier sample, any claim about how your thinking has changed is a comparison against memory — and memory of your own past capability is exactly what the phenomenon degrades.",
      "IMPRINT captures it through prompts drawn from four universal modules — opinion and belief, decision under pressure, memory and recall, emotional fingerprint — plus modules specific to your profession cluster. Responses can be text, voice or file upload. Four signals are extracted from each: word count, average sentence length, vocabulary richness and time taken to compose.",
      "The baseline is read server-side whenever a calibration is scored, never sent from the browser. That is a deliberate constraint: a measurement is worthless if the thing being measured against can be edited by the party being measured.",
    ],
    related: ["baseline-divergence", "calibration", "drift-score", "echo-drift"],
  },
  {
    slug: "baseline-divergence",
    term: "Baseline divergence",
    definition:
      "Baseline divergence is the largest component of the IMPRINT Drift Score, at 40 percent. It measures how far a calibration's vocabulary richness and average sentence length sit from the same measures in your baseline, as a proportion of the baseline value.",
    origin: "imprint",
    body: [
      "Divergence is relative rather than absolute: the difference between the calibration value and the baseline average is divided by the baseline average, so the signal means the same thing for a writer of long, dense sentences and one of short, plain ones.",
      "The two sub-signals are weighted equally and combined into a 0–100 scale capped at 100. Vocabulary richness is type-token ratio — unique words divided by total words. Average sentence length is words divided by sentence count.",
      "Two properties are worth knowing before you read the number. The measure is absolute, so writing more richly than your baseline registers as divergence exactly as writing less richly does. And type-token ratio falls as text gets longer, so a longer calibration than baseline can register divergence created by length rather than by any change in thinking. Both are stated in the methodology's limitations.",
    ],
    related: ["cognitive-baseline", "drift-score", "calibration"],
  },
  {
    slug: "calibration",
    term: "Calibration",
    definition:
      "Calibration is IMPRINT's recurring re-test. You answer the same modules used for your baseline, the responses are compared against it, and a new Drift Score is produced from the comparison.",
    origin: "imprint",
    body: [
      "Calibration is what converts a one-time baseline into a series. A single baseline tells you what you were; a sequence of calibrations tells you the direction and rate of travel, which is the only part that is actionable.",
      "Because two of the four signals — vault inactivity and journal irregularity — are computed over a rolling 14-day window, calibrating at least fortnightly keeps them describing the period the score covers. Calibrate less often and those components increasingly reflect a stretch of time the score no longer represents.",
      "The comparison is per-module rather than whole-session, so a change confined to one kind of thinking shows up as such instead of being averaged into a single undifferentiated number.",
    ],
    related: ["cognitive-baseline", "drift-score", "baseline-divergence"],
  },
  {
    slug: "skill-vault",
    term: "Skill Vault",
    definition:
      "The Skill Vault is where an IMPRINT user lists the capabilities they are deliberately protecting. Each skill carries a strength value and generated practice challenges, and skills unexercised for 14 days count toward vault inactivity — 25 percent of the Drift Score.",
    origin: "imprint",
    body: [
      "The Vault exists because naming a skill is what makes its neglect visible. An unnamed capability cannot be observed slipping; it is simply used less, then less, and then remembered as something you used to be able to do.",
      "Vault inactivity is computed as the share of tracked skills not practised within the last 14 days. A user tracking four skills who has practised one in that window scores 75 on this signal.",
      "One behaviour is worth knowing: with no skills tracked at all, the signal defaults to 50 rather than 0. An empty Vault is treated as an unknown rather than as evidence of perfect practice — but it does mean a new account carries a mid-range contribution on this component until skills are added.",
    ],
    related: ["skill-atrophy", "drift-score", "ai-reduction-protocol"],
  },
  {
    slug: "ai-dependence",
    term: "AI dependence",
    alternateNames: ["Dependency flags"],
    definition:
      "AI dependence is the IMPRINT signal contributing 20 percent of the Drift Score. It counts dependency flags raised by the Mirror over the last 14 days — moments when you asked it to decide something rather than to help you think — at 10 points per flag, capped at 100.",
    origin: "imprint",
    body: [
      "The Mirror is constrained to ask questions and nothing else. When it detects that a message is asking it to decide, recommend or produce rather than to reflect, it redirects the question back to you and records a flag.",
      "The flags are therefore a record of reaching for an answer rather than of using AI at all. Using AI heavily and deliberately produces no flags; turning to it at the moment a judgement is required produces them.",
      "The scale is deliberately blunt: ten flags in a fortnight saturates the signal. That linear ten-points-per-flag mapping is a design choice rather than a calibrated finding, and it is listed among the methodology's stated limitations.",
    ],
    related: ["automation-bias", "drift-score", "metacognitive-laziness"],
  },
  {
    slug: "ai-reduction-protocol",
    term: "AI Reduction Protocol",
    definition:
      "The AI Reduction Protocol is an optional commitment an IMPRINT user makes to limit their own AI use for a fixed window. It is self-imposed and self-reported; IMPRINT does not block or monitor any tool.",
    origin: "imprint",
    body: [
      "The Protocol exists because measurement alone rarely changes behaviour. A score tells you the direction of travel; a commitment with a defined end date is what people actually act on, and the fixed window matters more than the severity.",
      "IMPRINT deliberately does not enforce it. There is no blocker, no extension, no monitoring of what you open — partly because such enforcement is trivially circumvented, and mostly because a capability protected only by a blocked website was not being protected.",
      "Its effect appears indirectly, through the signals already being measured: more practice logged in the Vault, more regular journal entries, fewer dependency flags from the Mirror.",
    ],
    related: ["skill-vault", "ai-dependence", "drift-score"],
  },
];

export const GLOSSARY_BY_SLUG = new Map(GLOSSARY.map((t) => [t.slug, t]));

export const LITERATURE_TERMS = GLOSSARY.filter((t) => t.origin === "literature");
export const IMPRINT_TERMS = GLOSSARY.filter((t) => t.origin === "imprint");
