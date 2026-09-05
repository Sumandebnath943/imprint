"use client";

/**
 * Visitor beacon.
 *
 * A *visit* is one tab, and it spans page loads. That matters: the footer links
 * are plain anchors, so moving from / to /courses is a full document load. When
 * the collector's state lived only in module scope it died with the document,
 * and every internal link looked like the visitor leaving and a stranger
 * arriving. State is therefore persisted in sessionStorage — per tab, cleared
 * when the tab closes, which is exactly the lifetime of a visit.
 *
 * Four alerts per visit:
 *
 *   arrival  once, when the visit starts — new or returning
 *   event    a notable action, as it happens
 *   ended    the visit finished
 *   report   the full journey and actions for that visit
 *
 * Design notes:
 *   - Every listener is passive; the collector must not affect scrolling or
 *     input latency.
 *   - Exit uses sendBeacon, the only send that survives page unload.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const ENDPOINT = "/api/beacon";
const ARRIVAL_DELAY_MS = 700; // let the page settle without making the alert late
const IDLE_AFTER_MS = 30_000; // no input for this long stops the "active" clock
const VISIT_GAP_MS = 30 * 60_000; // a tab resumed after this long is a new visit
const INTERNAL_NAV_MS = 2_500; // window in which an unload means "still here"
const MAX_REPORTS = 3; // a visitor who comes back can produce an updated report

const OPT_OUT_KEY = "imprint_beacon_off";
const OPT_OUT_PARAM = "notrack";
const VISIT_KEY = "imprint_visit"; // sessionStorage — this tab's visit
const VISITOR_KEY = "imprint_visitor"; // localStorage — has this browser been here

type ActionType = "click" | "submit" | "input" | "key" | "copy" | "download" | "external";
type EventName =
  | "signed_in"
  | "signed_out"
  | "entered_dashboard"
  | "onboarding_complete"
  | "cta_click";

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

/** Everything that survives a page load, stored in sessionStorage. */
interface Visit {
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
  reportsSent: number;
  dirtySinceReport: boolean;
  events: EventName[];
  pageLoads: number;
  returning: boolean;
  visitCount: number;
  sinceLastMs: number | null;
}

let visit: Visit | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
/** Set while a same-origin navigation is in flight, so unload is not an exit. */
let internalNavUntil = 0;

// ── Storage ─────────────────────────────────────────────────────────────────

function readJson<T>(store: Storage, key: string): T | null {
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(store: Storage, key: string, value: unknown): void {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or a full quota; losing the record is not worth an error.
  }
}

function persist(): void {
  if (visit) writeJson(sessionStorage, VISIT_KEY, visit);
}

/**
 * The opt-out, applied from the URL.
 *
 *   ?notrack=1   silences this browser permanently
 *   ?notrack=0   turns it back on
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

function newSid(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("");
}

/** Has this browser been here before, and how long ago? */
function visitorMemory(): { returning: boolean; visitCount: number; sinceLastMs: number | null } {
  const prior = readJson<{ visits: number; lastSeen: number }>(localStorage, VISITOR_KEY);
  const now = Date.now();
  writeJson(localStorage, VISITOR_KEY, {
    visits: (prior?.visits ?? 0) + 1,
    lastSeen: now,
  });
  return {
    returning: Boolean(prior),
    visitCount: (prior?.visits ?? 0) + 1,
    sinceLastMs: prior?.lastSeen ? Math.max(0, now - prior.lastSeen) : null,
  };
}

function startVisit(): Visit {
  return {
    sid: newSid(),
    startedAt: Date.now(),
    lastActivity: Date.now(),
    activeMs: 0,
    pages: [],
    actions: [],
    scroll: { maxPx: 0, maxPct: 0, milestones: [], events: 0 },
    pointerMoves: 0,
    clicks: 0,
    keys: 0,
    touches: 0,
    visibilityChanges: 0,
    firstActionMs: null,
    lastActionMs: null,
    arrivalSent: false,
    reportsSent: 0,
    dirtySinceReport: true,
    events: [],
    pageLoads: 0,
    ...visitorMemory(),
  };
}

/** Resume this tab's visit, or begin one if there is nothing usable to resume. */
function loadVisit(): Visit {
  const saved = readJson<Visit>(sessionStorage, VISIT_KEY);
  // A tab left open overnight is not one very long visit.
  if (saved?.sid && typeof saved.startedAt === "number" && Date.now() - saved.lastActivity < VISIT_GAP_MS) {
    saved.events = Array.isArray(saved.events) ? saved.events : [];
    saved.pages = Array.isArray(saved.pages) ? saved.pages : [];
    saved.actions = Array.isArray(saved.actions) ? saved.actions : [];
    return saved;
  }
  return startVisit();
}

