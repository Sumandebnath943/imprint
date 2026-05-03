-- ============================================================
-- IMPRINT — Supabase Database Migration
-- ============================================================

-- ─── Enable UUID extension ───────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email               TEXT NOT NULL,
  full_name           TEXT NOT NULL DEFAULT '',
  username            TEXT UNIQUE,
  avatar_url          TEXT,
  age_group           TEXT CHECK (age_group IN ('child_8_12','teen_13_15','teen_16_18','adult_19_64','senior_65_plus')),
  profession          TEXT,
  profession_cluster  TEXT CHECK (profession_cluster IN ('language_voice','visual_creative','technical_analytical','human_social','leadership_strategy','life_personal')),
  ai_exposure_level   TEXT CHECK (ai_exposure_level IN ('none','light','moderate','heavy','dependent')),
  ai_use_context      TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step     INTEGER DEFAULT 0,
  imprint_score       INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BASELINE IMPRINTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS baseline_imprints (
  id                      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id                 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cluster                 TEXT NOT NULL,
  module_id               TEXT NOT NULL,
  module_name             TEXT NOT NULL,
  prompt_given            TEXT NOT NULL,
  response_text           TEXT,
  response_audio_url      TEXT,
  response_file_url       TEXT,
  response_type           TEXT CHECK (response_type IN ('text','audio','file','multimodal')) NOT NULL,
  word_count              INTEGER NOT NULL DEFAULT 0,
  avg_sentence_length     FLOAT NOT NULL DEFAULT 0,
  vocabulary_richness     FLOAT NOT NULL DEFAULT 0,
  response_time_seconds   INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DRIFT SCORES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drift_scores (
  id                      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id                 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score                   INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  score_label             TEXT CHECK (score_label IN ('anchored','drifting','critical','crisis')) NOT NULL,
  calibration_session_id  UUID,
  delta_from_previous     INTEGER NOT NULL DEFAULT 0,
  contributing_signals    JSONB NOT NULL DEFAULT '{}',
  week_number             INTEGER NOT NULL,
  year                    INTEGER NOT NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SKILL VAULT ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_vault (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  skill_name        TEXT NOT NULL,
  skill_category    TEXT NOT NULL,
  cluster           TEXT NOT NULL,
  strength_level    INTEGER NOT NULL DEFAULT 50 CHECK (strength_level >= 0 AND strength_level <= 100),
  last_exercised    TIMESTAMPTZ DEFAULT NOW(),
  decay_rate        FLOAT NOT NULL DEFAULT 0.5,
  times_practiced   INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── VAULT CHALLENGES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_challenges (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id               UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id              UUID REFERENCES skill_vault(id) ON DELETE CASCADE NOT NULL,
  challenge_title       TEXT NOT NULL,
  challenge_description TEXT NOT NULL,
  challenge_type        TEXT NOT NULL,
  assigned_date         DATE NOT NULL,
  due_date              DATE NOT NULL,
  completed_at          TIMESTAMPTZ,
  submission_text       TEXT,
  submission_audio_url  TEXT,
  submission_file_url   TEXT,
  status                TEXT CHECK (status IN ('pending','completed','missed')) NOT NULL DEFAULT 'pending',
  strength_gained       INTEGER,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── JOURNAL ENTRIES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id               UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title                 TEXT NOT NULL,
  content               TEXT NOT NULL,
  word_count            INTEGER NOT NULL DEFAULT 0,
  mood                  TEXT,
  tags                  TEXT[] DEFAULT '{}',
  is_forge_entry        BOOLEAN NOT NULL DEFAULT FALSE,
  was_timed             BOOLEAN NOT NULL DEFAULT FALSE,
  time_limit_seconds    INTEGER,
  has_ai_assistance     BOOLEAN NOT NULL DEFAULT FALSE,
  drift_signals         JSONB,
  response_file_url     TEXT,
  item_type             TEXT,
  source                TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CALIBRATION SESSIONS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS calibration_sessions (
  id                        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id                   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_number            INTEGER NOT NULL,
  status                    TEXT CHECK (status IN ('scheduled','in_progress','completed')) NOT NULL DEFAULT 'scheduled',
  responses                 JSONB NOT NULL DEFAULT '[]',
  drift_score_produced      INTEGER CHECK (drift_score_produced >= 0 AND drift_score_produced <= 100),
  comparison_vs_baseline    JSONB,
  completed_at              TIMESTAMPTZ,
  next_session_due          TIMESTAMPTZ NOT NULL,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MIRROR SESSIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mirror_sessions (
  id                        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id                   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  messages                  JSONB NOT NULL DEFAULT '[]',
  ai_question_count         INTEGER NOT NULL DEFAULT 0,
  user_message_count        INTEGER NOT NULL DEFAULT 0,
  dependency_flags          INTEGER NOT NULL DEFAULT 0,
  topics                    TEXT[] DEFAULT '{}',
  session_duration_seconds  INTEGER NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TIME CAPSULES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS time_capsules (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  unlock_date   DATE NOT NULL,
  is_unlocked   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BELIEFS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beliefs (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  belief_statement  TEXT NOT NULL,
  category          TEXT NOT NULL,
  confidence_level  INTEGER NOT NULL CHECK (confidence_level >= 1 AND confidence_level <= 10),
  first_recorded    TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed     TIMESTAMPTZ DEFAULT NOW(),
  change_log        JSONB NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── HUMAN CIRCLES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS human_circles (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  cluster_focus   TEXT NOT NULL,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  member_limit    INTEGER NOT NULL DEFAULT 8,
  is_private      BOOLEAN NOT NULL DEFAULT FALSE,
  invite_code     TEXT UNIQUE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CIRCLE MEMBERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS circle_members (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id   UUID REFERENCES human_circles(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role        TEXT CHECK (role IN ('admin','member')) NOT NULL DEFAULT 'member',
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (circle_id, user_id)
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_baseline_user ON baseline_imprints(user_id);
CREATE INDEX IF NOT EXISTS idx_drift_user ON drift_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_drift_week ON drift_scores(user_id, year, week_number);
CREATE INDEX IF NOT EXISTS idx_vault_user ON skill_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_user ON vault_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_calibration_user ON calibration_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mirror_user ON mirror_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_capsules_user ON time_capsules(user_id);
CREATE INDEX IF NOT EXISTS idx_beliefs_user ON beliefs(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_user ON circle_members(user_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseline_imprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirror_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE beliefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Generic user-scoped policies
CREATE POLICY "Users own their baseline imprints" ON baseline_imprints FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their drift scores" ON drift_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their skill vault" ON skill_vault FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their vault challenges" ON vault_challenges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their journal entries" ON journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their calibration sessions" ON calibration_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their mirror sessions" ON mirror_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their time capsules" ON time_capsules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their beliefs" ON beliefs FOR ALL USING (auth.uid() = user_id);

-- Human circles: members can view their circles
CREATE POLICY "Circle members can view circles" ON human_circles FOR SELECT USING (
  id IN (SELECT circle_id FROM circle_members WHERE user_id = auth.uid())
  OR NOT is_private
);
CREATE POLICY "Users can create circles" ON human_circles FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Circle admins can update circles" ON human_circles FOR UPDATE USING (
  id IN (SELECT circle_id FROM circle_members WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Circle members can view memberships" ON circle_members FOR SELECT USING (
  circle_id IN (SELECT circle_id FROM circle_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users can join circles" ON circle_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── PROFILE AUTO-CREATE TRIGGER ─────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_skill_vault_updated_at BEFORE UPDATE ON skill_vault
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
