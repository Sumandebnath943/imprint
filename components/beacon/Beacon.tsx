"use client";

/**
 * Visitor beacon.
 *
 * Collects what a visit looked like and posts it to /api/beacon, which enriches
 * it with network-level facts and forwards an alert to Telegram. Two messages
 * per visit at most:
 *
 *   arrival  — sent shortly after the first page renders, so the alert is live
 *   summary  — sent when the tab is hidden or closed, with the full behaviour
 *
 * Design notes:
 *   - State is module-scoped, not React state. It has to survive re-renders and
 *     client-side route changes without resetting, and nothing here should
 *     cause a render.
 *   - Every listener is passive; the collector must not affect scrolling or
 *     input latency.
 *   - Exit uses sendBeacon, the only send that reliably survives page unload.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const ENDPOINT = "/api/beacon";
const ARRIVAL_DELAY_MS = 700; // let the page settle without making the alert late
const IDLE_AFTER_MS = 30_000; // no input for this long stops the "active" clock
const MAX_SUMMARIES = 3; // re-arms if the visitor comes back to the tab
const OPT_OUT_KEY = "imprint_beacon_off";
const OPT_OUT_PARAM = "notrack";

/**
 * The opt-out, applied from the URL.
 *
 *   ?notrack=1   silences this browser permanently
 *   ?notrack=0   turns it back on
 *
 * Persisted in local storage, so it survives the query string being dropped.
 */
function applyOptOutParam(): void {
  let value: string | null = null;
  try {
    value = new URLSearchParams(location.search).get(OPT_OUT_PARAM);
  } catch {
    return;
  }
  if (value === null) return;
  try {
    if (value === "0" || value === "false") localStorage.removeItem(OPT_OUT_KEY);
    else localStorage.setItem(OPT_OUT_KEY, "1");
  } catch {
    // Blocked storage: the choice cannot be remembered, which is not fatal.
  }
}

type ActionType = "click" | "submit" | "input" | "key" | "copy" | "download" | "external";

interface Action {
  t: number;
  type: ActionType;
  label: string;
  path?: string;
}

interface PageVisit {
  path: string;
  title?: string;
  t: number;
  ms?: number;
}

interface State {
  sid: string;
  startedAt: number;
  lastActivity: number;
  activeMs: number;
  pages: PageVisit[];
  actions: Action[];
  scroll: { maxPx: number; maxPct: number; milestones: number[]; events: number };
  pointerMoves: number;
  clicks: number;
  keys: number;
  touches: number;
  visibilityChanges: number;
  firstActionMs: number | null;
  lastActionMs: number | null;
  arrivalSent: boolean;
  summariesSent: number;
  dirtySinceSummary: boolean;
  started: boolean;
  timer: ReturnType<typeof setInterval> | null;
  /** Milestones already reported, so each fires at most once per tab. */
  events: Set<EventName>;
}

type EventName = "signed_in" | "signed_out" | "entered_dashboard" | "onboarding_complete";

let state: State | null = null;

function createSession(): State {
  return {
    sid: newSid(),
    startedAt: Date.now(),
    lastActivity: Date.now(),
    activeMs: 0,
    pages: [{ path: location.pathname + location.search, title: document.title, t: 0 }],
    actions: [],
    scroll: { maxPx: 0, maxPct: currentScrollPct(), milestones: [], events: 0 },
    pointerMoves: 0,
    clicks: 0,
    keys: 0,
    touches: 0,
    visibilityChanges: 0,
    firstActionMs: null,
    lastActionMs: null,
    arrivalSent: false,
    summariesSent: 0,
    dirtySinceSummary: true,
    started: true,
    timer: null,
    events: new Set<EventName>(),
  };
}

function newSid(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("");
}

function since(): number {
  return state ? Date.now() - state.startedAt : 0;
}

function markActivity() {
  if (!state) return;
  state.lastActivity = Date.now();
  state.dirtySinceSummary = true;
}

function recordAction(type: ActionType, label: string) {
  if (!state) return;
  const t = since();
  if (state.firstActionMs === null) state.firstActionMs = t;
  state.lastActionMs = t;
  if (state.actions.length < 30) {
    state.actions.push({ type, label: label.slice(0, 120), t, path: location.pathname });
  }
  markActivity();
}

