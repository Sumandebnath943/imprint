export type ResponseType = "text" | "audio" | "file" | "choice";

export interface BaselineModule {
  id: string;
  name: string;
  cluster: "universal" | "language_voice" | "technical_analytical" | "visual_creative" | "human_social" | "leadership_strategy" | "life_personal" | "final";
  ghostWord: string;
  headline: string;
  prompt: string;
  responseType: ResponseType;
  allowVoiceAlternative?: boolean;
  timed?: number; // minutes, undefined = no timer
  minWords?: number;
  disableBackspace?: boolean;
  badge: string;
}

// ─── Universal Modules (everyone gets these) ──────────────────────────────────
export const UNIVERSAL_MODULES: BaselineModule[] = [
  {
    id: "U1",
    name: "Opinion & Belief",
    cluster: "universal",
    ghostWord: "BELIEVE",
    badge: "Universal · Opinion & Belief",
    headline: "What do you actually believe?",
    prompt: `Pick one: Climate change, social media, remote work, or universal basic income.

Write your genuine opinion on it — not what you think you should believe. What do YOU actually think? No hedging. No both-sidesing.

Just your real view.`,
    responseType: "text",
    timed: 8,
    minWords: 80,
  },
  {
    id: "U2",
    name: "Decision Under Pressure",
    cluster: "universal",
    ghostWord: "DECIDE",
    badge: "Universal · Decision Making",
    headline: "Walk me through a decision.",
    prompt: `Think of a real decision you made in the last 6 months — not huge, not tiny. Something that required actual thought.

Walk me through exactly how you made it. What did you consider? What did you ignore? What would you do differently?

No AI helped you make that decision. Describe the human process.`,
    responseType: "text",
    timed: 10,
    minWords: 100,
  },
  {
    id: "U3",
    name: "Memory & Recall",
    cluster: "universal",
    ghostWord: "REMEMBER",
    badge: "Universal · Memory & Recall",
    headline: "From memory only.",
    prompt: `Without searching, without notes — answer 3 of these 5:

1. Explain how a core concept in your field works
2. Name 5 people who significantly shaped your field
3. Describe the last book, article, or work that changed how you think
4. What's your field's biggest unsolved problem?
5. Explain your morning routine and why it's that way

Choose 3. Answer from pure memory. Depth matters more than perfection.`,
    responseType: "text",
    timed: 12,
  },
  {
    id: "U4",
    name: "Emotional Fingerprint",
    cluster: "universal",
    ghostWord: "FEEL",
    badge: "Universal · Emotional Fingerprint",
    headline: "What moves you?",
    prompt: `Describe three things:

1. Something that genuinely makes you angry (not 'should' make you angry — actually does)

2. Something you find unexpectedly beautiful

3. Something that makes you feel most like yourself

Don't perform. Don't optimize. This is private. Just tell me.`,
    responseType: "text",
    allowVoiceAlternative: true,
    minWords: 60,
  },
];

// ─── Cluster Modules ──────────────────────────────────────────────────────────
const LANGUAGE_MODULES: BaselineModule[] = [
  {
    id: "L1",
    name: "Voice Signature",
    cluster: "language_voice",
    ghostWord: "VOICE",
    badge: "Language & Voice · Voice Signature",
    headline: "Write like no one's watching.",
    prompt: `Pick one:
a) Describe the moment you chose this path in life
b) Write about a place that shaped who you are
c) Explain something you know deeply to someone who knows nothing about it

10 minutes. No editing after you start. No backspace allowed — keep writing forward.`,
    responseType: "text",
    timed: 10,
    disableBackspace: true,
  },
  {
    id: "L2",
    name: "Argument Structure",
    cluster: "language_voice",
    ghostWord: "ARGUE",
    badge: "Language & Voice · Argument",
    headline: "Make your case.",
    prompt: `Write a 150–200 word argument for something you genuinely believe in — about your industry, your craft, or the world.

Lead with your strongest point. No throat-clearing.`,
    responseType: "text",
    timed: 8,
    minWords: 150,
  },
];

