import type { NextRequest } from "next/server";
import { AUTH_RESUME_PATH, redirectAfterAuth } from "@/lib/auth/resume";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const { data, error } = await createClient().auth.exchangeCodeForSession(code);
    if (!error && data.session) return redirectAfterAuth(AUTH_RESUME_PATH);
  }
  return redirectAfterAuth("/signin?error=link");
}
