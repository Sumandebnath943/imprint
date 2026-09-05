import PublicCoursesClient from "@/components/courses/PublicCoursesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IMPRINT Learning Hub",
  description: "Structured courses built by humans, for humans. No AI tutors. No generated content.",
  alternates: { canonical: "/courses" },
  // No Course schema until courses exist. Marking up a waitlist as a course
  // catalogue would describe content the page does not have.
};

export default function PublicCoursesPage() {
  return <PublicCoursesClient />;
}
