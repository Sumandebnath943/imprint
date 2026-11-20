"use client";

import { useState, useEffect, useRef } from "react";
import {motion} from "framer-motion";
import { useRouter } from "next/navigation";
import DriftRing from "@/components/drift/DriftRing";
import {getZoneColor, getZoneLabel} from "@/lib/drift/types";
import type { CalibrationScoreResult } from "@/lib/calibration/types";

// ── Processing Overlay ───────────────────────────────────────────────────

interface ProcessingProps { onDone: (result: CalibrationScoreResult) => void; sessionId: string; }

export function CalibrationProcessing({ onDone, sessionId }: ProcessingProps) {
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetch("/api/calibration/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
      signal: controller.signal,
    }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || !Number.isFinite(result.score)) {
        throw new Error(result.error ?? "The comparison is currently unavailable.");
      }
      if (!controller.signal.aborted) onDoneRef.current(result);
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not score the comparison.");
    });
    return () => controller.abort();
  }, [sessionId, retry]);

  return (
    <div className="fixed inset-0 z-50 grid place-content-center bg-[#050508] p-6 text-center">
      <p role="status">{error || "Scoring your saved comparison…"}</p>
      {error && <button className="mt-5 text-[#ff8054]" onClick={() => setRetry((value) => value + 1)}>Retry scoring</button>}
    </div>
  );
}

interface ResultsProps {
  result: CalibrationScoreResult;
  sessionNumber: number;
  previousSessionNumber?: number;
}

export function CalibrationResults({ result, sessionNumber, previousSessionNumber }: ResultsProps) {
  const router = useRouter();
  const { score, delta, signals, nextSessionDue } = result;
  const color = getZoneColor(score);
  const signalCards = [
    { label: "Text similarity", value: signals.baseline_divergence },
    { label: "Vault activity", value: signals.vault_inactivity },
    { label: "Journal coverage", value: signals.journal_irregularity },
  ].flatMap(({ label, value }) => typeof value === "number" ? [{ label, value: 100 - value }] : []);
  const nextDate = new Date(nextSessionDue).toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "#050508" }}>
      <div className="mx-auto flex flex-col items-center" style={{ maxWidth: 680, padding: "80px 32px 120px" }}>
        {/* Score ring */}
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-6">
          <DriftRing score={score} size={240} strokeWidth={12} showCenter />
        </motion.div>

        {/* Score + status */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center mb-4">
          <div className="inline-flex rounded-full px-6 py-2 mb-4"
            style={{ background: `${color}1E`, border: `1px solid ${color}4D` }}>
            <span className="font-semibold" style={{ fontSize: 16, color }}>{getZoneLabel(score)}</span>
          </div>

          {delta !== null ? (
            <div>
              <p className="font-semibold mb-1" style={{ fontSize: 16, color: delta <= 0 ? "#00D97E" : "#FF2D2D" }}>
                {delta <= 0 ? `↓ ${Math.abs(delta)} points from Session ${previousSessionNumber}` : `↑ ${delta} points from Session ${previousSessionNumber}`}
              </p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>
                {delta <= 0 ? "Your legacy comparison score is lower." : "Your legacy comparison score is higher."}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium text-white mb-1" style={{ fontSize: 16 }}>Your first legacy text comparison.</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>This comparison describes text and activity.</p>
            </div>
          )}
        </motion.div>

        {/* Signal breakdown */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          className="grid grid-cols-2 gap-3 w-full mb-6">
          {signalCards.map(({ label, value: val }, i) => {
            const c = getZoneColor(100 - val);
            return (
              <div key={label} className="rounded-xl px-4 py-3" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color: c }}>{val}%</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: c }}
                    initial={{ width: 0 }} animate={{ width: `${val}%` }}
                    transition={{ duration: 0.8, delay: 0.7 + i * 0.08 }} />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Next steps */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className="w-full mb-8">
          <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.66)" }}>Next session due: {nextDate}</p>
          {score > 40 && (
            <div className="flex flex-col gap-2">
              {[
                { text: "Review your Recovery Protocol →", href: "/dashboard/drift" },
                { text: "Complete a Vault Challenge this week →", href: "/dashboard/vault" },
                { text: "Open The Mirror and reflect →", href: "/dashboard/mirror" },
              ].map(({ text, href }) => (
                <button key={text} onClick={() => router.push(href)}
                  className="flex items-center gap-2 text-sm text-left"
                  style={{ color: "#FF5500" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />{text}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
          className="flex gap-4">
          <button onClick={() => router.push("/dashboard/drift")}
            className="rounded-full font-medium text-on-accent" style={{ background: "#FF5500", height: 46, padding: "0 32px" }}>
            View Full Report →
          </button>
          <button onClick={() => router.push("/dashboard")}
            className="rounded-full transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.65)", height: 46, padding: "0 28px" }}>
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  );
}
