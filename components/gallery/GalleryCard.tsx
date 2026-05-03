"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, FileText, Image, Maximize2 } from "lucide-react";

export interface GalleryItem {
  id: string; user_id: string; file_url: string; file_type: string;
  item_type: "sketch" | "handwriting" | "photo" | "voice" | "document";
  caption?: string; source: "forge" | "direct_upload"; file_size?: number;
  duration_seconds?: number; word_count?: number; created_at: string;
}

export function fmtRelTime(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today"; if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`; return `${Math.floor(days / 30)}mo ago`;
}
function fmtDuration(secs?: number) {
  if (!secs) return "—"; const m = Math.floor(secs / 60), s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

import { createClient } from "@/lib/supabase/client";

export function useSupabaseUrl(path: string | undefined, source?: "forge" | "direct_upload", itemType?: GalleryItem["item_type"]) {
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(!!path);

  useEffect(() => {
    if (!path) { setLoading(false); return; }

    const supabase = createClient();

    // Extract bucket + relative path from any Supabase storage URL
    // Matches both /object/public/<bucket>/... and /object/sign/<bucket>/...
    const storageMatcher = /\/storage\/v1\/object\/(?:public|sign)\/([^/?]+)\/([^?]+)/;
    const match = path.match(storageMatcher);

    let bucket: string;
    let filePath: string;

    if (match) {
      // Full URL stored — extract bucket and path from it
      bucket = match[1];
      filePath = match[2];
    } else {
      // Relative path — determine bucket from source + itemType
      bucket = source === "forge"
        ? (itemType === "voice" ? "forge-audio" : "forge-files")
        : "gallery";
      filePath = path;
    }

    supabase.storage.from(bucket).createSignedUrl(filePath, 3600).then(({ data }) => {
      setUrl(data?.signedUrl || undefined);
      setLoading(false);
    });
  }, [path, source, itemType]);

  return { url, loading };
}

// ── Waveform placeholder ──────────────────────────────────────────────────

function Waveform({ bars = 32 }: { bars?: number }) {
  const heights = Array.from({ length: bars }, (_, i) => 20 + Math.abs(Math.sin(i * 0.7 + 1.2) * 24) + Math.random() * 10);
  return (
    <div className="flex items-center gap-0.5" style={{ height: 40 }}>
      {heights.map((h, i) => (
        <div key={i} className="rounded-full" style={{ width: 3, height: h, background: "#FF5500", opacity: 0.7 + (h / 40) * 0.3 }} />
      ))}
    </div>
  );
}

// ── Image card ────────────────────────────────────────────────────────────

function ImageCard({ item, onOpen }: { item: GalleryItem; onOpen: (item: GalleryItem) => void }) {
  const [hovered, setHovered] = useState(false);
  const typeLabel = item.item_type === "sketch" ? "Sketch" : item.item_type === "handwriting" ? "Handwriting" : "Photo";
  const { url: imgUrl, loading } = useSupabaseUrl(item.file_url, item.source, item.item_type);

  return (
    <div className="rounded-2xl overflow-hidden cursor-pointer mb-4 group relative"
      style={{ background: "#111111", border: `1px solid ${hovered ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)"}`, transform: hovered ? "scale(1.01)" : "scale(1)", transition: "all 200ms ease" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(item)}>
      {/* Image */}
      <div style={{ background: "#0D0D0D", maxHeight: 380, overflow: "hidden", minHeight: 120, position: "relative" }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center animate-pulse" style={{ background: "#1A1A1A" }}>
            <div className="w-8 h-8 rounded-full border-2 border-[#FF5500] border-t-transparent animate-spin" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgUrl} alt={item.caption ?? typeLabel} style={{ width: "100%", objectFit: "contain", display: loading ? "none" : "block" }} loading="lazy" />
      </div>
      {/* Meta */}
      <div style={{ padding: "14px 16px" }}>
        <span className="text-xs rounded-full px-2 py-0.5 mb-2 inline-block" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}>{typeLabel}</span>
        {item.caption && <p className="text-sm mb-1 line-clamp-2" style={{ color: "rgba(255,255,255,0.70)", lineHeight: 1.5 }}>{item.caption}</p>}
        <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          <span>{fmtRelTime(item.created_at)}</span>
          <span>·</span>
          <span className="rounded-full px-2 py-0.5" style={{ background: item.source === "forge" ? "rgba(255,85,0,0.10)" : "rgba(255,255,255,0.05)", color: item.source === "forge" ? "#FF5500" : "rgba(255,255,255,0.40)" }}>
            {item.source === "forge" ? "From The Forge" : "Direct Upload"}
          </span>
        </div>
      </div>
      {/* Hover overlay */}
      {hovered && (
        <motion.div className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: "rgba(8,8,8,0.85)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Maximize2 size={20} style={{ color: "white", marginBottom: 8 }} />
          <span className="font-medium text-white" style={{ fontSize: 16 }}>View</span>
        </motion.div>
      )}
    </div>
  );
}

// ── Voice card ────────────────────────────────────────────────────────────

function VoiceCard({ item, onOpen }: { item: GalleryItem; onOpen: (item: GalleryItem) => void }) {
  const [hovered, setHovered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { url: audioUrl } = useSupabaseUrl(item.file_url, item.source, item.item_type);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current && audioUrl) { audioRef.current = new Audio(audioUrl); }
    if (playing) { audioRef.current?.pause(); setPlaying(false); }
    else { audioRef.current?.play(); setPlaying(true); if (audioRef.current) audioRef.current.onended = () => setPlaying(false); }
  };

  return (
    <div className="rounded-2xl cursor-pointer mb-4"
      style={{ background: "#111118", border: `1px solid ${hovered ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)"}`, padding: "20px 24px", transform: hovered ? "scale(1.01)" : "scale(1)", transition: "all 200ms ease" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(item)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mic size={18} style={{ color: "#FF5500" }} />
          <span className="font-medium text-white" style={{ fontSize: 14 }}>Voice Note</span>
        </div>
        <span className="font-bold font-mono text-white" style={{ fontSize: 28 }}>{fmtDuration(item.duration_seconds)}</span>
      </div>
      <Waveform />
      {item.caption && <p className="text-xs mt-3 line-clamp-2" style={{ color: "rgba(255,255,255,0.50)" }}>{item.caption}</p>}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{fmtRelTime(item.created_at)}</span>
        {hovered && (
          <button onClick={togglePlay}
            className="rounded-full h-8 px-4 text-xs font-medium text-white"
            style={{ background: "#FF5500" }}>
            {playing ? "Pause" : "Play"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Document card ─────────────────────────────────────────────────────────

function DocumentCard({ item, onOpen }: { item: GalleryItem; onOpen: (item: GalleryItem) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="rounded-2xl cursor-pointer mb-4"
      style={{ background: "#0F0F0F", border: `1px solid ${hovered ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)"}`, padding: "20px 24px", transform: hovered ? "scale(1.01)" : "scale(1)", transition: "all 200ms ease" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(item)}>
      <div className="flex items-center gap-2 mb-3">
        <FileText size={18} style={{ color: "#FF5500" }} />
        <span className="font-medium text-white" style={{ fontSize: 14 }}>Document</span>
      </div>
      {item.caption && (
        <p className="text-sm italic mb-3 line-clamp-3"
          style={{ color: "rgba(255,255,255,0.60)", lineHeight: 1.6 }}>{item.caption}</p>
      )}
      <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
        {item.word_count && <span>{item.word_count} words</span>}
        <span>·</span><span>{fmtRelTime(item.created_at)}</span>
      </div>
    </div>
  );
}

// ── Combined card router ──────────────────────────────────────────────────

export default function GalleryCard({ item, onOpen }: { item: GalleryItem; onOpen: (item: GalleryItem) => void }) {
  if (item.item_type === "voice") return <VoiceCard item={item} onOpen={onOpen} />;
  if (item.item_type === "document") return <DocumentCard item={item} onOpen={onOpen} />;
  return <ImageCard item={item} onOpen={onOpen} />;
}
