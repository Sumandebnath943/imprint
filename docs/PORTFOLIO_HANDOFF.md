# IMPRINT — Portfolio Handoff

Material for presenting this project: what it is, what is genuinely interesting
about it, and the specifics worth citing. Written to be quoted from, not read
aloud.

**Live:** [imprint.houseofnamus.com](https://imprint.houseofnamus.com) ·
**Source:** [github.com/Sumandebnath943/imprint](https://github.com/Sumandebnath943/imprint)

---

## 1. The one-liner

**IMPRINT is an identity preservation engine — it captures how you think before
AI erodes it, then measures the distance as you drift.**

If you have thirty seconds, that plus the drift formula is the pitch.

---

## 2. The problem, framed

AI does not replace you all at once. It replaces you one delegated decision at
a time — a paragraph you did not write, a judgement call you did not make, a
problem you did not sit with.

The erosion is real but invisible, because **there is no "before" to compare
against.** Every other tool in this space measures output. IMPRINT measures the
distance between who you were and who you are becoming.

That framing is the product's strongest asset. Lead with it.

---

## 3. What makes it technically interesting

Four things, in the order they tend to land.

### 3.1 It quantifies something most people assume is unquantifiable

The Drift Score is a weighted composite of four measured signals, not a vibe:

```
drift = 0.40 · baseline_divergence    (language distance from your own baseline)
      + 0.25 · vault_inactivity       (skills not practised in 14 days)
      + 0.20 · ai_dependence          (times you asked the AI to decide for you)
      + 0.15 · journal_irregularity   (days with no unaided writing)
```

Baseline divergence carries the most weight because vocabulary richness and
sentence structure degrade earliest under delegation. The score is
**directionless by design** — it measures distance from *your* baseline, never
a comparison against other people.

### 3.2 The AI is deliberately constrained to be less capable

The Mirror runs on `gpt-4o` but is forbidden from answering. It asks questions,
never advises, never drafts. When it detects that you are asking it to decide
something, it refuses and **records a dependency flag that feeds back into your
drift score.**

Using an LLM and then constraining it *against* its natural behaviour — making
refusal the feature — is a more interesting design position than another
chat wrapper.

### 3.3 The baseline is deliberately un-fakeable

The Mirror originally accepted the user's cluster and baseline from the request
body. That meant a client could fabricate the very measuring stick it was being
judged against. Both are now read from the database server-side, the free-text
session context is sanitised before it reaches the system prompt, and requests
are rate-limited per user because every message is a billed model call.

That is a small, specific piece of threat-modelling in a product where the
integrity of the measurement *is* the product.

### 3.4 Authorisation lives in the database

Every table has row-level security with policies scoped to `auth.uid()`. Route
handlers run as the caller. The service-role key is used in exactly one
application path — deleting an auth user, which requires the admin API and is
gated behind a typed confirmation phrase.

Cross-user reads (leaderboard, mentor directory, public credentials) go through
a `public_profiles` view that exposes no email and no onboarding state.

---

## 4. Scope, in numbers

| | |
| --- | --- |
| Product pages | 18 dashboard routes, 7-step onboarding, 5 public |
| API route handlers | 22 |
| Database tables | 19, all with RLS |
| Migrations | 10, all idempotent |
| Application code | ~27,600 lines across 194 TS/TSX files |
| SQL | 1,210 lines |
| Storage buckets | 6, private by default, per-user path enforcement |

**Features:** Drift scoring · Calibration · Skill Vault with generated
challenges · The Mirror (Socratic AI) · The Forge (distraction-free writing) ·
Journal · Beliefs · Time Capsule · Gallery · Public shareable credential with
generated badge · Human Circles · Mentorship · Leaderboard.

---

## 5. The engineering story worth telling

This is the part that differentiates a portfolio piece from a demo. The project
was audited end-to-end and a series of **silent** failures were found — bugs
that produced no errors and looked fine on screen.

Pick two or three; the whole list is overkill.

### Four features were dead and looked merely empty

Circles hit a Postgres `42P17` infinite-recursion error because a policy on
`circle_members` queried `circle_members`. The leaderboard only ever showed the
viewer. The mentor directory was always empty. Every public credential link
404'd. All four presented as innocuous empty states. Fixed with
`SECURITY DEFINER` helper functions and a restricted view.

### Creating a circle was impossible on the default path

The insert chained `.select()`, and `RETURNING` is evaluated against the SELECT
policy — `NOT is_private OR is_circle_member(id)`. The creator's membership row
is written *after* the circle, so a private circle failed its own visibility
check. Private is the default, so every ordinary "Create a Circle" hit it. The
error message pointed at the wrong policy entirely.

### The Mirror measured every user against generic defaults

It selected a column that never existed. Postgres rejects the whole query when
one column is unknown, so the result came back `null`, was `?? []`'d into a
fallback, and the Mirror silently compared everyone's live writing against
300 words / 0.6 richness / 15-word sentences instead of their own baseline —
the entire point of the feature.

### The dashboard's headline card showed fabricated numbers

The API wrote the four drift signals in camelCase; the dashboard read
snake_case. The keys never matched, so every user on every account saw the same
hardcoded 85 / 60 / 72. The signals were also stored under the names of their
opposites — `aiIndependence` held a *dependence* count — so any consumer that
did match would have read them backwards.

### Accessibility was systematically below standard

357 text colours measured below WCAG AA against the `#080808` ground; the worst
tier at **1.74:1**, the most-used at **3.75:1**. They could not be fixed
piecemeal — lifting the darkest tier alone would have made it brighter than the
tier above and inverted the hierarchy — so the whole ramp moved together with
its ordering preserved. Button text on the brand orange was **3.21:1**; near-black
on the same orange is **6.18:1**, which fixed it without touching the brand
colour.

### The dashboard was unusable on a phone

The desktop sidebar rail had no responsive class, so it rendered *alongside* the
mobile tab bar and left 243px of usable width on a 375px screen, with 69
elements running off the edge — invisibly, because an `overflow-x: hidden`
added for an unrelated fix was clipping them.

---

## 6. Design decisions worth defending

- **Two-column onboarding.** A guided flow whose input is below the fold is
  broken. The framing text sits beside the controls rather than above them,
  which halves the vertical requirement and lets every step fit one screen at
  660px — the tightest realistic laptop viewport. The writing step puts the
  prompt on the left and the box on the right, so the question stays readable
  while you answer it.
- **Contained scroll panes.** Where a list genuinely cannot fit — 35 professions
  is 1,068px of grid — it scrolls in a pane with a slim thumb and soft fade
  edges. A bare scrollbar floating in open space reads as a rendering fault.
- **Frosted glass that actually works.** Both fixed bars already declared
  `backdrop-filter: blur(20px)` and then painted `rgba(8,8,8,0.85)` on top —
  at 85% opacity nothing reaches the blur. Dropping the fill to 0.60 and adding
  `saturate(160%)` is what makes it read as glass rather than fog.
- **Honest metric names.** Drift signals are stored under names describing what
  they measure, all increasing as things get worse, and inverted at the view
  layer. The previous naming is what caused the backwards-reading bug.
- **Never interleave two data providers.** The visitor beacon resolves location
  from Vercel's edge headers and the network operator from a separate IP lookup.
  Merging them field-by-field produced an alert reading "Bengaluru … postal
  600079" — a Chennai postcode — because the two use different databases and
  disagree at the edges. Location now comes from one provider at a time; only
  network facts merge. The same instinct as the drift signals: a number is only
  worth having if you can say exactly where it came from.

---

## 7. Talking points if asked "what would you do differently?"

Answer this honestly; it lands better than a polished non-answer.

- **Tests from the start.** There are none. Everything was verified by driving
  the running app — which found real bugs a type checker cannot — but nothing
  prevents regressions. The drift computation is pure arithmetic and should
  have been tested on day one.
- **Never edit an applied migration.** Four of the ten migrations exist purely
  because columns were added to `001_initial_schema.sql` after it had already
  run, where `CREATE TABLE IF NOT EXISTS` silently does nothing.
- **Semantic signals over lexical ones.** Type–token ratio and sentence length
  are transparent and cheap, but they are proxies for reasoning depth rather
  than measures of it. Embeddings are the honest next step, and the limitation
  is documented rather than hidden.

---

## 8. Demo path

Five minutes, in this order:

1. **Landing page** — the premise, and the frosted nav over the orange section.
2. **Sign in as the seeded demo account** (`npm run seed:demo` first) — the
   dashboard with ten weeks of real history, drift at 22 "Anchored", and the
   signal bars showing genuine inverted values.
3. **The Mirror** — ask it to decide something for you. Watch it refuse and flag
   the dependency.
4. **Drift** — the score over time with the contributing signals broken out.
5. **Public credential** — open the share link in a private window to show it
   resolving anonymously while a private one returns nothing.

Have `docs/PROJECT_BIBLE.md` open if anyone asks how the score is computed.

A recorded 4:44 walkthrough of this path exists, built for the BPF 2026
submission: every frame is a capture of the running production build against the
seeded account, cut against measured sentence boundaries in the narration.

---

## 9. Honest current limitations

State these before anyone finds them.

- No automated tests.
- Courses ship no content — waitlist only.
- The per-user rate limiter is in-process, so per-instance on serverless.
- Drift metrics are lexical proxies, not semantic measures.
- Onboarding scrolls on mobile by design; seven steps of content cannot fit a
  phone screen, and internal scroll regions there would be worse.
- The site logs visits — IP, city-level location, interaction timings — to a
  private Telegram chat. Disclosed at `/privacy`; `Do Not Track` is reported but
  not yet honoured as a suppression signal.
- `/terms` is linked from signup and does not exist yet.
