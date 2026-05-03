import { z } from "zod";

export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be under 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and dashes"
    )
    .optional(),
  avatar_url: z.string().url("Must be a valid URL").nullable().optional(),
  age_group: z
    .enum(["child_8_12", "teen_13_15", "teen_16_18", "adult_19_64", "senior_65_plus"])
    .optional(),
  profession: z.string().min(1, "Please select a profession").optional(),
  ai_exposure_level: z
    .enum(["none", "light", "moderate", "heavy", "dependent"])
    .optional(),
  ai_use_context: z.array(z.string()).optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
