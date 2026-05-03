"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen } from "lucide-react";

import JournalLeftPanel from "@/components/journal/JournalLeftPanel";
import JournalEditor from "@/components/journal/JournalEditor";
import JournalViewer, { PrivacyNotice } from "@/components/journal/JournalViewer";

import type { JournalEntry, JournalPageData } from "@/lib/journal/types";
import { getStreakMilestone, calcStreak } from "@/lib/journal/types";
import { createClient } from "@/lib/supabase/client";

type RightPanelState = "empty" | "editor" | "viewer";
const PRIVACY_KEY = "imprint_journal_privacy_seen";
const DRAFT_KEY = (uid: string) => `imprint_journal_draft_${uid}`;

interface JournalClientProps { pageData: JournalPageData; }

export default function JournalClient({ pageData }: JournalClientProps) {
  const supabase = createClient();

  const [entries, setEntries] = useState<JournalEntry[]>(pageData.entries);
  const [rightState, setRightState] = useState<RightPanelState>("empty");
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [privacySeen, setPrivacySeen] = useState(true); // default true; check on mount
  const [toast, setToast] = useState<string | null>(null);

  // Check privacy notice
  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem(PRIVACY_KEY);
      if (!seen) setPrivacySeen(false);
    }
  }, []);

  // Streak milestone check
  useEffect(() => {
    const streak = calcStreak(entries);
    const milestone = getStreakMilestone(streak);
    if (milestone) showToast(milestone);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts (global)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") { e.preventDefault(); handleNew(); }
      if (e.key === "Escape" && focusMode) setFocusMode(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMode]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  // ── New entry ───────────────────────────────────────────────────────
  const handleNew = useCallback(() => {
    setActiveEntry(null);
    setIsEditing(true);
    setRightState("editor");
  }, []);

  // ── Select entry ────────────────────────────────────────────────────
  const handleSelect = useCallback((entry: JournalEntry) => {
    setActiveEntry(entry);
    setIsEditing(false);
    setRightState("viewer");
  }, []);

  // ── Enter edit mode ─────────────────────────────────────────────────
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setRightState("editor");
  }, []);

  // ── Save (upsert) ───────────────────────────────────────────────────
  const handleSave = useCallback(async (data: Partial<JournalEntry> & { content: string }): Promise<JournalEntry> => {
    const isNew = !data.id;

    try {
      if (isNew) {
        const { data: saved, error } = await supabase.from("journal_entries").insert({
          user_id: pageData.userId,
          title: data.title ?? "Untitled Entry",
          content: data.content,
          word_count: data.word_count ?? 0,
          mood: data.mood ?? null,
          tags: data.tags ?? [],
          is_forge_entry: false,
          was_timed: false,
          has_ai_assistance: false,
          drift_signals: data.drift_signals ?? null,
        }).select().single();

        if (error) throw error;
        const entry = saved as JournalEntry;
        setEntries((p) => [entry, ...p]);
        setActiveEntry(entry);
        localStorage.removeItem(DRAFT_KEY(pageData.userId));
        showToast("Entry saved.");
        return entry;
      } else {
        const { data: updated, error } = await supabase.from("journal_entries").update({
          title: data.title,
          content: data.content,
          word_count: data.word_count ?? 0,
          mood: data.mood ?? null,
          tags: data.tags ?? [],
          drift_signals: data.drift_signals ?? null,
          updated_at: new Date().toISOString(),
        }).eq("id", data.id!).eq("user_id", pageData.userId).select().single();

        if (error) throw error;
        const entry = updated as JournalEntry;
        setEntries((p) => p.map((e) => e.id === entry.id ? entry : e));
        setActiveEntry(entry);
        return entry;
      }
    } catch (err) {
      console.error("Journal save error:", err);
      showToast("Failed to save entry. Please try again.");
      throw err;
    }
  }, [pageData.userId, supabase]);

  // ── Delete ──────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id).eq("user_id", pageData.userId);
      if (error) throw error;
      setEntries((p) => p.filter((e) => e.id !== id));
      setActiveEntry(null);
      setRightState("empty");
      showToast("Entry deleted.");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete entry.");
    }
  }, [pageData.userId, supabase]);

  const dismissPrivacy = () => {
    localStorage.setItem(PRIVACY_KEY, "true");
    setPrivacySeen(true);
  };

  return (
    <div className="absolute flex overflow-hidden" style={{ top: 64, left: 0, right: 0, bottom: 0, background: "#080808", zIndex: 10 }}>

      {/* LEFT PANEL — hidden in focus mode */}
      <AnimatePresence>
        {!focusMode && (
          <motion.div key="left" initial={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} style={{ overflow: "hidden", flexShrink: 0, height: "100%" }}>
            <JournalLeftPanel
              entries={entries}
              activeId={activeEntry?.id ?? null}
              onSelect={handleSelect}
              onNew={handleNew}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* RIGHT PANEL */}
      <div className="flex-1 relative overflow-hidden flex flex-col h-full">
        <AnimatePresence mode="wait">
          {rightState === "empty" && (
            <motion.div key="empty" className="flex-1 flex flex-col items-center justify-center h-full relative"
              style={{ background: "#0A0A0A" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Ghost */}
              <div className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
                style={{ fontSize: 180, fontWeight: 700, color: "#FFFFFF", opacity: 0.03, lineHeight: 1, zIndex: 0 }}>
                JOURNAL
              </div>

              <div className="relative z-10 text-center flex flex-col items-center gap-4">
                <BookOpen size={48} style={{ color: "rgba(255,255,255,0.08)" }} />
                <h2 className="font-medium" style={{ fontSize: 20, color: "rgba(255,255,255,0.45)" }}>
                  {entries.length === 0 ? "Your journal is empty." : "Select an entry or start a new one."}
                </h2>
                <p className="text-sm max-w-xs text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.30)", lineHeight: 1.7 }}>
                  No AI reads this. No AI helps write this.<br />Just you and your thoughts.
                </p>
                {entries.length === 0 && (
                  <button onClick={handleNew}
                    className="mt-2 rounded-full h-11 px-8 text-sm font-medium text-white"
                    style={{ background: "#FF5500" }}>
                    Write Your First Entry
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {rightState === "editor" && (
            <motion.div key="editor" className="flex-1 flex flex-col w-full h-full relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <JournalEditor
                entry={activeEntry}
                baseline={pageData.baseline}
                userId={pageData.userId}
                onSave={handleSave}
                onDelete={activeEntry ? handleDelete : undefined}
                focusMode={focusMode}
                onToggleFocusMode={() => setFocusMode((p) => !p)}
              />
            </motion.div>
          )}

          {rightState === "viewer" && activeEntry && (
            <motion.div key="viewer" className="flex-1 flex flex-col w-full h-full relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <JournalViewer
                entry={activeEntry}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Privacy notice */}
        <AnimatePresence>
          {!privacySeen && (
            <PrivacyNotice onDismiss={dismissPrivacy} />
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div key="toast" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-3 rounded-xl px-5 py-3"
            style={{ background: "#111111", border: "1px solid rgba(255,85,0,0.30)", maxWidth: 320 }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#FF5500" }} />
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
