import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ORANGE = "#FF5500";

function scoreLabel(score: number) {
  if (score >= 800) return "Anchored";
  if (score >= 600) return "Strong";
  if (score >= 400) return "Solid";
  if (score >= 200) return "Building";
  return "Establishing";
}

function driftColor(score: number) {
  if (score < 40) return "#00D97E";
  if (score < 60) return "#FFB800";
  if (score < 80) return ORANGE;
  return "#FF2D2D";
}

/**
 * Renders the embeddable credential badge as a PNG.
 *
 * Referenced by the embed snippet on the credential page, so the image a user
 * pastes into a README or portfolio reflects their current scores on every
 * request rather than being a static file.
 *
 * Only serves badges for profiles that opted into a public credential — it
 * reads public_profiles (migration 006), which enforces that.
 */
export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("public_profiles")
    .select("full_name, profession, imprint_score, latest_drift_score")
    .eq("credential_code", params.code)
    .eq("credential_public", true)
    .maybeSingle();

  if (!profile) {
    return new Response("Credential not found", { status: 404 });
  }

  const imprint = profile.imprint_score ?? 0;
  const drift = profile.latest_drift_score ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0D0D0D 0%, #141414 55%, #0A0A0A 100%)",
          border: `2px solid rgba(255,85,0,0.35)`,
          borderRadius: 20,
          padding: "34px 40px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#fff", fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
              IMPRINT
            </span>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: ORANGE }} />
          </div>
          <span style={{ color: "rgba(255,85,0,0.75)", fontSize: 15, letterSpacing: 2, fontWeight: 600 }}>
            IDENTITY CREDENTIAL
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, letterSpacing: 2 }}>
            ISSUED TO
          </span>
          <span style={{ color: "#fff", fontSize: 42, fontWeight: 700, marginTop: 4 }}>
            {profile.full_name || "Anonymous"}
          </span>
          {profile.profession ? (
            <span style={{ color: ORANGE, fontSize: 18, marginTop: 6 }}>{profile.profession}</span>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 44 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "rgba(255,255,255,0.66)", fontSize: 14, letterSpacing: 2 }}>
              IMPRINT SCORE
            </span>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
              <span style={{ color: "#fff", fontSize: 60, fontWeight: 700, lineHeight: 1 }}>
                {imprint}
              </span>
              <span style={{ color: "rgba(255,255,255,0.62)", fontSize: 20 }}>/1000</span>
            </div>
            <span style={{ color: ORANGE, fontSize: 16, fontWeight: 700, marginTop: 4 }}>
              {scoreLabel(imprint)}
            </span>
          </div>

          <div style={{ width: 1, height: 74, background: "rgba(255,255,255,0.12)" }} />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "rgba(255,255,255,0.66)", fontSize: 14, letterSpacing: 2 }}>
              DRIFT
            </span>
            <span
              style={{
                color: driftColor(drift),
                fontSize: 60,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {drift}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 960,
      height: 400,
      headers: {
        // Short public cache: the badge should track score changes without
        // hammering the database on every README render.
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
      },
    }
  );
}
