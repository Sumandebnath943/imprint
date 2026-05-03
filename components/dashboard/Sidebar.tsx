"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Flame, Sparkles, Shield, BookOpen,
  Activity, Radio, Clock, Heart, Image, Users,
  GraduationCap, User, Settings, ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";
import type { DashboardProfile } from "@/lib/dashboard/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const NAV_GROUPS = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/forge", label: "The Forge", icon: Flame },
      { href: "/dashboard/mirror", label: "The Mirror", icon: Sparkles },
      { href: "/dashboard/vault", label: "Skill Vault", icon: Shield },
      { href: "/dashboard/journal", label: "Journal", icon: BookOpen },
      { href: "/dashboard/drift", label: "Drift Score", icon: Activity },
      { href: "/dashboard/calibration", label: "Calibration", icon: Radio },
    ],
  },
  {
    items: [
      { href: "/dashboard/time-capsule", label: "Time Capsule", icon: Clock },
      { href: "/dashboard/beliefs", label: "Beliefs", icon: Heart },
      { href: "/dashboard/gallery", label: "Gallery", icon: Image },
    ],
  },
  {
    items: [
      { href: "/dashboard/circles", label: "Circles", icon: Users },
      { href: "/dashboard/courses", label: "Courses", icon: GraduationCap },
    ],
  },
  {
    items: [
      { href: "/dashboard/profile", label: "Profile", icon: User },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

const COLLAPSED_W = 68;
const EXPANDED_W = 240;
const LS_KEY = "imprint_sidebar_collapsed";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  collapsed: boolean;
  isActive: boolean;
}

function NavItem({ href, label, icon: Icon, collapsed, isActive }: NavItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => collapsed && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Link
        href={href}
        className="flex items-center gap-3 rounded-[10px] transition-all duration-150 group"
        style={{
          padding: collapsed ? "12px 0" : "10px 20px",
          justifyContent: collapsed ? "center" : "flex-start",
          margin: "2px 8px",
          background: isActive ? "rgba(255,85,0,0.10)" : "transparent",
          borderLeft: isActive ? "2px solid #FF5500" : "2px solid transparent",
        }}
        onMouseOver={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
          }
        }}
        onMouseOut={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }
        }}
      >
        <Icon
          size={20}
          style={{ color: isActive ? "#FF5500" : "rgba(255,255,255,0.35)", flexShrink: 0 }}
        />
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-sm font-medium whitespace-nowrap"
            style={{ color: isActive ? "white" : "rgba(255,255,255,0.50)" }}
          >
            {label}
          </motion.span>
        )}
      </Link>

      {/* Tooltip for collapsed mode */}
      <AnimatePresence>
        {collapsed && showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none"
            style={{
              background: "#1A1A1A",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 8,
              padding: "6px 12px",
              whiteSpace: "nowrap",
            }}
          >
            <span className="text-white" style={{ fontSize: 13 }}>{label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Divider() {
  return (
    <div className="my-2 mx-4" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
  );
}

interface SidebarProps {
  profile: DashboardProfile | null;
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(LS_KEY, String(next));
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error("Failed to sign out"); return; }
    router.push("/");
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <motion.aside
      animate={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="fixed top-0 left-0 h-full z-50 flex flex-col overflow-hidden"
      style={{
        background: "#0D0D0D",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center border-b shrink-0"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          height: 64,
          padding: collapsed ? "0 0" : "0 20px",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        {collapsed ? (
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "#FF5500", boxShadow: "0 0 8px rgba(255,85,0,0.8)" }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center"
          >
            <span className="text-base font-bold text-white tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              IMPRINT
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full ml-0.5 mb-2"
              style={{ background: "#FF5500", boxShadow: "0 0 6px rgba(255,85,0,0.8)" }}
            />
          </motion.div>
        )}
      </div>

      {/* Nav scroll area */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3" style={{ scrollbarWidth: "none" }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <Divider />}
            {group.items.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                collapsed={collapsed}
                isActive={isActive(item.href, item.exact)}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div
        className="border-t shrink-0 pb-4 pt-3"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        {/* User row */}
        <div
          className="flex items-center gap-3 px-3 pb-3"
          style={{ justifyContent: collapsed ? "center" : "flex-start" }}
        >
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
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-w-0 flex-1"
            >
              <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? "User"}</p>
              <Link
                href="/dashboard/profile"
                className="text-xs transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                View Profile
              </Link>
            </motion.div>
          )}
        </div>

        {/* Sign out */}
        <div style={{ padding: collapsed ? "0 8px" : "0 12px", marginBottom: 6 }}>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 rounded-lg transition-all duration-150"
            style={{
              height: 36,
              padding: collapsed ? "0" : "0 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              color: "rgba(255,255,255,0.35)",
            }}
            title="Sign out"
            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.color = "#FF5500"; (e.currentTarget as HTMLElement).style.background = "rgba(255,85,0,0.06)"; }}
            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <LogOut size={15} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: 13 }}>Sign out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <div style={{ padding: collapsed ? "0 8px" : "0 12px" }}>
          <button
            onClick={toggle}
            className="w-full flex items-center justify-center rounded-lg transition-all duration-150"
            style={{
              height: 32,
              background: "rgba(255,255,255,0.04)",
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
          >
            {collapsed
              ? <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.40)" }} />
              : <ChevronLeft size={14} style={{ color: "rgba(255,255,255,0.40)" }} />
            }
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
