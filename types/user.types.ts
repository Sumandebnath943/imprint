export type AgeGroup =
  | "child_8_12"
  | "teen_13_15"
  | "teen_16_18"
  | "adult_19_64"
  | "senior_65_plus";

export type ProfessionCluster =
  | "language_voice"
  | "visual_creative"
  | "technical_analytical"
  | "human_social"
  | "leadership_strategy"
  | "life_personal";

export type AIExposureLevel =
  | "none"
  | "light"
  | "moderate"
  | "heavy"
  | "dependent";

export type Profession =
  | "writer"
  | "journalist"
  | "screenwriter"
  | "marketer"
  | "customer_support"
  | "sales"
  | "designer"
  | "illustrator"
  | "photographer"
  | "videographer"
  | "architect"
  | "musician"
  | "performer"
  | "actor"
  | "chef"
  | "software_developer"
  | "data_scientist"
  | "researcher"
  | "scientist"
  | "accountant"
  | "educator"
  | "doctor"
  | "lawyer"
  | "therapist"
  | "social_worker"
  | "product_manager"
  | "entrepreneur"
  | "executive"
  | "athlete"
  | "coach"
  | "student"
  | "homemaker_parent"
  | "retired"
  | "between_jobs"
  | "freelancer";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  age_group: AgeGroup;
  profession: Profession;
  profession_cluster: ProfessionCluster;
  ai_exposure_level: AIExposureLevel;
  ai_use_context: string[];
  onboarding_completed: boolean;
  onboarding_step: number;
  imprint_score: number;
  created_at: string;
  updated_at: string;
}

export type ProfileInsert = Omit<Profile, "created_at" | "updated_at">;
export type ProfileUpdate = Partial<
  Omit<Profile, "id" | "created_at" | "updated_at">
>;
