"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import CapsuleList, { type TimeCapsule } from "@/components/time-capsule/CapsuleList";
import CapsuleCompose from "@/components/time-capsule/CapsuleCompose";
import CapsuleRightPanel from "@/components/time-capsule/CapsuleRightPanel";
import { createClient } from "@/lib/supabase/client";

interface TimeCapsuleClientProps {
  capsules: TimeCapsule[];
  userId: string;
  userName: string;
  currentDriftScore: number | null;
}

type RightMode = "empty" | "compose" | "view";

export default function TimeCapsuleClient({ capsules: initial, userId, userName, currentDriftScore }: TimeCapsuleClientProps) {
  const [capsules, setCapsules] = useState<TimeCapsule[]>(initial);
  const [selected, setSelected] = useState<TimeCapsule | null>(null);
  const [mode, setMode] = useState<RightMode>("empty");
  const supabase = createClient();

  const handleNew = useCallback(() => { setSelected(null); setMode("compose"); }, []);
  const handleSelect = useCallback((c: TimeCapsule) => { setSelected(c); setMode("view"); }, []);

  const handleSaved = useCallback((capsule: TimeCapsule) => {
    setCapsules((p) => [capsule, ...p]);
    setSelected(capsule);
    setMode("view");
  }, []);

  const handleReply = useCallback((original: TimeCapsule) => {
    // Pre-populate a new compose with "Reply to: [title]"
    setSelected(null);
    setMode("compose");
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from("time_capsules").delete().eq("id", id).eq("user_id", userId);
    setCapsules((p) => p.filter((c) => c.id !== id));
    setSelected(null);
    setMode("empty");
  }, [supabase, userId]);

  return (
    <div className="flex h-full relative" style={{ background: "#080808", minHeight: "calc(100vh - 64px)" }}>
      {/* Ghost */}
      <div className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
        style={{ fontSize: 180, fontWeight: 700, color: "#fff", opacity: 0.025, zIndex: 0, lineHeight: 1 }}>FUTURE</div>

      {/* Left panel */}
      <CapsuleList capsules={capsules} selectedId={selected?.id ?? null} onSelect={handleSelect} onNew={handleNew} />

      {/* Right panel */}
      <div className="flex-1 flex h-full relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {mode === "empty" && (
            <motion.div key="empty" className="flex-1 flex flex-col items-center justify-center"
              style={{ background: "#0A0A0A" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BookOpen size={48} style={{ color: "rgba(255,255,255,0.08)", marginBottom: 16 }} />
              <h2 className="font-medium mb-2" style={{ fontSize: 20, color: "rgba(255,255,255,0.40)" }}>
                {capsules.length === 0 ? "Write your first time capsule." : "Select a capsule or write a new one."}
              </h2>
              <p className="text-sm text-center max-w-xs" style={{ color: "rgba(255,255,255,0.25)", lineHeight: 1.7 }}>
                Seal a letter to your future self.<br />It stays locked until the date you choose.
              </p>
            </motion.div>
          )}

          {mode === "compose" && (
            <motion.div key="compose" className="flex-1 flex h-full"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CapsuleCompose
                userId={userId} userName={userName}
                currentDriftScore={currentDriftScore}
                onSaved={handleSaved}
                onCancel={() => setMode(selected ? "view" : "empty")}
              />
            </motion.div>
          )}

          {mode === "view" && selected && (
            <motion.div key={selected.id} className="flex-1 flex h-full"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CapsuleRightPanel
                capsule={selected} currentDriftScore={currentDriftScore}
                onReply={handleReply} onDelete={handleDelete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