/** A human-readable name for whatever was clicked. */
function labelFor(el: Element): string {
  const target = el.closest(
    "a, button, [role='button'], input[type='submit'], input[type='button'], summary, label"
  );
  const node = target ?? el;

  const aria = node.getAttribute?.("aria-label");
  if (aria) return aria.trim();

  const text = (node as HTMLElement).innerText?.trim();
  if (text) return text.replace(/\s+/g, " ").slice(0, 120);

  const title = node.getAttribute?.("title");
  if (title) return title.trim();

  if (node instanceof HTMLInputElement) {
    return node.value || node.name || node.type;
  }
  if (node instanceof HTMLAnchorElement && node.href) return node.href;

  return node.tagName.toLowerCase();
}

function currentScrollPct(): number {
  const doc = document.documentElement;
  const height = Math.max(doc.scrollHeight, document.body.scrollHeight);
  const seen = window.scrollY + window.innerHeight;
  if (height <= window.innerHeight) return 100; // page fits; nothing to scroll
  return Math.max(0, Math.min(100, Math.round((seen / height) * 100)));
}

function build(kind: "arrival" | "summary" | "event", event?: EventName) {
  if (!state) return null;

  // Close out the page currently being viewed so its dwell time is included.
  const pages = state.pages.map((p) => ({ ...p }));
  const last = pages[pages.length - 1];
  if (last && last.ms === undefined) last.ms = Math.max(0, since() - last.t);

  return {
    v: 1 as const,
    sid: state.sid,
    kind,
    ...(event ? { event } : {}),
    path: location.pathname + location.search,
    title: document.title?.slice(0, 160),
    referrer: document.referrer || undefined,
    sessionMs: since(),
    activeMs: Math.round(state.activeMs),
    pages,
    actions: state.actions,
    scroll: state.scroll,
    signals: {
      pointerMoves: state.pointerMoves,
      clicks: state.clicks,
      keys: state.keys,
      touches: state.touches,
      visibilityChanges: state.visibilityChanges,
      firstActionMs: state.firstActionMs,
      lastActionMs: state.lastActionMs,
      webdriver: Boolean(navigator.webdriver),
      touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === "1",
      languages: navigator.languages?.length ?? 0,
      plugins: navigator.plugins?.length ?? 0,
      hardwareConcurrency: navigator.hardwareConcurrency ?? 0,
      deviceMemory:
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
    },
    device: {
      screenW: screen.width,
      screenH: screen.height,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    },
  };
}

function send(kind: "arrival" | "summary" | "event", viaBeacon: boolean, event?: EventName) {
  const body = build(kind, event);
  if (!body) return;
  const json = JSON.stringify(body);

  // sendBeacon is the only transport the browser guarantees during unload.
  if (viaBeacon && typeof navigator.sendBeacon === "function") {
    try {
      const ok = navigator.sendBeacon(ENDPOINT, new Blob([json], { type: "application/json" }));
      if (ok) return;
    } catch {
      // fall through to fetch
    }
  }

  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
    keepalive: true,
  }).catch(() => {
    // A dropped beacon is not worth surfacing to the visitor.
  });
}

/**
 * Report a milestone, once per tab.
 *
 * Milestones are detected from the route rather than from the auth client: the
 * app only reaches /onboarding or /dashboard with a session, and the server
 * reads who that session belongs to from the cookie. That keeps Supabase out of
 * every page's bundle and makes the identity unforgeable — a browser can claim
 * to be signed in, but it cannot produce a session it does not have.
 */
function sendEvent(name: EventName) {
  if (!state || state.events.has(name)) return;
  state.events.add(name);
  state.dirtySinceSummary = true;
  send("event", false, name);
}

function sendSummary() {
  if (!state) return;
  if (state.summariesSent >= MAX_SUMMARIES) return;
  if (state.summariesSent > 0 && !state.dirtySinceSummary) return;
  state.summariesSent += 1;
  state.dirtySinceSummary = false;
  send("summary", true);
}

function shouldRun(): boolean {
  if (typeof window === "undefined") return false;

  // Do Not Track is deliberately NOT treated as an opt-out. It is off by
  // default in every major browser, is frequently switched on by extensions
  // without the person knowing, and is ignored across most of the web — so it
  // is a poor signal of actual intent. It is still recorded and shown in the
  // alert. The explicit, documented opt-out is ?notrack=1, below.
  applyOptOutParam();

  try {
    if (localStorage.getItem(OPT_OUT_KEY) === "1") return false;
  } catch {
    // Blocked storage is not a reason to skip.
  }
  const debug = process.env.NEXT_PUBLIC_BEACON_DEBUG === "1";
  if (debug) return true;
  if (process.env.NODE_ENV !== "production") return false;
  return !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
}

