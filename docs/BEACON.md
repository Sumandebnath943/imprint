# Visitor beacon → Telegram

Real-time alerts when someone visits IMPRINT: who, where, what they did, and
whether they behaved like a person or a script.

## What arrives

An arrival alert, an end-of-visit summary, and a milestone alert whenever the
visitor signs in, creates an account, finishes onboarding, or first opens the
dashboard.

**On arrival** (~1.2s after the first page renders) — so the alert is live:

```
🟢 New visit — IMPRINT

👤 Not signed in — anonymous visitor

📍 Bengaluru, Karnataka, India 🇮🇳
   12.972, 77.594 · Asia/Kolkata
🛰 49.207.180.22 · Atria Convergence Technologies Pvt. Ltd. · AS24309
   open in maps

📄 /
   IMPRINT — Remember Who You Are
↩️ https://www.google.com/

💻 Chrome 128 · Windows · 1920×947 · en-IN
🧑 Human 83/100 (provisional)

🕒 05 Sept, 00:42 local (Asia/Kolkata) · Fri, 04 Sep 2026 19:12:04 UTC
```

**On a milestone** — sign-in, account creation, onboarding finished, first
dashboard visit:

```
✨ New account created — IMPRINT

👤 Ada Kessler · ada@example.com
   🆕 new account · onboarding step 1/7

📄 /onboarding/welcome

📍 Pune, Maharashtra, India 🇮🇳
   18.520, 73.857 · Asia/Kolkata
🛰 103.149.196.11 · NIXI · AS140158
   open in maps
```

**On exit** (tab hidden or closed) — the behaviour:

```
⚪️ Visit ended — IMPRINT

👤 Ada Kessler · ada@example.com
   account 2mo 14d old · onboarding complete · drift 22 · imprint 708

⏱ 6m 42s on site · 5m 15s active
🧭 5 pages
   /signin (9s)  →  /dashboard (2m)  →  /dashboard/drift (1m 36s)  →  …
📊 dashboard explored (4)
   overview · drift · vault · journal
📜 scroll 87% (5820px) · hit 25/50/75 · 64 events
🖱 3 actions
      8s · click · Begin Your Imprint
   1m 36s · click · About
      4m · external · github.com/Sumandebnath943/imprint
⌛ first 8s · last 4m
🎛 940 moves · 3 clicks · 12 keys · 0 touches
…location block…
🧑 Human 100/100 — mouse movement, 3 clicks, typing, progressive scrolling
```

## Configuration

| Variable | Where | Purpose |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Vercel + `.env.local` | From @BotFather. Mark **Sensitive** on Vercel. |
| `TELEGRAM_CHAT_ID` | Vercel + `.env.local` | Your chat, or a group (negative id). |
| `NEXT_PUBLIC_BEACON_DEBUG` | local only, optional | `1` makes the beacon run on localhost too. **Never set on Vercel.** |

With either credential missing the beacon is a silent no-op — a misconfigured
deploy can never break a page load.

**Env changes only apply to new deployments.** Redeploy after adding them.

## Who is visiting

Identity is resolved **server-side from the session cookie**, never from the
payload — a browser can claim anything, but it cannot forge a session. Every
alert therefore states whether the visitor is signed in and, if so, the account,
how old it is, whether onboarding is finished, and their current drift and
IMPRINT scores.

Milestones are detected from the route rather than from an auth listener: the
app only reaches `/onboarding` or `/dashboard` with a session. That keeps
Supabase out of every page's bundle. A sign-in on an account less than fifteen
minutes old is reported as **New account created**.

The summary lists every dashboard page opened during the visit, in order.

## Location

Two sources, deliberately not interleaved:

1. **Vercel edge headers** (`x-vercel-ip-city`, `-country`, `-latitude`, …).
   Resolved at the edge before the function runs: free, fast, never fails.
   Authoritative for city/region/country.
2. **ipwho.is** (HTTPS, no key). Supplies the **ISP and ASN**, which Vercel does
   not carry and which is the best single signal for "this came from a
   datacenter, not a living room". Also the only source in local development.

The two use different databases, so their location fields are **never mixed** —
doing so once produced "Bengaluru … postal 600079", a Chennai postcode. When
both name the same city the lookup's fuller names win ("Karnataka" over "KA");
otherwise Vercel's location is used whole and only network facts are merged.

