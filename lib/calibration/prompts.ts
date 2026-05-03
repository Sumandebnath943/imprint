import type { CalibrationPrompt } from "@/lib/calibration/types";

// ── Universal Sets (A/B/C) ────────────────────────────────────────────────

const U1: CalibrationPrompt[] = [
  {
    id: "U1-A", moduleId: "U1", cluster: "universal", ghostWord: "BELIEVE",
    badge: "Universal · Opinion",
    headline: "Where do you actually stand?",
    prompt: `Choose one: remote work, social media algorithms, AI in education, or four-day work weeks.\n\nWrite your genuine position on it — not the popular view, yours. No hedging. 8 minutes.`,
    responseType: "text", timed: 8, minWords: 80,
  },
  {
    id: "U1-B", moduleId: "U1", cluster: "universal", ghostWord: "BELIEVE",
    badge: "Universal · Opinion",
    headline: "Say what you actually think.",
    prompt: `Pick one topic you have a strong opinion about that most people in your life would disagree with.\n\nMake the case for your position as clearly as you can. No qualifications. 8 minutes.`,
    responseType: "text", timed: 8, minWords: 80,
  },
  {
    id: "U1-C", moduleId: "U1", cluster: "universal", ghostWord: "BELIEVE",
    badge: "Universal · Opinion",
    headline: "The uncomfortable truth.",
    prompt: `What is something you believe is true about your industry or field that most people in it are unwilling to say out loud?\n\nWrite it plainly and defend it. 8 minutes.`,
    responseType: "text", timed: 8, minWords: 80,
  },
];

const U2: CalibrationPrompt[] = [
  {
    id: "U2-A", moduleId: "U2", cluster: "universal", ghostWord: "DECIDE",
    badge: "Universal · Decision Making",
    headline: "How did you actually decide?",
    prompt: `Think of the most recent decision you made that you're still not sure about.\n\nWalk me through your reasoning — not what you decided, but HOW you thought about it. Every step. 10 minutes.`,
    responseType: "text", timed: 10, minWords: 100,
  },
  {
    id: "U2-B", moduleId: "U2", cluster: "universal", ghostWord: "DECIDE",
    badge: "Universal · Decision Making",
    headline: "A decision you own.",
    prompt: `Describe a decision you made in the last 3 months where you had incomplete information.\n\nHow did you move forward? What did you anchor on? What did you ignore? 10 minutes.`,
    responseType: "text", timed: 10, minWords: 100,
  },
  {
    id: "U2-C", moduleId: "U2", cluster: "universal", ghostWord: "DECIDE",
    badge: "Universal · Decision Making",
    headline: "When you were wrong.",
    prompt: `Describe a decision you made in the last year that turned out to be wrong.\n\nNot what you'd do differently — walk through your original reasoning step by step. What did your thinking process look like? 10 minutes.`,
    responseType: "text", timed: 10, minWords: 100,
  },
];

const U3: CalibrationPrompt[] = [
  {
    id: "U3-A", moduleId: "U3", cluster: "universal", ghostWord: "REMEMBER",
    badge: "Universal · Memory & Recall",
    headline: "Without looking it up.",
    prompt: `Answer from memory:\n1. Explain a core concept in your field as if you're teaching it\n2. Name 3 foundational works, people, or ideas that shaped your field\n3. Walk through a process you know deeply — step by step\n\nNo searching. No notes. 12 minutes.`,
    responseType: "text", timed: 12,
  },
  {
    id: "U3-B", moduleId: "U3", cluster: "universal", ghostWord: "REMEMBER",
    badge: "Universal · Memory & Recall",
    headline: "From the top of your head.",
    prompt: `Without any reference:\n1. Walk through how you would approach a hard problem in your field from scratch\n2. Explain the history of your field in under 200 words from memory\n3. List the skills you consider yourself genuinely expert in — then explain one\n\n12 minutes.`,
    responseType: "text", timed: 12,
  },
];

