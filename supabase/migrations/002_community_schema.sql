-- ─── 002 COMMUNITY SCHEMA ─────────────────────────────────────
-- Additions for Human Circles, Mentor Network, and Leaderboard

-- 1. Profiles Additions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS leaderboard_opt_in BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepting_mentees BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mentor_bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mentoring_style TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_mentees INTEGER DEFAULT 2;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS imprint_score INTEGER DEFAULT 0;

-- 2. Mentorships
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (requester_id, mentor_id)
);

CREATE TABLE IF NOT EXISTS mentorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mentee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  check_in_streak INTEGER DEFAULT 0,
  last_checkin TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  UNIQUE (mentor_id, mentee_id)
);

CREATE TABLE IF NOT EXISTS mentor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  mentorship_duration_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Human Circles Additions
-- (human_circles and circle_members already exist from 001)

CREATE TABLE IF NOT EXISTS circle_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES human_circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_type TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  drift_score_shared INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkin_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id UUID REFERENCES circle_checkins(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('strong', 'keep_going', 'eyes')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (checkin_id, user_id, reaction_type)
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_score ON profiles(imprint_score DESC);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor ON mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_requester ON mentorship_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_mentor ON mentorships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_mentee ON mentorships(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_mentor ON mentor_reviews(mentor_id);
CREATE INDEX IF NOT EXISTS idx_circle_checkins_circle ON circle_checkins(circle_id);
CREATE INDEX IF NOT EXISTS idx_checkin_reactions_checkin ON checkin_reactions(checkin_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_reactions ENABLE ROW LEVEL SECURITY;

-- Mentorships
CREATE POLICY "Users can view their mentorship requests" ON mentorship_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = mentor_id);
CREATE POLICY "Users can insert mentorship requests" ON mentorship_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Mentors can update mentorship requests" ON mentorship_requests FOR UPDATE USING (auth.uid() = mentor_id);

CREATE POLICY "Users can view their mentorships" ON mentorships FOR SELECT USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);
CREATE POLICY "Mentors can update their mentorships" ON mentorships FOR UPDATE USING (auth.uid() = mentor_id);
CREATE POLICY "System can insert mentorships" ON mentorships FOR INSERT WITH CHECK (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "Anyone can view mentor reviews" ON mentor_reviews FOR SELECT USING (true);
CREATE POLICY "Mentees can review mentors" ON mentor_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Circle Checkins & Reactions
CREATE POLICY "Circle members can view checkins" ON circle_checkins FOR SELECT USING (
  circle_id IN (SELECT circle_id FROM circle_members WHERE user_id = auth.uid())
);
CREATE POLICY "Circle members can insert checkins" ON circle_checkins FOR INSERT WITH CHECK (
  auth.uid() = user_id AND circle_id IN (SELECT circle_id FROM circle_members WHERE user_id = auth.uid())
);
CREATE POLICY "Checkin author or circle admin can delete" ON circle_checkins FOR DELETE USING (
  auth.uid() = user_id OR circle_id IN (SELECT circle_id FROM circle_members WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Circle members can view reactions" ON checkin_reactions FOR SELECT USING (
  checkin_id IN (SELECT id FROM circle_checkins WHERE circle_id IN (SELECT circle_id FROM circle_members WHERE user_id = auth.uid()))
);
CREATE POLICY "Circle members can react" ON checkin_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own reaction" ON checkin_reactions FOR DELETE USING (auth.uid() = user_id);
