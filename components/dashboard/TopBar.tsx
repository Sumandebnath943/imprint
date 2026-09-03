"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import type { DashboardProfile, DashboardDriftScore } from "@/lib/dashboard/types";
import { getDriftColor } from "@/lib/dashboard/types";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  label: string;
  detail: string;
  href: string;
}

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
  "/dashboard/profile/credential": "Identity Credential",
  "/dashboard/settings": "Settings",
  "/dashboard/leaderboard": "Leaderboard",
  "/dashboard/mentors": "Mentors",
  "/dashboard/mirror/history": "Mirror History",
};

/**
 * Longest matching prefix, so nested routes inherit their section's title
 * instead of falling through to "Dashboard". Leaderboard, Mentors and the
 * nested credential and mirror-history pages all showed "Dashboard" before.
 */
function titleFor(pathname: string): string {
  let best = "";
  for (const route of Object.keys(PAGE_TITLES)) {
    if ((pathname === route || pathname.startsWith(route + "/")) && route.length > best.length) {
      best = route;
    }
  }
  return best ? PAGE_TITLES[best] : "Dashboard";
}

interface TopBarProps {
  profile: DashboardProfile | null;
  driftScore: DashboardDriftScore | null;
  sidebarWidth: number;
}

export default function TopBar({ profile, driftScore, sidebarWidth }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const hasNotif = notifications.length > 0;

  // Derived from data the user already has, rather than a notifications table:
  // challenges coming due, time capsules that have unlocked, and incoming
  // mentorship requests. Previously the bell was hardcoded to never light up.
  const loadNotifications = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];

      const [challenges, capsules, requests] = await Promise.all([
        supabase
          .from("vault_challenges")
          .select("id, challenge_title, due_date")
          .eq("user_id", profile.id)
          .eq("status", "pending")
          .lte("due_date", today)
          .limit(5),
        supabase
          .from("time_capsules")
          .select("id, title, unlock_date")
          .eq("user_id", profile.id)
          .eq("is_unlocked", false)
          .lte("unlock_date", today)
          .limit(5),
        supabase
          .from("mentorship_requests")
          .select("id, status")
          .eq("mentor_id", profile.id)
          .eq("status", "pending")
          .limit(5),
      ]);

      const next: Notification[] = [
        ...(challenges.data ?? []).map((c) => ({
          id: `challenge-${c.id}`,
          label: "Challenge due",
          detail: c.challenge_title,
          href: "/dashboard/vault",
        })),
        ...(capsules.data ?? []).map((c) => ({
          id: `capsule-${c.id}`,
          label: "Time capsule unlocked",
          detail: c.title,
          href: "/dashboard/time-capsule",
        })),
        ...(requests.data ?? []).map((r) => ({
          id: `request-${r.id}`,
          label: "Mentorship request",
          detail: "Someone asked you to mentor them",
          href: "/dashboard/mentors",
        })),
      ];

      setNotifications(next);
    } catch (err) {
      console.error("[TopBar] notifications failed", err);
    }
  }, [profile?.id]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Close the panel on outside click.
  useEffect(() => {
    if (!notifOpen) return;
    const onDown = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [notifOpen]);

  const title = titleFor(pathname);
  const score = driftScore?.score ?? 0;
  const driftColor = getDriftColor(score);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    // Same frosted treatment as the public nav (see .imprint-glass in
    // globals.css), so the two fixed bars read as one material. Always on
    // here — unlike the landing nav there is no transparent-over-hero state.
    <div
      className="fixed top-0 right-0 z-40 flex items-center px-8 gap-6 imprint-glass"
      data-glass="on"
      style={{
        left: sidebarWidth,
        height: 64,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        transition: "left 0.25s ease",
      }}
    >
      {/* 1px light catch along the top edge. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)",
        }}
      />

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
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            aria-label={hasNotif ? `Notifications (${notifications.length} new)` : "Notifications"}
            aria-expanded={notifOpen}
            className="relative p-1.5 rounded-lg transition-colors hover:bg-white/5"
          >
            <Bell size={20} style={{ color: "rgba(255,255,255,0.50)" }} />
            {hasNotif && (
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ background: "#FF5500", boxShadow: "0 0 6px rgba(255,85,0,0.8)" }}
              />
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 mt-2 w-[300px] rounded-[12px] overflow-hidden z-50"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 16px 40px rgba(0,0,0,0.6)" }}
            >
              <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-[13px] font-semibold text-white">Needs your attention</span>
              </div>

              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-[13px] text-center" style={{ color: "rgba(255,255,255,0.62)" }}>
                  Nothing pending. You&apos;re current.
                </p>
              ) : (
                <ul className="max-h-[320px] overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => { setNotifOpen(false); router.push(n.href); }}
                        className="w-full text-left px-4 py-3 transition-colors hover:bg-white/5"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <span className="block text-[11px] uppercase tracking-wide mb-0.5" style={{ color: "#FF5500" }}>
                          {n.label}
                        </span>
                        <span className="block text-[13px] text-white truncate">{n.detail}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

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
