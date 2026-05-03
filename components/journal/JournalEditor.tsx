"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, MoreHorizontal, Check, Tag, X, Download, Copy, Trash2 } from "lucide-react";
import type { JournalEntry, Mood, BaselineAverages } from "@/lib/journal/types";
import {
  MOOD_COLORS, MOODS, countWords, readingMinutes,
  analyzeDrift, exportAsText, exportAsMarkdown, SUGGESTED_TAGS,
} from "@/lib/journal/types";

interface JournalEditorProps {
  entry: JournalEntry | null;  // null = new entry
  baseline: BaselineAverages;
  userId: string;
  onSave: (data: Partial<JournalEntry> & { content: string }) => Promise<JournalEntry>;
  onDelete?: (id: string) => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
}

const DEBOUNCE_MS = 3000;

export default function JournalEditor({
  entry, baseline, userId, onSave, onDelete, focusMode, onToggleFocusMode,
}: JournalEditorProps) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [mood, setMood] = useState<Mood | null>((entry?.mood as Mood) ?? null);
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showMoodMenu, setShowMoodMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(entry?.id ?? null);
  const [startTime] = useState(Date.now());

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  const wordCount = countWords(content);
  const moodColor = mood ? MOOD_COLORS[mood] : null;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // Focus textarea on mount
  useEffect(() => { setTimeout(() => textareaRef.current?.focus(), 100); }, []);

  // Sync entry data when switching entries
  useEffect(() => {
    setTitle(entry?.title ?? "");
    setContent(entry?.content ?? "");
    setMood((entry?.mood as Mood) ?? null);
    setTags(entry?.tags ?? []);
    setSavedEntryId(entry?.id ?? null);
    setSaveStatus("idle");
  }, [entry?.id]);

  // Debounced auto-save
  const triggerAutoSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const text = contentRef.current;
      if (!text.trim()) return;
      setSaveStatus("saving");
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const drift = analyzeDrift(text, elapsed, baseline);
      const saved = await onSave({
        id: savedEntryId ?? undefined,
        title: title || "Untitled Entry",
        content: text,
        mood,
        tags,
        word_count: countWords(text),
        drift_signals: drift,
        is_forge_entry: false,
        was_timed: false,
        has_ai_assistance: false,
      });
      setSavedEntryId(saved.id);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, DEBOUNCE_MS);
  }, [title, mood, tags, savedEntryId, baseline, onSave, startTime]);

  const handleContentChange = (val: string) => {
    setContent(val);
    triggerAutoSave();
  };

  const handleManualSave = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!content.trim()) return;
    setSaveStatus("saving");
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const drift = analyzeDrift(content, elapsed, baseline);
    const saved = await onSave({
      id: savedEntryId ?? undefined,
      title: title || "Untitled Entry",
      content,
      mood,
      tags,
      word_count: wordCount,
      drift_signals: drift,
      is_forge_entry: false,
      was_timed: false,
      has_ai_assistance: false,
    });
    setSavedEntryId(saved.id);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }, [content, title, mood, tags, wordCount, savedEntryId, baseline, onSave, startTime]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleManualSave(); }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") { e.preventDefault(); onToggleFocusMode(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleManualSave, onToggleFocusMode]);

  const addTag = (t: string) => {
    if (t.trim() && !tags.includes(t.trim()) && tags.length < 8) {
      setTags([...tags, t.trim()]);
      setTagInput("");
    }
  };

  const currentEntry: JournalEntry = {
    id: savedEntryId ?? "new",
    user_id: userId,
    title: title || "Untitled Entry",
    content,
    word_count: wordCount,
    mood,
    tags,
    is_forge_entry: false,
    was_timed: false,
    has_ai_assistance: false,
    drift_signals: null,
    created_at: entry?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: "#0A0A0A" }}>
      {/* Ghost JOURNAL */}
      <div className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
        style={{ fontSize: 180, fontWeight: 700, color: "#FFFFFF", opacity: 0.03, lineHeight: 1, zIndex: 0 }}>
        JOURNAL
      </div>

      {/* TOP BAR */}
      <div className="shrink-0 flex items-center gap-4 px-10 relative z-50"
        style={{ height: 56, background: "rgba(10,10,10,0.95)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Word count + save status (moved to start) */}
        <div className="flex items-center gap-3 flex-1 justify-start">
          <span className="font-mono text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>{wordCount} words</span>
          <AnimatePresence>
            {saveStatus !== "idle" && (
              <motion.span key={saveStatus} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {saveStatus === "saving" ? "Saving..." : "Saved ✓"}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Mood selector */}
          <div className="relative">
            <button onClick={() => { setShowMoodMenu((p) => !p); setShowTagMenu(false); setShowMoreMenu(false); }}
              className="flex items-center gap-1.5 rounded-full px-3 h-8 text-xs transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.50)" }}>
              {moodColor && <span className="w-2 h-2 rounded-full" style={{ background: moodColor }} />}
              {mood ?? "Mood"}
            </button>
            <AnimatePresence>
              {showMoodMenu && (
                <motion.div key="mood-menu" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-10 right-0 z-50 rounded-2xl p-2 grid grid-cols-2 gap-1"
                  style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.10)", minWidth: 200 }}>
                  {MOODS.map((m) => (
                    <button key={m} onClick={() => { setMood(m); setShowMoodMenu(false); }}
                      className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs text-left transition-all hover:bg-white/5"
                      style={{ color: "rgba(255,255,255,0.70)", background: mood === m ? "rgba(255,255,255,0.08)" : "transparent" }}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: MOOD_COLORS[m] }} />
                        {m}
                      </span>
                      {mood === m && <Check size={12} style={{ color: "#FF5500" }} />}
                    </button>
                  ))}
                  {mood && (
                    <button onClick={() => { setMood(null); setShowMoodMenu(false); }}
                      className="col-span-2 text-xs py-2 text-center rounded-lg hover:bg-white/5"
                      style={{ color: "rgba(255,255,255,0.35)" }}>Clear mood</button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tags */}
          <div className="relative">
            <button onClick={() => { setShowTagMenu((p) => !p); setShowMoodMenu(false); setShowMoreMenu(false); }}
              className="flex items-center gap-1.5 rounded-full px-3 h-8 text-xs transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.50)" }}>
              <Tag size={12} />{tags.length > 0 ? `${tags.length} tags` : "Add tags"}
            </button>
            <AnimatePresence>
              {showTagMenu && (
                <motion.div key="tag-menu" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-10 right-0 z-50 rounded-2xl p-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.10)", minWidth: 240 }}>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {tags.map((t) => (
                      <span key={t} className="flex items-center gap-1 text-xs rounded-full px-2 py-0.5"
                        style={{ background: "rgba(255,85,0,0.12)", border: "1px solid rgba(255,85,0,0.25)", color: "#FF5500" }}>
                        {t}
                        <button onClick={() => setTags(tags.filter((x) => x !== t))}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addTag(tagInput); }}
                    placeholder="Add tag..."
                    className="w-full outline-none text-xs mb-3"
                    style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 10px", color: "white" }} />
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_TAGS.filter((s) => !tags.includes(s)).map((s) => (
                      <button key={s} onClick={() => addTag(s)}
                        className="text-xs rounded-full px-2 py-0.5 hover:border-orange-500/30"
                        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.50)" }}>
                        + {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Save */}
          <button onClick={handleManualSave}
            className="rounded-full h-8 px-4 text-xs font-medium text-white transition-all hover:opacity-90"
            style={{ background: "#FF5500" }}>
            Save
          </button>

          {/* Focus mode */}
          <button onClick={onToggleFocusMode}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
            <Maximize2 size={14} style={{ color: "rgba(255,255,255,0.40)" }} />
          </button>

          {/* More */}
          <div className="relative">
            <button onClick={() => { setShowMoreMenu((p) => !p); setShowMoodMenu(false); setShowTagMenu(false); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
              <MoreHorizontal size={14} style={{ color: "rgba(255,255,255,0.40)" }} />
            </button>
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div key="more-menu" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-10 right-0 z-50 rounded-xl py-1 overflow-hidden"
                  style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.10)", minWidth: 160 }}>
                  {[
                    { label: "Export", icon: Download, action: () => { setShowExportModal(true); setShowMoreMenu(false); } },
                    ...(onDelete && savedEntryId ? [{ label: "Delete", icon: Trash2, action: () => { setShowDeleteConfirm(true); setShowMoreMenu(false); }, danger: true }] : []),
                  ].map(({ label, icon: Icon, action, danger = false }) => (
                    <button key={label} onClick={action}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-all hover:bg-white/5 text-left"
                      style={{ color: danger ? "#FF2D2D" : "rgba(255,255,255,0.70)" }}>
                      <Icon size={14} />{label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex-1 overflow-y-auto relative z-10" style={{ padding: "40px 64px 140px", width: "100%" }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title..."
          className="w-full outline-none bg-transparent font-bold mb-3"
          style={{ fontSize: 32, color: "white" }}
        />
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", marginBottom: 32 }}>{today}</p>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={`Start writing. This is private.\nNo AI will read this. No AI will judge this.\nJust you, your thoughts, and time.`}
          spellCheck
          autoComplete="off"
          className="w-full resize-none outline-none"
          style={{
            background: "transparent", border: "none",
            minHeight: "calc(100vh - 340px)", padding: "0 8px",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: focusMode ? 18 : 17, lineHeight: 1.9,
            color: "rgba(255,255,255,0.82)",
            caretColor: "rgba(255,85,0,0.70)",
          }}
        />
      </div>

      {/* Bottom toolbar */}
      <div className="shrink-0 flex items-center gap-4 relative z-10"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,10,0.95)", padding: "12px 40px", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2">
          {[
            { label: "B", title: "Bold", action: () => { const ta = textareaRef.current; if (!ta) return; const s = ta.selectionStart, e = ta.selectionEnd; const sel = content.slice(s, e); setContent(content.slice(0, s) + `**${sel}**` + content.slice(e)); } },
            { label: "I", title: "Italic", action: () => { const ta = textareaRef.current; if (!ta) return; const s = ta.selectionStart, e = ta.selectionEnd; const sel = content.slice(s, e); setContent(content.slice(0, s) + `*${sel}*` + content.slice(e)); } },
            { label: "—", title: "Em dash", action: () => { const ta = textareaRef.current; if (!ta) return; const s = ta.selectionStart; setContent(content.slice(0, s) + "—" + content.slice(s)); } },
          ].map(({ label, title, action }) => (
            <button key={label} title={title} onClick={action}
              className="w-8 h-8 rounded-md flex items-center justify-center text-sm transition-all hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)" }}>
              {label}
            </button>
          ))}
          <div className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>
            {wordCount} words · {readingMinutes(wordCount)} min read
          </span>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.20)" }}>⌘S to save</span>
          <button onClick={handleManualSave}
            className="rounded-full h-9 px-5 text-sm font-medium text-white"
            style={{ background: "#FF5500" }}>
            Save Entry
          </button>
        </div>
      </div>

      {/* Export modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div key="export-overlay" className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.70)" }} onClick={() => setShowExportModal(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="rounded-3xl p-8 w-80" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <h3 className="font-semibold text-white mb-5" style={{ fontSize: 20 }}>Export Entry</h3>
              <div className="flex flex-col gap-3 mb-5">
                {[
                  { label: "Plain Text (.txt)", icon: Download, action: () => exportAsText(currentEntry) },
                  { label: "Markdown (.md)", icon: Download, action: () => exportAsMarkdown(currentEntry) },
                  { label: "Copy to Clipboard", icon: Copy, action: () => navigator.clipboard.writeText(content) },
                ].map(({ label, icon: Icon, action }) => (
                  <button key={label} onClick={() => { action(); setShowExportModal(false); }}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-left transition-all hover:bg-white/5"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.70)" }}>
                    <Icon size={16} style={{ color: "#FF5500" }} />{label}
                  </button>
                ))}
              </div>
              <p className="text-xs italic" style={{ color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                Your journal entries are yours. Export anytime.
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Delete confirm */}
        {showDeleteConfirm && savedEntryId && (
          <motion.div key="delete-overlay" className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.70)" }} onClick={() => setShowDeleteConfirm(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="rounded-2xl p-7 w-72 text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <p className="font-medium text-white mb-2">Delete this entry?</p>
              <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.40)" }}>This cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-full h-9 px-5 text-sm" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.60)" }}>
                  Cancel
                </button>
                <button onClick={() => { onDelete?.(savedEntryId); setShowDeleteConfirm(false); }}
                  className="rounded-full h-9 px-5 text-sm text-white" style={{ background: "#FF2D2D" }}>
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay click-outside close for dropdowns */}
      {(showMoodMenu || showTagMenu || showMoreMenu) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowMoodMenu(false); setShowTagMenu(false); setShowMoreMenu(false); }} />
      )}

      <style>{`textarea::placeholder { color: rgba(255,255,255,0.15); font-style: italic; } ::selection { background: rgba(255,85,0,0.15); }`}</style>
    </div>
  );
}
