"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import type { DashboardProfile, DashboardDriftScore } from "@/lib/dashboard/types";

const COLLAPSED_W = 68;
const EXPANDED_W = 240;
const LS_KEY = "imprint_sidebar_collapsed";

interface DashboardShellProps {
  children: React.ReactNode;
  profile: DashboardProfile | null;
  driftScore: DashboardDriftScore | null;
}

export default function DashboardShell({ children, profile, driftScore }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  // Sync with sidebar's localStorage state
  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem(LS_KEY);
      setCollapsed(saved !== "false");
    };
    sync();
    // Re-sync on storage events (if sidebar toggle happens in another component)
    window.addEventListener("storage", sync);
    // Poll on interval for same-tab updates
    const id = setInterval(sync, 300);
    return () => { window.removeEventListener("storage", sync); clearInterval(id); };
  }, []);

  const sidebarWidth = collapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <div
      className="min-h-screen"
      style={{ background: "#080808", fontFamily: "Space Grotesk, sans-serif" }}
    >
      {/* Ambient glow — top-right, fixed */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: -100,
          right: -100,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,85,0,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />

      {/* Sidebar */}
      <Sidebar profile={profile} />

      {/* Top bar */}
      <TopBar
        profile={profile}
        driftScore={driftScore}
        sidebarWidth={sidebarWidth}
      />

      {/* Main scrollable area */}
      <motion.main
        animate={{ marginLeft: sidebarWidth }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="relative z-10 min-h-screen"
        style={{ paddingTop: 64 }}
      >
        <div
          className="mx-auto"
          style={{ maxWidth: 1400, padding: "40px 32px 48px" }}
        >
          {children}
        </div>
      </motion.main>

      {/* Mobile bottom tab bar */}
      <MobileTabBar pathname={pathname} />
    </div>
  );
}

const MOBILE_TABS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/dashboard/forge", label: "Forge", icon: "🔥" },
  { href: "/dashboard/mirror", label: "Mirror", icon: "✨" },
  { href: "/dashboard/vault", label: "Vault", icon: "🛡️" },
  { href: "/dashboard/profile", label: "Profile", icon: "👤" },
];

function MobileTabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex"
      style={{
        background: "rgba(8,8,8,0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        height: 60,
      }}
    >
      {MOBILE_TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <a
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all"
            style={{ color: active ? "#FF5500" : "rgba(255,255,255,0.40)" }}
          >
            <span style={{ fontSize: 18 }}>{tab.icon}</span>
            {active && <span style={{ fontSize: 10, fontWeight: 600 }}>{tab.label}</span>}
          </a>
        );
      })}
    </nav>
  );
}
