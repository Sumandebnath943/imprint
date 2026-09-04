# IMPRINT — Project Bible

The canonical reference for what this product is, how it is built, and why it
works the way it does. If code and this document disagree, the code is right
and this document needs fixing — but every number here was read out of the
codebase, not remembered.

**Last verified against commit `68c8bc4`.**

---

## 1. The product

### 1.1 Premise

AI does not replace a person all at once. It replaces them one delegated
decision at a time — a paragraph they did not write, a judgement call they did
not make, a problem they did not sit with. The erosion is real but invisible,
because there is no "before" to compare against.

IMPRINT captures that "before" and keeps measuring the distance from it.

### 1.2 What the product actually does

1. **Captures a baseline.** During onboarding the user answers prompts drawn
   from four universal modules plus modules specific to their profession
   cluster. Responses may be text, voice or file.
2. **Extracts metrics.** Each response is reduced to four measurable signals.
3. **Re-tests on a cadence.** Calibration sessions repeat the same modules.
4. **Produces a Drift Score.** A weighted composite, 0–100, where higher means
   further from yourself.
5. **Gives the user things to do about it** — the Forge, the Mirror, the Skill
   Vault, journal, circles.

### 1.3 Non-negotiable product rules

These are design commitments, not implementation details. Breaking them breaks
the product's premise.

- **IMPRINT never writes for the user.** No autocomplete, no suggestions, no
  generated prose anywhere in a capture surface.
- **The Mirror only asks questions.** It never answers, advises, recommends or
  drafts. When asked to decide something it redirects and records a dependency
  flag.
- **The baseline is not user-editable.** It is the measuring stick. The Mirror
  API reads it from the database specifically so a client cannot fabricate it.
- **Drift is directionless.** It measures distance from *your* baseline, not
  quality, and not a comparison against other people.

---

## 2. Domain model

### 2.1 Profession clusters

Six. Stored on `profiles.profession_cluster` as a CHECK-constrained enum.

| Value | Label |
| --- | --- |
| `language_voice` | Language & Voice |
| `visual_creative` | Visual & Creative |
| `technical_analytical` | Technical & Analytical |
| `human_social` | Human & Social |
| `leadership_strategy` | Leadership & Strategy |
| `life_personal` | Life & Personal |

Labels live in `CLUSTER_LABELS` (`lib/onboarding/modules.ts`). **Never render
the raw enum** — that was a real bug fixed in `c403fb6`, where four surfaces
showed `technical_analytical` to users.

54 professions map onto these clusters.

### 2.2 Baseline modules

17 module definitions in `lib/onboarding/modules.ts`. Four universal (`U1`–`U4`)
plus cluster-specific ones (`L*`, `T*`, `V*`, `H*`, `S*`, `P*`) and a final
free-form module (`FINAL`). `buildModuleList(cluster)` assembles the 7 a given
user sees.

| Module | Name |
| --- | --- |
| U1 | Opinion & Belief |
| U2 | Decision Under Pressure |
| U3 | Memory & Recall |
| U4 | Emotional Fingerprint |
| FINAL | Your Final Imprint |

### 2.3 Text metrics

Extracted from every baseline and calibration response:

| Column | Computation |
| --- | --- |
| `word_count` | whitespace-delimited tokens |
| `avg_sentence_length` | words ÷ sentences (split on `.!?`) |
| `vocabulary_richness` | unique words ÷ total words (type–token ratio) |
| `response_time_seconds` | time to compose |

---

## 3. The two scores

### 3.1 Drift Score (0–100, higher = worse)

Computed in `app/api/calibration/complete/route.ts` when a calibration session
completes. Four signals, each 0–100 and each a *drift contributor*:

| Signal | Weight | Measures |
| --- | --- | --- |
| `baseline_divergence` | 40% | How far this session's vocabulary richness and sentence length sit from the user's baseline |
| `vault_inactivity` | 25% | Share of tracked skills not practised in 14 days |
| `ai_dependence` | 20% | Mirror dependency flags in 14 days (×10, capped) |
| `journal_irregularity` | 15% | Share of the last 14 days with no entry |

```
drift = 0.40·baseline_divergence
      + 0.25·vault_inactivity
      + 0.20·ai_dependence
      + 0.15·journal_irregularity
```

Labels (`getScoreLabel`):

| Score | Label |
| --- | --- |
| < 40 | anchored |
| < 60 | drifting |
| < 80 | critical |
| ≥ 80 | crisis |

