"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import BeliefCard, { type Belief, type ChangeLogEntry, CONFIDENCE_LABEL, CONFIDENCE_COLOR } from "@/components/beliefs/BeliefCard";

const CATEGORIES = ["Work & Career", "Technology", "People & Society", "Creativity", "Health & Life", "Politics", "Philosophy", "Personal Values", "Other"];
const FILTERS = ["All", "Core (8–10)", "Strong (6–7)", "Uncertain (1–5)", "Changed"];

function relTime(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today"; if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`; return `${Math.floor(days / 30)}mo ago`;
}

interface BeliefsClientProps { beliefs: Belief[]; userId: string; }

export default function BeliefsClient({ beliefs: initial, userId }: BeliefsClientProps) {
  const [beliefs, setBeliefs] = useState<Belief[]>(initial);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Form state
  const [statement, setStatement] = useState("");
  const [category, setCategory] = useState("Personal Values");
  const [confidence, setConfidence] = useState(7);
  const [contextNote, setContextNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [localUserId, setLocalUserId] = useState<string | null>(null);

  React.useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setLocalUserId(user?.id ?? null);
    };
    getUser();
  }, []);

  const supabase = createClient();

  // Stats
  const totalChanged = beliefs.filter((b) => b.change_log.length > 0).length;
  const avgConf = beliefs.length > 0
    ? Math.round(beliefs.reduce((s, b) => s + b.confidence_level, 0) / beliefs.length) : 0;
  const thisMonth = beliefs.filter((b) => (Date.now() - new Date(b.first_recorded).getTime()) < 30 * 86400000).length;

  // Filter
  const filteredBeliefs = beliefs.filter((b) => {
    if (filter === "All") return true;
    if (filter === "Core (8–10)") return b.confidence_level >= 8;
    if (filter === "Strong (6–7)") return b.confidence_level >= 6 && b.confidence_level <= 7;
    if (filter === "Uncertain (1–5)") return b.confidence_level <= 5;
    if (filter === "Changed") return b.change_log.length > 0;
    return b.category === filter;
  });

  // All change events (for timeline)
  const allChanges = beliefs.flatMap((b) =>
    b.change_log.map((c) => ({ ...c, belief: b.belief_statement.slice(0, 60) }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddBelief = async () => {
    if (!statement.trim()) return;
    if (!localUserId) {
      toast.error('Please sign in again.');
      return;
    }
    
    setSaving(true);
    const now = new Date().toISOString();
    try {
      const { data, error } = await supabase.from("beliefs").insert({
        user_id: localUserId, 
        belief_statement: statement, 
        category: category || "Other",
        confidence_level: Math.round(confidence), 
        first_recorded: now, 
        last_reviewed: now, 
        change_log: [],
      }).select().single();
      
      if (error) {
        console.error('BELIEF ERROR:', error.message, error.details, error.hint);
        toast.error('Failed to record: ' + error.message);
        return;
      }
      
      if (data) {
        setBeliefs((p) => [data as Belief, ...p]);
        setStatement(""); setCategory("Personal Values"); setConfidence(7); setContextNote("");
        setShowForm(false);
        toast.success("Belief recorded.");
      }
    } catch (err: any) {
      console.error("Belief exception:", err);
      toast.error("Failed to record belief.");
    } finally {
      setSaving(false);
    }
  };

  const handleReview = useCallback(async (updated: Belief) => {
    const prev = beliefs.find((b) => b.id === updated.id);
    if (!prev) return;
    const changed = prev.confidence_level !== updated.confidence_level;
    const newLog: ChangeLogEntry[] = changed ? [
      ...prev.change_log,
      { date: new Date().toISOString(), previous_confidence: prev.confidence_level, new_confidence: updated.confidence_level },
    ] : prev.change_log;

    try {
      const { data, error } = await supabase.from("beliefs").update({
        confidence_level: updated.confidence_level,
        last_reviewed: new Date().toISOString(),
        change_log: newLog,
      }).eq("id", updated.id).eq("user_id", userId).select().single();

      if (error) throw error;
      if (data) setBeliefs((p) => p.map((b) => b.id === updated.id ? data as Belief : b));
    } catch (err) {
      console.error("Review error:", err);
      toast.error("Failed to update belief.");
    }
  }, [beliefs, supabase, userId]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("beliefs").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
      setBeliefs((p) => p.filter((b) => b.id !== id));
      toast.success("Belief deleted.");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete belief.");
    }
  }, [supabase, userId]);

  return (
    <div className="relative" style={{ background: "#080808", minHeight: "100%", padding: "40px 48px 80px" }}>
      {/* Ghost */}
      <div className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
        style={{ fontSize: 160, fontWeight: 700, color: "#fff", opacity: 0.025, lineHeight: 1 }}>BELIEVE</div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-bold text-white mb-1" style={{ fontSize: 32 }}>Beliefs</h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.40)" }}>What you actually think. Recorded. Watched. Owned.</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-full font-medium text-white"
            style={{ height: 42, padding: "0 20px", background: "#FF5500", fontSize: 14 }}>
            <Plus size={15} /> Record a Belief
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { value: String(beliefs.length), label: "Beliefs tracked", sub: `${thisMonth} added this month`, subColor: "#FF5500" },
            { value: String(totalChanged), label: "Beliefs changed", sub: "Confidence shifted since recording", valueColor: "#FFB800" },
            { value: `${avgConf}%`, label: "Average confidence", sub: null, bar: avgConf },
          ].map(({ value, label, sub, subColor, valueColor, bar }) => (
            <div key={label} className="rounded-2xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="font-bold mb-0.5" style={{ fontSize: 36, color: valueColor ?? "white", lineHeight: 1 }}>{value}</p>
              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.40)" }}>{label}</p>
              {sub && <p className="text-xs" style={{ color: subColor ?? "rgba(255,255,255,0.35)" }}>{sub}</p>}
              {bar !== undefined && (
                <div className="h-1 rounded-full mt-2" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full" style={{ width: `${bar}%`, background: "#FF5500" }} />
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Add belief form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6">
              <div className="rounded-2xl p-8" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                <h2 className="font-semibold text-white mb-1" style={{ fontSize: 18 }}>Record a belief</h2>
                <p className="text-sm italic mb-5" style={{ color: "rgba(255,255,255,0.40)" }}>Be precise. Vague beliefs are useless.</p>

                <textarea value={statement} onChange={(e) => setStatement(e.target.value)}
                  placeholder="I believe that…" spellCheck
                  className="w-full rounded-xl outline-none resize-none mb-4"
                  style={{ background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.08)", padding: "20px 24px", minHeight: 100, fontSize: 16, color: "rgba(255,255,255,0.85)", lineHeight: 1.7 }} />

                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.40)" }}>Category</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setCategory(c)}
                      className="rounded-full text-xs px-3 py-1.5 transition-all"
                      style={{ background: category === c ? "#FF5500" : "#1A1A1A", border: category === c ? "1px solid #FF5500" : "1px solid rgba(255,255,255,0.08)", color: category === c ? "white" : "rgba(255,255,255,0.55)" }}>
                      {c}
                    </button>
                  ))}
                </div>

                <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.50)" }}>How confident are you in this belief?</p>
                <div className="text-center mb-1">
                  <span className="font-bold" style={{ fontSize: 32, color: "#FF5500" }}>{confidence}</span>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>/10</span>
                  <span className="ml-3 text-sm" style={{ color: CONFIDENCE_COLOR(confidence) }}>{CONFIDENCE_LABEL(confidence)}</span>
                </div>
                <div className="flex justify-between text-xs mb-1" style={{ color: "rgba(255,255,255,0.30)" }}>
                  <span>Not sure at all</span><span>Completely certain</span>
                </div>
                <input type="range" min={1} max={10} value={confidence} onChange={(e) => setConfidence(Number(e.target.value))}
                  className="w-full mb-5" style={{ accentColor: "#FF5500" }} />

                <textarea value={contextNote} onChange={(e) => setContextNote(e.target.value)}
                  placeholder="What led you to this belief? (optional — for your future self)"
                  className="w-full rounded-xl outline-none resize-none text-sm mb-5"
                  style={{ background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px", minHeight: 72, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }} />

                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowForm(false)}
                    className="rounded-full h-10 px-5 text-sm" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.50)" }}>Cancel</button>
                  <button onClick={handleAddBelief} disabled={saving || !statement.trim()}
                    className="rounded-full h-10 px-6 text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: "#FF5500" }}>
                    {saving ? "Recording…" : "Record This Belief"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter pills */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }}
          className="flex gap-2 flex-wrap mb-6">
          {[...FILTERS, ...CATEGORIES].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="rounded-full text-xs px-3 py-1.5 transition-all"
              style={{ background: filter === f ? "#FF5500" : "#1A1A1A", border: filter === f ? "1px solid #FF5500" : "1px solid rgba(255,255,255,0.08)", color: filter === f ? "white" : "rgba(255,255,255,0.55)" }}>
              {f}
            </button>
          ))}
        </motion.div>

        {/* Beliefs grid */}
        {filteredBeliefs.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="font-medium text-white mb-2" style={{ fontSize: 18 }}>No beliefs recorded yet.</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>Record what you actually think. Precisely.</p>
          </div>
        ) : (
          <div className="grid gap-4 mb-12" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {filteredBeliefs.map((b, i) => (
              <BeliefCard key={b.id} belief={b} index={i} onReview={handleReview} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Change log timeline */}
        {allChanges.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <button onClick={() => setShowHistory((p) => !p)}
              className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold text-white" style={{ fontSize: 20 }}>How your beliefs have changed</h2>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>{allChanges.length} changes</span>
              <motion.div animate={{ rotate: showHistory ? 180 : 0 }}>
                <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.40)" }} />
              </motion.div>
            </button>
            <AnimatePresence>
              {showHistory && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  <div className="flex flex-col gap-4">
                    {allChanges.map((c, i) => {
                      const diff = c.new_confidence - c.previous_confidence;
                      return (
                        <div key={i} className="flex gap-4 items-start">
                          <div className="flex flex-col items-center" style={{ width: 16 }}>
                            <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: diff > 0 ? "#00D97E" : "#FF2D2D" }} />
                            {i < allChanges.length - 1 && <div className="flex-1 w-px mt-1" style={{ background: "rgba(255,255,255,0.08)", minHeight: 24 }} />}
                          </div>
                          <div className="flex-1 pb-4" style={{ borderBottom: i < allChanges.length - 1 ? "none" : undefined }}>
                            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{relTime(c.date)}</p>
                            <p className="text-sm text-white mb-1">{c.belief}…</p>
                            <span className="text-xs" style={{ color: diff > 0 ? "#00D97E" : "#FF2D2D" }}>
                              {diff > 0 ? `↑ +${diff}` : `↓ ${diff}`} confidence ({c.previous_confidence}/10 → {c.new_confidence}/10)
                            </span>
                            {c.note && <p className="text-xs italic mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>{c.note}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
