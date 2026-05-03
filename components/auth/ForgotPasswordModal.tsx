"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthInput from "./AuthInput";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
}: ForgotPasswordModalProps) {
  const { resetPassword, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    const { success } = await resetPassword(email);
    if (success) {
      setSubmitted(true);
    }
  };

  const handleClose = () => {
    setEmail("");
    setSubmitted(false);
    setLocalError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}
            onClick={handleClose}
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-[400px] pointer-events-auto"
              style={{
                background: "#FFFFFF",
                borderRadius: 24,
                padding: "40px",
                boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-black/5"
                style={{ color: "rgba(0,0,0,0.40)" }}
              >
                <X size={16} />
              </button>

              {!submitted ? (
                <>
                  <h2
                    className="font-semibold mb-2"
                    style={{ fontSize: 22, color: "#1A1A1A" }}
                  >
                    Reset your password
                  </h2>
                  <p
                    className="mb-6 text-sm leading-relaxed"
                    style={{ color: "rgba(0,0,0,0.50)" }}
                  >
                    Enter your email and we&apos;ll send a reset link.
                  </p>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <AuthInput
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      leftIcon={<Mail size={16} />}
                      error={localError}
                      required
                    />

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-[52px] rounded-pill text-white text-sm font-medium transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
                      style={{
                        background: "#FF5500",
                        marginTop: 4,
                      }}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin" width={16} height={16} viewBox="0 0 24 24" fill="none">
                            <circle cx={12} cy={12} r={10} stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth={3} strokeLinecap="round" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: "rgba(0,217,126,0.12)" }}
                  >
                    <CheckCircle size={26} style={{ color: "#00D97E" }} />
                  </div>
                  <h2
                    className="font-semibold mb-2"
                    style={{ fontSize: 20, color: "#1A1A1A" }}
                  >
                    Check your email.
                  </h2>
                  <p
                    className="text-sm leading-relaxed mb-6"
                    style={{ color: "rgba(0,0,0,0.50)" }}
                  >
                    We sent a reset link to{" "}
                    <span className="font-medium" style={{ color: "#1A1A1A" }}>
                      {email}
                    </span>
                  </p>
                  <button
                    onClick={handleClose}
                    className="h-[46px] px-8 rounded-pill text-sm font-medium transition-all"
                    style={{
                      background: "#F0EBE3",
                      color: "#1A1A1A",
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
