"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, type Variants } from "framer-motion";
import { Mail, Lock } from "lucide-react";

import { signInSchema, type SignInFormData } from "@/lib/validations/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import AuthShell from "@/components/auth/AuthShell";
import AuthInput from "@/components/auth/AuthInput";
import GoogleButton from "@/components/auth/GoogleButton";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";

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

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const fieldContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function SignInPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, loading: authLoading } = useAuth();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0); // increment to re-trigger shake

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
  });

  const isLoading = isSubmitting || authLoading;

  const onSubmit = async (data: SignInFormData) => {
    setFormError(null);
    const { success, redirectTo } = await signIn(data.email, data.password);

    if (success && redirectTo) {
      router.push(redirectTo);
    } else if (!success) {
      // Trigger shake
      setShakeKey((k) => k + 1);
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
          New here?{" "}
          <Link href="/signup" className="font-medium hover:text-[#1A1A1A] transition-colors" style={{ color: "#FF5500" }}>
            Sign Up →
          </Link>
        </>
      }
    >
      <ForgotPasswordModal
        isOpen={showForgot}
        onClose={() => setShowForgot(false)}
      />

      {/* Auth card */}
      <motion.div
        key={shakeKey}
        variants={cardVariants}
        initial="hidden"
        animate={
          shakeKey > 0
            ? {
                x: [0, -8, 8, -4, 4, 0],
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  x: { duration: 0.4, ease: "easeOut" },
                },
              }
            : "visible"
        }
        className="mx-auto w-full max-w-[440px]"
        style={{
          background: "#FFFFFF",
          borderRadius: 28,
          padding: "44px 48px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header */}
        <div className="mb-8">
          <p
            className="uppercase tracking-widest text-xs font-medium mb-2"
            style={{ color: "rgba(0,0,0,0.40)" }}
          >
            Welcome back
          </p>
          <h1
            className="font-bold mb-1"
            style={{ fontSize: 40, color: "#1A1A1A", lineHeight: 1.1 }}
          >
            You&apos;re back.
          </h1>
          <p style={{ fontSize: 15, color: "rgba(0,0,0,0.50)", lineHeight: 1.6 }}>
            Your Imprint has been waiting.
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
                placeholder="Password"
                leftIcon={<Lock size={16} />}
                hasPasswordToggle
                error={errors.password?.message}
                autoComplete="current-password"
              />
            </motion.div>
          </motion.div>

          {/* Forgot password */}
          <div className="flex justify-end mt-2 mb-1">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-xs hover:underline transition-colors"
              style={{ color: "#FF5500" }}
            >
              Forgot password?
            </button>
          </div>

          {/* Global error */}
          {formError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 text-xs text-center"
              style={{ color: "#FF2D2D" }}
            >
              {formError}
            </motion.p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[52px] rounded-pill text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-4"
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
                Entering...
              </>
            ) : (
              "Enter IMPRINT"
            )}
          </button>
        </form>

        {/* Sign up redirect */}
        <p
          className="text-center mt-5 text-sm"
          style={{ color: "rgba(0,0,0,0.45)" }}
        >
          No Imprint yet?{" "}
          <Link href="/signup" className="font-medium hover:underline" style={{ color: "#FF5500" }}>
            Begin yours →
          </Link>
        </p>
      </motion.div>
    </AuthShell>
  );
}
