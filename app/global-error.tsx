"use client";

import { useEffect } from "react";

/**
 * Catches errors thrown in the root layout itself, where app/error.tsx cannot
 * render. Must supply its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#080808",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <div style={{ maxWidth: 460 }}>
          <p style={{ color: "#FF5500", fontSize: 12, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 16 }}>
            Something drifted
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 300, lineHeight: 1.2, marginBottom: 16 }}>
            IMPRINT failed to load.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Refresh the page to try again.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#FF5500",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "12px 32px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
