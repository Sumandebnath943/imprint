"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

interface FileUploadZoneProps {
  onFileSelected: (file: File, previewUrl: string) => void;
}

export default function FileUploadZone({ onFileSelected }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview({ name: file.name, url });
    onFileSelected(file, url);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (preview) {
    return (
      <div
        className="flex items-center gap-4 rounded-2xl p-4"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        {preview.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview.url} alt="preview" className="w-20 h-20 object-cover rounded-xl" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{preview.name}</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Uploaded</p>
        </div>
        <button onClick={clear} style={{ color: "rgba(255,255,255,0.40)" }} className="hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className="flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all duration-200"
      style={{
        border: `2px dashed ${dragging ? "rgba(255,85,0,0.40)" : "rgba(255,255,255,0.15)"}`,
        padding: "48px 32px",
        background: dragging ? "rgba(255,85,0,0.04)" : "transparent",
      }}
    >
      <Upload size={32} style={{ color: "rgba(255,255,255,0.30)", marginBottom: 12 }} />
      <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.60)" }}>
        Upload your sketch, drawing, or image
      </p>
      <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.30)" }}>
        JPG, PNG, or PDF · Max 10MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
