"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ChevronDown, Activity, Flame, Shield, Brain } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PROFESSIONS, CLUSTER_LABELS } from "@/lib/onboarding/modules";

interface ProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  profession: string | null;
  profession_cluster: string | null;
  age_group: string | null;
  location: string | null;
  imprint_score: number;
  created_at: string;
}

interface ProfileClientProps {
  profile: ProfileData;
  latestDriftScore: { score: number; status: string; date: string } | null;
  stats: {
    calibrations: number;
    streak: number;
    skillsTracked: number;
    vaultChallenges: number;
    journalEntries: number;
    daysActive: number;
    wordsWritten: number;
    forgeWords: number;
    journalWords: number;
    calibrationWords: number;
    consistencyRate: number;
    bestDriftScore: number | null;
    bestDriftDate: string | null;
  };
  scoreHistory: { score: number }[];
  timeline: any[];
  skills: any[];
  baseline: any;
  beliefs: any[];
}

const getZoneColor = (score: number) => {
  if (score < 40) return "#00D97E";
  if (score < 60) return "#FFB800";
  if (score < 80) return "#FF5500";
  return "#FF2D2D";
};

const getImprintLabel = (score: number) => {
  if (score >= 800) return { label: "Anchored", color: "#00D97E" };
  if (score >= 600) return { label: "Strong", color: "#00D97E" };
  if (score >= 400) return { label: "Solid", color: "#FFB800" };
  if (score >= 200) return { label: "Building", color: "#FF5500" };
  return { label: "Establishing", color: "#FF2D2D" };
};

const AGE_GROUP_LABELS: Record<string, string> = {
  child_8_12: "Age 8–12",
  teen_13_15: "Age 13–15",
  teen_16_18: "Age 16–18",
  adult_19_64: "Age 19–64",
  senior_65_plus: "Age 65+",
};

