"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Lock, CheckCircle } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import AuthShell from "@/components/auth/AuthShell";
import AuthInput from "@/components/auth/AuthInput";
import PasswordStrength from "@/components/auth/PasswordStrength";

// ─── Schema ───────────────────────────────────────────────────────────────────
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin" width={18} height={18} viewBox="0 0 24 24" fill="none">
      <circle cx={12} cy={12} r={10} stroke="rgba(255,255,255,0.30)" strokeWidth={3} />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
  });

  const passwordValue = watch("password", "");

  const onSubmit = async (data: ResetPasswordFormData) => {
    const { success: ok } = await updatePassword(data.password);
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        toast.success("Password updated. Sign in with your new password.");
        router.push("/signin");
      }, 2000);
    }
  };

  return (
    <AuthShell
      topRightSlot={
        <>
          Remember it?{" "}
          <Link href="/signin" className="font-medium" style={{ color: "#FF5500" }}>
            Sign In →
          </Link>
        </>
      }
    >
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto w-full max-w-[440px]"
        style={{
          background: "#FFFFFF",
          borderRadius: 28,
          padding: "44px 48px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.12)",
        }}
      >
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(0,217,126,0.12)" }}
              >
                <CheckCircle size={32} style={{ color: "#00D97E" }} />
              </div>
              <h2 className="font-bold mb-2" style={{ fontSize: 24, color: "#1A1A1A" }}>
                Password updated.
              </h2>
              <p style={{ color: "rgba(0,0,0,0.50)", fontSize: 15 }}>
                Redirecting you to Sign In...
              </p>
            </motion.div>
          ) : (
            <motion.div key="form">
              <div className="mb-8">
                <p
                  className="uppercase tracking-widest text-xs font-medium mb-2"
                  style={{ color: "rgba(0,0,0,0.40)" }}
                >
                  Password Reset
                </p>
                <h1
                  className="font-bold mb-2"
                  style={{ fontSize: 36, color: "#1A1A1A", lineHeight: 1.1 }}
                >
                  New password.
                </h1>
                <p style={{ fontSize: 15, color: "rgba(0,0,0,0.50)", lineHeight: 1.6 }}>
                  Choose a strong password to protect your Imprint.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
                <div>
                  <AuthInput
                    {...register("password")}
                    type="password"
                    placeholder="New password"
                    leftIcon={<Lock size={16} />}
                    hasPasswordToggle
                    error={errors.password?.message}
                    autoComplete="new-password"
                  />
                  <PasswordStrength password={passwordValue} />
                </div>

                <AuthInput
                  {...register("confirm_password")}
                  type="password"
                  placeholder="Confirm new password"
                  leftIcon={<Lock size={16} />}
                  hasPasswordToggle
                  error={errors.confirm_password?.message}
                  autoComplete="new-password"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[52px] rounded-pill text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 mt-2"
                  style={{
                    background: "#FF5500",
                    boxShadow: isSubmitting ? "none" : "0 4px 20px rgba(255,85,0,0.25)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      (e.currentTarget as HTMLButtonElement).style.background = "#FF7A30";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#FF5500";
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AuthShell>
  );
}
