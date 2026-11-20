import type { NextRequest } from "next/server";
import { redirectAfterAuth } from "@/lib/auth/resume";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  if (!code && !tokenHash) return redirectAfterAuth("/signin?error=link");

  const { auth } = createClient();
  const result = code
    ? await auth.exchangeCodeForSession(code)
    : await auth.verifyOtp({ token_hash: tokenHash!, type: "recovery" });
  return redirectAfterAuth(!result.error && result.data.session ? "/reset-password" : "/signin?error=link");
}
