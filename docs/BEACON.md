# Visitor beacon → Telegram

Real-time alerts when someone visits IMPRINT: who, where, what they did, and
whether they behaved like a person or a script.

## What arrives

Two messages per visit, at most.

**On arrival** (~1.2s after the first page renders) — so the alert is live:

```
🟢 New visit — IMPRINT

📍 Bengaluru, KA, India 🇮🇳
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

**On exit** (tab hidden or closed) — the behaviour:

```
⚪️ Visit ended — IMPRINT

⏱ 4m 12s on site · 3m 5s active
🧭 2 pages
   / (1m 36s)  →  /about (2m 36s)
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

The beacon is off on `localhost` in production builds. To silence a specific
browser you are testing from, run once in its console:

```js
localStorage.setItem("imprint_beacon_off", "1")
```

## Rate limits

12 messages per address per 10 minutes, and 150 per instance per 10 minutes, via
the existing `lib/api/rate-limit.ts`. In-process, so per-instance on serverless —
enough to stop one crawl flooding the chat.

## Privacy

This records IP address, city-level location, ISP, pages, and interaction
timings for every visitor, and forwards them to a private Telegram chat. That is
personal data under GDPR/UK GDPR, and the deck targets the US, UK and India.
Before public launch, disclose it in a privacy policy. `Do Not Track` is
reported in the alert but not currently honoured as a suppression signal.

## Files

```
app/api/beacon/route.ts            endpoint (POST alert, GET health check)
components/beacon/Beacon.tsx       client collector, mounted in app/layout.tsx
lib/beacon/geo.ts                  IP → location + network
lib/beacon/bot.ts                  human/bot scoring
lib/beacon/telegram.ts             message formatting + send
lib/validations/beacon.schema.ts   zod schema for the untrusted payload
```
