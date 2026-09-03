-- ============================================================
-- IMPRINT — 006 SOCIAL ACCESS FIX
-- ============================================================
-- Fixes four silently-broken features caused by row-level security:
--
--   1. Human Circles      — the circle_members SELECT policy queried
--                           circle_members, causing Postgres error 42P17
--                           "infinite recursion detected in policy".
--                           Every circle read failed. (Writes were already
--                           worked around with the service-role key.)
--   2. Leaderboard        — profiles could only ever be read by their owner,
--                           so the board always showed at most one person.
--   3. Mentor discovery   — same cause; the mentor list was always empty.
--   4. Public credentials — /credential/[code] runs with no session, so the
--                           owner-only policy meant every share link 404'd.
--
-- Strategy
-- --------
-- * SECURITY DEFINER helper functions break the recursion. They run as the
--   function owner, so the policies that call them do not re-enter RLS.
-- * A `public_profiles` view exposes ONLY non-sensitive columns for
--   cross-user reads. `profiles` itself stays owner-only, so email and
--   onboarding state are never readable by other users.
--
-- Safe to re-run: every statement is idempotent.
-- ============================================================


-- ─── 1. HELPER FUNCTIONS (break RLS recursion) ───────────────

-- Is the given user a member of the given circle?
-- SECURITY DEFINER so calling this inside a circle_members policy does not
-- re-trigger that same policy.
CREATE OR REPLACE FUNCTION public.is_circle_member(
  cid UUID,
  uid UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = cid AND user_id = uid
  );
$$;

-- Is the given user an admin of the given circle?
CREATE OR REPLACE FUNCTION public.is_circle_admin(
  cid UUID,
  uid UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = cid AND user_id = uid AND role = 'admin'
  );
$$;

-- Has the given user published a public credential?
-- Used to expose that user's latest drift score on the public credential page.
CREATE OR REPLACE FUNCTION public.has_public_credential(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT credential_public FROM profiles WHERE id = uid),
    false
  );
$$;

-- Which circle does this check-in belong to?
CREATE OR REPLACE FUNCTION public.checkin_circle_id(chid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT circle_id FROM circle_checkins WHERE id = chid;
$$;

GRANT EXECUTE ON FUNCTION public.is_circle_member(UUID, UUID)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_circle_admin(UUID, UUID)    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_public_credential(UUID)    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.checkin_circle_id(UUID)        TO anon, authenticated;


-- ─── 2. FIX CIRCLE RECURSION ─────────────────────────────────

DROP POLICY IF EXISTS "Circle members can view memberships" ON circle_members;
DROP POLICY IF EXISTS "Users can join circles"              ON circle_members;
DROP POLICY IF EXISTS "Members can leave circles"           ON circle_members;
DROP POLICY IF EXISTS "Circle members can view circles"     ON human_circles;
DROP POLICY IF EXISTS "Circle admins can update circles"    ON human_circles;

-- Members of a circle can see the whole membership list (no recursion:
-- is_circle_member is SECURITY DEFINER).
CREATE POLICY "Circle members can view memberships"
  ON circle_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_circle_member(circle_id)
  );

CREATE POLICY "Users can join circles"
  ON circle_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- A member can remove themselves; an admin can remove anyone.
CREATE POLICY "Members can leave circles"
  ON circle_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_circle_admin(circle_id)
  );

CREATE POLICY "Circle members can view circles"
  ON human_circles FOR SELECT
  USING (
    NOT is_private
    OR public.is_circle_member(id)
  );

CREATE POLICY "Circle admins can update circles"
  ON human_circles FOR UPDATE
  USING (public.is_circle_admin(id));

-- Circle creation from the app no longer needs the service-role key.
DROP POLICY IF EXISTS "Users can create circles" ON human_circles;
CREATE POLICY "Users can create circles"
  ON human_circles FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Join-by-invite-code has to find a private circle the user is not yet a
-- member of. Rather than opening SELECT on human_circles to every logged-in
-- user (which would leak the full private-circle list), expose a single
-- narrow lookup that only returns a circle when the exact code is known.
CREATE OR REPLACE FUNCTION public.find_circle_by_invite(code TEXT)
RETURNS TABLE (
  id           UUID,
  name         TEXT,
  member_limit INTEGER,
  member_count INTEGER
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.member_limit,
    (SELECT COUNT(*)::INTEGER FROM circle_members m WHERE m.circle_id = c.id)
  FROM human_circles c
  WHERE c.invite_code = UPPER(TRIM(code))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_circle_by_invite(TEXT) TO authenticated;


-- ─── 3. FIX CHECK-IN POLICIES (same recursion source) ────────

DROP POLICY IF EXISTS "Circle members can view checkins"        ON circle_checkins;
DROP POLICY IF EXISTS "Circle members can insert checkins"      ON circle_checkins;
DROP POLICY IF EXISTS "Checkin author or circle admin can delete" ON circle_checkins;
DROP POLICY IF EXISTS "Circle members can view reactions"       ON checkin_reactions;

CREATE POLICY "Circle members can view checkins"
  ON circle_checkins FOR SELECT
  USING (public.is_circle_member(circle_id));

CREATE POLICY "Circle members can insert checkins"
  ON circle_checkins FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_circle_member(circle_id)
  );

