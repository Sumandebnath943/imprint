// Skill Vault — shared types and helpers

export interface VaultSkill {
  id: string;
  user_id: string;
  skill_name: string;
  cluster: string;
  strength_level: number; // 0–100 (DB value)
  decay_rate: number;     // strength lost per day (default 0.5)
  last_exercised: string; // ISO timestamp
  times_practiced: number;
  created_at: string;
  updated_at: string;
}

export interface VaultChallenge {
  id: string;
  user_id: string;
  skill_id: string;
  skill_name?: string;
  challenge_title: string;
  challenge_description: string;
  challenge_type: string;
  assigned_date: string;
  due_date: string;
  status: "pending" | "completed" | "missed";
  strength_gained: number;
}

export interface VaultHistoryRow {
  id: string;
  created_at: string;
  skill_name: string;
  challenge_type: string;
  status: "completed" | "missed" | "in_progress";
  strength_change: number;
  duration_minutes?: number;
}

export interface VaultPageData {
  userId: string;
  userCluster: string;
  skills: VaultSkill[];
  activeChallenge: VaultChallenge | null;
  history: VaultHistoryRow[];
}

// ── Strength helpers ──────────────────────────────────────────────────────

export function getStrengthColor(strength: number): string {
  if (strength >= 80) return "#00D97E";
  if (strength >= 50) return "#FFB800";
  if (strength >= 25) return "#FF7A30";
  return "#FF2D2D";
}

export function getStrengthLabel(strength: number): string {
  if (strength >= 80) return "Strong";
  if (strength >= 50) return "Healthy";
  if (strength >= 25) return "Weakening";
  return "Critical";
}

// ── Decay engine ──────────────────────────────────────────────────────────

export function calcDecayedStrength(skill: VaultSkill): number {
  const daysSince =
    (Date.now() - new Date(skill.last_exercised).getTime()) / (1000 * 60 * 60 * 24);
  const loss = daysSince * (skill.decay_rate ?? 0.5);
  return Math.max(0, Math.round(skill.strength_level - loss));
}

export function getDaysSinceExercised(last: string): number {
  return Math.floor(
    (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function getDecayStatus(days: number): { label: string; color: string } {
  if (days === 0) return { label: "Practiced today", color: "#00D97E" };
  if (days <= 3)  return { label: "Healthy",          color: "#00D97E" };
  if (days <= 6)  return { label: "Cooling",           color: "#FFB800" };
  if (days <= 13) return { label: "⚠ Weakening",       color: "#FF7A30" };
  return             { label: "🔴 Decaying fast",     color: "#FF2D2D" };
}

export function getRelativeTime(isoDate: string): string {
  const days = getDaysSinceExercised(isoDate);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function getChallengeGain(strength: number): number {
  if (strength < 30)  return 15;
  if (strength < 60)  return 10;
  if (strength < 80)  return 7;
  return 5;
}

// ── Challenge templates ───────────────────────────────────────────────────

export function getChallengeTemplate(
  cluster: string,
  skillName: string
): { title: string; description: string; type: string; duration: string } {
  const templates: Record<string, { title: string; description: string; type: string; duration: string }> = {
    language_voice: {
      title: `Write from memory: ${skillName}`,
      description: `Write 300–500 words on a topic closely tied to your ${skillName} skill — from memory only. No AI. No references. Pure recall and craft. Open The Forge when ready.`,
      type: "timed_write",
      duration: "45 minutes",
    },
    technical_analytical: {
      title: `Reasoning exercise: ${skillName}`,
      description: `Without any tools or references, walk through a real problem scenario using your ${skillName} skill. Show every step of your reasoning in plain language.`,
      type: "reasoning_exercise",
      duration: "30 minutes",
    },
    visual_creative: {
      title: `Creative production: ${skillName}`,
      description: `Create something tangible using your ${skillName} skill — a sketch, a recording, a draft. No AI assistance. Upload or record your work in The Forge.`,
      type: "creative_production",
      duration: "45 minutes",
    },
    human_social: {
      title: `Teach it: ${skillName}`,
      description: `Explain your ${skillName} skill from memory — as if teaching it for the first time to someone who knows nothing. Voice note or written. The explanation IS the practice.`,
      type: "explanation_exercise",
      duration: "20 minutes",
    },
    leadership_strategy: {
      title: `Decision journal: ${skillName}`,
      description: `Write a 200-word decision journal entry about a real choice you're currently facing that involves your ${skillName}. No AI. No frameworks. Just your reasoning.`,
      type: "decision_journal",
      duration: "25 minutes",
    },
    life_personal: {
      title: `Knowledge transfer: ${skillName}`,
      description: `Explain what you know about ${skillName} to someone who knows nothing about it. Written or voice note. Depth matters more than length.`,
      type: "knowledge_transfer",
      duration: "20 minutes",
    },
  };
  return templates[cluster] ?? templates.life_personal;
}

// ── Suggested skills by cluster ───────────────────────────────────────────

export const SUGGESTED_SKILLS: Record<string, string[]> = {
  language_voice: ["Long-form writing", "Editing", "Storytelling", "Research synthesis", "Verbal persuasion", "Script writing", "Poetry", "Translation"],
  technical_analytical: ["System design", "Debugging", "Code review", "Algorithmic thinking", "Data interpretation", "Architecture planning", "Documentation", "Security reasoning"],
  visual_creative: ["Sketching", "Typography", "Color theory", "Composition", "Brand thinking", "Illustration", "3D modeling", "Photography"],
  human_social: ["Active listening", "Conflict resolution", "Empathy mapping", "Case formulation", "Facilitation", "Mentoring", "Cultural sensitivity", "Negotiation"],
  leadership_strategy: ["Strategic planning", "Decision-making", "Team motivation", "Risk assessment", "Stakeholder management", "Executive communication", "Vision setting", "Change management"],
  life_personal: ["Critical thinking", "Memory recall", "Problem solving", "Self-reflection", "Goal setting", "Financial reasoning", "Emotional regulation", "Deep work"],
};

export type FilterType = "All" | "Strong" | "Healthy" | "Weakening" | "Critical";
export type SortType = "strength-asc" | "strength-desc" | "last-practiced" | "recently-added" | "alphabetical";
