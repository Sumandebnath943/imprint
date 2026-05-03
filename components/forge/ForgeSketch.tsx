"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool, X } from "lucide-react";

interface ForgeSketchProps {
  onSave: (file: File, caption: string) => void;
}

export default function ForgeSketch({ onSave }: ForgeSketchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const handleSave = () => { if (file) onSave(file, caption); };
  const handleReset = () => { setFile(null); setPreviewUrl(null); setCaption(""); };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 relative">
      {/* Ghost */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ fontSize: 180, fontWeight: 700, color: "#FFFFFF", opacity: 0.025 }}>FORGE</div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="upload-zone" className="w-full relative z-10" style={{ maxWidth: 560 }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div
              onClick={() => inputRef.current?.click()}
              onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
              className="flex flex-col items-center justify-center gap-4 rounded-[20px] cursor-pointer transition-all duration-200"
              style={{
                minHeight: 320,
                border: `2px dashed ${isDragging ? "rgba(255,85,0,0.50)" : "rgba(255,255,255,0.12)"}`,
                background: isDragging ? "rgba(255,85,0,0.04)" : "rgba(255,255,255,0.02)",
              }}
            >
              <PenTool size={40} style={{ color: "rgba(255,255,255,0.20)" }} />
              <div className="text-center">
                <p className="text-lg font-medium mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>Drop your sketch or photo here</p>
                <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.30)" }}>or click to browse</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.20)" }}>Handwriting, sketches, drawings · JPG, PNG, PDF · Max 10MB</p>
              </div>
            </div>
            <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </motion.div>
        ) : (
          <motion.div key="preview" className="flex flex-col items-center gap-5 w-full relative z-10" style={{ maxWidth: 480 }}
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            {/* Preview */}
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl!} alt="preview" className="rounded-xl object-contain"
                style={{ maxWidth: 400, maxHeight: 300, border: "1px solid rgba(255,255,255,0.08)" }} />
              <button onClick={handleReset}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.15)" }}>
                <X size={12} style={{ color: "rgba(255,255,255,0.60)" }} />
              </button>
            </div>
            {/* File info */}
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              {file.name} · {(file.size / 1024).toFixed(0)} KB
            </p>
            {/* Caption */}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What is this? (optional)"
              rows={2}
              className="w-full resize-none outline-none text-sm"
              style={{
                background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 10, padding: "10px 14px", color: "rgba(255,255,255,0.80)",
                fontFamily: "'Courier New', monospace",
              }}
            />
            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleSave}
                className="rounded-full h-10 px-6 text-sm font-medium text-white"
                style={{ background: "#FF5500" }}>
                Save to Forge
              </button>
              <button onClick={handleReset}
                className="rounded-full h-10 px-6 text-sm font-medium"
                style={{ border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.60)" }}>
                Upload different file
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