> **Critical convention.** These four are stored under names describing what
> they *measure*, and all four go **up** as things get **worse**. The dashboard
> inverts them for display, because the card frames them as the qualities drift
> erodes ("Baseline Consistency", not "Baseline Divergence"). They were
> originally stored under the names of their opposites, in camelCase, while the
> dashboard read snake_case — so the keys never matched and every user saw
> hardcoded placeholder bars. Fixed in `c4a943e`. If you add a signal, keep the
> naming honest and invert at the view layer.

### 3.2 IMPRINT Score (0–1000, higher = better)

Computed in `app/(dashboard)/dashboard/profile/page.tsx`. Four components that
sum to the stored `profiles.imprint_score`:

| Component | Max | Formula |
| --- | --- | --- |
| Vault strength | 250 | `min(250, avgSkillStrength × 2.5)` |
| Calibration record | 300 | `min(calibrations × 50, 300)` |
| Journal consistency | 250 | `min(activeDays × 8, 250)` |
| AI independence | 200 | `max(200 − dependencyFlags × 5, 0)` |

---

## 4. Architecture

### 4.1 Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14, App Router, React Server Components |
| Language | TypeScript, `strict: true` |
| Styling | Tailwind CSS + inline styles for one-offs |
| Data / auth / storage | Supabase (Postgres, RLS enforced) |
| AI | OpenAI `gpt-4o` (the Mirror only) |
| Client state | Zustand (`lib/store/`) |
| Forms | react-hook-form + zod |
| Motion / charts | framer-motion, recharts |
| Hosting | Vercel — `main` auto-deploys to production |

Roughly 27,600 lines across 194 TS/TSX files, plus 1,210 lines of SQL.

### 4.2 Route groups

```
app/
  (public)/       landing, /about, /courses, /privacy, /credential/[code]
  (auth)/         /signin, /signup, /reset-password
  (onboarding)/   7-step baseline capture
  (dashboard)/    18 product pages
  api/            21 route handlers (+ /auth/callback = 22 total)
```

Also: `error.tsx`, `global-error.tsx`, `not-found.tsx`, `opengraph-image.tsx`,
`robots.ts`, `sitemap.ts`.

### 4.3 Data flow

- **Reads** happen in Server Components, straight from Supabase with the
  caller's session. Client components receive data as props.
- **Writes** go through route handlers under `app/api/`.
- **Authorisation lives in the database**, not the app. Every table has RLS
  enabled with policies scoped to `auth.uid()`.

### 4.4 Auth

Supabase SSR cookies, refreshed in `middleware.ts` → `lib/supabase/middleware.ts`.
`/dashboard/*` and `/onboarding/*` redirect unauthenticated visitors to
`/signin`. The dashboard layout additionally redirects users who have not
completed onboarding.

### 4.5 Service-role key

Used in exactly **two** places, and only one of them ships:

- `app/api/account/delete/route.ts` — deleting an auth user requires the admin
  API. Gated behind an authenticated session *and* a typed confirmation phrase.
  Cascade chain: `auth.users` → `profiles` → 19 tables, all `ON DELETE CASCADE`.
- `scripts/seed-demo.mjs` — local tooling, never imported by the app.

**Do not reach for it elsewhere.** Circle creation used to, as a workaround for
an RLS recursion bug; that was removed in `30cc9f5` once the policies were
fixed properly.

### 4.6 Visitor beacon

`components/beacon/Beacon.tsx` (mounted in the root layout) collects what a
visit looked like and posts it to `app/api/beacon/route.ts`, which enriches it
with network facts and sends an alert to Telegram. Two messages per visit: an
**arrival** ~1.2s after first paint, and a **summary** when the tab is hidden or
closed. Full detail in [`BEACON.md`](./BEACON.md).

Three rules it exists under:

- **Location is never interleaved across providers.** Vercel's edge headers are
  authoritative for city/region/country; `ipwho.is` supplies the ISP and ASN
  that Vercel does not carry. Taking the city from one and the postcode from
  the other produced "Bengaluru … postal 600079" — a Chennai postcode. Fields
  now come from one provider at a time; only network facts merge.
- **The route always answers 204.** It is fire-and-forget: a missing credential,
  a rejected payload or a Telegram outage must never surface to a visitor.
- **The payload is untrusted.** Bounded on every axis by
  `lib/validations/beacon.schema.ts`. IP, geolocation and user agent are read
  server-side from request headers, never from the body.

Without `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` the whole thing is a no-op.
It does not run on `localhost` unless `NEXT_PUBLIC_BEACON_DEBUG=1`.

