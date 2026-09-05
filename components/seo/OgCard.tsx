import { SITE_NAME } from "@/lib/site";

/**
 * The shared social card layout.
 *
 * Extracted from app/opengraph-image.tsx so every route can have its own card
 * without three copies of the same eighty lines drifting apart. Each route's
 * `opengraph-image.tsx` supplies only the words.
 *
 * Rendered by Satori, not a browser: flexbox only, every element that holds
 * more than one child needs an explicit `display`, and there is no cascade —
 * hence the inline styles rather than Tailwind.
 *
 * Known limitation: no font is loaded, so Satori falls back to its built-in
 * face, which has a single weight. Every `fontWeight: 700` here is currently
 * inert — the wordmark, the eyebrow and any `bold` segment all render at the
 * same weight. The weights are kept because they express the intended design
 * and start working the moment a real font is passed to ImageResponse; loading
 * Space Grotesk would fix that and put the cards in the brand typeface at the
 * same time.
 */
export default function OgCard({
  eyebrow,
  lines,
  subtitle,
}: {
  /** Small label above the headline. Omit on the site root, where the
   *  wordmark is the label. */
  eyebrow?: string;
  /** Headline. Outer array is rendered lines — split by hand, because Satori
   *  does not hyphenate and a wrapped headline reflows badly. Inner array is
   *  weight segments within a line, so a phrase can be emphasised mid-sentence
   *  the way the root card does with "identity **before AI**". */
  lines: { text: string; bold?: boolean }[][];
  subtitle: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #FF4500 0%, #B81F00 55%, #4A0D00 100%)",
        padding: "0 96px",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* The same oversized wordmark the hero uses as texture. */}
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
        {SITE_NAME}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: eyebrow ? 18 : 34,
        }}
      >
        <span
          style={{ color: "#fff", fontSize: 34, fontWeight: 700, letterSpacing: 1 }}
        >
          {SITE_NAME}
        </span>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#fff" }} />
      </div>

      {eyebrow ? (
        <span
          style={{
            color: "rgba(255,255,255,0.72)",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 22,
          }}
        >
          {eyebrow}
        </span>
      ) : null}

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
        {/* One span per line, with emphasised segments nested inside it rather
            than sitting beside it as flex siblings. Satori trims edge
            whitespace off flex children, so siblings render "identity" and
            "before AI" with no gap between them; inside a single text flow the
            space is just text and survives. */}
        {lines.map((segments, i) => (
          <span key={i}>
            {segments.map((seg) =>
              seg.bold ? (
                <span key={seg.text} style={{ fontWeight: 700 }}>
                  {seg.text}
                </span>
              ) : (
                seg.text
              )
            )}
          </span>
        ))}
      </div>

      <span
        style={{
          marginTop: 36,
          color: "rgba(255,255,255,0.80)",
          fontSize: 26,
          maxWidth: 760,
        }}
      >
        {subtitle}
      </span>
    </div>
  );
}
