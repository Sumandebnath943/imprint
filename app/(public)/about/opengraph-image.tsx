import { ImageResponse } from "next/og";
import OgCard from "@/components/seo/OgCard";

export const runtime = "edge";
export const alt = "Why IMPRINT exists — the philosophy behind the engine";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function AboutOpengraphImage() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow="The philosophy"
        lines={[
          [{ text: "We are losing" }],
          [{ text: "ourselves to the" }],
          [{ text: "machines we built.", bold: true }],
        ]}
        subtitle="Not dramatically. Not all at once. Quietly — one delegated thought at a time."
      />
    ),
    size
  );
}
