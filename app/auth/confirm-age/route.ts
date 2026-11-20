import type { NextRequest } from "next/server";
import { ADULT_ATTESTATION, AGE_CONFIRMATION_PATH, hasConfirmedAdultAge } from "@/lib/auth/eligibility";
import { AUTH_RESUME_PATH, redirectAfterAuth } from "@/lib/auth/resume";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin;
  if (request.headers.get("origin") !== appOrigin) {
    return new Response("Confirm your age from the Imprint page.", { status: 403 });
  }
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return redirectAfterAuth("/signin");
  if (hasConfirmedAdultAge(user)) return redirectAfterAuth(AUTH_RESUME_PATH);
  const form = await request.formData().catch(() => null);
  if (form?.get("adult") !== "yes") return redirectAfterAuth(AGE_CONFIRMATION_PATH);
  try {
    const { error } = await createAdminClient().auth.admin.updateUserById(user.id, {
      app_metadata: { [ADULT_ATTESTATION]: true },
    });
    if (error) throw error;
    return redirectAfterAuth(AUTH_RESUME_PATH);
  } catch {
    return redirectAfterAuth(`${AGE_CONFIRMATION_PATH}?error=save`);
  }
}
