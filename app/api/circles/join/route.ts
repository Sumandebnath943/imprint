import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const input = z.union([
  z.object({ circle_id: z.uuid() }).strict(),
  z.object({ invite_code: z.string().trim().min(4).max(16) }).strict(),
]);

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to join a circle." }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid invite code or choose a public circle." }, { status: 400 });
  const args = "circle_id" in parsed.data ? { p_circle: parsed.data.circle_id } : { p_code: parsed.data.invite_code };
  const { data, error } = await supabase.rpc("join_human_circle", args);
  if (error) {
    if (error.code === "P0002") return NextResponse.json({ error: "Circle or invite code unavailable." }, { status: 404 });
    if (error.code === "P0001") return NextResponse.json({ error: "This circle is full." }, { status: 409 });
    return NextResponse.json({ error: "Could not join. Try again." }, { status: 500 });
  }
  return NextResponse.json({ success: true, circle: data });
}
