import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const runtime = "edge";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social share card for the site root. Generated at request time so it stays
 * in sync with the brand without checking a binary into the repo.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FF4500 0%, #B81F00 55%, #4A0D00 100%)",
          padding: "0 96px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: -110,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            color: "rgba(255,255,255,0.10)",
            fontSize: 300,
            fontWeight: 700,
            letterSpacing: -12,
          }}
        >
          IMPRINT
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 34 }}>
          <span style={{ color: "#fff", fontSize: 34, fontWeight: 700, letterSpacing: 1 }}>
            {SITE_NAME}
          </span>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#fff" }} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: "#fff",
            fontSize: 82,
            fontWeight: 300,
            lineHeight: 1.04,
            letterSpacing: -2,
          }}
        >
          <span>Preserve your human</span>
          <span>
            identity <span style={{ fontWeight: 700 }}>before AI</span>
          </span>
          <span style={{ fontWeight: 700 }}>replaces it.</span>
        </div>

        <span
          style={{
            marginTop: 36,
            color: "rgba(255,255,255,0.80)",
            fontSize: 26,
            maxWidth: 760,
          }}
        >
          Map your cognitive baseline. Measure your drift. Keep what makes you you.
        </span>
      </div>
    ),
    size
  );
}
