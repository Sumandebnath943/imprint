import type { ProfessionCluster, Profession } from "@/types/user.types";
import type { BaselineModule } from "@/types/baseline.types";

// ─── Profession → Cluster Mapping ────────────────────────────────────────────

export const PROFESSION_CLUSTER_MAP: Record<Profession, ProfessionCluster> = {
  // language_voice
  writer: "language_voice",
  journalist: "language_voice",
  screenwriter: "language_voice",
  marketer: "language_voice",
  customer_support: "language_voice",
  sales: "language_voice",
  // visual_creative
  designer: "visual_creative",
  illustrator: "visual_creative",
  photographer: "visual_creative",
  videographer: "visual_creative",
  architect: "visual_creative",
  musician: "visual_creative",
  performer: "visual_creative",
  actor: "visual_creative",
  chef: "visual_creative",
  // technical_analytical
  software_developer: "technical_analytical",
  data_scientist: "technical_analytical",
  researcher: "technical_analytical",
  scientist: "technical_analytical",
  accountant: "technical_analytical",
  // human_social
  educator: "human_social",
  doctor: "human_social",
  lawyer: "human_social",
  therapist: "human_social",
  social_worker: "human_social",
  // leadership_strategy
  product_manager: "leadership_strategy",
  entrepreneur: "leadership_strategy",
  executive: "leadership_strategy",
  athlete: "leadership_strategy",
  coach: "leadership_strategy",
  // life_personal
  student: "life_personal",
  homemaker_parent: "life_personal",
  retired: "life_personal",
  between_jobs: "life_personal",
  freelancer: "life_personal",
};

export const CLUSTER_PROFESSIONS: Record<ProfessionCluster, Profession[]> = {
  language_voice: [
    "writer",
    "journalist",
    "screenwriter",
    "marketer",
    "customer_support",
    "sales",
  ],
  visual_creative: [
    "designer",
    "illustrator",
    "photographer",
    "videographer",
    "architect",
    "musician",
    "performer",
    "actor",
    "chef",
  ],
  technical_analytical: [
    "software_developer",
    "data_scientist",
    "researcher",
    "scientist",
    "accountant",
  ],
  human_social: ["educator", "doctor", "lawyer", "therapist", "social_worker"],
  leadership_strategy: [
    "product_manager",
    "entrepreneur",
    "executive",
    "athlete",
    "coach",
  ],
  life_personal: [
    "student",
    "homemaker_parent",
    "retired",
    "between_jobs",
    "freelancer",
  ],
};

// ─── Baseline Modules Per Cluster ─────────────────────────────────────────────

