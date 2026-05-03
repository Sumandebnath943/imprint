"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { getZoneColor } from "@/lib/drift/types";

interface DriftRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showCenter?: boolean;
  signals?: { label: string; good: boolean }[];
}

export default function DriftRing({ score, size = 240, strokeWidth = 12, showCenter = true, signals }: DriftRingProps) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const color = getZoneColor(score);

  // Animate score count
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, score, { duration: 2, ease: "easeOut", onUpdate: (v) => setDisplayScore(Math.round(v)) });
    return () => ctrl.stop();
  }, [score]);

  // Arc fill: score/100 of circumference (higher = more filled = worse)
  const fill = (score / 100) * circ;
  const [arcFill, setArcFill] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, fill, { duration: 2, ease: "easeOut", onUpdate: (v) => setArcFill(v) });
    return () => ctrl.stop();
  }, [fill]);

  const cx = size / 2, cy = size / 2;

  // 4 orbiting signal dots (Top, Right, Bottom, Left)
  const dotAngles = [-90, 0, 90, 180]; // top, right, bottom, left
  const dotR = size / 2 + strokeWidth;

  const getZoneShort = (s: number) => s < 40 ? "Anchored" : s < 60 ? "Drifting" : s < 80 ? "Critical" : "Crisis";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer glow */}
      <div className="absolute rounded-full pointer-events-none"
        style={{ inset: -8, background: `radial-gradient(circle, ${color}26 0%, transparent 70%)` }} />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
        {/* Decorative outer ring */}
        <circle cx={cx} cy={cy} r={r + strokeWidth / 2 + 4} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />

        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />

        {/* Score arc — counter-clockwise (rotate so 0 is top) */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcFill} ${circ}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />

        {/* Orbiting signal dots */}
        {signals && dotAngles.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const dx = cx + dotR * Math.cos(rad);
          const dy = cy + dotR * Math.sin(rad);
          const sig = signals[i];
          if (!sig) return null;
          return (
            <g key={i}>
              <circle cx={dx} cy={dy} r={5} fill={sig.good ? "#00D97E" : "#FF2D2D"} aria-label={`${sig.label}: ${sig.good ? "Good" : "Needs work"}`} />
            </g>
          );
        })}
      </svg>

      {/* Center label */}
      {showCenter && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold" style={{ fontSize: size > 160 ? 56 : 32, color: "white", lineHeight: 1 }}>
            {displayScore}
          </span>
          {size > 160 && (
            <>
              <span className="mt-1" style={{ fontSize: 13, color: "rgba(255,255,255,0.40)" }}>Drift Score</span>
              <span className="mt-0.5 font-medium" style={{ fontSize: 13, color }}>{getZoneShort(score)}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
