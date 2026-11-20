export const AUTH_RESUME_PATH = "/auth/resume";

export function redirectAfterAuth(path: string) {
  return new Response(null, { status: 303, headers: { Location: path, "Cache-Control": "private, no-store" } });
}
