"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Defers the hero video until the browser has nothing better to do.
 *
 * Returns false on the server and on the first client render, so the video is
 * never part of the initial HTML — the still image carries the hero until this
 * flips. Returns false permanently on phones and under reduced-motion.
 */
function useDeferredHeroVideo() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Matches the `md:` breakpoint the video renders at. Checked in JS rather
    // than left to CSS because `display:none` does not stop the fetch.
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const show = () => setReady(true);

    // Idle callback where available, so the video never competes with hydration
    // or the LCP paint. The timeout caps how long a busy main thread can delay
    // it; Safari has no requestIdleCallback, hence the fallback.
    // Captured rather than tested with `in`, which narrows `window` itself and
    // leaves the fallback branch typed as `never`.
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback
        : null;

    if (idle) {
      const handle = idle(show, { timeout: 2500 });
      return () => window.cancelIdleCallback(handle);
    }
    const handle = window.setTimeout(show, 1200);
    return () => window.clearTimeout(handle);
  }, []);

  return ready;
}

export default function HeroSection() {
  const showVideo = useDeferredHeroVideo();

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden text-white font-sans selection:bg-white/30"
      style={{
        // Using a vibrant orange-red gradient as fallback, expecting the hero image to be placed here
        background: "linear-gradient(135deg, #FF4500 0%, #D92600 100%)",
      }}
    >
      {/* Mobile Background Image (Hidden on Desktop).
          768px-wide WebP: this sits behind a luminosity blend and an overlay,
          so full resolution buys nothing and cost 1.6MB on the LCP element. */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-90 mix-blend-luminosity md:hidden"
        style={{ backgroundImage: "url('/hero-bg-mobile.webp')" }}
      />

      {/* Desktop still.

          The 34KB WebP that used to be only the video's `poster`, promoted to a
          layer of its own so the hero has its final appearance from the first
          paint instead of waiting on a megabyte of video.

          It fades out once the video mounts, and that is not a nicety. Both
          layers carry mix-blend-luminosity, and two luminosity blends stacked
          over the same backdrop compound: the second blends against the result
          of the first rather than against the orange gradient, which drains the
          colour and leaves the hero looking greyscale. Only one of these may be
          visible at a time. */}
      <div
        aria-hidden="true"
        className={`hidden md:block absolute inset-0 z-0 bg-cover bg-center bg-no-repeat mix-blend-luminosity scale-[1.15] transition-opacity duration-700 ${
          showVideo ? "opacity-0" : "opacity-90"
        }`}
        style={{ backgroundImage: "url('/hero-bg.webp')" }}
      />

      {/* Desktop Background Media.

          Mounted from an effect rather than rendered server-side. With
          `hidden md:block` the element existed on phones too, and an autoplay
          video is fetched regardless of `display:none` — so mobile paid for a
          file it could never show. Now nothing requests it until the viewport
          is confirmed desktop and the browser is idle.

          Skipped entirely under prefers-reduced-motion: an 8-second loop behind
          the headline is exactly the ambient motion that setting asks about. */}
      {showVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-bg.webp"
          className="hidden md:block absolute inset-0 z-0 w-full h-full object-cover opacity-90 mix-blend-luminosity scale-[1.15]"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
      )}

      {/* Add an overlay to ensure text contrast if the image is too bright */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 mix-blend-multiply pointer-events-none" />

      {/* Giant Background Text.

          This is a `div`, not the `h1` it used to be. At 10% opacity behind a
          blend mode, inside a pointer-events-none layer and marked select-none,
          it is a texture — but as an `h1` it was the page's primary heading,
          which meant the strongest structural signal on the site said nothing
          but "IMPRINT". The real headline in the left column carries it now.
          aria-hidden keeps a screen reader from announcing the brand name a
          third time after the nav logo and the headline. */}
      <div className="absolute bottom-0 left-0 w-full text-center pointer-events-none z-0 overflow-hidden">
        <motion.div
          aria-hidden="true"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          /* Sits on the section's bottom edge.

             The offset is in `em`, so it tracks the font size. It was -4%,
             which resolves against the *container* height — on a tall screen
             that pushed the word tens of pixels past the edge and the section's
             overflow-hidden ate the letterforms. An em offset stays constant
             relative to the type at every viewport size.

             With leading-none the line box is exactly one em tall while the
             capitals occupy roughly four fifths of it, so translating down by
             the remainder closes the gap under the letters and lets them sit
             flush on the edge. IMPRINT is all caps, so nothing descends into
             the space being cropped.

             Size is clamped rather than a bare 22vw: on a narrow phone the word
             overflowed its own line box and got clipped at both ends.

             The offset is a negative margin rather than a translate because
             this element's transform belongs to framer-motion — it animates
             `y`, and any transform set here would be overwritten the moment the
             entrance animation runs. */
          style={{ fontSize: "min(22vw, 20rem)", marginBottom: "-0.16em" }}
          className="font-bold leading-none tracking-tighter text-white/10 select-none mix-blend-overlay whitespace-nowrap"
        >
          IMPRINT
        </motion.div>
      </div>

      {/* Main Content Container
          The columns must be able to shrink between the lg breakpoint (1024px)
          and ~1330px. Previously the left column, a min-w-[300px] spacer and
          the right column had fixed widths totalling more than the viewport,
          so the right-hand text was clipped by the section's overflow-hidden
          on any window narrower than about 1330px. */}
      <div className="relative z-20 flex-1 w-full max-w-[1600px] mx-auto px-8 md:px-12 xl:px-16 pt-32 pb-16 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">

        {/* LEFT COLUMN */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full lg:w-auto lg:max-w-[420px] lg:shrink flex flex-col gap-10"
        >
          <div>
            {/* The page's h1. Visually smaller than the right column's
                heading, which is fine — heading level is document structure,
                not type scale, and this is the sentence that says what IMPRINT
                does. The <br> tags are line-break art direction; they do not
                affect how the heading is read as text. */}
            {/* The spaces before each <br /> are deliberate. Without them the
                element's text content reads "Preserve yourhuman identitywith
                our expertengine." — the line breaks are visual, but they are
                not word boundaries, and anything reading textContent (search
                snippets, screen readers, AI extractors) gets the words fused.
                A trailing space before a break renders as nothing, so this is
                invisible on screen. */}
            <h1 className="text-3xl md:text-4xl lg:text-[36px] xl:text-[42px] font-light leading-[1.1] tracking-tight mb-5 uppercase">
              Preserve your <br />
              human identity <br />
              with <span className="font-semibold">our expert <br />engine.</span>
            </h1>
            <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-[340px]">
              From cognitive baseline mapping to voice preservation, we provide the tools to anchor your identity before AI replaces it.
            </p>
          </div>

          <Link href="/signup" className="bg-[#8A1C00] text-white text-[11px] font-bold tracking-[0.2em] px-10 py-4 rounded-full w-max hover:bg-[#A32200] transition-colors shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 duration-200">
            BEGIN IMPRINT
          </Link>

          {/* Left Cards */}
          <div className="flex gap-4 mt-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 w-[170px] shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                  <span className="text-xs">⚡</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              </div>
              <div className="text-4xl font-light mb-1 mt-4">12+</div>
              <div className="text-[11px] text-white/70 leading-tight">Identity Signals tracked & monitored</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 w-[170px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <span className="text-4xl">⌘</span>
              </div>
              <div className="text-xs text-white/60 mb-2">Start your preservation</div>
              <div className="text-4xl font-light mb-1 mt-6">100%</div>
              <div className="text-[11px] text-white/70 leading-tight">Human verification guaranteed</div>
            </div>
          </div>
        </motion.div>

        {/* CENTER SPACER (keeps the silhouette visible between the columns).
            No min-width: it must be the first thing to collapse when the
            viewport is tight, rather than pushing the right column off-screen. */}
        <div className="hidden lg:block flex-1 min-w-0" />

        {/* RIGHT COLUMN */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full lg:w-auto lg:max-w-[480px] lg:shrink flex flex-col items-start lg:items-end text-left lg:text-right gap-10"
        >
          <div>
            <h2 className="text-5xl md:text-6xl lg:text-[56px] xl:text-[72px] font-light leading-[0.9] tracking-tighter uppercase mb-6">
              Identity<br />
              <span className="font-bold">Preservation</span><br />
              Engine
            </h2>

            <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-[360px] lg:ml-auto">
              In a world where AI thinks for you, writes for you, and decides for you — IMPRINT is your resistance. Your skills. Your voice. Your identity.
            </p>
          </div>

          {/* Right Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 w-[340px] text-left shadow-2xl mt-4 relative">
            <div className="absolute top-6 right-6">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            </div>
            <div className="text-[11px] text-white/60 uppercase tracking-widest mb-3">Your Drift Score</div>
            <div className="text-3xl font-semibold mb-2">Anchored</div>
            <p className="text-[13px] text-white/70 mb-6 leading-relaxed">
              Your identity is intact. Regular journaling and vault challenges are keeping you grounded.
            </p>

            {/* Mini progress bars/stats */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] text-white/60 mb-1">
                  <span>Baseline Consistency</span>
                  <span>92%</span>
                </div>
                <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/90 w-[92%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-white/60 mb-1">
                  <span>Vault Activity</span>
                  <span>84%</span>
                </div>
                <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/70 w-[84%]" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
