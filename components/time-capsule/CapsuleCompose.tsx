"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import type { TimeCapsule } from "@/components/time-capsule/CapsuleList";
import { fmtDate } from "@/components/time-capsule/CapsuleList";

type DatePreset = "1m" | "3m" | "6m" | "1y" | "2y" | "custom";

function addDays(base: Date, days: number) { const d = new Date(base); d.setDate(d.getDate() + days); return d; }
function addMonths(base: Date, months: number) { const d = new Date(base); d.setMonth(d.getMonth() + months); return d; }
function addYears(base: Date, years: number) { const d = new Date(base); d.setFullYear(d.getFullYear() + years); return d; }

function presetDate(p: DatePreset): Date {
  const now = new Date();
  if (p === "1m") return addMonths(now, 1);
  if (p === "3m") return addMonths(now, 3);
  if (p === "6m") return addMonths(now, 6);
  if (p === "1y") return addYears(now, 1);
  if (p === "2y") return addYears(now, 2);
  return addDays(now, 1);
}

function countWords(s: string) { return s.trim() ? s.trim().split(/\s+/).length : 0; }
function readMins(wc: number) { return Math.max(1, Math.round(wc / 200)); }

interface ComposeProps {
  userId: string;
  userName: string;
  currentDriftScore?: number | null;
  onSaved: (capsule: TimeCapsule) => void;
  onCancel: () => void;
}

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "1m", label: "1 Month" }, { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" }, { value: "1y", label: "1 Year" },
  { value: "2y", label: "2 Years" }, { value: "custom", label: "Custom" },
];

