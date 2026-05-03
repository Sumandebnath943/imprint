"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Trash2, ChevronLeft, ChevronRight, Upload, Mic, FileText, Image as ImageIcon } from "lucide-react";
import type { GalleryItem } from "@/components/gallery/GalleryCard";
import { fmtRelTime, useSupabaseUrl } from "@/components/gallery/GalleryCard";
import { createClient } from "@/lib/supabase/client";
import { createPortal } from "react-dom";
import { toast } from "sonner";

// ── Item Viewer Modal ─────────────────────────────────────────────────────

interface ViewerProps {
  item: GalleryItem; items: GalleryItem[];
  userId: string;
  onClose: () => void;
  onDelete: (id: string) => void;
  onCaptionUpdate: (id: string, caption: string) => void;
  onNavigate: (item: GalleryItem) => void;
}

export function GalleryItemViewer({ item, items, userId, onClose, onDelete, onCaptionUpdate, onNavigate }: ViewerProps) {
  const [caption, setCaption] = useState(item.caption ?? "");
  const [editingCaption, setEditingCaption] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const idx = items.findIndex((i) => i.id === item.id);
  const hasPrev = idx > 0;
  const hasNext = idx < items.length - 1;

  const isImage = ["sketch", "handwriting", "photo"].includes(item.item_type);
  const isVoice = item.item_type === "voice";

  const { url: mediaUrl, loading } = useSupabaseUrl(item.file_url, item.source, item.item_type);

  const togglePlay = () => {
    if (!audioRef.current && mediaUrl) { audioRef.current = new Audio(mediaUrl); }
    if (playing) { audioRef.current?.pause(); setPlaying(false); }
    else { audioRef.current?.play(); setPlaying(true); if (audioRef.current) audioRef.current.onended = () => setPlaying(false); }
  };

  const handleSaveCaption = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("journal_entries")
        .update({ title: caption })
        .eq("id", item.id)
        .eq("user_id", userId);
      if (error) throw error;
      onCaptionUpdate(item.id, caption);
      setEditingCaption(false);
    } catch (err) {
      console.error("Caption update error:", err);
      toast.error("Failed to update caption.");
    }
  };

  const handleDownload = () => {
    if (!mediaUrl) return;
    const a = document.createElement("a"); a.href = mediaUrl; a.download = item.id; a.click();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div className="fixed inset-0 flex"
      style={{ background: "rgba(4,4,4,0.97)", backdropFilter: "blur(24px)", zIndex: 9999 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <div className="flex flex-1 flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
            <button onClick={onClose} className="flex items-center gap-1 transition-all hover:text-white" style={{ color: "rgba(255,255,255,0.80)" }}>
              <ChevronLeft size={16} /> <span className="font-medium">Back to Gallery</span>
            </button>
            <div className="w-px h-4 mx-2" style={{ background: "rgba(255,255,255,0.15)" }} />
            <span className="capitalize">{item.item_type}</span>
            <span>·</span><span>{fmtRelTime(item.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload}
              className="rounded-full h-9 px-4 text-xs flex items-center gap-1.5 transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)" }}>
              <Download size={13} /> Download
            </button>
            <button onClick={() => setShowDelete(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-red-500/10"
              style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
              <Trash2 size={13} style={{ color: "rgba(255,255,255,0.40)" }} />
            </button>
            <button onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <X size={16} style={{ color: "rgba(255,255,255,0.70)" }} />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Center — image/audio */}
          <div className="flex-1 flex items-center justify-center relative" style={{ background: "#0A0A0A" }}>
            {/* Prev/Next */}
            {hasPrev && (
              <button onClick={() => onNavigate(items[idx - 1])} className="absolute left-4 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.06)" }}>
                <ChevronLeft size={20} style={{ color: "rgba(255,255,255,0.70)" }} />
              </button>
            )}
            {hasNext && (
              <button onClick={() => onNavigate(items[idx + 1])} className="absolute right-4 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.06)" }}>
                <ChevronRight size={20} style={{ color: "rgba(255,255,255,0.70)" }} />
              </button>
            )}

            {isImage && loading && (
              <div className="flex items-center justify-center w-full animate-pulse" style={{ height: "70vh", background: "#0A0A0A" }}>
                <div className="w-12 h-12 rounded-full border-2 border-[#FF5500] border-t-transparent animate-spin" />
              </div>
            )}
            {isImage && mediaUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt={item.caption ?? "Gallery item"} style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", display: loading ? "none" : "block" }} />
            )}

            {isVoice && (
              <div className="flex flex-col items-center gap-6" style={{ maxWidth: 560, width: "100%", padding: "0 48px" }}>
                <button onClick={togglePlay}
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-all hover:opacity-90"
                  style={{ background: "#FF5500" }}>
                  <span style={{ fontSize: 28 }}>{playing ? "⏸" : "▶"}</span>
                </button>
                <div className="w-full flex items-center gap-1" style={{ height: 80 }}>
                  {Array.from({ length: 60 }, (_, i) => {
                    const h = 10 + Math.abs(Math.sin(i * 0.5 + 0.8) * 50);
                    return <div key={i} className="rounded-full flex-1" style={{ height: h, background: "#FF5500", opacity: 0.6 + (h / 60) * 0.4 }} />;
                  })}
                </div>
              </div>
            )}

            {!isImage && !isVoice && item.caption && (
              <div style={{ maxWidth: 600, padding: "0 48px" }}>
                <p style={{ fontFamily: "Georgia, serif", fontSize: 16, lineHeight: 1.9, color: "rgba(255,255,255,0.75)" }}>{item.caption}</p>
              </div>
            )}
          </div>

          {/* Right metadata panel */}
          <div className="shrink-0 flex flex-col overflow-y-auto p-6"
            style={{ width: 280, borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Caption */}
            <div className="mb-5">
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Caption</p>
              {editingCaption ? (
                <div>
                  <textarea value={caption} onChange={(e) => setCaption(e.target.value)}
                    className="w-full rounded-lg outline-none resize-none text-sm"
                    style={{ background: "#1A1A1A", border: "1px solid rgba(255,85,0,0.30)", padding: "10px 12px", color: "rgba(255,255,255,0.80)", minHeight: 80 }} />
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleSaveCaption} className="text-xs rounded-full px-3 py-1 text-white" style={{ background: "#FF5500" }}>Save</button>
                    <button onClick={() => setEditingCaption(false)} className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm cursor-pointer" style={{ color: caption ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.25)", lineHeight: 1.6 }}
                  onClick={() => setEditingCaption(true)}>
                  {caption || "Click to add caption…"}
                </p>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col gap-3 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
              {[
                { label: "Type", value: item.item_type },
                { label: "Source", value: item.source === "forge" ? "The Forge" : "Direct Upload" },
                { label: "Created", value: new Date(item.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
                item.duration_seconds ? { label: "Duration", value: `${Math.floor(item.duration_seconds / 60)}:${String(item.duration_seconds % 60).padStart(2, "0")}` } : null,
                item.word_count ? { label: "Words", value: String(item.word_count) } : null,
              ].filter(Boolean).map((d) => d && (
                <div key={d.label} className="flex justify-between">
                  <span style={{ color: "rgba(255,255,255,0.30)" }}>{d.label}</span>
                  <span className="capitalize" style={{ color: "rgba(255,255,255,0.60)" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDelete && (
          <motion.div className="absolute inset-0 z-60 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.75)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDelete(false)}>
            <motion.div className="rounded-2xl p-7 text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", width: 300 }}
              onClick={(e) => e.stopPropagation()} initial={{ scale: 0.94 }} animate={{ scale: 1 }}>
              <p className="font-medium text-white mb-2" style={{ fontSize: 18 }}>Delete this item?</p>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.40)" }}>This is gone forever.</p>
              <button onClick={() => { onDelete(item.id); setShowDelete(false); onClose(); }}
                className="w-full rounded-full h-10 text-white mb-2" style={{ background: "#FF2D2D" }}>Delete</button>
              <button onClick={() => setShowDelete(false)}
                className="w-full rounded-full h-10 text-sm" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.50)" }}>Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────

const TYPE_OPTIONS = ["sketch", "handwriting", "photo", "voice", "document"] as const;
type ItemType = typeof TYPE_OPTIONS[number];

function detectType(file: File): ItemType {
  if (file.type.startsWith("image/")) return "sketch";
  if (file.type.startsWith("audio/")) return "voice";
  return "document";
}

interface UploadModalProps { userId: string; onUploaded: (item: GalleryItem) => void; onClose: () => void; }

export function GalleryUploadModal({ userId, onUploaded, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [type, setType] = useState<ItemType>("sketch");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => { setFile(f); setType(detectType(f)); };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${userId}/gallery/${Date.now()}_${file.name}`;

      // 1. Upload to storage bucket
      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(path, file, { upsert: false });
      if (uploadError) {
        console.error('Storage error:', uploadError.message);
        toast.error('Upload failed: ' + uploadError.message);
        return;
      }

      // For private buckets, store the path
      const fileUrl = path;

      // 2. Insert into journal_entries
      const { data, error: dbErr } = await supabase
        .from("journal_entries")
        .insert({
          user_id: userId,
          title: file.name,
          content: caption ? `${caption}\n\n[Attached File: ${fileUrl}]` : `[Attached File: ${fileUrl}]`,
          word_count: 0,
          is_forge_entry: false,
          has_ai_assistance: false,
          drift_signals: {},
        })
        .select()
        .single();

      if (dbErr) {
        console.error("Gallery error:", dbErr.message, dbErr.details);
        throw dbErr;
      }

      // Map to GalleryItem shape for optimistic UI update
      if (data) {
        const item: GalleryItem = {
          id: data.id,
          user_id: userId,
          file_url: fileUrl,
          file_type: file.type,
          item_type: type,
          caption: caption || undefined,
          source: "direct_upload",
          file_size: file.size,
          created_at: data.created_at,
        };
        onUploaded(item);
        onClose();
      }
    } catch (err: any) {
      console.error("Gallery upload error:", err);
      toast.error("Upload failed: " + (err.message || "Please try again."));
    } finally {
      setUploading(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div className="fixed inset-0 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.75)", zIndex: 9999 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="rounded-3xl w-full max-w-lg"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", padding: "36px" }}
        onClick={(e) => e.stopPropagation()} initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-white" style={{ fontSize: 20 }}>Add to Gallery</h3>
          <button onClick={onClose}><X size={18} style={{ color: "rgba(255,255,255,0.40)" }} /></button>
        </div>

        {/* Drop zone */}
        <div onClick={() => inputRef.current?.click()}
          className="rounded-2xl flex flex-col items-center justify-center cursor-pointer mb-5 transition-all hover:bg-white/3"
          style={{ border: "2px dashed rgba(255,255,255,0.12)", minHeight: 140, padding: "24px" }}>
          {file ? (
            <div className="flex items-center gap-3">
              {file.type.startsWith("image/") ? <ImageIcon size={28} style={{ color: "#FF5500" }} /> : file.type.startsWith("audio/") ? <Mic size={28} style={{ color: "#FF5500" }} /> : <FileText size={28} style={{ color: "#FF5500" }} />}
              <div>
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            </div>
          ) : (
            <>
              <Upload size={28} style={{ color: "rgba(255,255,255,0.25)", marginBottom: 8 }} />
              <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.45)" }}>
                Click to upload · Images, audio, PDFs, text<br />Max 25MB
              </p>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/*,audio/*,application/pdf,.txt" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        </div>

        {file && (
          <>
            <input value={caption} onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption this piece (optional)"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-4"
              style={{ background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.80)" }} />
            <div className="flex gap-2 flex-wrap mb-5">
              {TYPE_OPTIONS.map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className="rounded-full text-xs px-3 py-1.5 capitalize transition-all"
                  style={{ background: type === t ? "#FF5500" : "#1A1A1A", border: type === t ? "1px solid #FF5500" : "1px solid rgba(255,255,255,0.08)", color: type === t ? "white" : "rgba(255,255,255,0.55)" }}>
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        <button onClick={handleUpload} disabled={!file || uploading}
          className="w-full rounded-full h-12 font-medium text-white disabled:opacity-40"
          style={{ background: "#FF5500" }}>
          {uploading ? "Uploading…" : "Add to Gallery"}
        </button>
      </motion.div>
    </motion.div>,
    document.body
  );
}
