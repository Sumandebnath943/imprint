/**
 * Seeds a fully populated demo account.
 *
 * Every dashboard in IMPRINT is longitudinal — drift only means something
 * against a history — so a freshly created account shows empty states
 * everywhere and demos badly. This builds an account with ten weeks of
 * plausible history behind it.
 *
 *   node scripts/seed-demo.mjs
 *   node scripts/seed-demo.mjs --email you@example.com --password 'S3cret!'
 *
 * Re-running wipes and rebuilds that account's rows, so it is safe to repeat.
 * Requires SUPABASE_SERVICE_ROLE_KEY: creating a confirmed auth user and
 * writing rows on its behalf both need to bypass RLS.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// ── Env ─────────────────────────────────────────────────────────────────────

function loadEnv(file = ".env.local") {
  const p = path.resolve(process.cwd(), file);
  if (!fs.existsSync(p)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(p, "utf8")
      .split("\n")
      .filter((l) => l.trim() && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      })
  );
}

const env = { ...loadEnv(), ...process.env };
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Set them in .env.local or the environment before running."
  );
  process.exit(1);
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const EMAIL = arg("email", "demo@imprint.local");
const PASSWORD = arg("password", "ImprintDemo!2026");

const db = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ─────────────────────────────────────────────────────────────────

const DAY = 86_400_000;
const daysAgo = (n) => new Date(Date.now() - n * DAY).toISOString();
const dateAgo = (n) => daysAgo(n).split("T")[0];

function isoWeek(iso) {
  const d = new Date(iso);
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const start = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return {
    week: Math.ceil(((t - start) / DAY + 1) / 7),
    year: t.getUTCFullYear(),
  };
}

const labelFor = (s) => (s <= 39 ? "anchored" : s <= 59 ? "drifting" : s <= 79 ? "critical" : "crisis");

async function insert(table, rows) {
  if (!rows.length) return;
  const { error } = await db.from(table).insert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ${table.padEnd(22)} ${rows.length}`);
}

// ── 1. Auth user ────────────────────────────────────────────────────────────

async function findOrCreateUser() {
  // listUsers is paginated; the demo account is normally on page one, but
  // walk the pages so this still works on a populated project.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const found = data.users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());
    if (found) {
      console.log(`Reusing existing user ${EMAIL}`);
      return found.id;
    }
    if (data.users.length < 200) break;
  }

  const { data, error } = await db.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "AdaKessler" },
  });
  if (error) throw new Error(`createUser: ${error.message}`);
  console.log(`Created user ${EMAIL}`);
  return data.user.id;
}

// ── 2. Wipe prior demo rows ─────────────────────────────────────────────────

const OWNED_TABLES = [
  "vault_challenges",
  "skill_vault",
  "journal_entries",
  "mirror_sessions",
  "calibration_sessions",
  "drift_scores",
  "baseline_imprints",
  "beliefs",
  "time_capsules",
];

async function wipe(userId) {
  for (const table of OWNED_TABLES) {
    const { error } = await db.from(table).delete().eq("user_id", userId);
    // A table that does not exist yet in this project is not fatal.
    if (error && !/does not exist/i.test(error.message)) {
      throw new Error(`wipe ${table}: ${error.message}`);
    }
  }
  console.log("Cleared previous demo rows");
}

// ── 3. Content ──────────────────────────────────────────────────────────────

const BASELINE = [
  ["U1", "Opinion & Belief", "Remote work is not a perk, it is a redistribution of power over time. When the commute vanishes the employer loses its strongest claim on the shape of your day, and a lot of the backlash is really about that loss rather than productivity. I have watched teams ship more with less friction from kitchens and spare rooms. The people who insist otherwise rarely produce the numbers, they produce anecdotes about culture. Culture is not a floor plan. It is whether people tell each other the truth when something is going badly.", 88, 24.1, 0.71, 402],
  ["U2", "Decision Under Pressure", "I turned down a contract in March that would have paid well for six months. The work was real but the person hiring described three previous contractors as difficult, which told me more about him than about them. I listed what I would gain, money and a logo, against what I would spend, most of my attention through summer. I ignored the part of me that wanted to be wanted. What I would do differently is decide faster. I sat with it for eleven days and the answer had not changed since day two.", 96, 21.3, 0.68, 511],
  ["U3", "Memory & Recall", "The last book I finished was a short history of the Dutch tulip market, though I could not tell you the author without looking. What stayed with me is that the crash mattered less than the stories told afterwards. My grandmother's kitchen had a yellow enamel table with a chip on the near corner shaped like a comma. I remember the chip more clearly than her face now, which bothers me more than I usually admit.", 79, 19.8, 0.74, 388],
  ["U4", "Emotional Fingerprint", "I get quiet rather than loud. When something lands badly the first thing that goes is my willingness to speculate out loud, and people read that as calm when it is closer to the opposite. It takes about a day before I can say what actually bothered me, and by then the moment has usually passed, so I have learned to write it down instead and bring it up later even when it feels stale.", 74, 23.0, 0.76, 349],
  ["T1", "Problem Framing", "Most problems handed to me are already framed as solutions, which is the real problem. Someone says the search is slow when they mean people cannot find things, and those are different investigations. I try to get back to the observation underneath before touching anything. The cost of skipping that step is you build the wrong thing correctly, and correct construction makes it much harder to admit later that the frame was wrong.", 71, 22.4, 0.73, 366],
  ["T2", "Estimation & Intuition", "I would guess a mid-size grocery store carries somewhere around thirty thousand distinct items. That comes from walking aisles and counting a shelf section, maybe two hundred facings per bay, then multiplying by bays and discounting for duplicates across sizes. I trust the order of magnitude and not the number. Where my intuition fails is anything growing exponentially, where I consistently guess low by a wide margin.", 66, 20.6, 0.77, 331],
];

const DRIFT = [
  [70, 61], [63, 54], [56, 47], [49, 44], [42, 38], [35, 41], [28, 33], [21, 29], [14, 26], [7, 22],
];

const SKILLS = [
  ["Argument construction", "reasoning", 82, 11, 2],
  ["Estimation without tools", "reasoning", 64, 6, 9],
  ["Longhand drafting", "expression", 71, 8, 4],
  ["Reading dense text unaided", "comprehension", 58, 5, 13],
  ["Debugging by inspection", "technical", 77, 9, 3],
  ["Explaining to a novice", "communication", 69, 7, 6],
];

const BELIEFS = [
  ["Convenience is the main way autonomy is lost, not coercion.", "technology", 9, 120],
  ["Most disagreements are about definitions, not facts.", "epistemics", 8, 96],
  ["Writing by hand produces different thoughts than typing.", "cognition", 6, 74],
  ["I should be able to explain my work without notes.", "practice", 7, 41],
];

// Leading offsets are 0/1/2 on purpose: the streak counts back from today, so
// without an entry dated today the demo dashboard reads "start your streak".
const JOURNAL = [
  [0, "The cost of the shortcut", "I noticed today that I reached for autocomplete before I had finished forming the sentence in my head. That is the part that unsettles me. Not that the tool finished it, but that I had outsourced the forming.", 42, true, 5],
  [1, "Estimation practice, unaided", "Guessed the number of windows on the building opposite, then counted. I was low by nineteen percent, which is better than last month but still low in the same direction, which suggests a bias rather than noise.", 38, true, 4],
  [2, "On being quiet", "Wrote for twenty minutes about why I go silent when criticised. Did not reach a conclusion. Reaching a conclusion was probably not the point.", 27, false, 0],
  [6, "Longhand, no backspace", "Filled two pages without deleting anything. The prose is worse and the thinking is better. I do not know yet what to do with that trade.", 31, true, 6],
  [11, "Rebuilt the argument from scratch", "Took the position I have been repeating for months and tried to reconstruct it without the phrases I habitually use. About a third of it did not survive contact.", 45, true, 7],
  [17, "Reading without a summary", "Forty pages, no assistance, no summary afterwards. Retention felt thinner than I expected. Worth repeating before drawing conclusions.", 29, false, 0],
];

const MIRROR = [
  [4, 12, 11, 0, ["work", "attention"], 840],
  [8, 9, 8, 1, ["a decision"], 610],
  [15, 14, 13, 0, ["beliefs"], 1020],
  [22, 7, 7, 2, ["skills"], 455],
];

// ── 4. Seed ─────────────────────────────────────────────────────────────────

/**
 * The same four components /api/calibration/complete sums into
 * profiles.imprint_score. Computed here rather than hardcoded so the profile's
 * breakdown bars actually add up to the score shown above them.
 */
