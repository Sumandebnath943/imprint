-- ============================================================
-- IMPRINT — 010 FORCE-RESET CIRCLE POLICIES
-- ============================================================
-- circle_members still raises 42P17 "infinite recursion detected in policy"
-- after 006, which means a recursive policy survived that migration.
--
-- 006 dropped policies by name, using the names 001 created. A policy created
-- under any other name — a hand edit in the dashboard, an earlier revision of
-- the schema, a rename — was left in place, and a single recursive policy is
-- enough: Postgres ORs all permissive SELECT policies together and evaluates
-- every one of them.
--
-- The helper functions are fine. Verified against the live database:
--   is_circle_member(...)  -> false, no error
--   SELECT on circle_members -> 42P17
-- So the fault is a leftover policy, not the 006 replacements.
--
-- This drops EVERY policy on the four circle tables by enumerating
-- pg_policies rather than naming them, then recreates only the correct set.
-- It reports what it removed, so the stale name ends up in the output.
--
-- Safe to re-run.
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('circle_members', 'human_circles', 'circle_checkins', 'checkin_reactions')
  LOOP
    RAISE NOTICE 'dropping policy % on %', r.policyname, r.tablename;
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;


-- ─── circle_members ──────────────────────────────────────────
-- No recursion: is_circle_member is SECURITY DEFINER, so calling it from
-- inside a circle_members policy does not re-enter that policy.

CREATE POLICY "Circle members can view memberships"
  ON circle_members FOR SELECT
  USING (user_id = auth.uid() OR public.is_circle_member(circle_id));

CREATE POLICY "Users can join circles"
  ON circle_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can leave circles"
  ON circle_members FOR DELETE
  USING (auth.uid() = user_id OR public.is_circle_admin(circle_id));


-- ─── human_circles ───────────────────────────────────────────

CREATE POLICY "Circle members can view circles"
  ON human_circles FOR SELECT
  USING (NOT is_private OR public.is_circle_member(id));

CREATE POLICY "Users can create circles"
  ON human_circles FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Circle admins can update circles"
  ON human_circles FOR UPDATE
  USING (public.is_circle_admin(id));


-- ─── circle_checkins ─────────────────────────────────────────

CREATE POLICY "Circle members can view checkins"
  ON circle_checkins FOR SELECT
  USING (public.is_circle_member(circle_id));

CREATE POLICY "Circle members can insert checkins"
  ON circle_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_circle_member(circle_id));

CREATE POLICY "Checkin author or circle admin can delete"
  ON circle_checkins FOR DELETE
  USING (auth.uid() = user_id OR public.is_circle_admin(circle_id));


-- ─── checkin_reactions ───────────────────────────────────────

CREATE POLICY "Circle members can view reactions"
  ON checkin_reactions FOR SELECT
  USING (public.is_circle_member(public.checkin_circle_id(checkin_id)));

CREATE POLICY "Circle members can react"
  ON checkin_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_circle_member(public.checkin_circle_id(checkin_id))
  );

CREATE POLICY "Users can remove their own reaction"
  ON checkin_reactions FOR DELETE
  USING (auth.uid() = user_id);


-- RLS must be on for these to take effect.
ALTER TABLE circle_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_circles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_checkins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_reactions ENABLE ROW LEVEL SECURITY;
