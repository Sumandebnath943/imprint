"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search } from "lucide-react";
import type { DashboardProfile, DashboardDriftScore } from "@/lib/dashboard/types";
import { getDriftColor } from "@/lib/dashboard/types";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/forge": "The Forge",
  "/dashboard/mirror": "The Mirror",
  "/dashboard/vault": "Skill Vault",
  "/dashboard/journal": "Journal",
  "/dashboard/drift": "Drift Score",
  "/dashboard/calibration": "Calibration",
  "/dashboard/time-capsule": "Time Capsule",
  "/dashboard/beliefs": "Beliefs",
  "/dashboard/gallery": "Gallery",
  "/dashboard/circles": "Circles",
  "/dashboard/courses": "Courses",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
};

interface TopBarProps {
  profile: DashboardProfile | null;
  driftScore: DashboardDriftScore | null;
  sidebarWidth: number;
}

export default function TopBar({ profile, driftScore, sidebarWidth }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasNotif] = useState(false);

  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  const score = driftScore?.score ?? 0;
  const driftColor = getDriftColor(score);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div
      className="fixed top-0 right-0 z-40 flex items-center px-8 gap-6"
      style={{
        left: sidebarWidth,
        height: 64,
        background: "rgba(8,8,8,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        transition: "left 0.25s ease",
      }}
    >
      {/* Page title */}
      <h1
        className="font-semibold text-white whitespace-nowrap"
        style={{ fontSize: 20, fontFamily: "Space Grotesk, sans-serif" }}
      >
        {title}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right cluster */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <button className="relative p-1.5 rounded-lg transition-colors hover:bg-white/5">
          <Bell size={20} style={{ color: "rgba(255,255,255,0.50)" }} />
          {hasNotif && (
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ background: "#FF5500", boxShadow: "0 0 6px rgba(255,85,0,0.8)" }}
            />
          )}
        </button>

        {/* Drift score pill */}
        <Link
          href="/dashboard/drift"
          className="flex items-center gap-2 rounded-full transition-all hover:opacity-80"
          style={{
            background: "rgba(255,85,0,0.12)",
            border: "1px solid rgba(255,85,0,0.25)",
            padding: "6px 14px",
          }}
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: driftColor }} />
          <span className="font-medium text-white" style={{ fontSize: 13, fontFamily: "Space Grotesk, sans-serif" }}>
            Drift: {score}
          </span>
        </Link>

        {/* User avatar */}
        <Link
          href="/dashboard/profile"
          className="flex items-center justify-center rounded-full shrink-0 font-medium transition-all hover:opacity-80"
          style={{
            width: 32,
            height: 32,
            background: profile?.avatar_url ? "transparent" : "rgba(255,85,0,0.20)",
            color: "#FF5500",
            fontSize: 12,
          }}
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
          ) : initials}
        </Link>
      </div>
    </div>
  );
}
