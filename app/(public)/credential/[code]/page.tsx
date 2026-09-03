import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

// Dynamic share card: a credential link posted to LinkedIn or X should show
// the holder's name and score, not a generic site title.
export async function generateMetadata(
  { params }: { params: { code: string } }
): Promise<Metadata> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("public_profiles")
    .select("full_name, profession, imprint_score")
    .eq("credential_code", params.code)
    .eq("credential_public", true)
    .maybeSingle();

  if (!profile) {
    return {
      title: "Credential not found",
      robots: { index: false, follow: false },
    };
  }

  const name = profile.full_name || "An IMPRINT member";
  const title = `${name} — IMPRINT Identity Credential`;
  const description = `${name}${
    profile.profession ? `, ${profile.profession},` : ""
  } scores ${profile.imprint_score ?? 0}/1000 on IMPRINT — a verified record of identity preservation in the age of AI.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: [`/api/credential/${params.code}/badge.png`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/credential/${params.code}/badge.png`],
    },
  };
}

export default async function PublicCredentialPage({ params }: { params: { code: string } }) {
  const supabase = createClient();

  // Reads the public_profiles view (see migration 006), which exposes only
  // non-sensitive columns for users who opted into a public credential.
  // Querying `profiles` directly here would always fail: this page runs with
  // no session, and profiles is owner-only.
  const { data: profile } = await supabase
    .from("public_profiles")
    .select(
      "id, full_name, profession, profession_cluster, imprint_score, latest_drift_score"
    )
    .eq("credential_code", params.code)
    .eq("credential_public", true)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const { data: statsRows } = await supabase.rpc("credential_stats", {
    uid: profile.id,
  });
  const s = Array.isArray(statsRows) ? statsRows[0] : statsRows;

  const stats = {
    calibrations: s?.calibrations ?? 0,
    streak: s?.day_streak ?? 0,
    skillsTracked: s?.skills_tracked ?? 0,
  };

  const imprintScore = profile.imprint_score || 0;
  const dScore = profile.latest_drift_score ?? 0;

  const dColor = dScore < 40 ? "#00D97E" : dScore < 60 ? "#FFB800" : dScore < 80 ? "#FF5500" : "#FF2D2D";
  // Same four labels and thresholds the dashboard uses. This previously
  // read Anchored/Stable/Drifting/Critical, so a score of 50 was "Stable"
  // on the shareable credential and "Drifting" everywhere else in the app.
  const dLabel = dScore < 40 ? "Anchored" : dScore < 60 ? "Drifting" : dScore < 80 ? "Critical" : "Crisis";
  const iLabel = imprintScore >= 800 ? "Anchored" : imprintScore >= 600 ? "Strong" : imprintScore >= 400 ? "Solid" : imprintScore >= 200 ? "Building" : "Establishing";
  const iColor = imprintScore >= 800 ? "#00D97E" : imprintScore >= 600 ? "#00D97E" : imprintScore >= 400 ? "#FFB800" : imprintScore >= 200 ? "#FF5500" : "#FF2D2D";

  return (
    <div className="relative pt-24 pb-32 max-w-[1200px] mx-auto px-6 flex flex-col items-center">
      <div className="mb-12 text-center">
        <h1 className="text-[24px] font-bold text-white mb-2">Verified by IMPRINT</h1>
        <p className="text-[15px] text-white/50">This credential certifies consistent identity preservation.</p>
      </div>

      <div className="relative overflow-hidden w-full max-w-[480px] rounded-[24px] mb-16" style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #111111 50%, #0A0A0A 100%)", border: "1px solid rgba(255,85,0,0.30)", padding: "40px 44px" }}>
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: "rgba(255,85,0,0.12)", filter: "blur(60px)", transform: "translate(30%, -30%)" }} />
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: "repeating-linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <span className="absolute bottom-[-10%] right-[-5%] font-bold text-white opacity-5 transform -rotate-12 pointer-events-none" style={{ fontSize: 120, lineHeight: 1 }}>IMPRINT</span>

        <div className="relative z-10">
          {/* TOP ROW */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-1.5">
              <span className="text-[18px] font-bold text-white tracking-tight">IMPRINT</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
            </div>
            <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,85,0,0.70)" }}>IDENTITY CREDENTIAL</span>
          </div>

          <div className="h-[1px] w-full mb-5" style={{ background: "rgba(255,85,0,0.20)" }} />

          {/* HOLDER */}
          <div className="mb-8">
            <span className="block text-[11px] uppercase text-white/50 mb-1 tracking-widest">ISSUED TO</span>
            <span className="block text-[28px] font-bold text-white mb-2 leading-none">{profile.full_name || "Anonymous User"}</span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium" style={{ background: "rgba(255,85,0,0.10)", border: "1px solid rgba(255,85,0,0.25)", color: "#FF5500" }}>{profile.profession || "Undefined"}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px]" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.60)" }}>{profile.profession_cluster || "No Cluster"}</span>
            </div>
          </div>

          {/* SCORES */}
          <div className="flex items-center gap-6 mb-8">
            <div className="flex-1">
              <span className="block text-[10px] uppercase text-white/40 mb-1 tracking-widest">IMPRINT SCORE</span>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-bold text-white text-[56px] leading-none">{imprintScore}</span>
                <span className="text-[16px] text-white/40">/1000</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider" style={{ background: `${iColor}15`, color: iColor }}>{iLabel}</span>
            </div>
            <div className="w-[1px] h-20 bg-white/10" />
            <div className="flex-1">
              <span className="block text-[10px] uppercase text-white/40 mb-1 tracking-widest">DRIFT SCORE</span>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-bold text-[56px] leading-none" style={{ color: dColor }}>{dScore}</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider" style={{ background: `${dColor}15`, color: dColor }}>{dLabel}</span>
            </div>
          </div>

          {/* STATS */}
          <div className="flex items-center justify-between mb-8 py-4 border-t border-b border-white/10">
            <div className="text-center">
              <span className="block font-semibold text-white text-[16px] mb-0.5">{stats.calibrations}</span>
              <span className="text-[11px] text-white/40 uppercase">Calibrations</span>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div className="text-center">
              <span className="block font-semibold text-white text-[16px] mb-0.5">{stats.streak}</span>
              <span className="text-[11px] text-white/40 uppercase">Day Streak</span>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div className="text-center">
              <span className="block font-semibold text-white text-[16px] mb-0.5">{stats.skillsTracked}</span>
              <span className="text-[11px] text-white/40 uppercase">Skills Tracked</span>
            </div>
          </div>

          {/* FOOTER VERIFICATION */}
          <div className="text-center mb-6">
            <span className="block text-[12px] text-white/30 mb-2">Verified {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            <span className="block text-[11px] text-white/20 font-mono mb-1">{params.code}</span>
          </div>

          <div className="h-[1px] w-full bg-[#FF5500] opacity-50 mb-4" />
          <p className="text-center text-[11px] text-white/30 italic">This credential certifies consistent identity preservation using the IMPRINT engine.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link href="/signup" className="px-8 py-3 rounded-full text-[14px] font-medium text-white transition-all hover:opacity-90" style={{ background: "#FF5500" }}>
          Create your own IMPRINT credential
        </Link>
        <Link href="/about" className="px-8 py-3 rounded-full text-[14px] font-medium text-white border border-white/20 transition-all hover:bg-white/5">
          What is IMPRINT?
        </Link>
      </div>
    </div>
  );
}
