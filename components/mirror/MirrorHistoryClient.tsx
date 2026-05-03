"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import MirrorSessionViewer from "@/components/mirror/MirrorSessionViewer";
import type { MirrorPastSession } from "@/lib/mirror/types";
import { formatTime } from "@/lib/mirror/types";

export default function MirrorHistoryClient({ initialSessions }: { initialSessions: MirrorPastSession[] }) {
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full relative" style={{ minHeight: "calc(100vh - 64px)", background: "#080808" }}>
      <div className="max-w-4xl w-full mx-auto p-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/dashboard/mirror" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-4 transition-all hover:opacity-70" style={{ color: "rgba(255,120,50,0.90)" }}>
              <ArrowLeft size={14} /> Back to Mirror
            </a>
            <h1 className="text-3xl font-bold text-white">Mirror History</h1>
            <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>Your past reflection sessions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialSessions.length === 0 && (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>You haven't completed any mirror sessions yet.</p>
          )}
          {initialSessions.map((s) => (
            <div key={s.id} onClick={() => setViewingSessionId(s.id)}
              className="rounded-2xl p-5 cursor-pointer transition-all border border-transparent"
              style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.05)" }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,120,50,0.3)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(255,120,50,0.05)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                {new Date(s.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                {(s.topics && s.topics.length > 0) ? s.topics.join(", ") : "Open Reflection"}
              </h3>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-xs px-2 py-1 rounded bg-white/5 text-white/50">{formatTime(s.session_duration_seconds)}</span>
                <span className="text-xs px-2 py-1 rounded bg-white/5 text-white/50">{s.ai_question_count} Qs</span>
                {s.dependency_flags > 0 && (
                  <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,184,0,0.12)", color: "#FFB800" }}>
                    {s.dependency_flags} Flags
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {viewingSessionId && (
          <MirrorSessionViewer
            sessionId={viewingSessionId}
            onClose={() => setViewingSessionId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
