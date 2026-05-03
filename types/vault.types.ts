export type ChallengeStatus = "pending" | "completed" | "missed";

export interface SkillVaultEntry {
  id: string;
  user_id: string;
  skill_name: string;
  skill_category: string;
  cluster: string;
  strength_level: number;
  last_exercised: string;
  decay_rate: number;
  times_practiced: number;
  created_at: string;
  updated_at: string;
}

export type SkillVaultInsert = Omit<
  SkillVaultEntry,
  "id" | "created_at" | "updated_at"
>;
export type SkillVaultUpdate = Partial<
  Omit<SkillVaultEntry, "id" | "user_id" | "created_at" | "updated_at">
>;

export interface VaultChallenge {
  id: string;
  user_id: string;
  skill_id: string;
  challenge_title: string;
  challenge_description: string;
  challenge_type: string;
  assigned_date: string;
  due_date: string;
  completed_at: string | null;
  submission_text: string | null;
  submission_audio_url: string | null;
  submission_file_url: string | null;
  status: ChallengeStatus;
  strength_gained: number | null;
  created_at: string;
}

export type VaultChallengeInsert = Omit<VaultChallenge, "id" | "created_at">;
export type VaultChallengeUpdate = Partial<
  Omit<VaultChallenge, "id" | "user_id" | "skill_id" | "created_at">
>;
