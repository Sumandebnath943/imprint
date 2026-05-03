"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import MirrorMessageBubble from "./MirrorMessage";
import type { MirrorMessage } from "@/lib/mirror/types";
import { formatTime } from "@/lib/mirror/types";

interface MirrorSessionViewerProps {
  sessionId: string;
  onClose: () => void;
}

export default function MirrorSessionViewer({ sessionId, onClose }: MirrorSessionViewerProps) {
  const [messages, setMessages] = useState<MirrorMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("mirror_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (error) throw error;
        setMessages(data.messages || []);
        setSessionData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load session");
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [sessionId]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: "#0A0A10" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 shrink-0"
        style={{ height: 64, background: "rgba(10,10,16,0.95)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-4">
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10">
            <X size={18} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
          <div>
            <p className="font-semibold text-white">Past Reflection</p>
            {sessionData && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {new Date(sessionData.created_at).toLocaleDateString()} · {(sessionData.topics || []).join(", ")}
              </p>
            )}
          </div>
        </div>
        {sessionData && (
          <div className="flex gap-4 text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span>{formatTime(sessionData.session_duration_seconds)}</span>
            <span>{sessionData.ai_question_count} Questions</span>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-6 relative"
        style={{ padding: "32px 48px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,120,50,0.20) transparent" }}>
        
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full" style={{ background: "rgba(255,120,50,0.50)" }} />
          </div>
        )}
        
        {error && (
          <div className="flex-1 flex items-center justify-center flex-col gap-2">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={onClose} className="text-xs text-white/50 underline">Go Back</button>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-sm text-white/40">
            This session has no recorded messages.
          </div>
        )}

        {!loading && !error && messages.map((msg: any) => (
          <MirrorMessageBubble key={msg.id} msg={msg} />
        ))}
      </div>
    </motion.div>
  );
}
