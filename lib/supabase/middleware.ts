import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_RESUME_PATH } from "@/lib/auth/resume";
import { ADULT_ONLY_MESSAGE, AGE_CONFIRMATION_PATH, hasConfirmedAdultAge } from "@/lib/auth/eligibility";

const accountRightsPaths = new Set(["/api/account/export", "/api/account/delete"]);

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Gracefully skip auth middleware if Supabase is not configured yet.
  // Remove this check once you add your .env.local credentials.
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do not run any code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to
  // debug issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  function redirect(path: string, signInDestination?: string) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    if (signInDestination) url.searchParams.set("redirectTo", signInDestination);
    const response = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll()) response.cookies.set(cookie);
    return response;
  }

  // Protected routes — require session.
  // /onboarding was previously unguarded: it rendered fine with no session,
  // then every save silently 401'd part-way through the flow.
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");

  // Auth routes — redirect to dashboard if already logged in
  const isAuthRoute =
    pathname.startsWith("/signin") || pathname.startsWith("/signup");

  if (isProtectedRoute && !user) {
    return redirect("/signin", pathname);
  }

  if (user && !hasConfirmedAdultAge(user)) {
    if (isProtectedRoute) return redirect(AGE_CONFIRMATION_PATH);
    if (pathname.startsWith("/api/") && !accountRightsPaths.has(pathname)) {
      return NextResponse.json({ error: ADULT_ONLY_MESSAGE }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
    }
  }

  if (isAuthRoute && user) {
    return redirect(AUTH_RESUME_PATH);
  }

  return supabaseResponse;
}
