import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const failure = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function mentorAction<T>(request: Request, schema: z.ZodType<T>, rpc: string, args: (data: T) => Record<string, unknown>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return failure("Sign in to use mentoring.", 401);
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return failure("Check the mentoring details and try again.", 400);
  const { data, error } = await supabase.rpc(rpc, args(input.data));
  if (error) {
    const status = { "42501": 403, "22023": 400, P0001: 409 }[error.code];
    return status ? failure(error.message, status) : failure("The mentoring update could not be saved. Try again.", 500);
  }
  return NextResponse.json({ result: data });
}
