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

**1 — Baseline capture.** During onboarding you answer a set of prompts drawn
from four universal modules (opinion & belief, decision under pressure, memory
& recall, emotional fingerprint) plus modules specific to your profession
cluster — language & voice, visual & creative, technical & analytical, human &
social, leadership & strategy, or life & personal. Responses can be text,
voice, or file upload.

**2 — Metric extraction.** Each response is reduced to four measurable
signals:

| Signal | How it is computed |
| --- | --- |
| `word_count` | tokens in the response |
| `avg_sentence_length` | words ÷ sentences |
| `vocabulary_richness` | unique words ÷ total words (type–token ratio) |
| `response_time_seconds` | time to compose |

**3 — Calibration.** On a recurring cadence you answer the same modules again.
Each response is compared against its own baseline, per module.

**4 — Drift Score.** Four signals are combined into a weighted composite on a
0–100 scale, where **higher means further from yourself**:

| Signal | Weight | What it measures |
| --- | --- | --- |
| Baseline divergence | 40% | How far this calibration's vocabulary richness and sentence length sit from your baseline |
| Vault inactivity | 25% | Share of your tracked skills not practised in the last 14 days |
| AI dependence | 20% | Dependency flags the Mirror raised in the last 14 days |
| Journal irregularity | 15% | Share of the last 14 days with no entry |

Baseline divergence carries the heaviest weight because language degrades
earliest and most visibly under delegation. The dashboard presents each
signal inverted — as the quality drift erodes — so a fuller bar always
reads as better.

| Score | Label |
| --- | --- |
| 0–39 | **Anchored** |
| 40–59 | **Drifting** |
| 60–79 | **Critical** |
| 80–100 | **Identity Crisis** |

The score is directionless by design — it measures *distance* from your
baseline, not improvement or decline against anyone else.

## Features

### Measurement
- **Drift** — your score over time, with the contributing signals broken out so
  you can see *which* dimension moved.
- **Calibration** — the recurring re-test that produces each new score.
- **Skill Vault** — the skills you are deliberately protecting, each with a
  strength value and generated practice challenges.

### Practice
- **The Mirror** — a Socratic reflection surface built on `gpt-4o`. It is
  constrained to ask questions and nothing else: it will not answer, advise,
  recommend, or write for you. It detects when you are asking it to decide
  something and redirects the question back at you, tracking how often that
  happens.
- **The Forge** — distraction-free composition with drift signals captured as
  you write.
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

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router, RSC) |
| Language | TypeScript, `strict: true` |
| Styling | Tailwind CSS |
| Database / Auth / Storage | Supabase (Postgres, RLS enforced) |
| AI | OpenAI `gpt-4o` |
| Client state | Zustand |
| Forms / validation | react-hook-form + zod |
| Motion / charts | framer-motion, recharts |
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
- **Prompt safety.** The Mirror reads the user's cluster and baseline from the
  database rather than the request body, so a client cannot fabricate the
  baseline it is being measured against. The free-text session context is
  sanitised before it reaches the system prompt, and requests are rate-limited
  per user because every message is a billed model call.

## Running locally

**Prerequisites:** Node 18+, a Supabase project, an OpenAI API key.

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
| `OPENAI_API_KEY` | Powers The Mirror |
| `NEXT_PUBLIC_APP_URL` | Canonical origin, used for OG images and the sitemap |
| `TELEGRAM_BOT_TOKEN` | Optional. Visitor beacon alerts; unset means the beacon is a no-op |
| `TELEGRAM_CHAT_ID` | Optional. Destination chat for those alerts |

Apply the migrations in order from `supabase/migrations/` via the Supabase SQL
editor or CLI:

```bash
supabase db push
```

Then:

```bash
npm run dev
```

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
  beacon/         visitor beacon: geo, bot scoring, Telegram, AI crawler ids
  seo/            entity constants, JSON-LD builders, route registry
  content/        glossary, FAQ, research index, cluster and note loaders
  supabase/       browser, server and middleware clients
  utils/          drift + baseline computation
  validations/    zod schemas
  api/            shared route-handler helpers
supabase/
  migrations/     schema and RLS policies, applied in order
types/            shared domain types
```

## Current limitations

Honest notes on where the MVP stops:

- Drift metrics are lexical (type–token ratio, sentence length, latency). They
  are deliberately transparent and cheap to compute, but they are a proxy for
  reasoning depth rather than a direct measure of it. Semantic and embedding-
  based signals are the natural next step.
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
- Landing-page quotes in the friends-and-family section are placeholders. They
  are labelled as pre-launch impressions and carry no invented metrics, but they
  need replacing with real attributed words before launch.

## Documentation

| Document | For |
| --- | --- |
| [Project Bible](docs/PROJECT_BIBLE.md) | Canonical reference — domain model, algorithms, schema, conventions |
| [Developer Handoff](docs/HANDOFF.md) | Picking up the code: setup, traps, current state, what to do next |
| [Portfolio Handoff](docs/PORTFOLIO_HANDOFF.md) | Presenting the project — the story and the numbers |
| [Beacon](docs/BEACON.md) | Visitor alerts: what is collected, how location resolves, configuration |

The scoring method is also published for readers rather than developers at
[/methodology](https://imprint.houseofnamus.com/methodology), including a
limitations section covering the length-sensitivity of type–token ratio, the
directionless divergence measure, and the fact that three of the four signals
measure engagement with IMPRINT itself.

## License

MIT — see [LICENSE](LICENSE).
