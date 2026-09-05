import { ImageResponse } from "next/og";
import OgCard from "@/components/seo/OgCard";

export const runtime = "edge";
export const alt = "The IMPRINT Learning Hub — courses built by humans, for humans";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function CoursesOpengraphImage() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow="Learning Hub"
        lines={[
          [{ text: "Built by humans," }],
          [{ text: "for humans.", bold: true }],
        ]}
        subtitle="No AI tutors. No generated content. Courses in the skills worth keeping."
      />
    ),
    size
  );
}