// ── Measurement ─────────────────────────────────────────────────────────────

function since(): number {
  return visit ? Date.now() - visit.startedAt : 0;
}

function markActivity() {
  if (!visit) return;
  visit.lastActivity = Date.now();
  visit.dirtySinceReport = true;
}

function recordAction(type: ActionType, label: string) {
  if (!visit) return;
  const t = since();
  if (visit.firstActionMs === null) visit.firstActionMs = t;
  visit.lastActionMs = t;
  if (visit.actions.length < 30) {
    visit.actions.push({ type, label: label.slice(0, 120), t, path: location.pathname });
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

  if (node instanceof HTMLInputElement) return node.value || node.name || node.type;
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

/** Calls to action worth an immediate alert, matched on their visible label. */
const HOT_LABELS =
  /^(begin your imprint|begin imprint|start now|get started|begin my baseline|create account|sign up)/i;

// ── Sending ─────────────────────────────────────────────────────────────────

function build(kind: "arrival" | "ended" | "report" | "event", event?: EventName) {
  if (!visit) return null;

  // Close out the page being viewed so its dwell time is included.
  const pages = visit.pages.map((p) => ({ ...p }));
  const last = pages[pages.length - 1];
  if (last && last.ms === undefined) last.ms = Math.max(0, since() - last.t);

  return {
    v: 1 as const,
    sid: visit.sid,
    kind,
    ...(event ? { event } : {}),
    visitor: {
      returning: visit.returning,
      visitCount: visit.visitCount,
      sinceLastMs: visit.sinceLastMs,
      pageLoads: Math.max(1, visit.pageLoads),
    },
    path: location.pathname + location.search,
    title: document.title?.slice(0, 160),
    referrer: document.referrer || undefined,
    sessionMs: since(),
    activeMs: Math.round(visit.activeMs),
    pages,
    actions: visit.actions,
    scroll: visit.scroll,
    signals: {
      pointerMoves: visit.pointerMoves,
      clicks: visit.clicks,
      keys: visit.keys,
      touches: visit.touches,
      visibilityChanges: visit.visibilityChanges,
      firstActionMs: visit.firstActionMs,
      lastActionMs: visit.lastActionMs,
      webdriver: Boolean(navigator.webdriver),
      touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === "1",
      languages: navigator.languages?.length ?? 0,
      plugins: navigator.plugins?.length ?? 0,
      hardwareConcurrency: navigator.hardwareConcurrency ?? 0,
      deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0,
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

function send(kind: "arrival" | "ended" | "report" | "event", viaBeacon: boolean, event?: EventName) {
  const body = build(kind, event);
  if (!body) return;
  const json = JSON.stringify(body);

  // sendBeacon is the only transport the browser guarantees during unload.
  if (viaBeacon && typeof navigator.sendBeacon === "function") {
    try {
      if (navigator.sendBeacon(ENDPOINT, new Blob([json], { type: "application/json" }))) return;
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
 * Report a notable action, once per visit.
 *
 * Detected from the route rather than an auth listener: the app only reaches
 * /onboarding or /dashboard with a session, and the server reads whose session
 * it is from the cookie. That keeps Supabase out of every page's bundle and
 * makes the identity unforgeable.
 */
function sendEvent(name: EventName) {
  if (!visit || visit.events.includes(name)) return;
  visit.events.push(name);
  visit.dirtySinceReport = true;
  persist();
  send("event", false, name);
}

/** The visit is over: a short notice, then the full record. */
function endVisit() {
  if (!visit) return;
  if (visit.reportsSent >= MAX_REPORTS) return;
  if (visit.reportsSent > 0 && !visit.dirtySinceReport) return;
  visit.reportsSent += 1;
  visit.dirtySinceReport = false;
  persist();
  send("ended", true);
  send("report", true);
}

function shouldRun(): boolean {
  if (typeof window === "undefined") return false;

  // Do Not Track is deliberately NOT treated as an opt-out — it is off by
  // default everywhere, is frequently switched on by extensions without the
  // person knowing, and is ignored across most of the web. It is still
  // recorded and shown in the alert. The opt-out is ?notrack=1, below.
  applyOptOutParam();

  try {
    if (localStorage.getItem(OPT_OUT_KEY) === "1") return false;
  } catch {
    // Blocked storage is not a reason to skip.
  }

  if (process.env.NEXT_PUBLIC_BEACON_DEBUG === "1") return true;
  if (process.env.NODE_ENV !== "production") return false;
  return !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
}

export default function Beacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!shouldRun()) return;

    // Resume this tab's visit across the page load, or start a new one.
    if (!visit) {
      visit = loadVisit();
      visit.pageLoads += 1;
      visit.pages.push({
        path: location.pathname + location.search,
        title: document.title,
        t: since(),
      });
      visit.scroll.maxPct = Math.max(visit.scroll.maxPct, currentScrollPct());
      persist();
    }

    const v = visit;
    const passive = { passive: true } as const;

    const onPointerMove = () => {
      v.pointerMoves += 1;
      markActivity();
    };
    const onScroll = () => {
      v.scroll.events += 1;
      v.scroll.maxPx = Math.max(v.scroll.maxPx, Math.round(window.scrollY));
      const pct = currentScrollPct();
      if (pct > v.scroll.maxPct) v.scroll.maxPct = pct;
      for (const m of [25, 50, 75, 100]) {
        if (v.scroll.maxPct >= m && !v.scroll.milestones.includes(m)) {
          v.scroll.milestones.push(m);
        }
      }
      markActivity();
    };
    const onClick = (e: MouseEvent) => {
      v.clicks += 1;
      const el = e.target as Element | null;
      if (!el?.closest) {
        markActivity();
        return;
      }
      const anchor = el.closest("a") as HTMLAnchorElement | null;

      // A same-origin link means the tab is navigating, not leaving. Without
      // this, every internal link ended the visit and started a new one — the
      // footer links are plain anchors, so each is a full document load.
      if (anchor?.href && anchor.origin === location.origin && !anchor.target) {
        internalNavUntil = Date.now() + INTERNAL_NAV_MS;
      }

      let type: ActionType = "click";
      if (anchor?.hasAttribute("download")) type = "download";
      else if (anchor?.href && anchor.origin !== location.origin) type = "external";

      const label = labelFor(el);
      recordAction(type, label);
      if (HOT_LABELS.test(label)) sendEvent("cta_click");
      persist();
    };
    const onKey = () => {
      v.keys += 1;
      markActivity();
    };
    const onTouch = () => {
      v.touches += 1;
      markActivity();
    };
    const onSubmit = (e: Event) => {
      internalNavUntil = Date.now() + INTERNAL_NAV_MS;
      const form = e.target as HTMLFormElement | null;
      recordAction("submit", form?.getAttribute("name") ?? form?.id ?? "form");
      persist();
    };
    const onCopy = () => recordAction("copy", "copied text");
    const onVisibility = () => {
      v.visibilityChanges += 1;
      // Switching tabs is not leaving; just make sure nothing is lost.
      if (document.visibilityState === "hidden") persist();
      else markActivity();
    };
    const onPageHide = () => {
      persist();
      // Still inside the site: the next document resumes this same visit.
      if (Date.now() < internalNavUntil) return;
      endVisit();
    };

    window.addEventListener("pointermove", onPointerMove, passive);
    window.addEventListener("scroll", onScroll, passive);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey, passive);
    window.addEventListener("touchstart", onTouch, passive);
    window.addEventListener("submit", onSubmit, true);
    document.addEventListener("copy", onCopy, passive);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    // Active time, plus a periodic save so a crash does not lose the visit.
    if (!timer) {
      timer = setInterval(() => {
        if (document.visibilityState !== "visible") return;
        if (Date.now() - v.lastActivity > IDLE_AFTER_MS) return;
        v.activeMs += 1000;
        if (v.activeMs % 5000 === 0) persist();
      }, 1000);
    }

    // Announced once per visit, not once per page load.
    const arrival = v.arrivalSent
      ? null
      : setTimeout(() => {
          if (!v.arrivalSent) {
            v.arrivalSent = true;
            persist();
            send("arrival", false);
          }
        }, ARRIVAL_DELAY_MS);

    return () => {
      if (arrival) clearTimeout(arrival);
      if (timer) {
        clearInterval(timer);
        timer = null;
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

  // ── Client-side route changes ─────────────────────────────────────────────
  useEffect(() => {
    const v = visit;
    if (!v) return;

    const path = location.pathname + location.search;
    const last = v.pages[v.pages.length - 1];
    if (last?.path === path) return; // initial render; already recorded

    if (last && last.ms === undefined) last.ms = Math.max(0, since() - last.t);
    if (v.pages.length < 40) v.pages.push({ path, title: document.title, t: since() });
    v.dirtySinceReport = true;
    markActivity();
    persist();

    const p = location.pathname;
    if (p.startsWith("/dashboard")) sendEvent("entered_dashboard");
    else if (p === "/onboarding/complete") sendEvent("onboarding_complete");
    else if (p.startsWith("/onboarding")) sendEvent("signed_in");
  }, [pathname]);

  return null;
}
