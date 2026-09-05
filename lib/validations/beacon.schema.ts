import { z } from "zod";

/**
 * Shape of the visitor beacon payload.
 *
 * Everything here is client-reported and therefore untrusted: it is bounded on
 * every axis so a crafted request cannot blow up the Telegram message or the
 * request body. Network-level facts (IP, geolocation, user agent) are read
 * server-side from request headers and never taken from this payload.
 */

const short = z.string().max(200);

export const BeaconActionSchema = z.object({
  /** Milliseconds since the session started. */
  t: z.number().int().min(0).max(86_400_000),
  type: z.enum(["click", "submit", "input", "key", "copy", "download", "external"]),
  label: z.string().max(120),
  path: z.string().max(300).optional(),
});

export const BeaconPageSchema = z.object({
  path: z.string().max(300),
  title: z.string().max(160).optional(),
  /** Milliseconds since the session started when this page was entered. */
  t: z.number().int().min(0).max(86_400_000),
  /** Milliseconds spent on this page. */
  ms: z.number().int().min(0).max(86_400_000).optional(),
});

export const BeaconSchema = z.object({
  v: z.literal(1),
  /** Random per-tab id, used only to group an arrival with its summary. */
  sid: z.string().min(6).max(40),
  /**
   * arrival — once per visit, when it starts
   * ended   — the visit finished (short)
   * report  — the full journey and actions for that visit
   * event   — a notable action mid-visit
   */
  kind: z.enum(["arrival", "ended", "report", "event"]),
  /** Set when kind is "event". The server re-checks the session before
   *  reporting anything about identity, so this is only a hint. */
  event: z
    .enum(["signed_in", "signed_out", "entered_dashboard", "onboarding_complete"])
    .optional(),

  path: z.string().max(300),
  title: short.optional(),
  referrer: z.string().max(400).optional(),

  /**
   * Whether this browser has been here before. Read from local storage, so it
   * is a claim rather than proof — good enough for "new or returning", and
   * never used for anything that matters.
   */
  visitor: z
    .object({
      returning: z.boolean().default(false),
      visitCount: z.number().int().min(1).max(100_000).default(1),
      /** Ms since the previous visit ended. */
      sinceLastMs: z.number().int().min(0).max(31_536_000_000).nullable().default(null),
      /** Page loads within this visit — a visit spans navigations. */
      pageLoads: z.number().int().min(1).max(500).default(1),
    })
    .prefault({}),

  /** Wall-clock ms since the session started. */
  sessionMs: z.number().int().min(0).max(86_400_000).default(0),
  /** Time the tab was visible and the visitor was not idle. */
  activeMs: z.number().int().min(0).max(86_400_000).default(0),

  pages: z.array(BeaconPageSchema).max(40).default([]),
  actions: z.array(BeaconActionSchema).max(30).default([]),

  scroll: z
    .object({
      maxPx: z.number().int().min(0).max(2_000_000).default(0),
      maxPct: z.number().int().min(0).max(100).default(0),
      /** Depth milestones reached, e.g. [25, 50, 75]. */
      milestones: z.array(z.number().int()).max(4).default([]),
      events: z.number().int().min(0).max(100_000).default(0),
    })
    .prefault({}),

  /** Raw interaction counters — the basis of the human/bot judgement. */
  signals: z
    .object({
      pointerMoves: z.number().int().min(0).max(1_000_000).default(0),
      clicks: z.number().int().min(0).max(10_000).default(0),
      keys: z.number().int().min(0).max(100_000).default(0),
      touches: z.number().int().min(0).max(10_000).default(0),
      visibilityChanges: z.number().int().min(0).max(10_000).default(0),
      firstActionMs: z.number().int().min(0).max(86_400_000).nullable().default(null),
      lastActionMs: z.number().int().min(0).max(86_400_000).nullable().default(null),
      webdriver: z.boolean().default(false),
      touchSupport: z.boolean().default(false),
      cookiesEnabled: z.boolean().default(true),
      doNotTrack: z.boolean().default(false),
      languages: z.number().int().min(0).max(50).default(0),
      plugins: z.number().int().min(0).max(200).default(0),
      hardwareConcurrency: z.number().int().min(0).max(1024).default(0),
      deviceMemory: z.number().min(0).max(1024).default(0),
      timezone: short.optional(),
      language: short.optional(),
    })
    .prefault({}),

  device: z
    .object({
      screenW: z.number().int().min(0).max(30_000).default(0),
      screenH: z.number().int().min(0).max(30_000).default(0),
      viewportW: z.number().int().min(0).max(30_000).default(0),
      viewportH: z.number().int().min(0).max(30_000).default(0),
      dpr: z.number().min(0).max(10).default(1),
    })
    .prefault({}),
});

export type BeaconPayload = z.infer<typeof BeaconSchema>;
export type BeaconAction = z.infer<typeof BeaconActionSchema>;
export type BeaconPage = z.infer<typeof BeaconPageSchema>;