export default function ProfileClient({
  profile, latestDriftScore, stats, scoreHistory, timeline, skills, baseline, beliefs
}: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    age_group: profile?.age_group || "",
    profession: profile?.profession || "",
    profession_cluster: profile?.profession_cluster || "",
  });

  const handleProfessionChange = (professionName: string) => {
    const found = PROFESSIONS.find(p => p.name === professionName);
    setFormData(prev => ({
      ...prev,
      profession: professionName,
      profession_cluster: found?.cluster || prev.profession_cluster,
    }));
  };
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB."); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${profile.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl + `?v=${Date.now()}`;
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);
      if (dbError) throw dbError;
      setAvatarUrl(publicUrl);
      toast.success("Profile photo updated!");
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Please try again."));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const driftScore = latestDriftScore?.score ?? 0;
  const driftColor = getZoneColor(driftScore);
  const imprintStatus = getImprintLabel(profile?.imprint_score || 0);

  // Derived scores for widget (max 1000 total)
  const vaultStrength = Math.min(250, stats.skillsTracked * 25);
  const calibrationRecord = Math.min(300, stats.calibrations * 50);
  const identityStreak = Math.min(250, stats.streak * 8);
  const aiIndependence = 200; // Mocked for now

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("Profile updated.");
        setIsEditing(false);
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (e) {
      toast.error("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const memberSinceDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Recently";
  const initials = (profile?.full_name || "User").substring(0, 2).toUpperCase();

  return (
    <div className="relative pt-12 pb-32 max-w-[1000px] mx-auto px-6 md:px-0">
      <div className="absolute top-0 right-[-10%] pointer-events-none select-none overflow-hidden" style={{ zIndex: 0 }}>
        <span style={{ fontSize: 160, fontWeight: 700, color: "#fff", opacity: 0.03, lineHeight: 1 }}>IDENTITY</span>
      </div>

      <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }} className="relative z-10 flex flex-col gap-10">
        
        {/* SECTION 1: PROFILE HERO */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-[24px] p-10 md:p-12" style={{ background: "linear-gradient(135deg, #111111 0%, #0D0D0D 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Background decorations */}
          <div className="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "rgba(255,85,0,0.08)", filter: "blur(80px)" }} />
          <div className="absolute bottom-[-10%] right-4 pointer-events-none select-none">
            <span style={{ fontSize: 300, fontWeight: 700, color: "#fff", opacity: 0.04, lineHeight: 0.8 }}>{(profile?.full_name || "U")[0].toUpperCase()}</span>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            {/* LEFT: Avatar & Info */}
            <div className="flex items-center gap-6">
              <div
                className="relative group w-[88px] h-[88px] rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                style={{ background: "rgba(255,85,0,0.20)", border: "3px solid rgba(255,85,0,0.40)", cursor: "pointer" }}
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold" style={{ fontSize: 32, color: "#FF5500" }}>{initials}</span>
                )}
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar
                    ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    : <><Camera size={20} color="white" className="mb-1" /><span className="text-[12px] font-medium text-white">Change</span></>}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <h1 className="font-bold text-white mb-3" style={{ fontSize: 32, lineHeight: 1 }}>{profile?.full_name || "Anonymous User"}</h1>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-[13px] font-medium" style={{ background: "rgba(255,85,0,0.10)", border: "1px solid rgba(255,85,0,0.25)", color: "#FF5500" }}>{profile?.profession || "Undefined"}</span>
                  <span className="px-3 py-1 rounded-full text-[13px]" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.60)" }}>{profile?.profession_cluster || "No Cluster"}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <span>IMPRINT member since {memberSinceDate}</span>
                  <span>·</span>
                  <span>{stats.daysActive} days preserving identity</span>
                </div>
              </div>
            </div>

            {/* CENTER: Drift Ring */}
            <div className="flex flex-col items-center">
              <div className="relative w-[140px] h-[140px] flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="70" cy="70" r="62" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <circle cx="70" cy="70" r="62" fill="transparent" stroke={driftColor} strokeWidth="6" strokeDasharray={`${(driftScore / 100) * 389} 389`} strokeLinecap="round" />
                </svg>
                <div className="text-center">
                  <span className="block font-bold text-white" style={{ fontSize: 40, lineHeight: 1 }}>{driftScore}</span>
                  <span className="block text-[11px] font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)", marginTop: 4 }}>Drift Score</span>
                </div>
              </div>
              <span className="mt-4 px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider" style={{ background: `${driftColor}15`, color: driftColor }}>
                {latestDriftScore?.status || "Unknown"}
              </span>
            </div>

            {/* RIGHT: IMPRINT Score Card */}
            <div className="flex flex-col items-end">
              <div className="rounded-[16px] p-5 w-[220px]" style={{ background: "rgba(255,85,0,0.06)", border: "1px solid rgba(255,85,0,0.20)" }}>
                <span className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#FF5500" }}>IMPRINT SCORE</span>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-bold text-white" style={{ fontSize: 48, lineHeight: 1 }}>{profile?.imprint_score || 0}</span>
                  <span className="text-[18px]" style={{ color: "rgba(255,255,255,0.40)" }}>/1000</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full" style={{ background: imprintStatus.color }} />
                  <span className="text-[14px] font-medium" style={{ color: imprintStatus.color }}>{imprintStatus.label}</span>
                </div>
                <Link href="/dashboard/profile/credential" className="text-[13px] font-medium text-[#FF5500] hover:underline">
                  View Credential →
                </Link>
              </div>
              <span className="mt-3 px-3 py-1 rounded-full text-[13px]" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)" }}>
                {profile?.age_group ? (AGE_GROUP_LABELS[profile.age_group] ?? profile.age_group) : "Age not set"}
              </span>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/5 flex flex-wrap justify-between gap-4">
            {[
              { val: stats.calibrations, label: "Calibrations" },
              { val: `${stats.streak} Day`, label: "Streak" },
              { val: stats.skillsTracked, label: "Skills Tracked" },
              { val: stats.vaultChallenges, label: "Vault Challenges" },
              { val: stats.journalEntries, label: "Journal Entries" }
            ].map((s, i) => (
              <div key={i} className="text-center min-w-[100px]">
                <p className="font-bold text-white mb-1" style={{ fontSize: 20 }}>{s.val}</p>
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.40)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* SECTION 2: IMPRINT SCORE WIDGET */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="rounded-[20px] p-8 md:p-10" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="font-semibold text-white mb-1" style={{ fontSize: 20 }}>Your IMPRINT Score</h2>
              <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.40)" }}>A composite measure of identity preservation.</p>
            </div>
            <Link href="/dashboard/profile/credential" className="px-4 py-2 rounded-full text-[13px] font-medium text-white transition-all hover:bg-white/10" style={{ background: "rgba(255,85,0,0.15)", color: "#FF5500" }}>
              View Full Credential →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
            <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: "Vault Strength", val: vaultStrength, max: 250, icon: <Shield size={16} color="#00D97E"/>, color: "#00D97E" },
                { name: "Calibration Record", val: calibrationRecord, max: 300, icon: <Activity size={16} color="#FF5500"/>, color: "#FF5500" },
                { name: "Identity Streak", val: identityStreak, max: 250, icon: <Flame size={16} color="#FFB800"/>, color: "#FFB800" },
                { name: "AI Independence", val: aiIndependence, max: 200, icon: <Brain size={16} color="#4FC3F7"/>, color: "#4FC3F7" },
              ].map(c => (
                <div key={c.name} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {c.icon}
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>{c.name}</span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(c.val / c.max) * 100}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full" style={{ background: c.color }} />
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-bold text-white text-[20px]">{c.val}</span>
                    <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.30)" }}>/{c.max} max</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="md:col-span-1 pl-6 border-l border-white/5 flex flex-col items-center">
              <div className="h-[50px] w-full mb-2 opacity-50">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreHistory}>
                    <Line type="monotone" dataKey="score" stroke="#FF5500" strokeWidth={2} dot={{ fill: '#FF5500', r: 3 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <span className="text-[12px] font-medium text-white">Trending stable</span>
            </div>
          </div>
        </motion.div>

        {/* SECTION 3: STATS OVERVIEW ROW */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-[16px] p-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="block font-bold text-white mb-1" style={{ fontSize: 32, lineHeight: 1 }}>{stats.daysActive}</span>
            <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.40)" }}>Days active on IMPRINT</span>
          </div>
          <div className="rounded-[16px] p-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="block font-bold mb-1" style={{ fontSize: 32, lineHeight: 1, color: "#00D97E" }}>{stats.bestDriftScore || "--"}</span>
            <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.40)" }}>Best Drift Score (lowest)</span>
            <p className="text-[12px] mt-2" style={{ color: "rgba(255,255,255,0.30)" }}>{stats.bestDriftDate || "N/A"}</p>
          </div>
          <div className="rounded-[16px] p-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="block font-bold text-white mb-1" style={{ fontSize: 32, lineHeight: 1 }}>{stats.wordsWritten.toLocaleString()}</span>
            <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.40)" }}>Words written in IMPRINT</span>
          </div>
          <div className="rounded-[16px] p-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="block font-bold mb-1" style={{ fontSize: 32, lineHeight: 1, color: "#FF5500" }}>{stats.consistencyRate}%</span>
            <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.40)" }}>Challenge completion rate</span>
          </div>
        </motion.div>

        {/* EDIT PROFILE SECTION (Collapsible) */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2 mb-4 group">
            <span className="font-semibold text-white text-[16px]">Edit Profile</span>
            <ChevronDown size={16} className="text-white/50 transition-transform group-hover:text-white" style={{ transform: isEditing ? "rotate(180deg)" : "rotate(0deg)" }} />
          </button>

          <AnimatePresence>
            {isEditing && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="rounded-[16px] p-8" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-[13px] font-medium text-white/60 mb-2">Full Name</label>
                      <input type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="w-full text-[15px] outline-none text-white rounded-[10px]" style={{ background: "#1A1A1A", padding: "12px 16px", border: "1px solid transparent" }} />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-white/60 mb-2">Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-mono">@</span>
                        <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full text-[15px] outline-none text-white rounded-[10px] pl-8 font-mono" style={{ background: "#1A1A1A", padding: "12px 16px", border: "1px solid transparent" }} />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[13px] font-medium text-white/60 mb-2">Bio (optional)</label>
                      <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} maxLength={160} rows={3} placeholder="A few words about you (shown to Circle members)" className="w-full text-[15px] outline-none text-white rounded-[10px] resize-none" style={{ background: "#1A1A1A", padding: "12px 16px", border: "1px solid transparent" }} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[13px] font-medium text-white/60 mb-2">Location (optional)</label>
                      <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="City, Country" className="w-full text-[15px] outline-none text-white rounded-[10px]" style={{ background: "#1A1A1A", padding: "12px 16px", border: "1px solid transparent" }} />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-white/60 mb-2">Age Group</label>
                      <select value={formData.age_group} onChange={e => setFormData({ ...formData, age_group: e.target.value })} className="w-full text-[15px] outline-none text-white rounded-[10px]" style={{ background: "#1A1A1A", padding: "12px 16px", border: "1px solid transparent" }}>
                        <option value="">Select age group</option>
                        {Object.entries(AGE_GROUP_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[13px] font-medium text-white/60 mb-2">Profession</label>
                      <select
                        value={formData.profession}
                        onChange={e => handleProfessionChange(e.target.value)}
                        className="w-full text-[15px] outline-none text-white rounded-[10px]"
                        style={{ background: "#1A1A1A", padding: "12px 16px", border: "1px solid transparent" }}
                      >
                        <option value="">Select profession</option>
                        {Object.entries(CLUSTER_LABELS).map(([cluster, clusterLabel]) => (
                          <optgroup key={cluster} label={clusterLabel}>
                            {PROFESSIONS.filter(p => p.cluster === cluster).map(p => (
                              <option key={p.name} value={p.name}>{p.name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {formData.profession_cluster && (
                        <p className="text-[12px] mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                          Cluster: <span style={{ color: "#FF5500" }}>{CLUSTER_LABELS[formData.profession_cluster] ?? formData.profession_cluster}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleSave} disabled={saving} className="rounded-full px-6 py-2.5 text-[14px] font-medium text-white disabled:opacity-50 transition-all hover:opacity-90" style={{ background: "#FF5500" }}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