function computeImprintScore() {
  const avgSkillStrength = SKILLS.reduce((s, k) => s + k[2], 0) / SKILLS.length;
  const journalDays = new Set(JOURNAL.map(([days]) => days)).size;
  const dependencyFlags = MIRROR.reduce((s, m) => s + m[3], 0);

  return Math.max(0, Math.min(1000, Math.round(
    Math.min(avgSkillStrength * 2.5, 250) +
    Math.min(DRIFT.length * 50, 300) +
    Math.min(journalDays * 8, 250) +
    Math.max(200 - dependencyFlags * 5, 0)
  )));
}

async function seed() {
  const userId = await findOrCreateUser();
  await wipe(userId);

  // The handle_new_user trigger creates the profile row; upsert so this works
  // whether or not that trigger is installed.
  const { error: pErr } = await db.from("profiles").upsert(
    {
      id: userId,
      email: EMAIL,
      full_name: "Ada Kessler",
      username: "ada",
      age_group: "adult_19_64",
      profession: "Systems engineer",
      profession_cluster: "technical_analytical",
      ai_exposure_level: "moderate",
      ai_use_context: ["writing", "coding", "research"],
      onboarding_completed: true,
      onboarding_step: 6,
      imprint_score: computeImprintScore(),
      bio: "Building things that do not need me to explain them twice.",
      location: "Rotterdam",
      credential_public: true,
      // Migration 007 issues these on signup; set one explicitly so the demo
      // credential and its public share link work even before 007 is applied.
      credential_code: `IMPRINT-${userId.slice(0, 8).toUpperCase()}-DEMO01`,
      created_at: daysAgo(74),
    },
    { onConflict: "id" }
  );
  if (pErr) throw new Error(`profiles: ${pErr.message}`);
  console.log("  profiles               1");

  await insert(
    "baseline_imprints",
    BASELINE.map(([id, name, text, wc, asl, vr, secs]) => ({
      user_id: userId,
      cluster: id.startsWith("U") ? "universal" : "technical_analytical",
      module_id: id,
      module_name: name,
      prompt_given: `${name} baseline prompt`,
      response_text: text,
      response_type: "text",
      word_count: wc,
      avg_sentence_length: asl,
      vocabulary_richness: vr,
      response_time_seconds: secs,
      created_at: daysAgo(73),
    }))
  );

  // Calibration sessions and drift scores are inserted as pairs so the
  // calibration history and the drift chart tell the same story.
  const sessions = DRIFT.map(([days, score], i) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    session_number: i + 1,
    status: "completed",
    responses: [],
    drift_score_produced: score,
    comparison_vs_baseline: {},
    completed_at: daysAgo(days),
    next_session_due: daysAgo(days - 14),
    created_at: daysAgo(days),
  }));
  await insert("calibration_sessions", sessions);

  await insert(
    "drift_scores",
    DRIFT.map(([days, score], i) => {
      const created = daysAgo(days);
      const { week, year } = isoWeek(created);
      return {
        user_id: userId,
        score,
        score_label: labelFor(score),
        calibration_session_id: sessions[i].id,
        delta_from_previous: i === 0 ? 0 : score - DRIFT[i - 1][1],
        // Drift contributors, higher = worse, matching what
        // /api/calibration/complete writes. They roughly reconstruct the
        // score under its own weights (0.40/0.25/0.20/0.15).
        contributing_signals: {
          baseline_divergence: Math.min(100, Math.round(score * 1.1)),
          vault_inactivity: Math.min(100, Math.round(score * 0.9)),
          ai_dependence: Math.min(100, Math.round(score * 0.7)),
          journal_irregularity: Math.min(100, Math.round(score * 1.2)),
        },
        week_number: week,
        year,
        created_at: created,
      };
    })
  );

  const skills = SKILLS.map(([name, cat, strength, practiced, lastDays]) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    skill_name: name,
    skill_category: cat,
    cluster: "technical_analytical",
    strength_level: strength,
    times_practiced: practiced,
    last_exercised: daysAgo(lastDays),
    decay_rate: 0.5,
    created_at: daysAgo(70),
  }));
  await insert("skill_vault", skills);

  await insert("vault_challenges", [
    {
      user_id: userId,
      skill_id: skills[1].id,
      challenge_title: "Estimate before you measure",
      challenge_description:
        "Pick three quantities you could look up. Write your estimate and your reasoning first, then check. Record the direction of the error, not just the size.",
      challenge_type: "practice",
      assigned_date: dateAgo(2),
      due_date: dateAgo(-1),
      status: "pending",
      strength_gained: 6,
      created_at: daysAgo(2),
    },
    {
      user_id: userId,
      skill_id: skills[3].id,
      challenge_title: "Forty pages, unaided",
      challenge_description:
        "Read forty pages of something difficult with no summary, no assistant, no notes. Afterwards write what you retained from memory.",
      challenge_type: "practice",
      assigned_date: dateAgo(16),
      due_date: dateAgo(13),
      status: "completed",
      strength_gained: 8,
      completed_at: daysAgo(14),
      created_at: daysAgo(16),
    },
  ]);

  await insert(
    "journal_entries",
    JOURNAL.map(([days, title, content, wc, forge, mins]) => ({
      user_id: userId,
      title,
      content,
      word_count: wc,
      is_forge_entry: forge,
      was_timed: mins > 0,
      time_limit_seconds: mins > 0 ? mins * 60 : null,
      has_ai_assistance: false,
      drift_signals: forge
        ? { vocabulary_richness: 0.72, avg_sentence_length: 21.4, words_per_minute: 34 }
        : {},
      created_at: daysAgo(days),
    }))
  );

  await insert(
    "mirror_sessions",
    MIRROR.map(([days, userMsgs, aiMsgs, flags, topics, secs]) => ({
      user_id: userId,
      messages: [],
      user_message_count: userMsgs,
      ai_question_count: aiMsgs,
      dependency_flags: flags,
      topics,
      session_duration_seconds: secs,
      created_at: daysAgo(days),
    }))
  );

  await insert(
    "beliefs",
    BELIEFS.map(([statement, category, confidence, days]) => ({
      user_id: userId,
      belief_statement: statement,
      category,
      confidence_level: confidence,
      first_recorded: daysAgo(days),
      last_reviewed: daysAgo(Math.floor(days / 4)),
      change_log: [],
      created_at: daysAgo(days),
    }))
  );

  await insert("time_capsules", [
    {
      user_id: userId,
      title: "To whoever is reading this in a year",
      content:
        "You were worried that the tools were doing the thinking. Check whether you still write the first draft yourself. If not, that is the answer, and you already knew it when you wrote this.",
      unlock_date: dateAgo(-300),
      is_unlocked: false,
      created_at: daysAgo(65),
    },
    {
      user_id: userId,
      title: "Before the calibration",
      content:
        "Predicting a drift score around 40. Writing it down so I cannot revise the memory afterwards.",
      unlock_date: dateAgo(30),
      is_unlocked: true,
      created_at: daysAgo(60),
    },
  ]);

  console.log(`\nDemo account ready\n  email    ${EMAIL}\n  password ${PASSWORD}\n`);
}

seed().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
