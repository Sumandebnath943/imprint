-- ─── 003 COURSES SCHEMA ─────────────────────────────────────
-- Additions for Courses and Philosophy Pages

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS waitlist_joined BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS course_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  suggestion_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'public_page',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_course_suggestions_user ON course_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_waitlist_email ON course_waitlist(email);

-- Row Level Security
ALTER TABLE course_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own suggestions" ON course_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own suggestions" ON course_suggestions FOR SELECT USING (auth.uid() = user_id);

-- The waitlist is public insert only (managed by API with anon/service key or unauthenticated inserts if allowed)
-- Since the API handles this via service role or server component, we can allow anon inserts or just let the server override.
CREATE POLICY "Anyone can insert to waitlist" ON course_waitlist FOR INSERT WITH CHECK (true);
