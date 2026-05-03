"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Play, Pause, RotateCcw } from "lucide-react";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [state, setState] = useState<"idle" | "recording" | "done">("idle");
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete(blob, duration);
        setState("done");
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start();
      setState("recording");
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      alert("Microphone access is required for voice recording.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
    setState("idle");
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />}

      {/* Record / Stop button */}
      <div className="relative flex items-center justify-center">
        {state === "recording" && (
          <>
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                className="absolute rounded-full"
                style={{ border: "1px solid rgba(255,45,45,0.30)" }}
                animate={{ width: [80 + ring * 24, 80 + ring * 40], height: [80 + ring * 24, 80 + ring * 40], opacity: [0.6, 0] }}
                transition={{ duration: 1.5, delay: ring * 0.4, repeat: Infinity, ease: "easeOut" }}
              />
            ))}
          </>
        )}

        <motion.button
          onClick={state === "idle" ? startRecording : state === "recording" ? stopRecording : undefined}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-20 h-20 rounded-full flex items-center justify-center relative z-10 transition-colors duration-300"
          style={{
            background: state === "recording" ? "#FF2D2D" : "#FF5500",
            boxShadow: state === "recording" ? "0 0 30px rgba(255,45,45,0.40)" : "0 0 20px rgba(255,85,0,0.30)",
          }}
        >
          {state === "recording" ? <Square size={24} fill="white" color="white" /> : <Mic size={28} color="white" />}
        </motion.button>
      </div>

      {/* Duration */}
      <AnimatePresence mode="wait">
        {state !== "idle" && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="font-mono text-2xl font-bold"
            style={{ color: state === "recording" ? "#FF2D2D" : "white" }}
          >
            {formatTime(duration)}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Status label */}
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
        {state === "idle" && "Tap to start recording"}
        {state === "recording" && "Recording… tap to stop"}
        {state === "done" && "Recording complete"}
      </p>

      {/* Playback controls */}
      {state === "done" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            {isPlaying ? <Pause size={16} color="white" /> : <Play size={16} color="white" />}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 text-sm transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <RotateCcw size={14} />
            Re-record
          </button>
        </motion.div>
      )}
    </div>
  );
}
