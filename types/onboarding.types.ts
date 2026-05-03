import type { ProfessionCluster, AIExposureLevel } from "./user.types";

export type OnboardingStep =
  | "welcome"
  | "who-are-you"
  | "ai-exposure"
  | "baseline"
  | "skill-vault"
  | "complete";

export interface OnboardingWhoAreYouData {
  full_name: string;
  age_group: string;
  profession: string;
  profession_cluster: ProfessionCluster;
}

export interface OnboardingAIExposureData {
  ai_exposure_level: AIExposureLevel;
  ai_use_context: string[];
}

export interface OnboardingBaselineData {
  completed_modules: string[];
  baseline_responses: Record<string, unknown>;
}

export interface OnboardingSkillVaultData {
  selected_skills: string[];
  skill_strengths: Record<string, number>;
}

export interface OnboardingAnswers {
  who_are_you?: OnboardingWhoAreYouData;
  ai_exposure?: OnboardingAIExposureData;
  baseline?: OnboardingBaselineData;
  skill_vault?: OnboardingSkillVaultData;
  [key: string]: unknown;
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  answers: OnboardingAnswers;
}
