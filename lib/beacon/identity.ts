/**
 * Who is visiting, resolved from the session rather than from the payload.
 *
 * The beacon request carries the visitor's cookies, so the server can ask
 * Supabase directly who they are. Nothing about identity is taken from the
 * client: a browser can claim anything, but it cannot forge a session.
 *
 * Reads run as the caller, so row-level security applies exactly as it does
 * everywhere else — this can only ever see the visitor's own row.
 */

export interface Identity {
  signedIn: boolean;
  userId?: string;
  email?: string;
  name?: string;
  username?: string;
  /** True when the account was created within NEW_ACCOUNT_WINDOW_MS. */
  isNewAccount?: boolean;
  accountAgeMs?: number;
  onboardingCompleted?: boolean;
  onboardingStep?: number | null;
  driftScore?: number | null;
  imprintScore?: number | null;
}

/** Inside this window a sign-in is really a sign-up. */
const NEW_ACCOUNT_WINDOW_MS = 15 * 60_000;

export async function resolveIdentity(): Promise<Identity> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { signedIn: false };

    const [{ data: profile }, { data: drift }] = await Promise.all([
      supabase
        .from("profiles")
        .select("email, full_name, username, created_at, onboarding_completed, onboarding_step, imprint_score")
        .eq("id", user.id)
        .single(),
      supabase
        .from("drift_scores")
        .select("score")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // created_at on the profile rather than the auth user: the row is written
    // by the handle_new_user trigger at the moment the account is created.
    const createdAt = profile?.created_at ? Date.parse(profile.created_at) : NaN;
    const accountAgeMs = Number.isFinite(createdAt) ? Date.now() - createdAt : undefined;

    return {
      signedIn: true,
      userId: user.id,
      email: profile?.email ?? user.email ?? undefined,
      name: profile?.full_name ?? undefined,
      username: profile?.username ?? undefined,
      accountAgeMs,
      isNewAccount: accountAgeMs !== undefined && accountAgeMs < NEW_ACCOUNT_WINDOW_MS,
      onboardingCompleted: profile?.onboarding_completed ?? undefined,
      onboardingStep: profile?.onboarding_step ?? null,
      driftScore: drift?.score ?? null,
      imprintScore: profile?.imprint_score ?? null,
    };
  } catch {
    // An unreadable session must never cost us the alert.
    return { signedIn: false };
  }
}
