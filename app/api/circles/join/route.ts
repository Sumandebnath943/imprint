import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const JoinSchema = z.object({
  invite_code: z.string().trim().min(4, "Invite code required").max(16),
});

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = JoinSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invite code required" },
        { status: 400 }
      );
    }

    // find_circle_by_invite is SECURITY DEFINER (migration 006). A private
    // circle is invisible to a non-member under RLS, so a plain select here
    // could never find it — but we also do not want to open human_circles to
    // every logged-in user. The function returns a circle only for an exact
    // code match, and nothing else.
    const { data: found, error: lookupError } = await supabase.rpc(
      "find_circle_by_invite",
      { code: parsed.data.invite_code }
    );

    if (lookupError) {
      console.error("[circles/join] lookup", lookupError);
      return NextResponse.json({ error: "Could not verify that code." }, { status: 500 });
    }

    const circle = Array.isArray(found) ? found[0] : found;
    if (!circle) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 404 });
    }

    if (circle.member_count >= circle.member_limit) {
      return NextResponse.json(
        { error: `This circle is full (${circle.member_count}/${circle.member_limit} members).` },
        { status: 400 }
      );
    }

    const { error: joinError } = await supabase
      .from("circle_members")
      .insert({ circle_id: circle.id, user_id: user.id, role: "member" });

    if (joinError) {
      // UNIQUE (circle_id, user_id) — already a member.
      if (joinError.code === "23505") {
        return NextResponse.json({ error: "You're already in this circle." }, { status: 400 });
      }
      console.error("[circles/join]", joinError);
      return NextResponse.json({ error: "Failed to join circle" }, { status: 500 });
    }

    return NextResponse.json({ success: true, circle });
  } catch (err) {
    console.error("[circles/join]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
