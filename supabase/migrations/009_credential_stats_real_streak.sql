-- ============================================================
-- IMPRINT — 009 REAL DAY STREAK IN credential_stats
-- ============================================================
-- credential_stats.day_streak counted DISTINCT days with a journal entry in
-- the last 30 days. That is an activity count, not a streak: an account that
-- wrote on ten scattered days over a month reported a ten day streak on its
-- public credential.
--
-- Both credential surfaces render the value under the label "DAY STREAK",
-- and the dashboard and profile compute a genuine consecutive-day streak from
-- the same table — so the public, shareable artifact disagreed with the app.
--
-- This rewrites it to the definition the rest of the app already uses:
-- consecutive calendar days with at least one journal entry, counting back
-- from today, stopping at the first gap.
--
-- Safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.credential_stats(uid UUID)
RETURNS TABLE (
  calibrations    INTEGER,
  skills_tracked  INTEGER,
  journal_entries INTEGER,
  day_streak      INTEGER
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH days AS (
    -- One row per calendar day the user wrote anything.
    SELECT DISTINCT created_at::date AS d
    FROM journal_entries
    WHERE user_id = uid
  ),
  numbered AS (
    -- Days that are consecutive share the same (date - row_number) value, so
    -- the group containing today is the current streak.
    SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d))::INTEGER AS grp
    FROM days
  ),
  current_run AS (
    SELECT COUNT(*)::INTEGER AS len
    FROM numbered
    WHERE grp = (SELECT grp FROM numbered WHERE d = CURRENT_DATE)
  )
  SELECT
    (SELECT COUNT(*)::INTEGER FROM calibration_sessions
       WHERE user_id = uid AND status = 'completed'),
    (SELECT COUNT(*)::INTEGER FROM skill_vault     WHERE user_id = uid),
    (SELECT COUNT(*)::INTEGER FROM journal_entries WHERE user_id = uid),
    -- No entry today means no active streak.
    COALESCE((SELECT len FROM current_run), 0);
$$;

GRANT EXECUTE ON FUNCTION public.credential_stats(UUID) TO anon, authenticated;
