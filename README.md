# IMPRINT

**The identity preservation engine for humans in the age of AI.**

[imprint.houseofnamus.com](https://imprint.houseofnamus.com)

---

## The problem

AI does not replace you all at once. It replaces you one delegated decision at a
time — a paragraph you did not write, a judgement call you did not make, a
problem you did not sit with. The erosion is real but invisible, because there
is no "before" to compare yourself against.

IMPRINT captures that "before" and keeps measuring the distance from it.

## How it works

1. Choose the work you want to preserve. Imprint has draft assessment tracks
   for all 36 selectable roles, including separate developer and tester tracks.
2. An enabled role pilot captures two work samples, grades published criteria
   using objective checks where available and bounded AI evaluation, and
   saves your first result as your Original Imprint.
3. The Progress page shows your proficiency and comparable results, and
   assigns practice, AI-use check-ins, and reassessment. Journaling and
   practice activity have separate measures.
4. Eligible users can submit dated earlier work for independent source and
   authorship review. A historical comparison requires two usable samples for
   the same criterion, period, and scoring version.
5. Older text and activity comparisons remain visible as legacy records.

See the [methodology](https://imprint.houseofnamus.com/methodology) for scoring
formulas and evidence requirements.

## Features

### Measurement
- **Progress** — private proficiency, skill changes, due tasks, and archived Drift comparisons.
- **Calibration** — reassessment for the selected role when that pilot is enabled.
- **Skill Vault** — the skills you are deliberately protecting, each with a
  strength value and generated practice challenges.

### Practice
- **The Mirror** asks open reflection questions and can summarize the dialogue on request.
  It invites users to make their own decisions. Reflection contributes zero proficiency points.
- **The Forge** — distraction-free composition and practice with consistent session measurements.
- **Journal**, **Beliefs**, **Time Capsule** — longitudinal records of what you
  thought and when.

### Identity
- **Credential** — a public, shareable page and generated badge image proving
  your baseline and current standing.
- **Gallery**, **Profile**, **Settings**, including an AI Reduction Protocol
  you can commit to for a fixed window.

### Community
- **Circles** — small accountability groups with check-ins.
- **Mentors** — request or offer mentorship.
- **Leaderboard** — ranked by imprint score.

## The written layer

Alongside the product, IMPRINT publishes what it is doing and why:

| Page | What it holds |
| --- | --- |
| [`/methodology`](https://imprint.houseofnamus.com/methodology) | The complete Drift Score arithmetic — four weighted signals, the formula for each, fallback values, score bands, and a limitations section as long as the explanation |
| [`/research`](https://imprint.houseofnamus.com/research) | The studies this rests on, each summarised with what it does *not* establish |
| [`/glossary`](https://imprint.houseofnamus.com/glossary) | 15 defined terms — seven from the literature, eight IMPRINT defines |
| [`/faq`](https://imprint.houseofnamus.com/faq) | 30 answered questions, including the hostile ones |
| [`/drift-score`](https://imprint.houseofnamus.com/drift-score) | What the number means and how to get one |
| [`/notes`](https://imprint.houseofnamus.com/notes) | Long-form articles, authored as MDX under `content/notes/` |

Update the public methodology when an assessment rubric, scoring rule, or evidence requirement changes.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router, RSC) |
| Language | TypeScript, `strict: true` |
| Styling | Tailwind CSS |
| Database / Auth / Storage | Supabase (Postgres, RLS enforced) |
| AI | Google Gemini primary with Groq fallback for temporary provider failures |
| Client state | Zustand |
| Forms / validation | react-hook-form + zod |
| Motion / charts | framer-motion, recharts |
| Content | MDX via `next-mdx-remote`, frontmatter via `gray-matter` |
| Hosting | Vercel |

### Architecture notes

- **Server-first.** Dashboard pages are React Server Components that read from
  Supabase directly; client components receive data as props. Mutations go
  through route handlers under `app/api/`.
- **Auth.** Supabase SSR cookies, refreshed in `middleware.ts`. `/dashboard/*`
  and `/onboarding/*` redirect unauthenticated visitors to sign-in.
- **Authorisation is in the database, not the app.** Every table has RLS
  enabled and policies scoped to `auth.uid()`. Route handlers use the caller's
  session — the service role key is never used to bypass a policy.
- **Assessment and reflection.** The server validates evidence and calculates
  proficiency. Model outputs reference a published criterion. Mirror receives
  recent conversation and the selected topic. User content remains data.

## Running locally

**Prerequisites:** Node 18+ and a Supabase project. AI features require separate provider setup.

```bash
git clone https://github.com/Sumandebnath943/imprint.git
cd imprint
npm install
```

Copy the example env file and fill it in:

```bash
cp .env.local.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never exposed to the client |
| `GEMINI_API_KEY` | Server-only primary provider for AI scoring, transcription and Mirror |
| `GROQ_API_KEY` | Server-only fallback for temporary Gemini failures |
| `IMPRINT_AI_ENABLED` | Defaults off. Set to `true` only for isolated synthetic QA or an approved deployment |
| `NEXT_PUBLIC_IMPRINT_GOOGLE_OAUTH_ENABLED` | Defaults off. Enable after configuring and verifying Google sign-in |
| `NEXT_PUBLIC_APP_URL` | Canonical origin, used for OG images and the sitemap |
| `TELEGRAM_BOT_TOKEN` | Optional. Visitor and crawler alerts; unset means both are a no-op |
| `TELEGRAM_CHAT_ID` | Optional. Destination chat for those alerts |
| `GOOGLE_SITE_VERIFICATION` | Optional. Search Console HTML-tag token; the meta tag is omitted when unset |
| `BING_SITE_VERIFICATION` | Optional. Bing Webmaster meta-tag token |

Apply the migrations in order from `supabase/migrations/` via the Supabase SQL
editor or CLI:

```bash
supabase db push
```

Then:

```bash
npm run dev
```

Other scripts:

```bash
npm run build          # production build
npm run lint
npm run seed:demo      # local demo data
npm run indexnow       # push the sitemap to Bing, Yandex, Naver, Seznam, Yep
```

`indexnow` is for after publishing, not for a timer — resubmitting unchanged
URLs is what the protocol's 429 response exists to punish. Google does not
participate in IndexNow; discovery there runs through Search Console and the
sitemap.

## Assessment pilot setup

Apply all migrations in order on a staging Supabase project. Configure the
service role key server-side. Set `IMPRINT_PILOT_ROLES` to the exact IDs of roles
approved for an invited pilot, for example `software-qa,software-developer`.
An empty list disables new proficiency scoring. Role content and criteria
live in `lib/assessment/catalog.ts`. Verify tasks with practitioners, compare
model output with independent ratings, and test alternate forms and relevant
input modes before enabling a role more broadly. Pilot differences are
descriptive until meaningful change thresholds are established.

Set `IMPRINT_REVIEWER_IDS` to the account IDs of authorized reviewers. Their
queue is under `/dashboard/assessment-review`. Request a review from a scored
assessment. Submit historical evidence from Progress.

## Launch scope

Imprint is for people aged 18 and older. Apply migration 020 before deploying
the age gate. New email signups confirm their age during registration, and
existing accounts confirm it on their next visit.

Google OAuth is deferred. Launch uses email and password. Keep the Google
sign-in flag off. Configure authentication emails in Supabase Auth. Task
reminders can be activated separately after verifying email delivery.

Task reminder delivery requires server-only `RESEND_API_KEY`,
`IMPRINT_REMINDER_FROM` and `IMPRINT_CRON_SECRET`, and an hourly signed POST
to `/api/internal/imprint-reminders`. Follow the rollout instructions for
Supabase Cron. The worker checks the opt-in, adult confirmation, and the
confirmed Supabase Auth email address. Verify delivery using a test account
before enabling a production schedule.

Run `npm run test:assessment` for the assessment rule tests. Run
`supabase/tests/imprint_flow.sql` against a fresh local or staging database
after migration to verify retry behavior, scheduling, and access boundaries.
The test creates temporary fixtures inside a rolled-back transaction.

## Disposable QA backend

Run `bash scripts/qa-local-supabase.sh` with Docker and Supabase CLI v2.84.2.
The script creates a new local project with Auth, PostgREST, PostgreSQL, Storage,
and Mailpit. It applies the original migration history after checking that the
managed Storage table already has row-level security. Set `QA_PORT` to your
local app port, `QA_EMAIL_CONFIRMATIONS` to `true` or `false`, and use a unique
`QA_DB_PORT_PREFIX` for each stack. `QA_SUPABASE_ENV` selects the private file
containing the local connection settings. On Windows the script runs inside
WSL. For upgrade testing, set `QA_UPGRADE_FIXTURE` to the absolute path of
`supabase/tests/qa_upgrade_seed.sql` and run `qa_upgrade_verify.sql` afterward.

Mentor applications are reviewed at `/dashboard/mentors/review` by an account
listed in `IMPRINT_REVIEWER_IDS`. Approval applies to the profession reviewed.
The mentor chooses when to open requests. Mentorship check-ins and Time Capsule
unlock dates use UTC. Settings exports a `tar.gz` of account records and owned
attachments, including metadata for still-sealed Time Capsules.

## Project structure

```
app/
  (public)/       landing, about, methodology, drift-score, research, faq,
                  glossary, notes, for/[audience], courses, contact, legal,
                  public credential pages
  llms.txt/       generated agent-facing site map
  llms-full.txt/  generated full-text corpus
  (auth)/         sign in, sign up, password reset
  (onboarding)/   baseline capture flow
  (dashboard)/    the product
  api/            route handlers
components/       one directory per feature area
content/
  notes/          articles as MDX, read at build time
lib/
  beacon/         visitor beacon: geo, bot scoring, Telegram, crawler + probe ids
  seo/            entity constants, JSON-LD builders, route registry
  content/        glossary, FAQ, research index, cluster and note loaders
  supabase/       browser, server and middleware clients
  utils/          formatting, profession clusters and baseline modules
  validations/    zod schemas
  api/            shared route-handler helpers
scripts/
  indexnow.mjs    push the sitemap to IndexNow participants
supabase/
  migrations/     schema and RLS policies, applied in order
types/            shared domain types
```

## Current limitations

Honest notes on where the MVP stops:

- Legacy text comparisons describe text characteristics and activity. Role proficiency scoring is in pilot and requires independent validation for each supported track.
- Courses are presented as upcoming with a waitlist; no course content ships in
  this build. `/courses` says so on the page rather than only here.
- A small number of credential statistics are placeholders pending the full
  relational rollup.
- The per-user rate limiter is in-process, so on serverless it is per-instance
  rather than global. Adequate for the current scale, and the seam for a shared
  store is isolated in `lib/api/rate-limit.ts`.
- The visitor beacon records IP, city-level location, interaction timings and —
  when signed in — the account, and sends them to a private Telegram chat. This
  is disclosed in [the privacy policy](https://imprint.houseofnamus.com/privacy),
  which carries a one-click opt-out (`?notrack=1`). `Do Not Track` is reported in
  the alert but does not itself suppress logging.
- Open Graph card images render in a fallback font. No font is passed to the
  image renderer, so every bold weight in `components/seo/OgCard.tsx` is
  currently inert and the cards are not in the brand typeface.
- Landing-page quotes in the friends-and-family section are placeholders. They
  are labelled as pre-launch impressions and carry no invented metrics, but they
  need replacing with real attributed words before launch. This also gates
  `Review` structured data — none ships anywhere on the site while they stand.

## Documentation

This README is the public documentation for the repository. The scoring method
is published for readers rather than developers at
[/methodology](https://imprint.houseofnamus.com/methodology), including a
limitations section covering the length-sensitivity of type–token ratio, the
directionless divergence measure, and the fact that three of the four signals
measure engagement with IMPRINT itself.

Internal working documents — the project bible, the developer and portfolio
handoffs, and the beacon write-up — are kept out of this repository under
`/docs/`, which is gitignored.

## License

MIT — see [LICENSE](LICENSE).
