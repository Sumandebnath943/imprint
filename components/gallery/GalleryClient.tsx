"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid, List, PenTool, Mic, Image, FileText, Palette, Upload, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import GalleryCard, { type GalleryItem, useSupabaseUrl } from "@/components/gallery/GalleryCard";
import { GalleryItemViewer, GalleryUploadModal } from "@/components/gallery/GalleryModal";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type FilterType = "All" | "sketch" | "handwriting" | "photo" | "voice" | "document";
type DateRange = "all" | "week" | "month" | "3m" | "year";

const TYPE_FILTERS: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: "All", label: "All", icon: null },
  { value: "sketch", label: "Sketches", icon: <PenTool size={13} /> },
  { value: "handwriting", label: "Handwriting", icon: <PenTool size={13} /> },
  { value: "photo", label: "Photos", icon: <Image size={13} /> },
  { value: "voice", label: "Voice Notes", icon: <Mic size={13} /> },
  { value: "document", label: "Documents", icon: <FileText size={13} /> },
];

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "all", label: "All time" }, { value: "week", label: "This week" },
  { value: "month", label: "This month" }, { value: "3m", label: "Last 3 months" },
  { value: "year", label: "This year" },
];

function filterByDate(items: GalleryItem[], range: DateRange) {
  if (range === "all") return items;
  const now = Date.now();
  const ms: Record<Exclude<DateRange, "all">, number> = { week: 7, month: 30, "3m": 90, year: 365 };
  const cutoff = now - ms[range] * 86400000;
  return items.filter((i) => new Date(i.created_at).getTime() >= cutoff);
}

function fmtRelTime(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today"; if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`; return `${Math.floor(days / 30)}mo ago`;
}

interface GalleryClientProps { items: GalleryItem[]; userId: string; }

