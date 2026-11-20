"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ChevronDown } from "lucide-react";
import Link from "next/link";
import type { AssessmentSummary } from "@/lib/assessment/comparison";
import ProficiencySummary from "@/components/assessment/ProficiencySummary";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PROFESSIONS, CLUSTER_LABELS } from "@/lib/onboarding/modules";
import { formatNumber } from "@/lib/utils/format";

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
  proficiency: AssessmentSummary | null;
  stats: {
    calibrations: number;
    assessments: number;
    streak: number;
    skillsTracked: number;
    vaultChallenges: number;
    journalEntries: number;
    daysActive: number;
    wordsWritten: number;
    forgeWords: number;
    journalWords: number;
    calibrationWords: number;
    consistencyRate: number | null;
    bestDriftScore: number | null;
    bestDriftDate: string | null;
  };
}

const AGE_GROUP_LABELS: Record<string, string> = {
  child_8_12: "Age 8–12",
  teen_13_15: "Age 13–15",
  teen_16_18: "Age 16–18",
  adult_18_64: "Age 18–64",
  adult_19_64: "Age 19–64",
  senior_65_plus: "Age 65+",
};

export default function ProfileClient({
  profile, proficiency, stats
}: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [savedFields, setSavedFields] = useState({
    full_name: profile?.full_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    age_group: profile?.age_group || "",
    profession: profile?.profession || "",
    profession_cluster: profile?.profession_cluster || "",
  });
  const [formData, setFormData] = useState(savedFields);

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

  const handleSave = async () => {
    const changes: Record<string, string | null> = {};
    for (const key of Object.keys(formData) as (keyof typeof formData)[]) {
      const value = formData[key].trim();
      if (value !== savedFields[key].trim()) changes[key] = value || (key === "age_group" || key === "profession" || key === "profession_cluster" ? null : "");
    }
    if (Object.keys(changes).length === 0) { setIsEditing(false); return; }
    const changingProfession = "profession" in changes || "profession_cluster" in changes;
    if (changingProfession && !window.confirm(`Switch to ${formData.profession}? Each profession keeps its own assessment history.`)) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...changes, ...(changingProfession ? { confirmProfessionChange: true } : {}) })
      });
      if (res.ok) {
        const saved = { ...formData };
        for (const key of Object.keys(changes) as (keyof typeof formData)[]) saved[key] = changes[key] ?? "";
        setSavedFields(saved);
        setFormData(saved);
        toast.success("Profile updated.");
        setIsEditing(false);
        if (changingProfession) window.location.reload();
      } else {
        const result = await res.json().catch(() => null);
        toast.error(result?.error ?? "Failed to update profile.");
      }
    } catch {
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
                  <span className="px-3 py-1 rounded-full text-[13px]" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.60)" }}>{profile?.profession_cluster ? (CLUSTER_LABELS[profile.profession_cluster] ?? profile.profession_cluster) : "No Cluster"}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]" style={{ color: "rgba(255,255,255,0.62)" }}>
                  <span>IMPRINT member since {memberSinceDate}</span>
                  <span>·</span>
                  {/* daysActive counts distinct days with activity, not elapsed
                      time. Beside "member since June" the old wording — "days
                      preserving identity" — read as membership length, so an
                      account 74 days old appeared to claim it was 6 days old. */}
                  <span>{stats.daysActive ? `${stats.daysActive} ${stats.daysActive === 1 ? "day" : "days"} in Journal or Forge` : "No Journal or Forge activity yet"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 px-5 py-4 text-center">
              <ProficiencySummary summary={proficiency} />
              <Link href="/dashboard/drift" className="mt-2 inline-block text-sm text-[#ff9c77] underline">View progress</Link>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/profile/credential" className="text-sm text-[#ff9c77] underline">View credential</Link>
              <span className="text-sm text-white/65">{profile?.age_group ? (AGE_GROUP_LABELS[profile.age_group] ?? profile.age_group) : "Age not set"}</span>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/5 flex flex-wrap justify-between gap-4">
            {[
              { val: stats.assessments, label: "Scored assessments" },
              { val: stats.calibrations, label: "Legacy Calibration sessions" },
              { val: `${stats.streak} Day`, label: "Streak" },
              { val: stats.skillsTracked, label: "Skills Tracked" },
              { val: stats.vaultChallenges, label: "Vault Challenges" },
              { val: stats.journalEntries, label: "Journal Entries" }
            ].map((s, i) => (
              <div key={i} className="text-center min-w-[100px]">
                <p className="font-bold text-white mb-1" style={{ fontSize: 20 }}>{s.val}</p>
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.66)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* SECTION 3: STATS OVERVIEW ROW */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-[16px] p-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="block font-bold text-white mb-1" style={{ fontSize: 32, lineHeight: 1 }}>{stats.daysActive}</span>
            <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.66)" }}>Days with Journal or Forge entries</span>
          </div>
          <div className="rounded-[16px] p-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="block font-bold mb-1" style={{ fontSize: 32, lineHeight: 1, color: "#00D97E" }}>{stats.bestDriftScore ?? "—"}</span>
            <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.66)" }}>Lowest legacy Drift Score</span>
            <p className="text-[12px] mt-2" style={{ color: "rgba(255,255,255,0.58)" }}>{stats.bestDriftDate || "N/A"}</p>
          </div>
          <div className="rounded-[16px] p-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="block font-bold text-white mb-1" style={{ fontSize: 32, lineHeight: 1 }}>{formatNumber(stats.wordsWritten)}</span>
            <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.66)" }}>Words in Journal and Forge</span>
          </div>
          <div className="rounded-[16px] p-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="block font-bold mb-1" style={{ fontSize: 32, lineHeight: 1, color: "#FF5500" }}>{stats.consistencyRate === null ? "—" : `${stats.consistencyRate}%`}</span>
            <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.66)" }}>Challenge completion rate</span>
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
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 font-mono">@</span>
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
                        {formData.age_group && !["adult_18_64", "senior_65_plus"].includes(formData.age_group) && (
                          <option value={formData.age_group} disabled>{AGE_GROUP_LABELS[formData.age_group]}</option>
                        )}
                        <option value="adult_18_64">Age 18–64</option>
                        <option value="senior_65_plus">Age 65+</option>
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
                        <option value="" disabled>Select profession</option>
                        {Object.entries(CLUSTER_LABELS).map(([cluster, clusterLabel]) => (
                          <optgroup key={cluster} label={clusterLabel}>
                            {PROFESSIONS.filter(p => p.cluster === cluster).map(p => (
                              <option key={p.name} value={p.name}>{p.name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {formData.profession_cluster && (
                        <p className="text-[12px] mt-2" style={{ color: "rgba(255,255,255,0.62)" }}>
                          Cluster: <span style={{ color: "#FF5500" }}>{CLUSTER_LABELS[formData.profession_cluster] ?? formData.profession_cluster}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleSave} disabled={saving} className="rounded-full px-6 py-2.5 text-[14px] font-medium text-on-accent disabled:opacity-50 transition-all hover:opacity-90" style={{ background: "#FF5500" }}>
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
