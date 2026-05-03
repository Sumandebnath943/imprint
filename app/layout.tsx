import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IMPRINT — Remember Who You Are",
  description:
    "The identity preservation engine for humans in the age of AI.",
  keywords: [
    "identity",
    "AI dependency",
    "human skills",
    "imprint",
    "self-awareness",
  ],
  openGraph: {
    title: "IMPRINT — Remember Who You Are",
    description:
      "The identity preservation engine for humans in the age of AI.",
    type: "website",
  },
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
