import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  const parsed = z.object({ id: z.uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid capsule." }, { status: 400, headers });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to open your capsule." }, { status: 401, headers });

  const { data, error } = await supabase.rpc("read_time_capsule", { p_id: parsed.data.id });
  if (error) return NextResponse.json({ error: "Could not open the capsule. Try again." }, { status: 500, headers });
  if (data === null) return NextResponse.json({ error: "This capsule is unavailable." }, { status: 404, headers });
  return NextResponse.json({ content: data }, { headers });
}