export default function CapsuleCompose({ userId, userName, currentDriftScore, onSaved, onCancel }: ComposeProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [preset, setPreset] = useState<DatePreset>("6m");
  const [customDate, setCustomDate] = useState("");
  const [attachDrift, setAttachDrift] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [sealing, setSealing] = useState(false);
  const [showSealModal, setShowSealModal] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [localUserId, setLocalUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setLocalUserId(user?.id ?? null);
    };
    getUser();
  }, []);

  const unlockDate = preset === "custom" && customDate
    ? new Date(customDate)
    : presetDate(preset);

  const daysFromNow = Math.ceil((unlockDate.getTime() - Date.now()) / 86400000);
  const wc = countWords(content);

  // Debounced auto-save indicator
  useEffect(() => {
    if (!content && !title) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveState("saved"), 2000);
  }, [content, title]);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const unlockYear = unlockDate.getFullYear();

  const handleSeal = async () => {
    if (!localUserId) {
      toast.error('Please sign in again.');
      return;
    }

    setSealing(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase.from("time_capsules").insert({
        user_id: localUserId,
        title: title || "Untitled Capsule",
        content,
        unlock_date: unlockDate.toISOString().split('T')[0],
        is_unlocked: false,
      }).select().single();

      if (error) {
        console.error("CAPSULE ERROR:", error.message, error.details, error.hint);
        toast.error("Failed to seal: " + error.message);
        setShowSealModal(false);
        return;
      }
      
      if (data) onSaved(data as TimeCapsule);
    } catch (err: any) {
      console.error("Capsule exception:", err);
      toast.error("Failed to seal capsule. Please try again.");
      setShowSealModal(false);
    } finally {
      setSealing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative" style={{ background: "#0A0A0A" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-10"
        style={{ height: 56, background: "rgba(10,10,10,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="What is this capsule about?"
          className="bg-transparent outline-none font-semibold text-white w-full mr-8"
          style={{ fontSize: 18, border: "none" }} />
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs" style={{ color: saveState === "saved" ? "#00D97E" : "rgba(255,255,255,0.30)" }}>
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : ""}
          </span>
          <button onClick={onCancel} className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>Cancel</button>
          <button onClick={() => setShowSealModal(true)}
            className="rounded-full h-8 px-4 text-xs font-medium text-white"
            style={{ background: "#FF5500" }}>
            Seal Capsule →
          </button>
        </div>
      </div>

      {/* Unlock date selector */}
      <div className="px-10 pt-6" style={{ flexShrink: 0 }}>
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.50)" }}>Open this capsule on:</p>
        <div className="flex gap-2 flex-wrap mb-3">
          {PRESETS.map(({ value, label }) => (
            <button key={value} onClick={() => setPreset(value)}
              className="rounded-full text-xs px-3 py-1.5 transition-all"
              style={{
                background: preset === value ? "#FF5500" : "#1A1A1A",
                border: preset === value ? "1px solid #FF5500" : "1px solid rgba(255,255,255,0.08)",
                color: preset === value ? "white" : "rgba(255,255,255,0.55)",
              }}>{label}</button>
          ))}
        </div>
        {preset === "custom" && (
          <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)}
            min={addDays(new Date(), 1).toISOString().split("T")[0]}
            className="rounded-xl px-4 py-2 text-sm outline-none mb-3"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.10)", color: "white" }} />
        )}
        <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.40)" }}>
          This capsule will unlock on {fmtDate(unlockDate.toISOString())} — {daysFromNow} days from today.
        </p>
      </div>

      {/* Drift snapshot toggle */}
      {currentDriftScore !== null && currentDriftScore !== undefined && (
        <div className="flex items-center gap-3 px-10 py-4" style={{ flexShrink: 0 }}>
          <button onClick={() => setAttachDrift((p) => !p)}
            className="w-10 h-5 rounded-full transition-all relative"
            style={{ background: attachDrift ? "#FF5500" : "#1A1A1A", border: "1px solid rgba(255,255,255,0.10)" }}>
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: attachDrift ? "calc(100% - 18px)" : 2 }} />
          </button>
          <div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>Attach my current Drift Score to this capsule</p>
            {attachDrift && (
              <p className="text-xs italic mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Your Drift Score of {currentDriftScore} will be sealed into this capsule. When it unlocks, you&apos;ll see who you were.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Compose area */}
      <div className="flex-1 overflow-y-auto px-10 pb-32">
        <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.25)" }}>Written {today}</p>
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder={`Dear ${userName} of ${unlockYear},\n\nWrite whatever you need to say to yourself.\nWho you are right now. What you're working on.\nWhat you're afraid of. What you hope for.\n\nThis letter will be sealed until ${fmtDate(unlockDate.toISOString())}.\nWrite honestly. No one will read this before then.`}
          spellCheck className="w-full bg-transparent border-none outline-none resize-none"
          style={{ minHeight: 400, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 17, lineHeight: 1.9, color: "rgba(255,255,255,0.82)", caretColor: "rgba(255,85,0,0.70)" }} />
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between px-10 py-3" style={{ flexShrink: 0, background: "rgba(10,10,10,0.95)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.30)" }}>
          {wc} words · {readMins(wc)} min read
        </span>
        <button onClick={() => setShowSealModal(true)}
          className="rounded-full font-semibold text-white"
          style={{ height: 52, padding: "0 32px", background: "#FF5500", fontSize: 15 }}>
          Seal Capsule →
        </button>
      </div>

      {/* Seal confirmation modal */}
      <AnimatePresence>
        {showSealModal && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.75)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowSealModal(false)}>
            <motion.div className="rounded-3xl p-8 text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", width: 400 }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.93 }} animate={{ scale: 1 }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(255,85,0,0.12)", border: "1px solid rgba(255,85,0,0.30)" }}>
                <Lock size={22} style={{ color: "#FF5500" }} />
              </div>
              <h3 className="font-semibold text-white mb-3" style={{ fontSize: 20 }}>Seal this capsule?</h3>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.50)", lineHeight: 1.7 }}>
                This letter will be locked until {fmtDate(unlockDate.toISOString())}. You cannot edit or read it until then.
              </p>
              <p className="font-bold mb-6" style={{ fontSize: 24, color: "#FF5500" }}>{fmtDate(unlockDate.toISOString())}</p>
              <button onClick={handleSeal} disabled={sealing}
                className="w-full rounded-full h-12 font-semibold text-white mb-3 disabled:opacity-60"
                style={{ background: "#FF5500" }}>{sealing ? "Sealing…" : "Seal It"}</button>
              <button onClick={() => setShowSealModal(false)}
                className="w-full rounded-full h-12 text-sm transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.55)" }}>Keep Writing</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