Accuracy is **city-level**, which is what IP geolocation gives. Street-level
would need the browser Geolocation API, which always shows a permission prompt.

**Precision is reported, never invented.** When no city can be resolved, a
provider will happily return the country's centroid — for India that lands near
Nagpur, roughly 700km from anyone in Pune. Rendering that as a map pin made the
alert actively misleading. Coordinates and the map link are now emitted **only**
when a city or region was genuinely resolved; a country-level result says
"country only — no map pin shown". Mobile-carrier addresses are flagged too,
because those routinely resolve to a regional gateway rather than the handset.

Verify it in production by opening `https://imprint.houseofnamus.com/api/beacon`
in a browser — it returns exactly what the server resolved for you, and whether
the bot credentials are present on that deploy.

## Human or bot

Scored 0–100 from independent signals, and the alert always shows its reasoning.

- **Declared crawlers** (Googlebot, GPTBot, ClaudeBot, …) short-circuit to 2/100
  and are named.
- **Hard tells**: `navigator.webdriver`, automation in the user agent, no
  `Accept-Language`, no screen dimensions, datacenter ASN.
- **Human tells**: mouse movement, touch, clicks, typing, tab switching,
  progressive scrolling, dwell time.
- **Shape tells**: reaching the page bottom in one scroll event; acting within
  250 ms of load.

The arrival verdict is marked **(provisional)** because it fires before anyone
could have moved a mouse — it reads on browser environment and network only.
The exit summary carries the real judgement.

## Silencing your own visits

**Do Not Track is honoured** — if the browser sends it, nothing is collected and
nothing is sent. The server refuses those payloads too, in case a stale bundle
is still running somewhere.

The beacon is also off on `localhost` in production builds. To silence a
specific browser you are testing from, run once in its console:

```js
localStorage.setItem("imprint_beacon_off", "1")
```

## Bots and rate limits

**Declared crawlers never alert.** Googlebot, GPTBot, TelegramBot and the rest
are dropped before anything else, as is anything scoring under 20 from a
datacenter network. They were producing alerts that read like a visitor — a US
datacenter, Linux, "bot" — while a real visit from a Windows laptop cannot
produce a Linux user agent. Set `BEACON_ALERT_BOTS=1` to see them anyway.

Rate limits run in **separate buckets for human and suspect traffic**
(20 per address and 150 per instance, per 10 minutes, via
`lib/api/rate-limit.ts`). A single shared counter meant a crawl could exhaust
the budget and silence the visits you actually wanted.

## When no alert arrives

Open `https://imprint.houseofnamus.com/api/beacon` **in the browser that is not
producing alerts**. It reports what the server sees for that exact request:
resolved location and precision, the user agent it read, and
`wouldBeSuppressed`, which names the reason if there is one.

The reasons a genuine visit produces nothing:

1. **Do Not Track is on.** It is honoured, so the beacon collects nothing and
   sends nothing. The diagnostic shows `doNotTrackHeader: "1"`. Note that a
   privacy extension can send this header even when Chrome's own toggle is off,
   and the header is checked server-side for exactly that reason.
2. **`imprint_beacon_off` is set** in that browser's local storage.

### Seeing your own visits while keeping DNT on

Run this once in the console of the browser you want to be visible. It opts that
one browser in, and nothing else changes:

```js
localStorage.setItem("imprint_beacon_force", "1")
```

The payload still reports the Do Not Track signal truthfully; the flag only says
this browser has consented anyway. Undo with `removeItem`.

## Privacy

This records IP address, city-level location, ISP, pages, and interaction
timings for every visitor, and forwards them to a private Telegram chat, along with the
account identity when the visitor is signed in. That is personal data under
GDPR/UK GDPR. It is disclosed at `/privacy`, and `Do Not Track` is honoured.

## Files

```
app/api/beacon/route.ts            endpoint (POST alert, GET health check)
components/beacon/Beacon.tsx       client collector, mounted in app/layout.tsx
lib/beacon/geo.ts                  IP → location + network, with precision
lib/beacon/identity.ts             session → who is visiting
lib/beacon/bot.ts                  human/bot scoring
lib/beacon/telegram.ts             message formatting + send
lib/validations/beacon.schema.ts   zod schema for the untrusted payload
```
