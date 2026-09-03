import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Every field optional: this endpoint takes partial updates. Only keys the
// caller actually sent are written.
//
// The previous version always wrote `age_group: body.age_group || null` (and
// the same for profession / profession_cluster), so a partial update such as
// { credential_public: true } silently NULLed those three columns.
const ProfileUpdateSchema = z.object({
  full_name: z.string().trim().max(80).optional(),
  username: z.string().trim().min(3).max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username may only contain letters, numbers, . _ and -")
    .optional(),
  bio: z.string().trim().max(500).optional(),
  location: z.string().trim().max(100).optional(),
  age_group: z.enum([
    "child_8_12", "teen_13_15", "teen_16_18", "adult_19_64", "senior_65_plus",
  ]).nullable().optional(),
  profession: z.string().trim().max(100).nullable().optional(),
  profession_cluster: z.enum([
    "language_voice", "visual_creative", "technical_analytical",
    "human_social", "leadership_strategy", "life_personal",
  ]).nullable().optional(),
  credential_public: z.boolean().optional(),
  leaderboard_opt_in: z.boolean().optional(),
  accepting_mentees: z.boolean().optional(),
  avatar_url: z.string().url().max(500).nullable().optional(),
}).strict();

export async function PATCH(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = ProfileUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid request" },
        { status: 400 }
      );
    }

    // Drop keys the caller omitted so we never overwrite untouched columns.
    const updates = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined)
    );

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      // 23505 = unique_violation on username.
      if (error.code === "23505") {
        return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
      }
      console.error("[profile/update]", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[profile/update]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
