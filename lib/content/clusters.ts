import type { ProfessionCluster } from "@/types/user.types";

/**
 * Editorial copy for the /for/[audience] pages.
 *
 * These are not programmatic landing pages with a noun swapped in. Each one
 * maps to a real `ProfessionCluster` in the product, which means the baseline
 * modules, the prompts and the vault challenge a visitor is shown on the page
 * are the ones they will actually get — pulled from lib/utils/profession.ts
 * rather than restated here. That is the difference between a legitimate
 * audience page and a doorway page, and it is why there are six of these and
 * not sixty.
 *
 * The `erosion` field is the part that has to be genuinely specific. If it
 * could be pasted onto another cluster unchanged, the page has no reason to
 * exist.
 */

export type ClusterPage = {
  slug: string;
  cluster: ProfessionCluster;
  /** Page title. Written as the phrase someone would search. */
  title: string;
  h1: string;
  description: string;
  lede: string;
  /** What delegation specifically takes from this group. Three paragraphs. */
  erosion: string[];
  /** The capability most worth protecting here, named plainly. */
  atStake: string;
  /** Concrete, cluster-specific practice. Not generic advice. */
  practice: string[];
  primaryKeyword: string;
  faqs: { q: string; a: string }[];
};

export const CLUSTER_PAGES: ClusterPage[] = [
  {
    slug: "writers",
    cluster: "language_voice",
    title: "IMPRINT for Writers",
    h1: "For people whose work is language",
    description:
      "Writers, journalists and marketers lose voice before they lose competence. IMPRINT captures how you write before delegation, and measures the distance as it opens.",
    lede: "Language is the first thing to go, and the hardest loss to see — because what replaces your voice is not worse writing. It is competent writing that belongs to nobody.",
    erosion: [
      "Your voice is the accumulation of a thousand small choices: the rhythm you fall into, the words you reach for, the argument you build before you know you are building it. None of those choices survive being outsourced, because the model makes its own.",
      "What comes back is fluent. It is often better structured than a first draft of yours would have been. And it is generic in a way that is almost impossible to detect from inside, because the thing you would compare it against — your own instinct for how you sound — is the thing that has been idle.",
      "The MIT participants who could not quote essays they had submitted minutes earlier were not writing badly. They had produced text without the process that makes text theirs. For someone whose profession is language, that is not a productivity question. It is the whole job.",
    ],
    atStake:
      "The specific way you construct an argument, and the vocabulary you reach for when nobody has suggested one.",
    practice: [
      "IMPRINT's baseline for this cluster captures three things: your professional philosophy in your own words, a pitch written without bullet points, and a story from your working life that changed how you think. Those are chosen because voice shows up in narrative structure and persuasion pattern more than in word choice.",
      "The vault challenge for language work is deliberately blunt: write 300 words on a tracked skill with no AI assistance, focused on your authentic voice. It is not a clever exercise. It is a rep.",
    ],
    primaryKeyword: "losing writing skills because of AI",
    faqs: [
      {
        q: "Does using AI make you a worse writer?",
        a: "No study has shown that AI use degrades writing ability directly. What research shows is reduced cognitive engagement during assisted writing and weaker recall of the result — so the risk is losing practice at composition, not losing the underlying capability outright.",
      },
      {
        q: "How do I keep my writing voice while using AI?",
        a: "Form a position before you prompt, in two sentences of your own. Prompting first makes the model's output your anchor, and you will edit it without noticing you never started from your own thinking. Keep some writing entirely unassisted so there is a voice to return to.",
      },
    ],
  },
  {
    slug: "developers",
    cluster: "technical_analytical",
    title: "IMPRINT for Developers",
    h1: "For people who solve problems from first principles",
    description:
      "Developers, data scientists and researchers lose problem decomposition before they lose syntax. IMPRINT measures how far your reasoning has moved from your own baseline.",
    lede: "Nobody worries about forgetting syntax — you looked that up before AI existed. The thing worth worrying about is the part you used to do in your head before you started typing.",
    erosion: [
      "Debugging is the clearest case. Reading a stack trace, forming a hypothesis, and testing it is a skill built entirely through repetition. Pasting the error and accepting the fix produces working code and zero reps, and the difference is invisible until you hit something the model has not seen.",
      "The subtler loss is decomposition. Breaking an unfamiliar problem into tractable pieces is the actual work of engineering, and it is exactly what a sufficiently capable assistant will do for you if asked. It feels like delegating implementation. It is delegating the design.",
      "There is a specific trap here that other fields do not have: your output is testable. Code that passes is code that passes, regardless of whether you could have written it. That feedback loop is unusually reassuring and unusually uninformative about whether your capability is intact.",
    ],
    atStake:
      "Decomposition of an unfamiliar problem, and the ability to hold a system in your head well enough to reason about it.",
    practice: [
      "The baseline for this cluster asks two questions: how you would approach a complex problem you have never seen before, and the mental model you use most often — explained as if to a non-expert. Both are chosen because reasoning shows up in how you frame a problem, not in whether you reach the answer.",
      "The vault challenge is to solve a problem from scratch with no AI and no web search, documenting the reasoning. Documenting it is the point; the artefact is what makes the reasoning inspectable later.",
    ],
    primaryKeyword: "will AI make developers worse programmers",
    faqs: [
      {
        q: "Will AI make developers worse programmers?",
        a: "The evidence supports a narrower claim: AI-assisted work involves less cognitive engagement, and skills that go unpractised decline. Whether that produces worse engineers depends on which parts you delegate — syntax recall costs nothing, problem decomposition is the actual skill.",
      },
      {
        q: "Is it bad to use AI for debugging?",
        a: "It depends whether you read the reasoning. Using AI to surface a hypothesis you then verify keeps the diagnostic loop intact. Pasting an error and applying the fix without reading it removes the loop entirely, and diagnosis is built through repetition.",
      },
    ],
  },
  {
    slug: "designers",
    cluster: "visual_creative",
    title: "IMPRINT for Designers and Creatives",
    h1: "For people whose work is judgement about form",
    description:
      "Designers, illustrators and photographers lose creative rationale before they lose craft. IMPRINT captures why you make the choices you make, before generation replaces the choosing.",
    lede: "Generation makes options cheap. What it cannot supply is the taste that picks between them — and taste is built by making choices, which is the part that just got automated.",
    erosion: [
      "Creative work has always involved rejecting far more than you keep. The rejections are where the judgement lives: you learn what you think by discovering what you will not accept. Generating forty options and picking one is a different cognitive act from making three and hating two.",
      "The rationale goes first. Ask most people why a piece works and you get a real answer built from years of that rejecting. Ask after a period of heavy generation and the answer gets thinner — not because taste vanished, but because it stopped being exercised on anything.",
      "This cluster also faces something the others do not: the tools produce output that is competent by default. Nothing looks broken. The failure mode is not bad work, it is work that could have come from anyone, which is the one outcome creative practice exists to prevent.",
    ],
    atStake:
      "The rationale behind a creative decision, and the instinct that rejects the merely acceptable.",
    practice: [
      "The baseline here captures a creative decision you are proud of and the process behind it, plus the first three lines of a manifesto for your work. Both target rationale rather than output, because output is the thing most easily faked and least diagnostic.",
      "The vault challenge is deliberately analogue: a hand-drawn or unassisted sketch exploring a tracked skill, with no digital tools unless essential. The friction is the exercise.",
    ],
    primaryKeyword: "AI and loss of creativity designers",
    faqs: [
      {
        q: "Does AI reduce creativity?",
        a: "Research on AI and creative work is thinner than on writing or reasoning. What is established is that AI-assisted tasks involve less cognitive engagement, and that judgement is built through repeated choosing — so generating options rather than making them plausibly reduces the practice creativity depends on.",
      },
      {
        q: "How do designers keep their creative instinct while using AI?",
        a: "Keep the choosing. Using generation to explore a space is different from using it to decide. Reserve some work as fully unassisted, and articulate the rationale for decisions out loud — rationale is the first thing to thin out and the easiest to notice going.",
      },
    ],
  },
  {
    slug: "leaders",
    cluster: "leadership_strategy",
    title: "IMPRINT for Founders and Leaders",
    h1: "For people who decide with incomplete information",
    description:
      "Founders, executives and product managers lose strategic intuition before they lose vocabulary. IMPRINT measures how far your reasoning under uncertainty has moved from your own baseline.",
    lede: "Judgement under uncertainty is the whole job, and it is built the only way judgement is ever built — by deciding without enough information and finding out what happened.",
    erosion: [
      "Strategy is unusually vulnerable because a model will always produce an answer. Ask for a recommendation on a decision with genuinely insufficient information, and you will get a confident, well-structured, plausible one. The confidence is uncorrelated with whether it is right, and there is no surface cue that tells you which you received.",
      "The loss compounds through a mechanism specific to leadership: your decisions are consequential and slow to resolve. Feedback arrives months later, filtered through everything else that happened. That was already a hard learning environment. Delegating the reasoning removes the one part that was reliably yours — the record of how you thought before you found out.",
      "Deskilling is also a live risk at the level of the role, not just the person. If the judgement no longer sits with you, no amount of individual discipline restores the context in which you used to exercise it daily.",
    ],
    atStake:
      "Reasoning under uncertainty, and the ability to construct a position before you have consensus or data.",
    practice: [
      "The baseline captures a decision you made with incomplete information and how you reasoned through it, plus what success looks like in three years. Both target the reasoning process rather than the outcome, because outcomes at this level are dominated by luck and the reasoning is not.",
      "The vault challenge is to make one real decision this week that requires a tracked skill, and record the reasoning. Recording it before you know the result is what makes it usable later.",
    ],
    primaryKeyword: "AI deskilling in the workplace",
    faqs: [
      {
        q: "What is deskilling and how is it different from skill atrophy?",
        a: "Skill atrophy happens to a person: a capability declines through disuse and recovers with practice. Deskilling happens to a role: automation restructures the job so it asks less of whoever holds it. Personal discipline fixes the first and cannot fix the second.",
      },
      {
        q: "Should leaders use AI for strategic decisions?",
        a: "For generating options and stress-testing reasoning, it is genuinely useful. For deciding, the risk is that model confidence is uncorrelated with accuracy and there is no surface cue distinguishing a good recommendation from a plausible one. Form a position first, then use the model against it.",
      },
    ],
  },
  {
    slug: "students",
    cluster: "life_personal",
    title: "IMPRINT for Students",
    h1: "For people still building the thing that could erode",
    description:
      "Students face the sharpest version of cognitive drift: delegating work that exists to build a capability, before the capability exists. IMPRINT captures a baseline while it is still forming.",
    lede: "Everyone else is protecting a capability they already have. You are trying to build one, using tools that will do the building for you if you let them.",
    erosion: [
      "Assigned work is not valuable because the output is needed. Nobody requires your essay. The essay exists because writing it builds something in you, which means delegating it does not save time — it removes the entire point of the exercise while leaving something to hand in.",
      "This is the one group where the research says the stakes may be structurally higher. Some researchers argue that when synthesis, evaluation and judgement are offloaded during the developmental period of the prefrontal cortex — roughly birth to the mid-twenties — the consequences could be more lasting than in an adult who is merely out of practice. That claim is not established, and it should be treated as a hypothesis rather than a finding.",
      "The practical problem is that you have no baseline to protect. Everyone older can point at work from five years ago and notice a change. If your first serious writing was already assisted, there is no earlier version of you on record at all.",
    ],
    atStake:
      "The capability itself, rather than a capability you already built and are now maintaining.",
    practice: [
      "The baseline for this cluster asks how you decide what is worth spending time on, and something you taught yourself in the last year and how you went about it. Both target self-directed learning, which is the skill everything else in education depends on.",
      "The vault challenge is to practise a tracked skill for thirty minutes with no digital assistance and journal the experience. Journaling it matters more here than elsewhere — a record made while learning is the baseline you will otherwise never have.",
    ],
    primaryKeyword: "students over-reliance on AI",
    faqs: [
      {
        q: "Is it bad for students to use AI?",
        a: "It depends entirely on which part is delegated. Using AI to check work, explain a concept or find sources keeps the learning intact. Using it to produce work assigned to build a capability removes the reason the work exists, while still producing something to submit.",
      },
      {
        q: "Does AI use affect young people more than adults?",
        a: "Some researchers argue that offloading synthesis and judgement during prefrontal cortex development — birth to the mid-twenties — could have more lasting effects than in adults. This is a hypothesis with a plausible mechanism, not an established finding, and it has not been directly tested.",
      },
    ],
  },
  {
    slug: "educators",
    cluster: "human_social",
    title: "IMPRINT for Educators and Clinicians",
    h1: "For people whose work is understanding other people",
    description:
      "Teachers, doctors, therapists and lawyers risk losing empathetic reasoning and values under pressure — the capabilities least visible in output and least recoverable from a transcript.",
    lede: "The capability at risk here is the one that never appears in the deliverable: the reasoning you did about a person before you wrote anything down.",
    erosion: [
      "Work in these professions produces documents — case notes, lesson plans, letters, assessments — and the documents are the most delegable part. But the document was never the work. It is the residue of a judgement made about a specific person in a specific situation, and a model drafting it from your summary is reconstructing that judgement from a compression of it.",
      "What erodes is the reasoning that happens between encountering a person and deciding what they need. It is invisible by nature, it does not show up in any output metric, and the delegated version reads perfectly well. There is no artefact whose quality would tell you it had stopped happening.",
      "There is also a values dimension the other clusters do not have. Professional principles get tested under time pressure, and offloading is at its most attractive precisely when you are most pressed. The moments where the delegation is most tempting are the moments where the judgement mattered most.",
    ],
    atStake:
      "Empathetic reasoning about a specific person, and the principles you hold when the pressure argues against them.",
    practice: [
      "The baseline asks about a time you had to understand someone else's perspective completely and how you did it, and a principle you have never compromised on even when it was difficult. Both target reasoning that leaves no artefact, which is exactly why it needs recording deliberately.",
      "The vault challenge for this cluster is not written: have a real conversation about a tracked skill with someone in your life, then reflect on what you learned. The capability is exercised with people or it is not exercised.",
    ],
    primaryKeyword: "AI in teaching and clinical judgement",
    faqs: [
      {
        q: "Can AI replace professional judgement in teaching or medicine?",
        a: "The documents these professions produce are highly delegable; the judgement behind them is not. A model drafting notes from your summary is reconstructing a decision from a compression of it, which works well enough to hide when the underlying reasoning has stopped happening.",
      },
      {
        q: "What is automation bias?",
        a: "Automation bias is the tendency to favour a machine's recommendation over your own judgement, including when the machine is wrong and evidence to notice is available. It was documented in aviation and clinical decision support decades before generative AI.",
      },
    ],
  },
];

export const CLUSTER_BY_SLUG = new Map(CLUSTER_PAGES.map((c) => [c.slug, c]));
