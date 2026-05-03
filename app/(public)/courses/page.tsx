import PublicCoursesClient from "@/components/courses/PublicCoursesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IMPRINT Learning Hub",
  description: "Structured courses built by humans, for humans. No AI tutors. No generated content.",
};

export default function PublicCoursesPage() {
  return <PublicCoursesClient />;
}
