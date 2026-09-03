"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Shared frame for an onboarding step.
 *
 * Every step used to be one tall centred column: headline, description, then
 * controls, stacked. That reads well at 1200px but on a 13" laptop the stack
 * alone was taller than the viewport, so the actual controls were pushed off
 * the bottom — and squeezing them into what was left produced a profession
 * grid about 30px tall, which is worse than scrolling.
 *
 * The `split` variant puts the framing text beside the controls instead of
 * above them, which roughly halves the vertical requirement and gives inputs
 * a real share of the screen. `centered` keeps the original single column for
 * the narrative steps, which have no controls to starve.
 *
 * Below lg both collapse to one column and the page scrolls normally — the
 * only thing that stays usable on a phone.
 */

interface StepLayoutProps {
  /** Large faint word behind the content. Decorative. */
  ghost?: string;
  /** Small orange label above the headline. */
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Extra content under the description, inside the left column. */
  aside?: ReactNode;
  children: ReactNode;
  variant?: "split" | "centered";
  /** Widen the controls column for grids and long option lists. */
  wide?: boolean;
}

const ease = [0.16, 1, 0.3, 1] as const;

export default function StepLayout({
  ghost,
  eyebrow,
  title,
  description,
  aside,
  children,
  variant = "split",
  wide = false,
}: StepLayoutProps) {
  const centered = variant === "centered";

  return (
    <div className="relative w-full lg:h-full lg:overflow-hidden">
      {ghost && (
        <div
          aria-hidden
          className="pointer-events-none select-none absolute inset-0 hidden lg:flex items-center justify-center"
          style={{ zIndex: 0 }}
        >
          <span
            style={{
              fontSize: "clamp(120px,15vw,240px)",
              fontWeight: 700,
              color: "#FFFFFF",
              opacity: 0.025,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              whiteSpace: "nowrap",
            }}
          >
            {ghost}
          </span>
        </div>
      )}

      <div
        className={[
          "relative z-10 mx-auto w-full h-full px-6 md:px-10",
          // Top clears the progress bar + Save & Exit; bottom clears BottomNav.
          "pt-24 pb-32 lg:pt-[84px] lg:pb-[100px]",
          centered ? "max-w-[720px]" : wide ? "max-w-[1180px]" : "max-w-[1040px]",
          "flex flex-col",
        ].join(" ")}
      >
        <div
          className={
            centered
              ? "flex flex-col lg:flex-1 lg:min-h-0"
              : "flex flex-col lg:flex-row lg:gap-14 lg:flex-1 lg:min-h-0"
          }
        >
          {/* Context — never scrolls, so the question stays put while you answer. */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className={[
              centered
                ? "text-center"
                : "lg:w-[38%] lg:shrink-0 lg:flex lg:flex-col lg:justify-center",
              "mb-8 lg:mb-0",
            ].join(" ")}
          >
            {eyebrow && (
              <p
                className="uppercase tracking-widest text-[11px] font-medium mb-3"
                style={{ color: "#FF5500" }}
              >
                {eyebrow}
              </p>
            )}

            <h1
              className="font-bold text-white"
              style={{
                fontSize: centered
                  ? "clamp(30px,4vw,46px)"
                  : "clamp(28px,3.2vw,40px)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </h1>

            {description && (
              <div
                className="mt-4 text-[15px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.62)" }}
              >
                {description}
              </div>
            )}

            {aside && <div className="mt-6">{aside}</div>}
          </motion.div>

          {/* Controls — the only region allowed to scroll, and only if it must. */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease }}
            className={[
              centered ? "mt-8" : "lg:flex-1 lg:min-w-0",
              "flex flex-col lg:min-h-0",
            ].join(" ")}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
