"use client";

import { motion } from "framer-motion";
import type { DashboardProfile } from "@/lib/dashboard/types";
import { getGreeting, getFirstName } from "@/lib/dashboard/types";
import { Flame } from "lucide-react";

interface GreetingRowProps {
  profile: DashboardProfile | null;
}

export default function GreetingRow({ profile }: GreetingRowProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const streak = profile?.streak_days ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start justify-between pb-8"
    >
      {/* Left */}
      <div>
        <p className="text-base mb-1" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "Space Grotesk, sans-serif" }}>
          {getGreeting()},
        </p>
        <h2
          className="font-bold text-white mb-3"
          style={{ fontSize: "clamp(32px,4vw,48px)", lineHeight: 1, fontFamily: "Space Grotesk, sans-serif" }}
        >
          {getFirstName(profile?.full_name ?? null)}.
        </h2>
        {profile?.profession && (
          <span
            className="inline-flex items-center rounded-full text-sm font-medium"
            style={{
              background: "rgba(255,85,0,0.10)",
              border: "1px solid rgba(255,85,0,0.25)",
              padding: "6px 14px",
              color: "#FF5500",
              fontSize: 13,
              fontFamily: "Space Grotesk, sans-serif",
            }}
          >
            {profile.profession}{profile.profession_cluster ? ` · ${profile.profession_cluster}` : ""}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="text-right">
        <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.40)" }}>{dateStr}</p>
        {streak > 0 ? (
          <div className="flex items-center justify-end gap-1.5">
            <Flame size={16} style={{ color: "#FF5500" }} />
            <span className="font-semibold text-sm" style={{ color: "#FF5500", fontFamily: "Space Grotesk, sans-serif" }}>
              {streak} day streak
            </span>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Start your streak today</p>
        )}
      </div>
    </motion.div>
  );
}
