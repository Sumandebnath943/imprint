import type { Metadata } from "next";

/**
 * Metadata for the sign-up page.
 *
 * It lives in a layout because the page itself is a client component, and
 * `export const metadata` is not available in one. Without this the route
 * inherited the root title and description and had no canonical at all — which
 * matters here more than on the other auth screens, since /signup is the only
 * one listed in the sitemap and the destination of every call to action on the
 * site.
 */
export const metadata: Metadata = {
  title: "Create your IMPRINT account",
  description:
    "Capture your cognitive baseline in about 25 minutes and get your first Drift Score. Free while pre-launch, no payment details required.",
  alternates: { canonical: "/signup" },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