const U4: CalibrationPrompt[] = [
  {
    id: "U4-A", moduleId: "U4", cluster: "universal", ghostWord: "FEEL",
    badge: "Universal · Emotional Fingerprint",
    headline: "What's actually happening.",
    prompt: `Right now, today:\n1. What is taking up the most mental space?\n2. What are you avoiding thinking about?\n3. What are you most looking forward to in the next 30 days?\n\nDon't perform. Don't optimize. Just answer honestly.`,
    responseType: "text", minWords: 60,
  },
  {
    id: "U4-B", moduleId: "U4", cluster: "universal", ghostWord: "FEEL",
    badge: "Universal · Emotional Fingerprint",
    headline: "Below the surface.",
    prompt: `Three honest answers:\n1. What emotion have you felt most frequently this week — and why?\n2. What have you been pretending is fine?\n3. What would you do differently if no one was watching?\n\nPrivate. Honest. Yours.`,
    responseType: "text", minWords: 60,
  },
  {
    id: "U4-C", moduleId: "U4", cluster: "universal", ghostWord: "FEEL",
    badge: "Universal · Emotional Fingerprint",
    headline: "The real version.",
    prompt: `Answer without filtering:\n1. What has genuinely excited you recently?\n2. What has genuinely disappointed you?\n3. What do you wish you had more time for?\n\nThis is for you, not for anyone else.`,
    responseType: "text", minWords: 60,
  },
];

// ── Cluster Sets ──────────────────────────────────────────────────────────

