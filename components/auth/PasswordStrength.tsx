"use client";

import { useMemo } from "react";

interface PasswordStrengthProps {
  password: string;
}

interface StrengthLevel {
  label: string;
  color: string;
  score: number;
}

function getStrength(password: string): StrengthLevel {
  if (!password) return { label: "", color: "#E5E0D8", score: 0 };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;

  // Map to 4 levels
  const level = Math.min(4, Math.max(1, Math.ceil(score * 4 / 5)));

  const levels: Record<number, StrengthLevel> = {
    1: { label: "Weak", color: "#FF2D2D", score: 1 },
    2: { label: "Fair", color: "#FFB800", score: 2 },
    3: { label: "Good", color: "#FF7A30", score: 3 },
    4: { label: "Strong", color: "#00D97E", score: 4 },
  };

  return levels[level] ?? levels[1];
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => getStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="px-1 mt-2">
      {/* 4 segment bar */}
      <div className="flex gap-1 mb-1.5">
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{
              background:
                seg <= strength.score ? strength.color : "#E5E0D8",
            }}
          />
        ))}
      </div>
      {/* Label */}
      <p
        className="text-xs text-right font-medium transition-colors duration-300"
        style={{ color: strength.color }}
      >
        {strength.label}
      </p>
    </div>
  );
}
