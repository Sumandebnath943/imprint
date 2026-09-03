import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CreateCircleSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  description: z.string().trim().max(500).optional().default(""),
  clusterFocus: z.string().trim().min(1, "Cluster focus required").max(60),
  isPrivate: z.boolean().optional().default(true),
});

function randomInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = CreateCircleSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }
    const { name, description, clusterFocus, isPrivate } = parsed.data;

    // Migration 006 replaced the recursive circle_members policy with
    // SECURITY DEFINER helpers, so this no longer needs the service-role key.
    // Uniqueness is enforced by the UNIQUE constraint on invite_code; we retry
    // on collision rather than pre-checking (the old pre-check read circles the
    // user cannot see, so it could not detect a collision anyway).
    // The id is generated here rather than read back from the insert.
    //
    // Chaining .select() adds a RETURNING clause, and RETURNING is checked
    // against the SELECT policy — which is "NOT is_private OR
    // is_circle_member(id)". The creator's membership row is written after the
    // circle, so at that instant they are not a member yet, and a private
    // circle fails its own SELECT check. Postgres reports that as "new row
    // violates row-level security policy", which made creating a private
    // circle impossible — and private is the default.
    let circle: { id: string; invite_code: string } | null = null;
    let inviteCode = "";
    let lastError: string | null = null;

    for (let attempt = 0; attempt < 5 && !circle; attempt++) {
      inviteCode = randomInviteCode();
      const circleId = crypto.randomUUID();

      const { error } = await supabase.from("human_circles").insert({
        id: circleId,
        name,
        description,
        cluster_focus: clusterFocus,
        created_by: user.id,
        member_limit: 8,
        is_private: isPrivate,
        invite_code: inviteCode,
      });

      if (!error) {
        circle = { id: circleId, invite_code: inviteCode };
        break;
      }
      // 23505 = unique_violation → the code was taken, try another.
      if (error.code !== "23505") {
        lastError = error.message;
        break;
      }
      lastError = error.message;
    }

    if (!circle) {
      console.error("[circles/create]", lastError);
      return NextResponse.json(
        { error: lastError ?? "Failed to create circle" },
        { status: 500 }
      );
    }

    const { error: memberError } = await supabase
      .from("circle_members")
      .insert({ circle_id: circle.id, user_id: user.id, role: "admin" });

    if (memberError) {
      // The circle exists but the creator is not in it — unusable. Roll back.
      console.error("[circles/create] member insert failed", memberError);
      await supabase.from("human_circles").delete().eq("id", circle.id);
      return NextResponse.json(
        { error: "Failed to create circle" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, circle, inviteCode });
  } catch (err) {
    console.error("[circles/create]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