const BASELINE_MODULES: Record<ProfessionCluster, BaselineModule[]> = {
  language_voice: [
    {
      id: "L1",
      name: "Voice & Perspective",
      cluster: "language_voice",
      prompt:
        "Describe your professional philosophy in your own words. What drives the way you communicate?",
      response_type: "text",
      description: "Captures your authentic written voice and perspective.",
    },
    {
      id: "L2",
      name: "Persuasion Pattern",
      cluster: "language_voice",
      prompt:
        "Write a short pitch for an idea you genuinely believe in — without using bullet points.",
      response_type: "text",
      description: "Reveals your natural persuasion and argumentation style.",
    },
    {
      id: "L3",
      name: "Narrative Instinct",
      cluster: "language_voice",
      prompt: "Tell a story from your work life that changed how you think.",
      response_type: "text",
      description: "Captures your storytelling structure and narrative voice.",
    },
  ],
  visual_creative: [
    {
      id: "V1",
      name: "Creative Rationale",
      cluster: "visual_creative",
      prompt:
        "Describe the last creative decision you made that you're proud of. What was your process?",
      response_type: "text",
      description: "Captures your design thinking and creative reasoning.",
    },
    {
      id: "V2",
      name: "Aesthetic Statement",
      cluster: "visual_creative",
      prompt:
        "If your creative work had a manifesto, what would the first three lines be?",
      response_type: "text",
      description: "Reveals your aesthetic identity and creative values.",
    },
  ],
  technical_analytical: [
    {
      id: "T1",
      name: "Problem Decomposition",
      cluster: "technical_analytical",
      prompt:
        "Walk me through how you'd approach a complex problem you've never seen before.",
      response_type: "text",
      description: "Captures your analytical reasoning and problem-solving approach.",
    },
    {
      id: "T2",
      name: "Mental Model",
      cluster: "technical_analytical",
      prompt:
        "What mental model do you use most often in your work? Explain it as if to a non-expert.",
      response_type: "text",
      description:
        "Reveals how you conceptualize and explain complex ideas.",
    },
  ],
  human_social: [
    {
      id: "H1",
      name: "Empathy in Practice",
      cluster: "human_social",
      prompt:
        "Describe a time you had to understand someone else's perspective completely. How did you do it?",
      response_type: "text",
      description: "Captures your empathetic reasoning and social cognition.",
    },
    {
      id: "H2",
      name: "Values Under Pressure",
      cluster: "human_social",
      prompt:
        "What principle have you never compromised on in your work, even when it was difficult?",
      response_type: "text",
      description: "Reveals your moral reasoning and professional values.",
    },
  ],
  leadership_strategy: [
    {
      id: "S1",
      name: "Strategic Intuition",
      cluster: "leadership_strategy",
      prompt:
        "Describe a decision you made with incomplete information. How did you reason through it?",
      response_type: "text",
      description:
        "Captures your strategic thinking and decision-making under uncertainty.",
    },
    {
      id: "S2",
      name: "Vision Articulation",
      cluster: "leadership_strategy",
      prompt: "What does success look like in 3 years — for you and your work?",
      response_type: "text",
      description: "Reveals how you construct and communicate long-term vision.",
    },
  ],
  life_personal: [
    {
      id: "P1",
      name: "Personal Framework",
      cluster: "life_personal",
      prompt:
        "How do you decide what's worth spending time on? What's your personal decision filter?",
      response_type: "text",
      description: "Captures your personal values and decision-making framework.",
    },
    {
      id: "P2",
      name: "Growth Perspective",
      cluster: "life_personal",
      prompt:
        "What's something you've taught yourself in the last year? How did you go about it?",
      response_type: "text",
      description: "Reveals your self-directed learning patterns.",
    },
  ],
};

// ─── Vault Challenge Prompts Per Cluster & Skill ──────────────────────────────

const VAULT_CHALLENGE_TEMPLATES: Record<ProfessionCluster, string> = {
  language_voice:
    "Write a 300-word piece on '{skill}' without using AI assistance. Focus on your authentic voice.",
  visual_creative:
    "Create a hand-drawn or unassisted sketch exploring '{skill}'. No digital tools unless essential.",
  technical_analytical:
    "Solve a '{skill}' problem from scratch without searching the web or using AI. Document your reasoning.",
  human_social:
    "Have a real conversation about '{skill}' with someone in your life. Reflect on what you learned.",
  leadership_strategy:
    "Make one real decision this week that requires '{skill}'. Record your reasoning process.",
  life_personal:
    "Practice '{skill}' for 30 minutes without any digital assistance. Journal your experience.",
};

// ─── Exported Functions ────────────────────────────────────────────────────────

/**
 * Returns the profession cluster for a given profession string.
 */
export function getClusterForProfession(profession: string): ProfessionCluster {
  const cluster =
    PROFESSION_CLUSTER_MAP[profession as Profession];
  if (!cluster) {
    return "life_personal"; // default fallback
  }
  return cluster;
}

/**
 * Returns the baseline modules assigned to a specific cluster.
 */
export function getBaselineModulesForCluster(
  cluster: string
): BaselineModule[] {
  return BASELINE_MODULES[cluster as ProfessionCluster] ?? [];
}

/**
 * Returns a vault challenge prompt string for a given cluster and skill.
 */
export function getVaultChallengePrompt(
  cluster: string,
  skill: string
): string {
  const template =
    VAULT_CHALLENGE_TEMPLATES[cluster as ProfessionCluster] ??
    VAULT_CHALLENGE_TEMPLATES.life_personal;
  return template.replace("{skill}", skill);
}
