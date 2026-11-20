"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CalibrationHub from "@/components/calibration/CalibrationHub";
import CalibrationSessionView from "@/components/calibration/CalibrationSession";
import { CalibrationProcessing, CalibrationResults } from "@/components/calibration/CalibrationResults";
import type { CalibrationPageData, CalibrationSession, CalibrationResponse, CalibrationScoreResult } from "@/lib/calibration/types";
import { toast } from "sonner";

type Phase = "hub" | "active" | "processing" | "results";

interface CalibrationClientProps { pageData: CalibrationPageData; }

export default function CalibrationClient({ pageData }: CalibrationClientProps) {
  const [phase, setPhase] = useState<Phase>(() => {
    // If there's an active in-progress session < 24h, go straight to active
    if (pageData.activeSession) return "active";
    return "hub";
  });
  const [activeSession, setActiveSession] = useState<CalibrationSession | null>(pageData.activeSession);
  const [scoreResult, setScoreResult] = useState<CalibrationScoreResult | null>(null);

  const saving = useRef(false);

  const completedCount = pageData.sessions.filter((s) => s.status === "completed").length;
  const sessionNumber = completedCount + 1;

  // ── Begin calibration ─────────────────────────────────────────────────
  const handleBegin = async () => {
    // If resuming
    if (activeSession) {
      setActiveSession(activeSession);
      setPhase("active");
      return;
    }
    // Start new session
    try {
      const res = await fetch("/api/calibration/start", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to start calibration");
      }
      
      setActiveSession(data.session as CalibrationSession);
      setPhase("active");
    } catch (err: any) {
      console.error("Calibration start error:", err);
      toast.error(err.message);
    }
  };

  const handleSave = async (responses: CalibrationResponse[]) => {
    if (!activeSession || saving.current) return false;
    saving.current = true;
    try {
      const response = await fetch("/api/calibration/save-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id, responses, version: activeSession.progress_version,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save progress.");
      setActiveSession({ ...activeSession, responses, progress_version: data.version });
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save progress.");
      return false;
    } finally {
      saving.current = false;
    }
  };

  const handlePause = async (responses: CalibrationResponse[]) => {
    if (await handleSave(responses)) setPhase("hub");
  };

  const handleComplete = async (responses: CalibrationResponse[]) => {
    if (await handleSave(responses)) setPhase("processing");
  };

  // ── Score result received ─────────────────────────────────────────────
  const handleScored = (result: CalibrationScoreResult) => {
    setScoreResult(result);
    setPhase("results");
  };

  return (
    <>
      {/* Hub (behind when session active) */}
      {phase === "hub" && (
        <CalibrationHub pageData={pageData} onBegin={handleBegin} />
      )}

      {/* Resume banner (shown in hub if active session) */}
      {phase === "hub" && activeSession && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-2xl px-6 py-4"
          style={{ background: "rgba(255,85,0,0.08)", border: "1px solid rgba(255,85,0,0.25)", boxShadow: "0 0 40px rgba(255,85,0,0.08)" }}>
          <div>
            <p className="text-sm font-medium text-white">You have a session in progress.</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.72)" }}>
              {activeSession.responses.length} of {activeSession.prompts.length} prompts completed.
            </p>
          </div>
          <button onClick={handleBegin}
            className="rounded-full h-10 px-6 text-sm font-medium text-on-accent"
            style={{ background: "#FF5500" }}>
            Resume Session →
          </button>
        </div>
      )}

      {/* Active session (full-screen portal) */}
      <AnimatePresence>
        {phase === "active" && activeSession && (
          <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CalibrationSessionView
              session={activeSession}
              sessionNumber={activeSession.session_number}
              onProgress={handleSave}
              onComplete={handleComplete}
              onPause={handlePause}
            />
          </motion.div>
        )}

        {phase === "processing" && activeSession && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CalibrationProcessing sessionId={activeSession.id} onDone={handleScored} />
          </motion.div>
        )}

        {phase === "results" && scoreResult && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CalibrationResults
              result={scoreResult}
              sessionNumber={sessionNumber}
              previousSessionNumber={sessionNumber - 1}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
