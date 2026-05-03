"use client";

import { motion } from "framer-motion";

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={className}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, ...style }}
    />
  );
}

export default function DashboardSkeleton() {
  return (
    <div>
      {/* Greeting */}
      <div className="flex justify-between pb-8">
        <div className="flex flex-col gap-3">
          <Skeleton style={{ width: 120, height: 16 }} />
          <Skeleton style={{ width: 200, height: 48, borderRadius: 8 }} />
          <Skeleton style={{ width: 160, height: 28, borderRadius: 100 }} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton style={{ width: 100, height: 14 }} />
          <Skeleton style={{ width: 80, height: 14 }} />
        </div>
      </div>

      {/* Hero row */}
      <div className="flex gap-5 mb-6">
        <Skeleton style={{ flex: "0 0 calc(65% - 10px)", height: 340, borderRadius: 20 }} />
        <div className="flex flex-col gap-4" style={{ flex: "0 0 calc(35% - 10px)" }}>
          <Skeleton style={{ flex: 1, height: 100, borderRadius: 16 }} />
          <Skeleton style={{ flex: 1, height: 100, borderRadius: 16 }} />
          <Skeleton style={{ flex: 1, height: 100, borderRadius: 16 }} />
        </div>
      </div>

      {/* Skills */}
      <div className="mb-6">
        <div className="flex justify-between mb-4">
          <Skeleton style={{ width: 100, height: 20 }} />
          <Skeleton style={{ width: 60, height: 16 }} />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 110, borderRadius: 20 }} />
          ))}
        </div>
      </div>

      {/* Activity */}
      <div className="flex gap-5 mb-6">
        <Skeleton style={{ flex: "0 0 calc(60% - 10px)", height: 220, borderRadius: 20 }} />
        <Skeleton style={{ flex: "0 0 calc(40% - 10px)", height: 220, borderRadius: 20 }} />
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-3 gap-5">
        <Skeleton style={{ height: 200, borderRadius: 20 }} />
        <Skeleton style={{ height: 200, borderRadius: 20 }} />
        <Skeleton style={{ height: 200, borderRadius: 20 }} />
      </div>
    </div>
  );
}
