/**
 * The research index behind IMPRINT.
 *
 * This page exists to be cited. An assistant asked "what research exists on AI
 * and cognitive decline" has to synthesise several papers, which is expensive;
 * quoting one page that has already organised them is cheap. That only works if
 * the organising is trustworthy, which sets the rules for this file:
 *
 *  1. `url` is present only where the link has been checked. A study whose
 *     canonical URL could not be confirmed is still listed, described
 *     accurately, and marked `unlinked` — a wrong citation on a page whose
 *     entire value is reliability costs more than a missing one.
 *  2. `finding` states what the study reported, at a length that survives being
 *     quoted alone.
 *  3. `limits` is not optional. Every entry carries the caveat, because a
 *     summary that drops sample sizes and scope is how a modest result becomes
 *     an internet certainty.
 */

export type Study = {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  url?: string;
  /** Why it is here. One sentence. */
  relevance: string;
  /** What it reported. Written to stand alone. */
  finding: string;
  /** What it does not establish. */
  limits: string;
};

export type ResearchGroup = {
  id: string;
  title: string;
  blurb: string;
  studies: Study[];
};

export const RESEARCH: ResearchGroup[] = [
  {
    id: "direct-measurement",
    title: "Direct measurement of AI-assisted cognition",
    blurb:
      "Studies that instrumented people while they worked with an AI assistant, rather than surveying them afterwards. These are the closest thing to direct evidence, and also the smallest.",
    studies: [
      {
        id: "your-brain-on-chatgpt",
        title:
          "Your Brain on ChatGPT: Accumulation of Cognitive Debt when Using an AI Assistant for Essay Writing Task",
        authors: "Kosmyna et al., MIT Media Lab",
        year: 2025,
        venue: "arXiv preprint",
        url: "https://arxiv.org/abs/2506.08872",
        relevance:
          "The study that introduced 'cognitive debt', and the one most often cited in this conversation.",
        finding:
          "Fifty-four participants wrote essays across three conditions — with an LLM, with a search engine, or unaided — under EEG. The LLM group showed the weakest and least distributed neural connectivity of the three, and performed worst at the neural, linguistic and scoring levels across sessions. Asked to quote from essays they had just submitted, LLM-group participants frequently could not.",
        limits:
          "Fifty-four participants, with only eighteen completing the fourth crossover session. One task type, one model, and a preprint rather than a peer-reviewed publication. It shows reduced engagement during assisted work; it does not show lasting cognitive damage.",
      },
    ],
  },
  {
    id: "offloading-and-thinking",
    title: "Cognitive offloading and critical thinking",
    blurb:
      "Survey and task-based work on whether frequent AI use tracks with weaker critical thinking, and whether offloading is the mechanism.",
    studies: [
      {
        id: "offloading-critical-thinking",
        title:
          "Cognitive offloading, critical thinking and attitudes towards artificial intelligence in the era of ChatGPT",
        authors: "Comparative study in young adults",
        year: 2025,
        venue: "Peer-reviewed; indexed on PubMed",
        url: "https://pubmed.ncbi.nlm.nih.gov/42377671/",
        relevance:
          "Compares AI-assisted against manual task performance directly, rather than relying on self-report alone.",
        finding:
          "Reports a negative association between AI-assisted task performance and measures of critical thinking in young adults, consistent with cognitive offloading as the mediating mechanism rather than AI exposure as such.",
        limits:
          "Correlational. People who already prefer to offload may simply reach for AI more often, which the design cannot separate from AI causing the offloading.",
      },
      {
        id: "gerlich-2025",
        title:
          "AI tools in society: impacts on cognitive offloading and the future of critical thinking",
        authors: "Gerlich, M.",
        year: 2025,
        venue: "Societies",
        relevance:
          "The largest sample commonly cited in this area, and the source of the 666-participant figure quoted throughout the debate.",
        finding:
          "Across 666 participants, frequent AI tool use correlated negatively with critical thinking scores, with cognitive offloading mediating the relationship. Younger participants showed higher AI dependence and lower critical thinking scores than older ones.",
        limits:
          "Correlational and largely self-reported, so it cannot establish direction. The age effect is confounded with familiarity and with baseline differences in how the two groups were educated. Listed without a link because the canonical URL was not verified — cite the journal record directly.",
      },
    ],
  },
  {
    id: "mechanism",
    title: "Mechanism and theory",
    blurb:
      "Work on why delegation would degrade capability at all — the learning-science and human-factors literature that predates generative AI.",
    studies: [
      {
        id: "metacognitive-laziness",
        title:
          "From Co-Design to Metacognitive Laziness: Evaluating Generative AI in Vocational Education",
        authors: "Multiple authors",
        year: 2025,
        venue: "arXiv preprint",
        url: "https://arxiv.org/pdf/2512.12306",
        relevance:
          "Names and examines the pattern where fluent output suppresses the impulse to evaluate it.",
        finding:
          "Describes 'metacognitive laziness': learners working with generative AI accepted output with less evaluation over time, and the capacity to judge output quality degraded alongside the habit of judging it.",
        limits:
          "Educational setting with a specific cohort. A preprint, and the construct is newer than the evidence base supporting it.",
      },
      {
        id: "digital-technology-cognition",
        title: "A Review of the Negative Effects of Digital Technology on Cognition",
        authors: "Review",
        year: 2026,
        venue: "arXiv preprint",
        url: "https://arxiv.org/pdf/2603.10025",
        relevance:
          "Places the AI conversation inside the longer literature on technology and attention, which is a useful corrective to treating 2025 as year zero.",
        finding:
          "Surveys evidence on digital technology and cognitive function, covering attention, memory and self-regulation, and finds effects that are real but generally smaller and more context-dependent than popular accounts suggest.",
        limits:
          "A review rather than new evidence, and it inherits the heterogeneity of what it reviews. Effect sizes across this literature are frequently small.",
      },
    ],
  },
  {
    id: "measurement-methods",
    title: "Measuring reliance itself",
    blurb:
      "Attempts to quantify how much a person is depending on a system — the problem IMPRINT is also trying to solve, approached differently.",
    studies: [
      {
        id: "offloading-score",
        title: "Offloading Score: Measuring AI Reliance Through Counterfactual Workflows",
        authors: "Multiple authors",
        year: 2026,
        venue: "arXiv preprint",
        url: "https://arxiv.org/pdf/2605.29392",
        relevance:
          "The closest published work to what IMPRINT's Drift Score attempts, and a more rigorous approach to the same question.",
        finding:
          "Proposes measuring AI reliance by comparing a completed workflow against a counterfactual in which the assistance was unavailable, producing a reliance measure grounded in task outcome rather than in self-report or in surface features of the output.",
        limits:
          "A proposed method rather than a validated instrument, and counterfactual workflows are expensive to construct. IMPRINT's lexical approach is cheaper and correspondingly weaker.",
      },
      {
        id: "cognitive-divergence",
        title:
          "The Cognitive Divergence: AI Context Windows, Human Attention Decline, and the Delegation Feedback Loop",
        authors: "Multiple authors",
        year: 2026,
        venue: "arXiv preprint",
        url: "https://arxiv.org/pdf/2603.26707",
        relevance:
          "Frames delegation as a feedback loop rather than a one-off choice, which is the dynamic IMPRINT's recurring calibration assumes.",
        finding:
          "Argues that expanding model context capability and declining sustained human attention form a reinforcing loop, in which each increment of delegation makes the next one more attractive and less noticeable.",
        limits:
          "Largely theoretical. The feedback loop is argued rather than measured, and the attention-decline evidence it draws on is contested.",
      },
    ],
  },
];

export const ALL_STUDIES: Study[] = RESEARCH.flatMap((g) => g.studies);