export default function GalleryClient({ items: initial, userId }: GalleryClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>(initial);
  const [typeFilter, setTypeFilter] = useState<FilterType>("All");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Stats
  const countOf = (t: string) => items.filter((i) => i.item_type === t).length;

  // Filtered
  const filtered = filterByDate(
    typeFilter === "All" ? items : items.filter((i) => i.item_type === typeFilter),
    dateRange
  );

  const handleOpen = useCallback((item: GalleryItem) => setSelectedItem(item), []);
  const handleClose = useCallback(() => setSelectedItem(null), []);
  const handleDelete = useCallback(async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
      setItems((p) => p.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Gallery delete error:", err);
      toast.error("Failed to delete item.");
    }
  }, [userId]);
  const handleCaptionUpdate = useCallback((id: string, caption: string) => {
    setItems((p) => p.map((i) => i.id === id ? { ...i, caption } : i));
    if (selectedItem?.id === id) setSelectedItem((prev) => prev ? { ...prev, caption } : null);
  }, [selectedItem]);
  const handleUploaded = useCallback((item: GalleryItem) => {
    setItems((p) => [item, ...p]);
  }, []);

  return (
    <div className="relative" style={{ background: "#080808", minHeight: "100%", padding: "40px 48px 80px" }}>
      {/* Ghost */}
      <div className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
        style={{ fontSize: 160, fontWeight: 700, color: "#fff", opacity: 0.025, lineHeight: 1, zIndex: 0 }}>GALLERY</div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-bold text-white mb-1" style={{ fontSize: 32 }}>Creative Gallery</h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.40)" }}>Your creative fingerprint, preserved.</p>
          </div>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 rounded-full font-medium text-white"
            style={{ height: 42, padding: "0 20px", background: "#FF5500", fontSize: 14 }}>
            <Upload size={14} /> Upload to Gallery
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }}
          className="flex items-center gap-2 mb-8 text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
          {[
            { n: countOf("sketch") + countOf("handwriting"), label: "sketches" },
            { n: countOf("voice"), label: "voice notes" },
            { n: countOf("photo"), label: "photos" },
            { n: countOf("document"), label: "documents" },
          ].map(({ n, label }, i) => (
            <span key={label} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>}
              <span className="text-white font-medium">{n}</span> {label}
            </span>
          ))}
        </motion.div>

        {/* Filter bar */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
          className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          {/* Type filters */}
          <div className="flex gap-2 flex-wrap">
            {TYPE_FILTERS.map(({ value, label, icon }) => (
              <button key={value} onClick={() => setTypeFilter(value)}
                className="flex items-center gap-1.5 rounded-full text-xs px-3 py-1.5 transition-all"
                style={{ background: typeFilter === value ? "#FF5500" : "#1A1A1A", border: typeFilter === value ? "1px solid #FF5500" : "1px solid rgba(255,255,255,0.08)", color: typeFilter === value ? "white" : "rgba(255,255,255,0.55)" }}>
                {icon}{label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {/* Date picker */}
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="text-xs rounded-xl px-3 py-1.5 outline-none"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.60)" }}>
              {DATE_RANGES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              {([["grid", <Grid key="g" size={14} />], ["list", <List key="l" size={14} />]] as const).map(([mode, icon]) => (
                <button key={mode} onClick={() => setViewMode(mode as "grid" | "list")}
                  className="w-9 h-9 flex items-center justify-center transition-all"
                  style={{ background: viewMode === mode ? "#FF5500" : "#1A1A1A", color: viewMode === mode ? "white" : "rgba(255,255,255,0.40)" }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Gallery grid */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24">
            <Palette size={64} style={{ color: "rgba(255,255,255,0.08)", marginBottom: 20 }} />
            <h2 className="font-semibold text-white mb-2 text-center" style={{ fontSize: 24 }}>Your gallery is empty.</h2>
            <p className="text-base text-center mb-8" style={{ color: "rgba(255,255,255,0.40)", maxWidth: 400, lineHeight: 1.7 }}>
              Sketches, handwriting, voice notes, and uploads from The Forge appear here.
            </p>
            <div className="flex gap-3">
              <button onClick={() => router.push("/dashboard/forge")}
                className="rounded-full font-medium text-white"
                style={{ height: 44, padding: "0 24px", background: "#FF5500" }}>Open The Forge →</button>
              <button onClick={() => setShowUpload(true)}
                className="rounded-full transition-all hover:bg-white/5"
                style={{ height: 44, padding: "0 20px", border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.65)" }}>
                Upload Something →
              </button>
            </div>
          </motion.div>
        ) : viewMode === "grid" ? (
          <div style={{ columns: "3", columnGap: 16 }}>
            {filtered.map((item) => (
              <div key={item.id} style={{ breakInside: "avoid" }}>
                <GalleryCard item={item} onOpen={handleOpen} />
              </div>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="flex flex-col" style={{ gap: 0 }}>
            {filtered.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3 cursor-pointer transition-all hover:bg-white/2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                onClick={() => handleOpen(item)}>
                <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "#1A1A1A" }}>
                  {(() => {
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    const { url: imgUrl, loading } = useSupabaseUrl(item.file_url, item.source, item.item_type);
                    if (["sketch", "handwriting", "photo"].includes(item.item_type) && item.file_url) {
                      // eslint-disable-next-line @next/next/no-img-element
                      return (
                        <div className="w-full h-full relative flex items-center justify-center">
                          {loading && <div className="absolute inset-0 bg-[#1A1A1A] animate-pulse" />}
                          <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: loading ? "none" : "block" }} />
                        </div>
                      );
                    }
                    return (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.item_type === "voice" ? <Mic size={18} style={{ color: "#FF5500" }} /> : <FileText size={18} style={{ color: "#FF5500" }} />}
                      </div>
                    );
                  })()}
                </div>
                <span className="text-xs capitalize rounded-full px-2 py-0.5 shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}>{item.item_type}</span>
                <p className="flex-1 text-sm truncate" style={{ color: "rgba(255,255,255,0.70)" }}>{item.caption ?? "Untitled"}</p>
                <span className="text-xs shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>{fmtRelTime(item.created_at)}</span>
                <span className="text-xs shrink-0 rounded-full px-2 py-0.5"
                  style={{ background: item.source === "forge" ? "rgba(255,85,0,0.10)" : "rgba(255,255,255,0.05)", color: item.source === "forge" ? "#FF5500" : "rgba(255,255,255,0.40)" }}>
                  {item.source === "forge" ? "Forge" : "Upload"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedItem && (
          <GalleryItemViewer
            item={selectedItem} items={filtered}
            userId={userId} onClose={handleClose}
            onDelete={handleDelete} onCaptionUpdate={handleCaptionUpdate}
            onNavigate={(item) => setSelectedItem(item)}
          />
        )}
        {showUpload && (
          <GalleryUploadModal userId={userId} onUploaded={handleUploaded} onClose={() => setShowUpload(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
