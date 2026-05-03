"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Flame } from "lucide-react";
import type { JournalEntry, Mood } from "@/lib/journal/types";
import { MOOD_COLORS, groupEntries, relativeDate, countWords, calcStreak } from "@/lib/journal/types";

type FilterTab = "All" | "This Week" | "This Month" | "Forge Sessions" | "Moods" | "Tagged";
const FILTER_TABS: FilterTab[] = ["All", "This Week", "This Month", "Forge Sessions", "Moods", "Tagged"];
const GROUP_ORDER = ["THIS WEEK", "LAST WEEK", "EARLIER THIS MONTH", "OLDER"] as const;

interface JournalLeftPanelProps {
  entries: JournalEntry[];
  activeId: string | null;
  onSelect: (e: JournalEntry) => void;
  onNew: () => void;
}

export default function JournalLeftPanel({ entries, activeId, onSelect, onNew }: JournalLeftPanelProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("All");

  const streak = useMemo(() => calcStreak(entries), [entries]);

  const filtered = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);

    return entries.filter((e) => {
      if (search) {
        const q = search.toLowerCase();
        const matchTitle = (e.title ?? "").toLowerCase().includes(q);
        const matchContent = (e.content ?? "").toLowerCase().includes(q);
        if (!matchTitle && !matchContent) return false;
      }
      if (filter === "This Week") return new Date(e.created_at) >= weekAgo;
      if (filter === "This Month") return new Date(e.created_at) >= monthAgo;
      if (filter === "Forge Sessions") return e.is_forge_entry;
      if (filter === "Moods") return !!e.mood;
      if (filter === "Tagged") return (e.tags ?? []).length > 0;
      return true;
    });
  }, [entries, search, filter]);

  const groups = useMemo(() => groupEntries(filtered), [filtered]);

  return (
    <div className="flex flex-col h-full" style={{
      width: 300, minWidth: 300,
      background: "#0D0D0D",
      borderRight: "1px solid rgba(255,255,255,0.06)",
    }}>
      {/* Top bar */}
      <div className="shrink-0 px-4 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-white" style={{ fontSize: 18 }}>Journal</span>
          <button onClick={onNew}
            className="rounded-full h-8 px-3 text-xs font-medium text-white transition-all hover:opacity-90"
            style={{ background: "#FF5500" }}>
            + New Entry
          </button>
        </div>
        {/* Streak */}
        {streak > 0 ? (
          <div className="flex items-center gap-1.5">
            <Flame size={15} style={{ color: "#FF5500" }} />
            <span className={`font-medium ${streak >= 7 ? "animate-pulse" : ""}`}
              style={{ fontSize: 14, color: streak >= 7 ? "#FF5500" : "white" }}>
              {streak >= 7 ? "🔥" : ""}{streak} day streak
            </span>
          </div>
        ) : (
          <p className="italic text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            Write today to start a streak
          </p>
        )}
      </div>

      {/* Search */}
      <div className="shrink-0 px-4 py-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.30)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries..."
            className="w-full outline-none text-sm"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, height: 36, padding: "0 12px 0 32px", color: "white" }}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="shrink-0 pb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-2 px-4" style={{ width: "max-content" }}>
          {FILTER_TABS.map((f) => {
            const sel = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="rounded-full text-xs transition-all whitespace-nowrap"
                style={{
                  padding: "4px 10px",
                  background: sel ? "rgba(255,85,0,0.12)" : "#1A1A1A",
                  border: sel ? "1px solid rgba(255,85,0,0.30)" : "1px solid rgba(255,255,255,0.08)",
                  color: sel ? "#FF5500" : "rgba(255,255,255,0.60)",
                }}>
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,85,0,0.20) transparent" }}>
        {filtered.length === 0 && (
          <p className="text-xs text-center py-8" style={{ color: "rgba(255,255,255,0.25)" }}>No entries found.</p>
        )}
        {GROUP_ORDER.map((group) => {
          const items = groups[group];
          if (!items.length) return null;
          return (
            <div key={group}>
              <p className="px-2 pt-4 pb-1 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{group}</p>
              {items.map((entry) => {
                const isActive = activeId === entry.id;
                const moodColor = entry.mood ? MOOD_COLORS[entry.mood as Mood] : null;
                const wc = entry.word_count ?? countWords(entry.content ?? "");
                return (
                  <motion.div key={entry.id}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => onSelect(entry)}
                    className="relative rounded-[10px] cursor-pointer mb-0.5 overflow-hidden"
                    style={{
                      padding: "10px 12px",
                      background: isActive ? "rgba(255,85,0,0.08)" : "transparent",
                      borderLeft: isActive ? "2px solid #FF5500" : "2px solid transparent",
                    }}
                    onMouseOver={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                    onMouseOut={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {/* Mood edge indicator */}
                    {moodColor && !isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: moodColor }} />
                    )}
                    {/* Row 1 */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate" style={{ maxWidth: 160 }}>
                        {entry.title ?? "Untitled Entry"}
                      </span>
                      <span className="text-xs shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {relativeDate(entry.created_at)}
                      </span>
                    </div>
                    {/* Row 2: preview */}
                    <p className="text-xs mb-1.5 line-clamp-2" style={{ color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                      {(entry.content ?? "").slice(0, 120) || "No content."}
                    </p>
                    {/* Row 3: badges */}
                    <div className="flex items-center gap-1.5">
                      {entry.mood && (
                        <span className="text-xs rounded-full px-1.5 py-0.5" style={{ background: `${moodColor}18`, color: moodColor!, fontSize: 10 }}>
                          {entry.mood}
                        </span>
                      )}
                      {entry.is_forge_entry && (
                        <span className="text-xs rounded-full px-1.5 py-0.5" style={{ background: "rgba(255,85,0,0.12)", color: "#FF5500", fontSize: 10 }}>
                          Forge
                        </span>
                      )}
                      <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>
                        {wc} words
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
