"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Play, Pause, RotateCcw } from "lucide-react";
import { formatTime } from "@/lib/forge/types";

type VoiceState = "idle" | "recording" | "done";

interface ForgeVoiceProps {
  onSave: (blob: Blob, duration: number) => void;
}

export default function ForgeVoice({ onSave }: ForgeVoiceProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobRef = useRef<Blob | null>(null);

  // Waveform draw
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barW = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barH = (dataArray[i] / 255) * canvas.height;
      ctx.fillStyle = `rgba(255,85,0,${0.4 + (dataArray[i] / 255) * 0.6})`;
      ctx.fillRect(x, canvas.height - barH, barW, barH);
      x += barW + 1;
    }
    animFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      src.connect(analyser);
      analyserRef.current = analyser;

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioDuration(elapsed);
        setState("done");
        stream.getTracks().forEach((t) => t.stop());
        cancelAnimationFrame(animFrameRef.current);
      };
      mr.start();
      setState("recording");
      intervalRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
      animFrameRef.current = requestAnimationFrame(drawWaveform);
    } catch {
      alert("Microphone access denied. Please allow microphone access to use Voice Note.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setElapsed(0);
    setIsPlaying(false);
    blobRef.current = null;
    setState("idle");
  };

  const handleSave = () => {
    if (blobRef.current) onSave(blobRef.current, audioDuration);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8" style={{ padding: "48px 32px" }}>
      {/* Ghost */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ fontSize: 180, fontWeight: 700, color: "#FFFFFF", opacity: 0.025 }}>FORGE</div>

      <AnimatePresence mode="wait">
        {state !== "done" ? (
          <motion.div key="recording-ui" className="flex flex-col items-center gap-6 relative z-10"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            {/* Pulse rings */}
            {state === "recording" && [0, 1, 2].map((i) => (
              <motion.div key={i} className="absolute rounded-full pointer-events-none"
                style={{ width: 120 + i * 40, height: 120 + i * 40, border: "1px solid rgba(255,45,45,0.25)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: -1 }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }} />
            ))}

            {/* Record / Stop button */}
            <motion.button
              onClick={state === "idle" ? startRecording : stopRecording}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="w-30 h-30 rounded-full flex items-center justify-center transition-all"
              style={{
                width: 120, height: 120,
                background: state === "recording" ? "rgba(255,45,45,0.15)" : "rgba(255,85,0,0.15)",
                border: `2px solid ${state === "recording" ? "#FF2D2D" : "rgba(255,85,0,0.40)"}`,
              }}
            >
              {state === "recording"
                ? <Square size={40} style={{ color: "#FF2D2D" }} />
                : <Mic size={40} style={{ color: "#FF5500" }} />
              }
            </motion.button>

            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              {state === "idle" ? "Tap to begin recording" : "Recording — tap to stop"}
            </p>

            {state === "recording" && (
              <p className="font-mono font-bold text-white text-3xl tabular-nums">{formatTime(elapsed)}</p>
            )}

            {/* Waveform canvas */}
            {state === "recording" && (
              <canvas ref={canvasRef} width={400} height={60} className="rounded-lg"
                style={{ background: "rgba(255,255,255,0.03)" }} />
            )}
          </motion.div>
        ) : (
          <motion.div key="done-ui" className="flex flex-col items-center gap-5 relative z-10 w-full max-w-md"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />}

            {/* Playback bar */}
            <div className="w-full rounded-xl p-4 flex items-center gap-4"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={togglePlay}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "#FF5500" }}>
                {isPlaying ? <Pause size={18} color="white" /> : <Play size={18} color="white" />}
              </button>
              <div className="flex-1">
                <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full" style={{ background: "#FF5500", width: "60%" }} />
                </div>
              </div>
              <span className="font-mono text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{formatTime(audioDuration)}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleSave}
                className="rounded-full h-10 px-6 text-sm font-medium text-white"
                style={{ background: "#FF5500" }}>
                Save Recording
              </button>
              <button onClick={reset}
                className="rounded-full h-10 px-6 text-sm font-medium flex items-center gap-2"
                style={{ border: "1px solid rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.60)" }}>
                <RotateCcw size={14} /> Re-record
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
