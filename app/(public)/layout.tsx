import type { Metadata } from "next";
import PublicNav from "@/components/layout/PublicNav";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "IMPRINT — Remember Who You Are",
  description: "The identity preservation engine for humans in the age of AI. Preserve your skills, voice, and thinking patterns before AI replaces them.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col" style={{ background: "#080808", fontFamily: "Space Grotesk, sans-serif" }}>
      <PublicNav />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
