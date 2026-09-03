"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import type { DashboardProfile, DashboardDriftScore } from "@/lib/dashboard/types";
import { readSidebarCollapsed, onSidebarCollapsedChange, SIDEBAR_COLLAPSED_W, SIDEBAR_EXPANDED_W } from "@/lib/dashboard/sidebar-state";


interface DashboardShellProps {
  children: React.ReactNode;
  profile: DashboardProfile | null;
  driftScore: DashboardDriftScore | null;
}

export default function DashboardShell({ children, profile, driftScore }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  // Event-driven, not polled. The old version ran setInterval(sync, 300) for
  // the lifetime of every dashboard page and still lagged the toggle by up to
  // 300ms; this updates in the same tick as the click.
  useEffect(() => {
    setCollapsed(readSidebarCollapsed());
    return onSidebarCollapsedChange(setCollapsed);
  }, []);

  // The sidebar is hidden below md, so nothing should be offset for it there.
  // Previously the rail's width was reserved at every viewport, which left
  // 243px of usable content width on a 375px screen and pushed 69 elements
  // off-screen.
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const sidebarWidth = isDesktop ? (collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W) : 0;

  return (
    // overflow-x-hidden: several pages place a decorative ghost-word watermark
    // at right-[-10%]. Each carries overflow-hidden, but that clips its own
    // children, not the element itself, so the word extended past the viewport
    // and gave Settings and the Credential page a real horizontal scrollbar.
    // Clipping at the shell fixes every page and stops the next one recurring.
    <div
      className="min-h-screen overflow-x-hidden"
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
        {/* Tighter gutters on mobile, and bottom clearance so the 60px fixed
            MobileTabBar does not sit on top of the last row of content. */}
        <div
          className="mx-auto px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-12"
          style={{ maxWidth: 1400 }}
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
