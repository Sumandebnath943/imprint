ALTER TABLE public.time_capsules ADD COLUMN IF NOT EXISTS drift_score_at_writing integer;
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;

-- Hosted projects may have renamed or replaced the original policies.
-- Remove legacy grants at the row level before installing the owner-only rules.
DO $$
DECLARE
  policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'time_capsules'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.time_capsules', policy_name);
  END LOOP;
END;
$$;

CREATE POLICY capsule_read_metadata ON public.time_capsules FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY capsule_delete_own ON public.time_capsules FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON public.time_capsules FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, user_id, title, unlock_date, created_at, drift_score_at_writing), DELETE
  ON public.time_capsules TO authenticated;

-- A saved date opens at midnight UTC, using PostgreSQL time.
CREATE OR REPLACE VIEW public.time_capsule_metadata WITH (security_invoker = true) AS
SELECT id, title, unlock_date, created_at, drift_score_at_writing,
       unlock_date <= (statement_timestamp() AT TIME ZONE 'UTC')::date AS is_unlocked
FROM public.time_capsules;
REVOKE ALL ON public.time_capsule_metadata FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.time_capsule_metadata TO authenticated;

CREATE OR REPLACE FUNCTION public.read_time_capsule(p_id uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT content FROM public.time_capsules
  WHERE id = p_id AND user_id = (SELECT auth.uid())
    AND unlock_date <= (statement_timestamp() AT TIME ZONE 'UTC')::date;
$$;

CREATE OR REPLACE FUNCTION public.seal_time_capsule(p_title text, p_content text, p_date date, p_attach_score boolean)
RETURNS SETOF public.time_capsule_metadata
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  owner uuid := auth.uid();
  capsule_id uuid;
  snapshot integer;
BEGIN
  IF owner IS NULL THEN RAISE EXCEPTION 'Sign in to seal a capsule' USING ERRCODE = '42501'; END IF;
  IF p_date IS NULL OR p_date <= (statement_timestamp() AT TIME ZONE 'UTC')::date
     OR nullif(btrim(p_content), '') IS NULL OR length(p_content) > 100000 OR length(p_title) > 200 THEN
    RAISE EXCEPTION 'Choose a future date and enter a letter of up to 100,000 characters' USING ERRCODE = '22023';
  END IF;
  IF p_attach_score THEN
    SELECT score INTO snapshot FROM public.drift_scores WHERE user_id = owner ORDER BY created_at DESC LIMIT 1;
  END IF;
  INSERT INTO public.time_capsules (user_id, title, content, unlock_date, drift_score_at_writing)
  VALUES (owner, coalesce(nullif(btrim(p_title), ''), 'Untitled Capsule'), p_content, p_date, snapshot)
  RETURNING id INTO capsule_id;
  RETURN QUERY SELECT * FROM public.time_capsule_metadata WHERE id = capsule_id;
END;
$$;

REVOKE ALL ON FUNCTION public.read_time_capsule(uuid), public.seal_time_capsule(text, text, date, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.read_time_capsule(uuid), public.seal_time_capsule(text, text, date, boolean) TO authenticated;