---

## 5. Database

### 5.1 Tables (19)

`profiles`, `baseline_imprints`, `drift_scores`, `skill_vault`,
`vault_challenges`, `journal_entries`, `calibration_sessions`,
`mirror_sessions`, `time_capsules`, `beliefs`, `human_circles`,
`circle_members`, `circle_checkins`, `checkin_reactions`,
`mentorship_requests`, `mentorships`, `mentor_reviews`, `course_suggestions`,
`course_waitlist`.

### 5.2 Migrations — apply in order

| File | Purpose |
| --- | --- |
| `001_initial_schema.sql` | Core tables, RLS, `handle_new_user` trigger |
| `002_community_schema.sql` | Circles, mentorship, check-ins |
| `003_courses_schema.sql` | Course waitlist and suggestions |
| `004_identity_schema.sql` | Profile/credential/settings columns |
| `005_storage_buckets.sql` | 6 buckets + per-user path policies |
| `006_social_access_fix.sql` | Fixes 4 silently broken features (see §7.1) |
| `007_credential_code_on_signup.sql` | Generate credential codes in the trigger |
| `008_journal_gallery_columns.sql` | Adds `item_type`, `source`, `response_file_url` |
| `009_credential_stats_real_streak.sql` | Real consecutive streak in `credential_stats` |
| `010_force_reset_circle_policies.sql` | Name-agnostic circle policy rebuild |

All are idempotent and safe to re-run.

> **Schema-drift warning.** Migrations 007–010 all exist because
> `CREATE TABLE IF NOT EXISTS` in `001` does **not** alter a table that already
> exists. Columns added to `001` after the table was first created never
> reached deployed databases. **If you add a column, write a new
> `ALTER TABLE` migration.** Editing `001` will silently do nothing.

### 5.3 RPC functions

`handle_new_user`, `generate_credential_code`, `credential_stats`,
`is_circle_member`, `is_circle_admin`, `has_public_credential`,
`checkin_circle_id`, `find_circle_by_invite`, `circle_member_profiles`.

The `is_circle_*` helpers are `SECURITY DEFINER` **specifically** to break RLS
recursion — a policy on `circle_members` that queries `circle_members` raises
Postgres `42P17` and takes the whole feature down.

### 5.4 The `public_profiles` view

Cross-user reads (leaderboard, mentor directory, public credentials) go through
this view, never through `profiles`. It exposes only non-sensitive columns —
**no email, no onboarding state**. `profiles` itself stays owner-only.

### 5.5 Storage buckets

| Bucket | Public | Holds |
| --- | --- | --- |
| `avatars` | yes | Profile photos |
| `gallery` | no | Direct gallery uploads |
| `forge-audio` | no | Forge voice notes |
| `forge-files` | no | Forge sketches/files |
| `baseline-audio` | no | Onboarding voice responses |
| `baseline-files` | no | Onboarding file responses |

Private buckets are read via signed URLs. Every object path **must** begin with
the owner's user id — the storage policies enforce it and
`api/storage/upload` re-checks it.

---

## 6. Conventions

### 6.1 Text contrast

The app runs on `#080808`. White text below ~50% opacity fails WCAG AA. The
ramp was lifted wholesale in `acd9b37`:

```
0.20 → 0.50    0.30 → 0.58    0.40 → 0.66
0.25 → 0.54    0.35 → 0.62    0.45 → 0.72
```

Borders, dividers and backgrounds at those same alpha values were deliberately
left alone — the substitution was anchored to the `color:` property.

**Do not introduce text below `rgba(255,255,255,0.50)`.**

### 6.2 Text on brand orange

White on `#FF5500` measures **3.21:1** and fails AA for the 14–16px labels the
buttons use. Use the `.text-on-accent` utility (near-black, **6.18:1**) on any
text sitting on an orange fill. Buttons fade with `disabled:opacity-50` rather
than swapping background, so the ratio holds when disabled.

### 6.3 Frosted surfaces

`.imprint-glass` in `app/globals.css`, used by the public nav and the dashboard
top bar. `rgba(8,8,8,0.60)` + `blur(24px) saturate(160%)`. The saturation
matters: without it a heavy blur over a dark page goes flat grey and reads as
fog rather than glass. Includes a `-webkit-` prefix, an `@supports` fallback to
an opaque fill, and a `prefers-reduced-motion` branch.

### 6.4 Onboarding layout

