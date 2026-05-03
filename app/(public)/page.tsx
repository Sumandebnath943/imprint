import type { Metadata } from "next";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import TwoFrontsSection from "@/components/landing/TwoFrontsSection";
import ForEveryHumanSection from "@/components/landing/ForEveryHumanSection";
import ImprintScoreSection from "@/components/landing/ImprintScoreSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import CoursesSection from "@/components/landing/CoursesSection";
import FinalCTASection from "@/components/landing/FinalCTASection";

export const metadata: Metadata = {
  title: "IMPRINT — Remember Who You Are",
  description:
    "The identity preservation engine for humans in the age of AI. Preserve your skills, voice, and thinking patterns before AI replaces them.",
  keywords: [
    "identity preservation",
    "AI dependency",
    "human skills",
    "echo drift",
    "cognitive identity",
    "IMPRINT",
  ],
  openGraph: {
    title: "IMPRINT — Remember Who You Are",
    description:
      "The identity preservation engine for humans in the age of AI.",
    type: "website",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://imprint.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "IMPRINT — Remember Who You Are",
    description:
      "The identity preservation engine for humans in the age of AI.",
  },
};

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <TwoFrontsSection />
      <ForEveryHumanSection />
      <ImprintScoreSection />
      <SocialProofSection />
      <CoursesSection />
      <FinalCTASection />
    </>
  );
}
