# IMPRINT — Developer Handoff

For whoever picks this up next. Read this first, then
[`PROJECT_BIBLE.md`](./PROJECT_BIBLE.md) when you need the reference detail.

**State as of commit `5e2ea0e`.** Live at
[imprint.houseofnamus.com](https://imprint.houseofnamus.com), auto-deployed
from `main` via Vercel.

---

## 1. Get it running

**Prerequisites:** Node 18+, a Supabase project, an OpenAI API key.

```bash
git clone https://github.com/Sumandebnath943/imprint.git
cd imprint
npm install
cp .env.local.example .env.local   # then fill it in
npm run dev
```

Apply migrations **in numeric order** from `supabase/migrations/` via the
Supabase SQL editor or `supabase db push`. All ten are idempotent.

Then seed a demo account so the app has something to show:

```bash
npm run seed:demo
```

That creates `demo@imprint.local` / `ImprintDemo!2026` with ten weeks of
history, plus a peer account so the leaderboard and mentor directory are not
empty. Re-running wipes and rebuilds it.

`TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are optional — without them the
visitor beacon is a no-op. It does not run on `localhost` in any case unless
you set `NEXT_PUBLIC_BEACON_DEBUG=1`, so local work will not alert anyone.

---

## 2. Read these five files first

| File | Why |
| --- | --- |
| `app/api/calibration/complete/route.ts` | The drift algorithm. The product's core. |
| `components/dashboard/DashboardShell.tsx` | Layout, responsive rules, sidebar state |
| `components/onboarding/StepLayout.tsx` | The onboarding layout primitive |
| `lib/supabase/middleware.ts` | Session refresh + route protection |
| `supabase/migrations/006_social_access_fix.sql` | Why the RLS looks the way it does |

---

## 3. Traps that will bite you

These are not hypothetical. Each one shipped.

### 3.1 Editing `001_initial_schema.sql` does nothing

`CREATE TABLE IF NOT EXISTS` will not alter a table that already exists.
Columns added to `001` after first deploy never reach a live database —
that is why `007`, `008` and `009` exist. **Adding a column means writing a new
`ALTER TABLE` migration.**

### 3.2 RLS policies are load-bearing and easy to break

A policy on `circle_members` that queries `circle_members` raises Postgres
`42P17` and kills the whole feature silently — the UI just shows an empty
state. Use the `SECURITY DEFINER` helpers (`is_circle_member`,
`is_circle_admin`). If you must drop policies, enumerate `pg_policies` rather
than naming them; `006` named them and missed one, which is why `010` exists.

### 3.3 `.select()` on an insert runs the SELECT policy

`RETURNING` is checked against the row's SELECT policy. If the row isn't
visible to its own creator yet — e.g. a private circle before the membership
row exists — the insert fails with "new row violates row-level security
policy", which points you at the wrong policy entirely. Generate ids client-side
and skip the `RETURNING` when that applies.

### 3.4 A bad column name nulls the entire query

Postgres rejects the whole select if one column is unknown; Supabase returns
`{ data: null, error }`. If you `?? []` that, you get silent fallback defaults
and no error anywhere. This shipped for months in the Mirror.

### 3.5 `{/* … */}` breaks the build inside `return (`

Before the root JSX element it parses as an expression. Use `//`. This broke
the build three times in one week.

### 3.6 `npm run build` clobbers a running dev server

It overwrites `.next`, and the dev server then throws `Cannot find module
'./xxxx.js'` or serves an unstyled page. Not a real bug. Stop the server,
`rm -rf .next`, restart.

### 3.7 Flex/grid children default to `min-width: auto`

They grow to fit content instead of scrolling. Any `overflow-x-auto` wrapper
needs `min-w-0` (or `max-w-full`) or it will simply expand and get clipped.

### 3.8 Never interleave fields from two geolocation providers

The beacon reads location from Vercel's edge headers and the ISP from a
third-party lookup. Taking the city from one and the postcode from the other
produced an alert reading "Bengaluru … postal 600079" — a Chennai postcode.
Two providers, two databases, and they disagree at the edges. Resolve location
from **one** provider at a time; merge only network facts (ISP, ASN), which the
other does not supply at all.

The same file carries the sharper version of this lesson: when *no* city
resolves, a provider will return the country's centroid, and rendering that as a
map pin put a Pune visitor outside Nagpur. Record what precision you actually
have and refuse to draw a pin you have not earned. See `lib/beacon/geo.ts`.

### 3.9 Outbound calls need a budget for the cold connection

The Telegram send was given 4s and dropped alerts silently. The round trip
measured **5.6s** on a cold connection — 1.3s to connect, another 1.9s for TLS —
and that is exactly the request carrying the first alert after a deploy. Budget
for the handshake, retry transport failures (but never a rejected request), and
raise `maxDuration` so the platform's 10s default cannot cut it short.

---

## 4. How to verify UI work here

There are no tests. What has actually caught bugs is driving the running app
and **measuring the DOM**, not looking at screenshots.

Two specific reasons:

1. **The preview pane serves stale frames.** During this work it repeatedly
   showed a column as empty when it was rendering correctly. When a screenshot
   disagrees with a measurement, trust the measurement — or confirm with
   `document.elementFromPoint(x, y)`, which asks the browser what is actually
   painted and hittable at a coordinate.
2. **"Does the page scroll?" is not the same as "can I see everything?"**
   Content can be inside the viewport but behind the fixed bottom nav, or
   clipped by an ancestor's `overflow: hidden`, or hidden inside a collapsed
   scroll container. All three shipped. Check element rects against the nav's
   top edge, not just against `innerHeight`.

Useful snippet — find genuinely unreachable content:

```js
const nav = [...document.querySelectorAll('div')].find(x => {
  const cs = getComputedStyle(x), r = x.getBoundingClientRect();
  return cs.position === 'fixed' && r.bottom >= innerHeight - 2 && r.height < 160;
});
const navTop = nav ? nav.getBoundingClientRect().top : innerHeight;
[...document.querySelectorAll('main *')]
  .filter(e => !e.children.length && e.textContent.trim())
  .filter(e => { const r = e.getBoundingClientRect(); return r.height && (r.top < -2 || r.bottom > navTop + 2); })
  .map(e => e.textContent.trim().slice(0, 30));
```

Viewports that matter: **1365×660** (13" laptop — the tightest real case),
**1440×900**, **375×812**.

---

## 5. Current state

**Working and verified end-to-end:** signup → onboarding (7 steps) → dashboard;
the Mirror against real baselines; the Forge; Skill Vault with challenges;
journal; gallery with real storage objects; drift and calibration; circles
(create private → join by code → roster → check-in, with an anonymous client
seeing nothing); leaderboard; mentor directory; public credential links;
the visitor beacon (real alerts delivered, geolocation correct, silent on
localhost); `/privacy`.

**Migrations 006–010 are applied to production.**

**Accessibility:** text contrast clears WCAG AA across the app; button text on
brand orange clears AA; the Mirror, Forge, leaderboard, circles and mentors
report zero failing elements.

**Responsive:** every dashboard route reports zero clipped elements at 375px;
all seven onboarding steps fit one screen at 660px with no stray scrollbars.

---

## 6. What I would do next

Roughly in order of value.

1. **Tests.** There are none. Start with the drift computation in
   `api/calibration/complete` — it is pure arithmetic over fetched rows and the
   product's core claim. Then RLS behaviour, which is where the expensive bugs
   have been.
2. **Move the rate limiter to a shared store.** `lib/api/rate-limit.ts` is
   per-instance on serverless. Upstash/Redis behind the same interface.
3. **Semantic drift signals.** The current metrics are lexical proxies.
   Embedding the baseline responses and measuring cosine distance on calibration
   would measure something much closer to the actual claim.
4. **A schema-drift check in CI.** Compare the live schema against the
   migrations. Four of the ten migrations exist purely because of drift.
5. **Courses.** Currently a waitlist with no content.
6. **Real quotes on the landing page.** The friends-and-family section is now
   labelled honestly and carries no invented metrics, but the quotes themselves
   are still placeholders. Replace them with real attributed words, or delete
   the section, before public launch.

---

## 7. Operational notes

- **Deploys:** push to `main`. Vercel picks it up in roughly 90 seconds.
- **Secrets:** `.env.local` is gitignored and has never been committed. The
  service-role key is used in exactly two places — `api/account/delete` and
  `scripts/seed-demo.mjs`.
- **Social links** in the footer are intentionally hidden: `SOCIAL_LINKS` in
  `components/landing/Footer.tsx` is an empty array, and the row renders nothing
  while it is empty. Add real URLs there and the design returns as-is.
- **Test accounts** created during development have been deleted. The seed
  script recreates `demo@` and `demo-peer@` on demand.
