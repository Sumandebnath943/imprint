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
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
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