`components/onboarding/StepLayout.tsx`. Two columns at `lg` — framing text
beside the controls, not above them — which halves the vertical requirement so
each step fits one screen. Below `lg` it collapses to one column and the page
scrolls normally.

Where a list genuinely cannot fit, it scrolls inside a `.scroll-pane`
(6px thumb, soft top/bottom fade, minimum height). **A bare scrollbar floating
in open space reads as a rendering fault** — if something must scroll, contain
it visibly.

### 6.5 Dashboard responsiveness

The sidebar rail is `hidden md:flex`; `MobileTabBar` is `md:hidden`. The shell
reserves no width for the rail below `md` (via `matchMedia`). Wide content
(e.g. the drift history table) scrolls in its own `overflow-x-auto` container
with `min-w-0` — a flex/grid child defaults to `min-width: auto` and will grow
instead of scrolling.

### 6.6 JSX comments

`{/* … */}` cannot sit inside `return (` before the root element — it parses as
an expression and breaks the build. Use `//` there. This broke the build three
separate times during the September 2026 work.

---

## 7. Notable defects and their fixes

Kept because each represents a trap that can recur.

### 7.1 Four features silently broken by RLS (`30cc9f5`, `006`, `010`)

Circles hit Postgres `42P17` infinite recursion; the leaderboard only ever
showed the viewer; the mentor list was always empty; every public credential
link 404'd. Fixed with `SECURITY DEFINER` helpers and the `public_profiles`
view. `006` dropped policies **by name** and missed one, so `010` rebuilds them
by enumerating `pg_policies` instead.

### 7.2 Private circle creation was impossible (`328e737`)

The route chained `.select()` on the insert. `RETURNING` is evaluated against
the SELECT policy — `NOT is_private OR is_circle_member(id)` — and the creator's
membership row is written *after* the circle. So a private circle failed its own
check, surfacing as "new row violates row-level security policy". `isPrivate`
defaults to `true`, so every normal creation hit it. Fixed by generating the id
in the route and dropping the `RETURNING`.

### 7.3 The Mirror measured everyone against defaults (`8286d64`)

The page selected `baseline_imprints.writing_style`, a column that never
existed. Postgres rejects the whole query when one column is unknown, so the
result came back null and the Mirror silently compared every user's live writing
against 300 words / 0.6 richness / 15-word sentences instead of their own
baseline — the entire point of the feature.

### 7.4 Dashboard signal bars were fabricated (`c4a943e`)

See §3.1. camelCase written, snake_case read; every user saw 85/60/72.

### 7.5 Gallery item types never persisted (`9f6ae0b`, `008`)

Both upload paths detected the type correctly and dropped it on insert. The
gallery compensated by regexing the file path out of the entry body and guessing
from the extension. Symptom: the type shown right after upload was right, after
a reload it changed.

### 7.6 Credential codes were never issued (`69fc007`, `007`)

`004` added the column and backfilled once, but `handle_new_user` only inserted
`(id, email, full_name)`. Every account created since had `credential_code =
NULL`, so share links could not resolve.

---

## 8. Known limitations

Honest scope boundaries, not bugs.

- **Drift metrics are lexical** — type–token ratio, sentence length, latency.
  Transparent and cheap, but a proxy for reasoning depth rather than a measure
  of it. Semantic/embedding signals are the natural next step.
- **Courses ship no content.** Presented as upcoming with a waitlist.
- **The rate limiter is in-process** (`lib/api/rate-limit.ts`), so on serverless
  it is per-instance rather than global. Adequate at current scale; the seam for
  a shared store is isolated in that one file.
- **No automated tests.** Everything has been verified by driving the running
  app, which has found real bugs the type checker cannot — but nothing prevents
  regressions.
- **Mobile onboarding scrolls.** Deliberate: seven steps of content cannot fit a
  phone screen, and internal scroll regions there would be worse.

---

## 9. Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Account deletion + seed script only |
| `OPENAI_API_KEY` | The Mirror |
| `NEXT_PUBLIC_APP_URL` | Canonical origin — OG images, sitemap, robots |
| `TELEGRAM_BOT_TOKEN` | Visitor beacon alerts. Unset ⇒ beacon is a no-op |
| `TELEGRAM_CHAT_ID` | Destination chat for those alerts |
| `NEXT_PUBLIC_BEACON_DEBUG` | Optional, local only. `1` runs the beacon on localhost. **Never set on Vercel** |

`lib/site.ts` resolves the origin: explicit `NEXT_PUBLIC_APP_URL`, then
`NEXT_PUBLIC_VERCEL_URL`, then localhost.
