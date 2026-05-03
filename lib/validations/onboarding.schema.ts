import { z } from "zod";

export const whoAreYouSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  age_group: z.enum([
    "child_8_12",
    "teen_13_15",
    "teen_16_18",
    "adult_19_64",
    "senior_65_plus",
  ]),
  profession: z.string().min(1, "Please select your profession"),
  profession_cluster: z.enum([
    "language_voice",
    "visual_creative",
    "technical_analytical",
    "human_social",
    "leadership_strategy",
    "life_personal",
  ]),
});

export const aiExposureSchema = z.object({
  ai_exposure_level: z.enum([
    "none",
    "light",
    "moderate",
    "heavy",
    "dependent",
  ]),
  ai_use_context: z
    .array(z.string())
    .min(1, "Please select at least one area"),
});

export const baselineResponseSchema = z.object({
  module_id: z.string().min(1),
  response_text: z.string().min(50, "Response must be at least 50 characters"),
  response_time_seconds: z.number().min(0),
});

export const skillVaultSetupSchema = z.object({
  selected_skills: z
    .array(z.string())
    .min(3, "Please select at least 3 skills")
    .max(10, "You can select up to 10 skills"),
});

export type WhoAreYouFormData = z.infer<typeof whoAreYouSchema>;
export type AIExposureFormData = z.infer<typeof aiExposureSchema>;
export type BaselineResponseFormData = z.infer<typeof baselineResponseSchema>;
export type SkillVaultSetupFormData = z.infer<typeof skillVaultSetupSchema>;