const CLUSTER_PROMPTS: Record<string, CalibrationPrompt[][]> = {
  language_voice: [
    [{
      id: "L-A", moduleId: "L1", cluster: "language_voice", ghostWord: "VOICE",
      badge: "Language & Voice · Expression",
      headline: "Write like only you can.",
      prompt: `You have 12 minutes.\n\nPick one: write about the last time you changed your mind about something, or describe a place that still lives in your memory.\n\nNo editing. Start and don't stop.`,
      responseType: "text", timed: 12, disableBackspace: true,
    }],
    [{
      id: "L-B", moduleId: "L1", cluster: "language_voice", ghostWord: "ARGUE",
      badge: "Language & Voice · Argument",
      headline: "Make the case.",
      prompt: `Write a 200-word argument for something you believe about your craft — something you'd actually say to a room of peers.\n\nLead with your strongest point. 10 minutes.`,
      responseType: "text", timed: 10, minWords: 150,
    }],
    [{
      id: "L-C", moduleId: "L1", cluster: "language_voice", ghostWord: "VOICE",
      badge: "Language & Voice · Voice",
      headline: "Pure voice.",
      prompt: `Pick a moment from the last two weeks — any moment. Describe it in detail.\n\nNot what happened — what it felt like. What did you notice? What did it mean to you? 10 minutes.`,
      responseType: "text", timed: 10, minWords: 120,
    }],
  ],
  technical_analytical: [
    [{
      id: "T-A", moduleId: "T1", cluster: "technical_analytical", ghostWord: "THINK",
      badge: "Technical · Problem Framing",
      headline: "Think out loud.",
      prompt: `A startup's engineering team doubled in size over 6 months. Three months later, velocity dropped 40%.\n\nYou haven't seen the codebase or metrics. What are your first 5 hypotheses? How would you prioritize investigating them?\n\nShow your thinking process.`,
      responseType: "text", timed: 10,
    }],
    [{
      id: "T-B", moduleId: "T1", cluster: "technical_analytical", ghostWord: "FRAME",
      badge: "Technical · System Design",
      headline: "From first principles.",
      prompt: `Explain how you would design a system to detect fraud in a payment network — from scratch, no existing frameworks.\n\nWalk through your reasoning from the problem definition to your first architectural decision.`,
      responseType: "text", timed: 10,
    }],
    [{
      id: "T-C", moduleId: "T1", cluster: "technical_analytical", ghostWord: "DEBUG",
      badge: "Technical · Debugging",
      headline: "Without the tools.",
      prompt: `A production system went down at 2am. You have access to logs but no monitoring dashboards.\n\nWalk me through your debugging process step by step — what do you look for first, and why?`,
      responseType: "text", timed: 10,
    }],
  ],
  visual_creative: [
    [{
      id: "V-A", moduleId: "V1", cluster: "visual_creative", ghostWord: "CREATE",
      badge: "Visual & Creative · Instinct",
      headline: "Describe your instinct.",
      prompt: `Think of a project brief you'd find exciting right now — describe it, then walk through your first 5 creative moves.\n\nWhat would you do before opening any tool? What does your instinct reach for first?`,
      responseType: "text",
    }],
    [{
      id: "V-B", moduleId: "V1", cluster: "visual_creative", ghostWord: "MAKE",
      badge: "Visual & Creative · Craft",
      headline: "The creative before the craft.",
      prompt: `Describe the last piece of work — yours or someone else's — that stopped you and made you think 'that's it.'\n\nWhat specifically made it work? What principle does it represent for you?`,
      responseType: "text",
    }],
  ],
  human_social: [
    [{
      id: "H-A", moduleId: "H1", cluster: "human_social", ghostWord: "TEACH",
      badge: "Human & Social · Teaching",
      headline: "Teach it from scratch.",
      prompt: `You have 5 minutes to explain the single most important concept in your field to someone who has never heard of it.\n\nNo jargon. No assuming knowledge. Start now.`,
      responseType: "text", timed: 5, minWords: 80,
    }],
    [{
      id: "H-B", moduleId: "H2", cluster: "human_social", ghostWord: "ETHICS",
      badge: "Human & Social · Ethics",
      headline: "The grey area.",
      prompt: `Describe a situation in your work where the right thing to do was clear — but doing it would cause harm to someone else in your care.\n\nWalk me through your thinking process (not what you did — how you thought). 10 minutes.`,
      responseType: "text", timed: 10,
    }],
  ],
  leadership_strategy: [
    [{
      id: "S-A", moduleId: "S1", cluster: "leadership_strategy", ghostWord: "DECIDE",
      badge: "Leadership & Strategy · Decision",
      headline: "The decision that was yours.",
      prompt: `Describe a decision you made in the last 3 months where you were the final call.\n\nWhat were the stakes? What were you uncertain about? How did you move?\n\n8 minutes, no polish.`,
      responseType: "text", timed: 8, minWords: 100,
    }],
    [{
      id: "S-B", moduleId: "S2", cluster: "leadership_strategy", ghostWord: "PRINCIPLE",
      badge: "Leadership & Strategy · Principles",
      headline: "What you actually believe.",
      prompt: `Write down 5 principles you actually use to make decisions — not ones you aspire to, the real ones.\n\nThen explain one of them as if you were describing it to someone who would push back on it.`,
      responseType: "text",
    }],
  ],
  life_personal: [
    [{
      id: "P-A", moduleId: "P1", cluster: "life_personal", ghostWord: "LIVE",
      badge: "Life & Personal · Real Life",
      headline: "Your actual life.",
      prompt: `Describe your week — not the highlights, not the Instagram version. The real texture of it.\n\nWhat occupied your mind? What did you avoid? What felt right? What didn't?`,
      responseType: "text", minWords: 80,
    }],
    [{
      id: "P-B", moduleId: "P2", cluster: "life_personal", ghostWord: "LEARN",
      badge: "Life & Personal · Growth",
      headline: "What you've actually learned.",
      prompt: `What is something you understood differently 1 year ago vs today — something you actually changed your mind on, not just refined?\n\nWalk through what shifted and why.`,
      responseType: "text",
    }],
  ],
};

// ── Build session prompt list ─────────────────────────────────────────────

export function buildCalibrationPrompts(
  sessionNumber: number,
  userCluster: string
): CalibrationPrompt[] {
  const setIdx = (sessionNumber - 1) % 3; // 0, 1, 2, repeat
  const clusterSetIdx = (sessionNumber - 1) % 2; // 0, 1, repeat

  // Pick U4 using setIdx clamped to available sets
  const u4Set = U4[setIdx % U4.length];
  const u3Set = U3[setIdx % U3.length];

  const universal = [
    U1[setIdx % U1.length],
    U2[setIdx % U2.length],
    u3Set,
    u4Set,
  ];

  const clusterSets = CLUSTER_PROMPTS[userCluster] ?? CLUSTER_PROMPTS.life_personal;
  const clusterPrompt = clusterSets[clusterSetIdx % clusterSets.length][0];

  // 5 prompts total: 4 universal + 1 cluster
  return [...universal, clusterPrompt];
}
