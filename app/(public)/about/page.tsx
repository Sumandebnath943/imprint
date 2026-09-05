import AboutClient from "@/components/about/AboutClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why IMPRINT Exists",
  description: "The philosophy behind IMPRINT. Why we need an identity preservation engine in the age of AI.",
  // Self-referencing canonical. The ?notrack=1 opt-out can be appended to any
  // URL on the site, so without this every page has a duplicate variant.
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutClient />;
}
