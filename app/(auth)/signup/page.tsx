"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { User, Mail, Lock, CheckCircle } from "lucide-react";

import { signUpSchema, type SignUpFormData } from "@/lib/validations/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import AuthShell from "@/components/auth/AuthShell";
import AuthInput from "@/components/auth/AuthInput";
import GoogleButton from "@/components/auth/GoogleButton";
import PasswordStrength from "@/components/auth/PasswordStrength";

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin" width={18} height={18} viewBox="0 0 24 24" fill="none">
      <circle cx={12} cy={12} r={10} stroke="rgba(255,255,255,0.30)" strokeWidth={3} />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.10)" }} />
      <span className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>or</span>
      <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.10)" }} />
    </div>
  );
}

// ─── Card animation variants ──────────────────────────────────────────────────
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const fieldContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.3 },
  },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─── Sign Up Page ─────────────────────────────────────────────────────────────
export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, loading: authLoading } = useAuth();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fadeToBlack, setFadeToBlack] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
  });

  const passwordValue = watch("password", "");
  const isLoading = isSubmitting || authLoading;

  const onSubmit = async (data: SignUpFormData) => {
    setFormError(null);
    const { success: ok } = await signUp(data.email, data.password, data.full_name);

    if (ok) {
      setSuccess(true);
      // After 1.5s show success, then fade to black, then navigate
      setTimeout(() => {
        setFadeToBlack(true);
        setTimeout(() => {
          router.push("/onboarding/welcome");
        }, 700);
      }, 1500);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signInWithGoogle();
    setGoogleLoading(false);
  };

  return (
    <AuthShell
      topRightSlot={
        <>
          Already have one?{" "}
          <Link href="/signin" className="font-medium hover:text-[#1A1A1A] transition-colors" style={{ color: "#FF5500" }}>
            Sign In →
          </Link>
        </>
      }
    >
      {/* Black fade overlay */}
      <AnimatePresence>
        {fadeToBlack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50"
            style={{ background: "#080808" }}
          />
        )}
      </AnimatePresence>

      {/* Auth card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto w-full max-w-[460px]"
        style={{
          background: "#FFFFFF",
          borderRadius: 28,
          padding: "44px 48px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.12)",
        }}
      >
        <AnimatePresence mode="wait">
          {success ? (
            /* ── Success State ─────────────────────────────────────── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-center py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(0,217,126,0.12)" }}
              >
                <CheckCircle size={32} style={{ color: "#00D97E" }} />
              </motion.div>
              <h2 className="font-bold mb-2" style={{ fontSize: 24, color: "#1A1A1A" }}>
                Imprint created.
              </h2>
              <p style={{ color: "rgba(0,0,0,0.50)", fontSize: 15 }}>
                Welcome. Let&apos;s capture who you are.
              </p>
            </motion.div>
          ) : (
            /* ── Form State ────────────────────────────────────────── */
            <motion.div key="form">
              {/* Header */}
              <div className="mb-8">
                <p
                  className="uppercase tracking-widest text-xs font-medium mb-2"
                  style={{ color: "rgba(0,0,0,0.40)" }}
                >
                  Create your Imprint
                </p>
                <h1
                  className="font-bold mb-2"
                  style={{ fontSize: 40, color: "#1A1A1A", lineHeight: 1.1 }}
                >
                  Begin.
                </h1>
                <p className="leading-relaxed" style={{ fontSize: 15, color: "rgba(0,0,0,0.50)", lineHeight: 1.6 }}>
                  Your identity engine starts here.{" "}
                  <span className="block">12 minutes to set your baseline.</span>
                </p>
              </div>

              {/* Google */}
              <GoogleButton
                onClick={handleGoogle}
                loading={googleLoading}
                label="Continue with Google"
              />

              <OrDivider />

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <motion.div
                  variants={fieldContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-3"
                >
                  {/* Full name */}
                  <motion.div variants={fieldVariants}>
                    <AuthInput
                      {...register("full_name")}
                      type="text"
                      placeholder="Your full name"
                      leftIcon={<User size={16} />}
                      error={errors.full_name?.message}
                      autoComplete="name"
                    />
                  </motion.div>

                  {/* Email */}
                  <motion.div variants={fieldVariants}>
                    <AuthInput
                      {...register("email")}
                      type="email"
                      placeholder="Email address"
                      leftIcon={<Mail size={16} />}
                      error={errors.email?.message}
                      autoComplete="email"
                    />
                  </motion.div>

                  {/* Password */}
                  <motion.div variants={fieldVariants}>
                    <AuthInput
                      {...register("password")}
                      type="password"
                      placeholder="Create a password"
                      leftIcon={<Lock size={16} />}
                      hasPasswordToggle
                      error={errors.password?.message}
                      autoComplete="new-password"
                    />
                    <PasswordStrength password={passwordValue} />
                  </motion.div>

                  {/* Confirm password */}
                  <motion.div variants={fieldVariants}>
                    <AuthInput
                      {...register("confirm_password")}
                      type="password"
                      placeholder="Confirm password"
                      leftIcon={<Lock size={16} />}
                      hasPasswordToggle
                      error={errors.confirm_password?.message}
                      autoComplete="new-password"
                    />
                  </motion.div>
                </motion.div>

                {/* Global form error */}
                {formError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-xs text-center"
                    style={{ color: "#FF2D2D" }}
                  >
                    {formError}
                  </motion.p>
                )}

                {/* Terms */}
                <p
                  className="text-center mt-4 mb-4"
                  style={{ fontSize: 12, color: "rgba(0,0,0,0.40)", lineHeight: 1.6 }}
                >
                  By continuing, you agree to IMPRINT&apos;s{" "}
                  <Link href="/terms" className="hover:underline" style={{ color: "#FF5500" }}>Terms</Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="hover:underline" style={{ color: "#FF5500" }}>Privacy Policy</Link>.
                </p>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] rounded-pill text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: "#FF5500",
                    boxShadow: isLoading ? "none" : "0 4px 20px rgba(255,85,0,0.25)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      (e.currentTarget as HTMLButtonElement).style.background = "#FF7A30";
                      (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.01)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#FF5500";
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                  }}
                >
                  {isLoading ? (
                    <>
                      <Spinner />
                      Creating...
                    </>
                  ) : (
                    "Create My Imprint"
                  )}
                </button>
              </form>

              {/* Sign in redirect */}
              <p
                className="text-center mt-5 text-sm"
                style={{ color: "rgba(0,0,0,0.45)" }}
              >
                Already have an Imprint?{" "}
                <Link href="/signin" className="font-medium hover:underline" style={{ color: "#FF5500" }}>
                  Sign in →
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AuthShell>
  );
}