CREATE POLICY "Checkin author or circle admin can delete"
  ON circle_checkins FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_circle_admin(circle_id)
  );

CREATE POLICY "Circle members can view reactions"
  ON checkin_reactions FOR SELECT
  USING (public.is_circle_member(public.checkin_circle_id(checkin_id)));


-- ─── 3b. CIRCLE MEMBER DIRECTORY ─────────────────────────────
-- Members of a circle need to see each other's names. Embedding
-- `profiles(full_name)` cannot work — profiles is owner-only — so expose a
-- narrow directory that is readable only by members of that same circle.

CREATE OR REPLACE FUNCTION public.circle_member_profiles(cid UUID)
RETURNS TABLE (
  user_id       UUID,
  full_name     TEXT,
  avatar_url    TEXT,
  imprint_score INTEGER,
  role          TEXT,
  joined_at     TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    m.user_id,
    p.full_name,
    p.avatar_url,
    p.imprint_score,
    m.role,
    m.joined_at
  FROM circle_members m
  JOIN profiles p ON p.id = m.user_id
  WHERE m.circle_id = cid
    -- Caller must be a member of this circle.
    AND public.is_circle_member(cid)
  ORDER BY m.joined_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.circle_member_profiles(UUID) TO authenticated;


-- ─── 4. PUBLIC PROFILE VIEW ──────────────────────────────────
-- `profiles` stays owner-only. This view is the ONLY cross-user read path
-- and deliberately omits email, onboarding_* and every settings column.

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = off) AS
SELECT
  p.id,
  p.full_name,
  p.username,
  p.avatar_url,
  p.bio,
  p.location,
  p.profession,
  p.profession_cluster,
  p.imprint_score,
  p.credential_code,
  p.credential_public,
  p.leaderboard_opt_in,
  p.accepting_mentees,
  p.max_mentees,
  p.mentor_bio,
  p.mentoring_style,
  p.created_at,
  -- Latest drift score, resolved here so callers cannot accidentally read a
  -- stale row. (The leaderboard previously took drift_scores[0] with no
  -- ordering, which is not necessarily the most recent score.)
  d.score        AS latest_drift_score,
  d.score_label  AS latest_drift_label
FROM profiles p
LEFT JOIN LATERAL (
  SELECT score, score_label
  FROM drift_scores
  WHERE user_id = p.id
  ORDER BY created_at DESC
  LIMIT 1
) d ON true
WHERE
  p.credential_public  = true
  OR p.leaderboard_opt_in = true
  OR p.accepting_mentees  = true;

COMMENT ON VIEW public.public_profiles IS
  'Non-sensitive profile columns for users who have opted into a public '
  'credential, the leaderboard, or mentoring. Never exposes email.';

GRANT SELECT ON public.public_profiles TO anon, authenticated;


-- ─── 5. DRIFT SCORES ON PUBLIC CREDENTIALS ───────────────────
-- The public credential page shows the holder's latest drift score.

DROP POLICY IF EXISTS "Public credentials expose drift score" ON drift_scores;
CREATE POLICY "Public credentials expose drift score"
  ON drift_scores FOR SELECT
  USING (public.has_public_credential(user_id));


-- ─── 6. AGGREGATE STATS FOR CREDENTIALS ──────────────────────
-- Replaces the hardcoded {calibrations: 4, streak: 12, skillsTracked: 8}
-- placeholder on both credential pages with real counts.

CREATE OR REPLACE FUNCTION public.credential_stats(uid UUID)
RETURNS TABLE (
  calibrations   INTEGER,
  skills_tracked INTEGER,
  journal_entries INTEGER,
  day_streak     INTEGER
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::INTEGER FROM calibration_sessions
       WHERE user_id = uid AND status = 'completed'),
    (SELECT COUNT(*)::INTEGER FROM skill_vault      WHERE user_id = uid),
    (SELECT COUNT(*)::INTEGER FROM journal_entries  WHERE user_id = uid),
    -- Distinct days with a journal entry in the last 30 days.
    (SELECT COUNT(DISTINCT created_at::date)::INTEGER
       FROM journal_entries
      WHERE user_id = uid
        AND created_at > NOW() - INTERVAL '30 days');
$$;

GRANT EXECUTE ON FUNCTION public.credential_stats(UUID) TO anon, authenticated;


-- ─── 7. INDEXES FOR THE NEW ACCESS PATHS ─────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_credential_code
  ON profiles(credential_code) WHERE credential_public = true;

CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard
  ON profiles(imprint_score DESC) WHERE leaderboard_opt_in = true;

CREATE INDEX IF NOT EXISTS idx_profiles_mentors
  ON profiles(id) WHERE accepting_mentees = true;

CREATE INDEX IF NOT EXISTS idx_drift_user_created
  ON drift_scores(user_id, created_at DESC);