const TECHNICAL_MODULES: BaselineModule[] = [
  {
    id: "T1",
    name: "Problem Framing",
    cluster: "technical_analytical",
    ghostWord: "FRAME",
    badge: "Technical · Problem Framing",
    headline: "Before you solve — define.",
    prompt: `Here's a vague scenario:
A company's user retention dropped 30% last quarter. No other context is given.

You have NOT been asked to solve it yet.

What are the first 5 questions you would ask? What would you need to know before touching the data?

Show your thinking process, not the answer.`,
    responseType: "text",
    timed: 8,
  },
  {
    id: "T2",
    name: "Estimation & Intuition",
    cluster: "technical_analytical",
    ghostWord: "ESTIMATE",
    badge: "Technical · Estimation",
    headline: "No calculator. Just your mind.",
    prompt: `Answer both questions from intuition and reasoning. Show your work in plain language:

1. How many piano tuners are there in your city (or the nearest large city to you)?

2. If you had to estimate a key data point in your field without tools — how would you approach it? What would you anchor on first?`,
    responseType: "text",
    timed: 10,
  },
];

const VISUAL_MODULES: BaselineModule[] = [
  {
    id: "V1",
    name: "Creative Process",
    cluster: "visual_creative",
    ghostWord: "CREATE",
    badge: "Visual & Creative · Process",
    headline: "How do you actually start?",
    prompt: `Describe your creative process for starting a project from scratch. Not the ideal process — your real one.

What do you do first? What blocks you? How do you break through?

No examples from AI. No frameworks. Just what actually happens in your head.`,
    responseType: "text",
    allowVoiceAlternative: true,
  },
  {
    id: "V2",
    name: "Creative Fingerprint",
    cluster: "visual_creative",
    ghostWord: "MAKE",
    badge: "Visual & Creative · Fingerprint",
    headline: "Show me something.",
    prompt: `Sketch something — anything. A shape, a space, a feeling, an idea.

Upload a photo of your sketch, or record yourself describing a visual you'd create right now if you had no tools.

No perfection required. This is a fingerprint, not a portfolio piece.`,
    responseType: "file",
    allowVoiceAlternative: true,
  },
];

const HUMAN_MODULES: BaselineModule[] = [
  {
    id: "H1",
    name: "Explanation Style",
    cluster: "human_social",
    ghostWord: "TEACH",
    badge: "Human & Social · Explanation",
    headline: "Explain it to a 12-year-old.",
    prompt: `Take the most complex concept in your field.

Explain it to a 12-year-old in under 150 words. No jargon. No abbreviations.

Start right now — no planning.`,
    responseType: "text",
    allowVoiceAlternative: true,
    timed: 5,
    minWords: 50,
  },
  {
    id: "H2",
    name: "Ethical Reasoning",
    cluster: "human_social",
    ghostWord: "ETHICS",
    badge: "Human & Social · Ethics",
    headline: "There's no right answer here.",
    prompt: `A patient, client, or student comes to you. They need help. The right thing to do is clear — but doing it will cause real harm to someone else you're responsible for.

Walk me through how you think about it.

Not what you'd do — how you THINK about it.`,
    responseType: "text",
    timed: 10,
  },
];

const STRATEGY_MODULES: BaselineModule[] = [
  {
    id: "S1",
    name: "Decision Journal",
    cluster: "leadership_strategy",
    ghostWord: "LEAD",
    badge: "Leadership & Strategy · Decision",
    headline: "A decision you own.",
    prompt: `Write a raw account of a real decision you made in the last 3 months that you are completely responsible for.

What were the stakes? What did you know? What did you not know? How did you decide?

8 minutes. No polish. No AI drafted this.`,
    responseType: "text",
    timed: 8,
  },
  {
    id: "S2",
    name: "Mental Models",
    cluster: "leadership_strategy",
    ghostWord: "PRINCIPLE",
    badge: "Leadership & Strategy · Principles",
    headline: "What do you actually operate by?",
    prompt: `List 5 principles that genuinely guide how you make decisions. Not aspirational ones — the real ones you actually use.

Then pick one and explain it without using any business or self-help jargon.`,
    responseType: "text",
  },
];

