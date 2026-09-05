import type { Metadata } from "next";
import PublicNav from "@/components/layout/PublicNav";
import Footer from "@/components/landing/Footer";
import JsonLd from "@/components/seo/JsonLd";
import { siteGraph } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "IMPRINT — Remember Who You Are",
  description: "The identity preservation engine for humans in the age of AI. Preserve your skills, voice, and thinking patterns before AI replaces them.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col" style={{ background: "#080808", fontFamily: "Space Grotesk, sans-serif" }}>
      {/* Entity graph on the public tree only. The dashboard and onboarding
          routes are disallowed in robots.txt, so structured data there would
          describe pages nothing is allowed to index. */}
      <JsonLd data={siteGraph()} />
      <PublicNav />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
