"use client";

/**
 * Visitor-facing control for the visit logging described in the privacy policy.
 *
 * Reads and writes the same local-storage key the beacon checks, so what this
 * shows is the real state for this browser rather than a description of it.
 * The `?notrack=1` link does the same thing and is what can be shared or
 * bookmarked; this exists so the choice is visible and reversible on the page
 * that explains it.
 */

import { useEffect, useState } from "react";

const KEY = "imprint_beacon_off";

type State = "loading" | "on" | "off" | "unavailable";

export default function TrackingOptOut() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    try {
      setState(localStorage.getItem(KEY) === "1" ? "off" : "on");
    } catch {
      // Storage blocked: the choice cannot be remembered in this browser.
      setState("unavailable");
    }
  }, []);

  const set = (optOut: boolean) => {
    try {
      if (optOut) localStorage.setItem(KEY, "1");
      else localStorage.removeItem(KEY);
      setState(optOut ? "off" : "on");
    } catch {
      setState("unavailable");
    }
  };

  const isOff = state === "off";
  const border = isOff ? "rgba(0,217,126,0.35)" : "rgba(255,85,0,0.28)";
  const bg = isOff ? "rgba(0,217,126,0.07)" : "rgba(255,85,0,0.06)";

  return (
    <div
      className="rounded-2xl p-6 mt-2"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <p
        className="uppercase tracking-widest font-medium mb-3"
        style={{ fontSize: 11, letterSpacing: "0.2em", color: isOff ? "#00D97E" : "#FF5500" }}
      >
        This browser
      </p>

      <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 16, lineHeight: 1.7 }}>
        {state === "loading" && "Checking…"}
        {state === "on" && "Visits from this browser are logged, as described above."}
        {state === "off" && "Visits from this browser are not logged. Nothing is collected and nothing is sent."}
        {state === "unavailable" &&
          "This browser is blocking local storage, so the choice cannot be saved here. Use the link below instead, or write to us."}
      </p>

      {(state === "on" || state === "off") && (
        <button
          type="button"
          onClick={() => set(!isOff)}
          className="mt-5 rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
          style={
            isOff
              ? { background: "rgba(255,255,255,0.10)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)" }
              : { background: "#FF5500", color: "#0A0A0A" }
          }
        >
          {isOff ? "Turn logging back on" : "Do not log my visits"}
        </button>
      )}

      <p className="mt-5" style={{ color: "rgba(255,255,255,0.62)", fontSize: 14, lineHeight: 1.65 }}>
        The same thing, as a link you can bookmark or share:{" "}
        <a href="/?notrack=1" className="hover:underline" style={{ color: "#FF5500" }}>
          imprint.houseofnamus.com/?notrack=1
        </a>
        . To undo it, visit{" "}
        <a href="/?notrack=0" className="hover:underline" style={{ color: "#FF5500" }}>
          /?notrack=0
        </a>
        . The choice is stored in this browser only, so it needs repeating on
        each browser and device, and clearing site data will reset it.
      </p>
    </div>
  );
}
