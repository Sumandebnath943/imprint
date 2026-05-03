"use client";

import { forwardRef, useState } from "react";
import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  hasPasswordToggle?: boolean;
  error?: string;
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ leftIcon, hasPasswordToggle, error, type, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const resolvedType = hasPasswordToggle
      ? showPassword
        ? "text"
        : "password"
      : type;

    return (
      <div className="relative">
        <div className="relative flex items-center">
          {/* Left icon */}
          {leftIcon && (
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex-shrink-0"
              style={{ color: "rgba(0,0,0,0.30)" }}
            >
              {leftIcon}
            </span>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={resolvedType}
            {...props}
            className={`w-full h-[52px] text-[15px] text-[#1A1A1A] placeholder:text-[rgba(0,0,0,0.30)] outline-none transition-all duration-200 ${className ?? ""}`}
            style={{
              background: error ? "rgba(255,45,45,0.06)" : "#F0EBE3",
              borderRadius: 100,
              padding: `0 ${hasPasswordToggle ? "48px" : "20px"} 0 ${leftIcon ? "44px" : "20px"}`,
              border: error
                ? "2px solid rgba(255,45,45,0.35)"
                : "2px solid transparent",
              outline: "none",
              ...props.style,
            }}
            onFocus={(e) => {
              const el = e.currentTarget;
              if (!error) {
                el.style.background = "#F5F0EB";
                el.style.border = "2px solid rgba(255,85,0,0.40)";
              }
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              const el = e.currentTarget;
              el.style.background = error ? "rgba(255,45,45,0.06)" : "#F0EBE3";
              el.style.border = error
                ? "2px solid rgba(255,45,45,0.35)"
                : "2px solid transparent";
              props.onBlur?.(e);
            }}
          />

          {/* Password toggle */}
          {hasPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
              style={{ color: "rgba(0,0,0,0.35)" }}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>

        {/* Inline error */}
        {error && (
          <p
            className="mt-1.5 text-xs pl-4"
            style={{ color: "#FF2D2D" }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";
export default AuthInput;
