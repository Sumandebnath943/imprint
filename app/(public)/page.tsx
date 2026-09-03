import type { Metadata } from "next";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import TwoFrontsSection from "@/components/landing/TwoFrontsSection";
import ForEveryHumanSection from "@/components/landing/ForEveryHumanSection";
import ImprintScoreSection from "@/components/landing/ImprintScoreSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import CoursesSection from "@/components/landing/CoursesSection";
import FinalCTASection from "@/components/landing/FinalCTASection";

// Title/OG/twitter defaults come from the root layout. `absolute` opts out of
// the "%s — IMPRINT" template so the landing page is not titled
// "IMPRINT — Remember Who You Are — IMPRINT".
export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} — ${SITE_TAGLINE}`,
  },
  alternates: {
    canonical: "/",
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
