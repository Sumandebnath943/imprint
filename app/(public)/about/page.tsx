import AboutClient from "@/components/about/AboutClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why IMPRINT Exists",
  description: "The philosophy behind IMPRINT. Why we need an identity preservation engine in the age of AI.",
};

export default function AboutPage() {
  return <AboutClient />;
}
