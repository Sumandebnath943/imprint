import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { SITE_URL, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/site";
import { PERSON_NAME, PERSON_URL, ORG_NAME } from "@/lib/seo/entity";
import Beacon from "@/components/beacon/Beacon";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  // metadataBase makes every relative OG/twitter image URL resolve to an
  // absolute one. Without it, social cards render blank.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // Google has ignored meta keywords since 2009, so this ranks nothing. It is
  // kept as a compact statement of what the site is about — the terms are the
  // ones the content is actually built around, not a wishlist.
  keywords: [
    "cognitive offloading",
    "cognitive debt",
    "AI dependence",
    "skill atrophy",
    "echo drift",
    "drift score",
    "cognitive baseline",
    "identity preservation engine",
  ],
  // The product is not its own author. Naming the person and the publisher
  // here is the metadata half of the entity claim the JSON-LD graph makes in
  // full — see lib/seo/entity.ts for why reciprocity is the point.
  authors: [{ name: PERSON_NAME, url: PERSON_URL }],
  creator: PERSON_NAME,
  publisher: ORG_NAME,
  // Structural fields only — deliberately no title or description here.
  //
  // Next inherits a parent's `openGraph` object wholesale into any child that
  // does not declare its own, so a title set here is not a default: it is the
  // share title for every page on the site. Every one of them announced
  // "IMPRINT — Remember Who You Are" on social and in link previews, including
  // /methodology and /faq, which have perfectly good titles of their own.
  //
  // With the title absent, Next fills og:title and twitter:title from each
  // page's own `title`, which is what a share card should say. The same applies
  // to description. Anything added back here silently overrides all 40 pages.
  openGraph: {
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
  // Read from the environment so the tokens can be set per-deployment without
  // a commit. Next omits each tag entirely when its variable is unset, so an
  // unconfigured environment emits nothing rather than an empty meta tag.
  // These are public identifiers, not secrets — the env var is for
  // convenience, not confidentiality.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body
        className={`${spaceGrotesk.className} bg-imprint-black text-imprint-white antialiased`}
      >
        {children}
        <Beacon />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1A1A1A",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#FFFFFF",
              fontFamily: "var(--font-space-grotesk)",
            },
          }}
        />
      </body>
    </html>
  );
}