const PERSONAL_MODULES: BaselineModule[] = [
  {
    id: "P1",
    name: "Values in Action",
    cluster: "life_personal",
    ghostWord: "LIVE",
    badge: "Life & Personal · Values",
    headline: "Your real day. Not the ideal one.",
    prompt: `Describe your typical day — not the version you'd want someone to see. The real one.

What do you prioritize? What do you avoid? What do you look forward to?

This is your values in action, not on paper.`,
    responseType: "text",
    allowVoiceAlternative: true,
    minWords: 80,
  },
  {
    id: "P2",
    name: "Learning Style",
    cluster: "life_personal",
    ghostWord: "LEARN",
    badge: "Life & Personal · Learning",
    headline: "The last thing you truly learned.",
    prompt: `Walk me through the last thing you genuinely learned — not from AI, not from a quick Google. Something that actually changed how you do something.

How did it happen? What clicked? Why did it stick?`,
    responseType: "text",
  },
];

// ─── Final module (everyone gets this last) ───────────────────────────────────
export const FINAL_MODULE: BaselineModule = {
  id: "FINAL",
  name: "Personal Expression",
  cluster: "final",
  ghostWord: "YOU",
  badge: "Your Final Imprint",
  headline: "One last thing.",
  prompt: `Tell me something about yourself that no AI could have told me.

No context. No format. No rules.
Text, voice, a sketch, a photo.

Just you.`,
  responseType: "text",
  allowVoiceAlternative: true,
};

// ─── Cluster → modules map ────────────────────────────────────────────────────
const CLUSTER_MODULES: Record<string, BaselineModule[]> = {
  language_voice: LANGUAGE_MODULES,
  technical_analytical: TECHNICAL_MODULES,
  visual_creative: VISUAL_MODULES,
  human_social: HUMAN_MODULES,
  leadership_strategy: STRATEGY_MODULES,
  life_personal: PERSONAL_MODULES,
};

export function buildModuleList(professionCluster: string): BaselineModule[] {
  const clusterMods = CLUSTER_MODULES[professionCluster] ?? PERSONAL_MODULES;
  return [...UNIVERSAL_MODULES, ...clusterMods, FINAL_MODULE];
}

// ─── Suggested skills per cluster ────────────────────────────────────────────
export const CLUSTER_SKILLS: Record<string, string[]> = {
  language_voice: ["Long-form writing", "Editing", "Pitching", "Interviewing", "Persuasive writing", "Research", "Storytelling"],
  technical_analytical: ["Problem framing", "Code debugging", "Data analysis", "Technical writing", "System design", "Estimation", "Code review"],
  visual_creative: ["Sketching", "Composition", "Color theory", "Typography", "Ideation", "Presentation", "Concept development"],
  human_social: ["Active listening", "Explaining complexity", "Ethical reasoning", "Case assessment", "Documentation", "Empathy mapping"],
  leadership_strategy: ["Decision journaling", "Strategic planning", "Pitching", "Team communication", "Risk assessment", "OKR setting"],
  life_personal: ["Learning retention", "Time management", "Written reflection", "Creative expression", "Memory recall", "Goal setting"],
};

