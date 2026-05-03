"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

import { VaultSummaryStats, VaultChallengeBanner } from "@/components/vault/VaultSummaryStats";
import VaultFilterBar from "@/components/vault/VaultFilterBar";
import SkillCard from "@/components/vault/SkillCard";
import SkillDrawer from "@/components/vault/SkillDrawer";
import { AddSkillPanel, VaultHistory } from "@/components/vault/AddSkillPanel";

import type { VaultSkill, VaultChallenge, VaultPageData, FilterType, SortType } from "@/lib/vault/types";
import { calcDecayedStrength, getStrengthLabel, SUGGESTED_SKILLS } from "@/lib/vault/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface VaultClientProps { pageData: VaultPageData; }

export default function VaultClient({ pageData }: VaultClientProps) {
  const router = useRouter();
  const supabase = createClient();

  // ── Skills state (optimistic) ─────────────────────────────────────────
  const [skills, setSkills] = useState<VaultSkill[]>(pageData.skills);
  const [activeChallenge, setActiveChallenge] = useState<VaultChallenge | null>(pageData.activeChallenge);
  const [decayedStrengths, setDecayedStrengths] = useState<Record<string, number>>({});
  const [syncToast, setSyncToast] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<FilterType>("All");
  const [sort, setSort] = useState<SortType>("strength-asc");
  const [search, setSearch] = useState("");
  const [drawerSkill, setDrawerSkill] = useState<VaultSkill | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ── Decay engine on mount ─────────────────────────────────────────────
  useEffect(() => {
    const newStrengths: Record<string, number> = {};
    const updates: { id: string; strength: number }[] = [];

    for (const skill of skills) {
      const decayed = calcDecayedStrength(skill);
      newStrengths[skill.id] = decayed;
      if (Math.abs(decayed - skill.strength_level) > 5) {
        updates.push({ id: skill.id, strength: decayed });
      }
    }
    setDecayedStrengths(newStrengths);

    // Batch Supabase update
    if (updates.length > 0) {
      Promise.all(
        updates.map(({ id, strength }) =>
          supabase.from("skill_vault").update({ strength_level: strength, updated_at: new Date().toISOString() }).eq("id", id)
        )
      ).then(() => {
        setSyncToast(true);
        setTimeout(() => setSyncToast(false), 2500);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filter + sort + search ────────────────────────────────────────────
  const filteredSkills = skills
    .filter((s) => {
      const str = decayedStrengths[s.id] ?? s.strength_level;
      const label = getStrengthLabel(str);
      const matchFilter = filter === "All" || label === filter;
      const matchSearch = !search || s.skill_name.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    })
    .sort((a, b) => {
      const sa = decayedStrengths[a.id] ?? a.strength_level;
      const sb = decayedStrengths[b.id] ?? b.strength_level;
      if (sort === "strength-asc")   return sa - sb;
      if (sort === "strength-desc")  return sb - sa;
      if (sort === "last-practiced") return new Date(a.last_exercised).getTime() - new Date(b.last_exercised).getTime();
      if (sort === "recently-added") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return a.skill_name.localeCompare(b.skill_name);
    });

  // ── Add skill (optimistic) ──────────────────────────────────────────────────
  const handleAddSkill = useCallback(async (name: string, strength: number) => {
    // 1. Get user session first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    // 2. Read profession_cluster from profile if userCluster is undefined
    let cluster = pageData.userCluster;
    if (!cluster) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('profession_cluster')
        .eq('id', user.id)
        .single();
      cluster = profile?.profession_cluster || '';
    }

    const tempId = `temp_${Date.now()}`;
    const now = new Date().toISOString();
    const newSkill: VaultSkill = {
      id: tempId, user_id: user.id, skill_name: name,
      cluster: cluster, strength_level: strength,
      decay_rate: 0.5, last_exercised: now, times_practiced: 0,
      created_at: now, updated_at: now,
    };
    // Optimistic insert
    setSkills((p) => [...p, newSkill]);
    setDecayedStrengths((p) => ({ ...p, [tempId]: strength }));

    try {
      const { data, error } = await supabase.from("skill_vault").insert({
        user_id: user.id, 
        skill_name: name,
        skill_category: cluster,
        cluster: cluster, 
        strength_level: strength || 60,
        decay_rate: 0.5, 
        last_exercised: now,
        times_practiced: 0
      }).select().single();

      if (error) {
        console.error("Add skill error:", error.message, error.details, error.hint);
        toast.error("Failed to add skill: " + error.message);
        return;
      }

      if (data) {
        setSkills((p) => p.map((s) => s.id === tempId ? data as VaultSkill : s));
        setDecayedStrengths((p) => { const n = { ...p }; n[data.id] = strength; delete n[tempId]; return n; });
        toast.success(`${name} added to your Vault.`);
      }
    } catch (err) {
      console.error("Add skill exception:", err);
      // Rollback optimistic update
      setSkills((p) => p.filter((s) => s.id !== tempId));
      setDecayedStrengths((p) => { const n = { ...p }; delete n[tempId]; return n; });
      toast.error("Failed to add skill. Please try again.");
    }
  }, [pageData.userId, pageData.userCluster, supabase]);

  // ── Generate challenge ────────────────────────────────────────────────
  const handleGenerateChallenge = useCallback(async (skill: VaultSkill) => {
    const str = decayedStrengths[skill.id] ?? skill.strength_level;
    const res = await fetch("/api/vault/generate-challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId: skill.id, skillName: skill.skill_name, cluster: skill.cluster, currentStrength: str }),
    });
    if (res.ok) {
      const { challenge } = await res.json();
      setActiveChallenge({ ...challenge, skill_name: skill.skill_name });
      showToast("Challenge assigned. You have 3 days to complete it.");
    }
  }, [decayedStrengths]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const drawerStrength = drawerSkill ? (decayedStrengths[drawerSkill.id] ?? drawerSkill.strength_level) : 0;

  return (
    <div className="relative" style={{ background: "#080808", minHeight: "100%", padding: "40px 48px 80px" }}>
      {/* Ghost VAULT text */}
      <div className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
        style={{ fontSize: 180, fontWeight: 700, color: "#FFFFFF", opacity: 0.03, lineHeight: 1, zIndex: 0 }}>
        VAULT
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-bold text-white mb-1" style={{ fontSize: 32 }}>Skill Vault</h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.40)" }}>Your human skills. Exercised or forgotten.</p>
          </div>
          <button onClick={() => {
              const panelDiv = document.getElementById("add-skill-toggle");
              const panelBtn = panelDiv?.querySelector("button");
              if (panelBtn) {
                panelBtn.click();
                panelDiv?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className="flex items-center gap-2 rounded-full h-10 px-5 text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "#FF5500" }}>
            <PlusCircle size={16} />Add Skill
          </button>
        </div>

        {/* Summary stats */}
        <VaultSummaryStats skills={skills} decayedStrengths={decayedStrengths} />

        {/* Active challenge banner */}
        {activeChallenge && (
          <VaultChallengeBanner
            challenge={activeChallenge}
            onBegin={() => router.push("/dashboard/forge")}
          />
        )}

        {/* Filter bar */}
        {skills.length > 0 && (
          <VaultFilterBar filter={filter} sort={sort} search={search}
            onFilter={setFilter} onSort={setSort} onSearch={setSearch} />
        )}

        {/* Grid */}
        {filteredSkills.length > 0 ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {filteredSkills.map((skill, i) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                decayedStrength={decayedStrengths[skill.id] ?? skill.strength_level}
                hasActiveChallenge={activeChallenge?.skill_id === skill.id}
                onDetails={setDrawerSkill}
                onGenerateChallenge={handleGenerateChallenge}
                index={i}
              />
            ))}
          </div>
        ) : skills.length === 0 ? (
          /* Empty state */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-5">
            <Shield size={64} style={{ color: "rgba(255,255,255,0.10)" }} />
            <h2 className="font-semibold text-white text-center" style={{ fontSize: 24 }}>Your Vault is empty.</h2>
            <p className="text-base text-center max-w-sm" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.7 }}>
              Add the skills you want to protect.<br />The ones AI is quietly replacing.
            </p>
            <button onClick={() => { setSearch(""); setFilter("All"); }}
              className="rounded-full h-11 px-8 text-sm font-medium text-white"
              style={{ background: "#FF5500" }}>
              Add Your First Skill
            </button>
            {/* Inline suggested skills when empty */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mt-2">
              {(SUGGESTED_SKILLS[pageData.userCluster] ?? SUGGESTED_SKILLS.life_personal).slice(0, 6).map((s) => (
                <button key={s} onClick={() => handleAddSkill(s, 60)}
                  className="rounded-full text-xs transition-all hover:opacity-80"
                  style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.60)", padding: "7px 14px" }}>
                  + {s}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="py-16 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
            No skills match your current filters.
          </div>
        )}

        {/* Add skill */}
        <div id="add-skill-toggle">
          <AddSkillPanel userCluster={pageData.userCluster} existingSkills={skills} onAdd={handleAddSkill} />
        </div>

        {/* History */}
        <VaultHistory history={pageData.history} />
      </div>

      {/* Skill drawer */}
      <SkillDrawer
        skill={drawerSkill}
        decayedStrength={drawerStrength}
        onClose={() => setDrawerSkill(null)}
        onGenerateChallenge={handleGenerateChallenge}
      />

      {/* Sync toast */}
      <AnimatePresence>
        {syncToast && (
          <motion.div key="sync" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full px-5 py-2 text-sm z-50"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.60)" }}>
            Vault synced.
          </motion.div>
        )}
        {toastMsg && (
          <motion.div key="toast" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 right-8 rounded-xl px-5 py-3 text-sm z-50 max-w-xs"
            style={{ background: "#111111", border: "1px solid rgba(255,85,0,0.25)", color: "rgba(255,255,255,0.80)" }}>
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
