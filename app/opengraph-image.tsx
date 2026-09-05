import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import OgCard from "@/components/seo/OgCard";

export const runtime = "edge";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social share card for the site root, and the fallback for any route without
 * one of its own. Generated at request time so it stays in sync with the brand
 * without checking a binary into the repo.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <OgCard
        // Line 2 is one segment, not "identity " + bold "before AI".
        //
        // Satori lays every child out as a flex item and trims edge whitespace
        // off each one, so a split line renders as "identitybefore AI" with no
        // space. That split existed to emphasise "before AI" — but no bold face
        // is loaded (see OgCard), so it emphasised nothing while costing a
        // visible bug. Restore the split when a real font ships.
        lines={[
          [{ text: "Preserve your human" }],
          [{ text: "identity before AI" }],
          [{ text: "replaces it." }],
        ]}
        subtitle="Map your cognitive baseline. Measure your drift. Keep what makes you you."
      />
    ),
    size
  );
}