// ─── Profession → cluster map (subset; full list in lib/utils/profession.ts) ─
export const PROFESSIONS: { name: string; cluster: string }[] = [
  { name: "Writer", cluster: "language_voice" },
  { name: "Journalist", cluster: "language_voice" },
  { name: "Screenwriter", cluster: "language_voice" },
  { name: "Marketer", cluster: "language_voice" },
  { name: "Customer Support", cluster: "language_voice" },
  { name: "Sales Representative", cluster: "language_voice" },
  { name: "Designer", cluster: "visual_creative" },
  { name: "Illustrator", cluster: "visual_creative" },
  { name: "Photographer", cluster: "visual_creative" },
  { name: "Videographer", cluster: "visual_creative" },
  { name: "Architect", cluster: "visual_creative" },
  { name: "Musician", cluster: "visual_creative" },
  { name: "Performer", cluster: "visual_creative" },
  { name: "Actor", cluster: "visual_creative" },
  { name: "Chef", cluster: "visual_creative" },
  { name: "Software Developer", cluster: "technical_analytical" },
  { name: "Data Scientist", cluster: "technical_analytical" },
  { name: "Researcher", cluster: "technical_analytical" },
  { name: "Scientist", cluster: "technical_analytical" },
  { name: "Accountant", cluster: "technical_analytical" },
  { name: "Educator", cluster: "human_social" },
  { name: "Doctor", cluster: "human_social" },
  { name: "Lawyer", cluster: "human_social" },
  { name: "Therapist", cluster: "human_social" },
  { name: "Social Worker", cluster: "human_social" },
  { name: "Product Manager", cluster: "leadership_strategy" },
  { name: "Entrepreneur", cluster: "leadership_strategy" },
  { name: "Executive", cluster: "leadership_strategy" },
  { name: "Athlete", cluster: "leadership_strategy" },
  { name: "Coach", cluster: "leadership_strategy" },
  { name: "Student", cluster: "life_personal" },
  { name: "Homemaker / Parent", cluster: "life_personal" },
  { name: "Retired", cluster: "life_personal" },
  { name: "Between Jobs", cluster: "life_personal" },
  { name: "Freelancer", cluster: "life_personal" },
];

export const CLUSTER_COLORS: Record<string, string> = {
  language_voice: "#FF5500",
  visual_creative: "#FF7A30",
  technical_analytical: "#00D97E",
  human_social: "#4FC3F7",
  leadership_strategy: "#CE93D8",
  life_personal: "#FFB800",
};

export const CLUSTER_LABELS: Record<string, string> = {
  language_voice: "Language & Voice",
  visual_creative: "Visual & Creative",
  technical_analytical: "Technical & Analytical",
  human_social: "Human & Social",
  leadership_strategy: "Leadership & Strategy",
  life_personal: "Life & Personal",
};

export const AGE_GROUPS = [
  { label: "8 – 12", value: "child_8_12" },
  { label: "13 – 15", value: "teen_13_15" },
  { label: "16 – 18", value: "teen_16_18" },
  { label: "19 – 64", value: "adult_19_64" },
  { label: "65+", value: "senior_65_plus" },
];

export const AI_EXPOSURE_LEVELS = [
  { value: "none", label: "None", description: "I don't use AI tools at all", color: "#00D97E" },
  { value: "light", label: "Light", description: "Occasionally for research or quick lookups", color: "#FFB800" },
  { value: "moderate", label: "Moderate", description: "Several times a week for real tasks", color: "#FF7A30" },
  { value: "heavy", label: "Heavy", description: "Daily — it's part of my main workflow", color: "#FF5500" },
  { value: "dependent", label: "Dependent", description: "I struggle to complete work without it", color: "#FF2D2D" },
];

export const AI_USE_CONTEXTS = [
  "Writing & drafting",
  "Coding & debugging",
  "Research & summarizing",
  "Problem solving",
  "Creative work",
  "Decision making",
  "Learning & studying",
  "Email & communication",
  "Data analysis",
  "Planning & strategy",
  "Brainstorming",
  "Other",
];

export const ONBOARDING_STEPS = [
  { index: 1, path: "/onboarding/welcome", label: "Welcome" },
  { index: 2, path: "/onboarding/who-are-you", label: "Identity" },
  { index: 3, path: "/onboarding/ai-exposure", label: "AI Use" },
  { index: 4, path: "/onboarding/baseline-intro", label: "Baseline Intro" },
  { index: 5, path: "/onboarding/baseline", label: "Baseline" },
  { index: 6, path: "/onboarding/skill-vault", label: "Skill Vault" },
  { index: 7, path: "/onboarding/complete", label: "Complete" },
];
export const TOTAL_STEPS = ONBOARDING_STEPS.length;
