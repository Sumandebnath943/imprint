"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu } from "lucide-react";

const NAV_LINKS = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "The Engine", href: "/#engine" },
  { label: "About", href: "/about" },
  { label: "Courses", href: "/courses" },
];

export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(8,8,8,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid transparent",
        }}
      >
        <nav className="max-w-[1440px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-0.5 group">
            <span
              className="text-xl font-bold text-white tracking-tight"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              IMPRINT
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full bg-imprint-orange mb-3 ml-0.5"
              style={{
                boxShadow: "0 0 8px rgba(255,85,0,0.8)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
          </Link>

          {/* Center Links — desktop */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLElement).style.color = "#ffffff")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.color =
                      "rgba(255,255,255,0.65)")
                  }
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right CTAs — desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/signin"
              className="h-9 px-5 rounded-pill flex items-center text-sm text-white transition-all duration-200 hover:bg-white/5"
              style={{ border: "0.5px solid rgba(255,255,255,0.35)" }}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="h-9 px-5 rounded-pill flex items-center text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
              style={{
                background: "#FF5500",
                boxShadow: "0 0 20px rgba(255,85,0,0.25)",
              }}
            >
              Begin Your Imprint
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </nav>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-72 flex flex-col"
              style={{
                background: "#111111",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <span className="font-bold text-white text-lg">IMPRINT</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-white/50 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 p-6 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="py-3 text-sm text-white/65 hover:text-white transition-colors border-b border-white/5"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="p-6 flex flex-col gap-3">
                <Link
                  href="/signin"
                  className="h-11 flex items-center justify-center rounded-pill text-sm text-white border border-white/20 hover:bg-white/5 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="h-11 flex items-center justify-center rounded-pill text-sm font-medium text-white"
                  style={{ background: "#FF5500" }}
                >
                  Begin Your Imprint
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </>
  );
}
