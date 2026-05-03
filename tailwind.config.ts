import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "imprint-black": "#080808",
        "imprint-surface": "#111111",
        "imprint-surface-2": "#1A1A1A",
        "imprint-surface-3": "#222222",
        "imprint-border": "rgba(255,255,255,0.07)",
        "imprint-border-hover": "rgba(255,255,255,0.14)",
        "imprint-orange": "#FF5500",
        "imprint-orange-glow": "#FF7A30",
        "imprint-orange-ember": "#C84400",
        "imprint-orange-atmo": "rgba(255,85,0,0.15)",
        "imprint-white": "#FFFFFF",
        "imprint-white-65": "rgba(255,255,255,0.65)",
        "imprint-white-35": "rgba(255,255,255,0.35)",
        "imprint-white-20": "rgba(255,255,255,0.20)",
        "drift-safe": "#00D97E",
        "drift-caution": "#FFB800",
        "drift-danger": "#FF5500",
        "drift-crisis": "#FF2D2D",
        "auth-bg": "#F5F0EB",
        "auth-card": "#FFFFFF",
      },
      fontFamily: {
        sans: ["Space Grotesk", "Inter", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        "card-lg": "20px",
        "card-xl": "24px",
        pill: "100px",
      },
      boxShadow: {
        card: "0 0 0 1px rgba(255,255,255,0.07)",
        "card-hover":
          "0 0 0 1px rgba(255,255,255,0.14), 0 0 30px rgba(255,85,0,0.08)",
        auth: "0 32px 80px rgba(0,0,0,0.15)",
        "glow-orange": "0 0 60px rgba(255,85,0,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
