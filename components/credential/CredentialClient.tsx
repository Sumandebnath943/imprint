"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Link2, Copy, Share2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface CredentialClientProps {
  profile: any;
  driftScore: any;
  stats: any;
}

export default function CredentialClient({ profile, driftScore, stats }: CredentialClientProps) {
  const [isPublic, setIsPublic] = useState(profile.credential_public || false);
  const [downloading, setDownloading] = useState(false);

  const verificationCode = profile.credential_code || `IMPRINT-${profile.id?.substring(0,8).toUpperCase()}-XXXXXX`;
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : "https://imprint.app"}/credential/${verificationCode}`;
  
  const imprintScore = profile.imprint_score || 0;
  const dScore = driftScore?.score || 0;
  
  const dColor = dScore < 40 ? "#00D97E" : dScore < 60 ? "#FFB800" : dScore < 80 ? "#FF5500" : "#FF2D2D";
  const dLabel = dScore < 40 ? "Anchored" : dScore < 60 ? "Stable" : dScore < 80 ? "Drifting" : "Critical";
  const iLabel = imprintScore >= 800 ? "Anchored" : imprintScore >= 600 ? "Strong" : imprintScore >= 400 ? "Solid" : imprintScore >= 200 ? "Building" : "Establishing";
  const iColor = imprintScore >= 800 ? "#00D97E" : imprintScore >= 600 ? "#00D97E" : imprintScore >= 400 ? "#FFB800" : imprintScore >= 200 ? "#FF5500" : "#FF2D2D";

  const handleDownload = async () => {
    const card = document.getElementById("credential-card");
    if (!card) return;
    
    setDownloading(true);
    toast("Generating credential...", { id: "dl" });
    
    try {
      const canvas = await html2canvas(card, {
        scale: 2,
        backgroundColor: "#080808",
        useCORS: true,
        // ignore background styling that messes with html2canvas (like complex SVG filters or backdrop blur if any)
      });
      
      const link = document.createElement("a");
      link.download = `imprint_credential_${profile.username || "user"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Download complete.", { id: "dl" });
    } catch (e) {
      toast.error("Failed to generate image.", { id: "dl" });
    } finally {
      setDownloading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  };

  const togglePublic = async () => {
    const newVal = !isPublic;
    setIsPublic(newVal);
    toast.success(`Credential is now ${newVal ? "public" : "private"}.`);
    // Ideally patch to /api/profile/update here
  };

  return (
    <div className="relative pt-12 pb-32 max-w-[1200px] mx-auto px-6 md:px-0">
      <div className="absolute top-0 right-[-10%] pointer-events-none select-none overflow-hidden" style={{ zIndex: 0 }}>
        <span style={{ fontSize: 160, fontWeight: 700, color: "#fff", opacity: 0.03, lineHeight: 1 }}>PROOF</span>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-12 items-start pt-10">
        
        {/* LEFT: CREDENTIAL CARD */}
        <div className="flex-1 w-full flex flex-col items-center">
          
          <div id="credential-card" className="relative overflow-hidden w-full max-w-[480px] rounded-[24px]" style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #111111 50%, #0A0A0A 100%)", border: "1px solid rgba(255,85,0,0.30)", padding: "40px 44px" }}>
            
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
                <span className="block text-[11px] text-white/20 font-mono mb-1">{verificationCode}</span>
                <span className="block text-[10px] text-white/30">Verification: imprint.app/verify/{verificationCode.split('-')[1]}</span>
              </div>

              <div className="h-[1px] w-full bg-[#FF5500] opacity-50 mb-4" />
              <p className="text-center text-[11px] text-white/30 italic">This credential certifies consistent identity preservation using the IMPRINT engine.</p>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <span className="block text-[12px] text-white/40 mb-1">Last generated: {new Date().toLocaleDateString()}</span>
            <button className="text-[13px] text-[#FF5500] hover:underline">Regenerate data</button>
          </div>

        </div>

        {/* RIGHT: SHARE OPTIONS */}
        <div className="w-full md:w-[360px] shrink-0 flex flex-col gap-8">
          
          {/* DOWNLOAD */}
          <div>
            <h3 className="text-[16px] font-semibold text-white mb-4">Download</h3>
            <button onClick={handleDownload} disabled={downloading} className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-[14px] font-medium text-white mb-2 transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "#FF5500" }}>
              <Download size={16} />
              {downloading ? "Generating PNG..." : "Download as PNG"}
            </button>
            <p className="text-[12px] text-white/40 text-center mb-2">High resolution (2x). Suitable for LinkedIn, portfolio, CV.</p>
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-[14px] font-medium text-white border border-white/20 hover:bg-white/5 transition-all">
              Download as PDF
            </button>
          </div>

          <div className="h-[1px] w-full bg-white/10" />

          {/* SHARE */}
          <div>
            <h3 className="text-[16px] font-semibold text-white mb-4">Public Link</h3>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[14px] font-medium text-white mb-1">Make publicly viewable</p>
                <p className="text-[13px] text-white/40 leading-relaxed max-w-[240px]">Anyone with the link can view your credential. No account required.</p>
              </div>
              <div onClick={togglePublic} className="w-11 h-6 rounded-full relative cursor-pointer mt-1 transition-colors" style={{ background: isPublic ? "#FF5500" : "#1A1A1A", border: isPublic ? "none" : "1px solid rgba(255,255,255,0.2)" }}>
                <div className="absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all" style={{ left: isPublic ? "22px" : "2px" }} />
              </div>
            </div>

            {isPublic ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 overflow-hidden">
                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#1A1A1A] mb-4">
                  <span className="text-[13px] font-mono text-white/60 truncate mr-2">{shareUrl}</span>
                  <button onClick={copyLink} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-[12px] text-white">
                    <Copy size={12} /> Copy
                  </button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button className="flex items-center justify-center gap-2 py-2.5 rounded-[8px] bg-[#0A66C2] hover:bg-[#0854A1] text-white text-[13px] font-medium transition-colors">
                    <Share2 size={16} /> Share on LinkedIn
                  </button>
                  <button className="flex items-center justify-center gap-2 py-2.5 rounded-[8px] bg-white text-black hover:bg-gray-200 text-[13px] font-medium transition-colors">
                    <Share2 size={16} /> Share on X
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="mt-4 p-3 rounded-[10px] bg-white/5 border border-white/10 text-center">
                <span className="text-[13px] text-white/40">Your credential is private.</span>
              </div>
            )}
          </div>

          <div className="h-[1px] w-full bg-white/10" />

          {/* EMBED */}
          <div>
            <h3 className="text-[16px] font-semibold text-white mb-2">Embed</h3>
            <p className="text-[14px] text-white/40 mb-4">Add to your portfolio or README</p>
            <div className="p-4 rounded-[10px] bg-[#0D0D0D] border border-white/5 mb-3 overflow-x-auto">
              <pre className="text-[12px] text-white/50 font-mono leading-relaxed">
{`<a href="${shareUrl}">
  <img src="https://imprint.app/badge.png" 
       alt="IMPRINT Identity Credential" 
       width="480" />
</a>`}
              </pre>
            </div>
            <button className="text-[13px] font-medium text-white px-4 py-2 rounded-full border border-white/20 hover:bg-white/5 transition-colors mb-2">
              Copy Embed Code
            </button>
            <p className="text-[12px] text-white/30 italic">The badge image auto-updates when your scores change. (Feature updating soon)</p>
          </div>

        </div>
      </div>
    </div>
  );
}