export default function Beacon() {
  const pathname = usePathname();

  // ── Collect ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!shouldRun()) return;

    // Session state is created once per tab, but listeners are attached on
    // EVERY mount. Guarding both on the same flag was a real bug: the cleanup
    // removed the listeners, and a remount then skipped re-adding them, so
    // `pagehide` never fired again — no exit summary, and therefore no page
    // journey, because the journey only ships inside the summary.
    if (!state) state = createSession();

    const s = state;
    const passive = { passive: true } as const;

    const onPointerMove = () => {
      s.pointerMoves += 1;
      markActivity();
    };
    const onScroll = () => {
      s.scroll.events += 1;
      s.scroll.maxPx = Math.max(s.scroll.maxPx, Math.round(window.scrollY));
      const pct = currentScrollPct();
      if (pct > s.scroll.maxPct) s.scroll.maxPct = pct;
      for (const m of [25, 50, 75, 100]) {
        if (s.scroll.maxPct >= m && !s.scroll.milestones.includes(m)) {
          s.scroll.milestones.push(m);
        }
      }
      markActivity();
    };
    const onClick = (e: MouseEvent) => {
      s.clicks += 1;
      const el = e.target as Element | null;
      if (!el?.closest) {
        markActivity();
        return;
      }
      const anchor = el.closest("a") as HTMLAnchorElement | null;
      let type: ActionType = "click";
      if (anchor?.hasAttribute("download")) type = "download";
      else if (anchor?.href && anchor.origin !== location.origin) type = "external";
      recordAction(type, labelFor(el));
    };
    const onKey = () => {
      s.keys += 1;
      markActivity();
    };
    const onTouch = () => {
      s.touches += 1;
      markActivity();
    };
    const onSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement | null;
      recordAction("submit", form?.getAttribute("name") ?? form?.id ?? "form");
    };
    const onCopy = () => recordAction("copy", "copied text");
    const onVisibility = () => {
      s.visibilityChanges += 1;
      if (document.visibilityState === "hidden") sendSummary();
      else markActivity();
    };
    const onPageHide = () => sendSummary();

    window.addEventListener("pointermove", onPointerMove, passive);
    window.addEventListener("scroll", onScroll, passive);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey, passive);
    window.addEventListener("touchstart", onTouch, passive);
    window.addEventListener("submit", onSubmit, true);
    document.addEventListener("copy", onCopy, passive);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    // Active time: one tick per second, counted only while the tab is visible
    // and the visitor has done something recently.
    if (!s.timer) {
      s.timer = setInterval(() => {
        if (document.visibilityState !== "visible") return;
        if (Date.now() - s.lastActivity > IDLE_AFTER_MS) return;
        s.activeMs += 1000;
      }, 1000);
    }

    // Only on the first mount of the tab; a remount must not re-announce.
    const arrival = s.arrivalSent
      ? null
      : setTimeout(() => {
          if (!s.arrivalSent) {
            s.arrivalSent = true;
            send("arrival", false);
          }
        }, ARRIVAL_DELAY_MS);

    return () => {
      if (arrival) clearTimeout(arrival);
      if (s.timer) {
        clearInterval(s.timer);
        s.timer = null;
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  // ── Record client-side route changes ──────────────────────────────────────
  useEffect(() => {
    const s = state;
    if (!s?.started) return;

    const path = location.pathname + location.search;
    const last = s.pages[s.pages.length - 1];
    // Unchanged path means this is the initial render; the arrival alert
    // already carries that page and its identity, so no milestone is sent.
    if (last?.path === path) return;

    if (last && last.ms === undefined) last.ms = Math.max(0, since() - last.t);
    if (s.pages.length < 40) {
      s.pages.push({ path, title: document.title, t: since() });
    }
    s.dirtySinceSummary = true;
    markActivity();

    // These routes are only reachable with a session, so arriving at one is
    // the signal. The server resolves who it actually is.
    const p = location.pathname;
    if (p.startsWith("/dashboard")) sendEvent("entered_dashboard");
    else if (p === "/onboarding/complete") sendEvent("onboarding_complete");
    else if (p.startsWith("/onboarding")) sendEvent("signed_in");
  }, [pathname]);

  return null;
}
