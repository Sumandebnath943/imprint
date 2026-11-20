BEGIN;
SET LOCAL TIME ZONE 'Pacific/Honolulu';
INSERT INTO auth.users (id, email) VALUES
  ('01500000-0000-4000-8000-000000000001', 'capsule-owner@example.test'),
  ('01500000-0000-4000-8000-000000000002', 'capsule-other@example.test');

INSERT INTO public.time_capsules (id, user_id, title, content, unlock_date, is_unlocked)
VALUES ('01500000-0000-4000-8000-000000000003', '01500000-0000-4000-8000-000000000001',
        'Legacy capsule', 'Synthetic legacy body', (statement_timestamp() AT TIME ZONE 'UTC')::date + 1, true);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '01500000-0000-4000-8000-000000000001', true);
DO $$
DECLARE
  created jsonb;
  legacy constant uuid := '01500000-0000-4000-8000-000000000003';
BEGIN
  SELECT to_jsonb(c) INTO created FROM public.seal_time_capsule('New capsule', 'Synthetic new body',
    (statement_timestamp() AT TIME ZONE 'UTC')::date + 1, false) AS c;
  ASSERT created IS NOT NULL AND NOT (created ? 'content') AND NOT (created->>'is_unlocked')::boolean;
  ASSERT (SELECT NOT is_unlocked FROM public.time_capsule_metadata WHERE id = legacy);
  ASSERT public.read_time_capsule(legacy) IS NULL;
  BEGIN
    PERFORM content FROM public.time_capsules WHERE id = legacy;
    RAISE EXCEPTION 'Authenticated base-table body read succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE public.time_capsules SET unlock_date = current_date, is_unlocked = true WHERE id = legacy;
    RAISE EXCEPTION 'Authenticated seal override succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;

RESET ROLE;
UPDATE public.time_capsules SET unlock_date = (statement_timestamp() AT TIME ZONE 'UTC')::date,
  is_unlocked = false WHERE id = '01500000-0000-4000-8000-000000000003';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  ASSERT (SELECT is_unlocked FROM public.time_capsule_metadata WHERE id = '01500000-0000-4000-8000-000000000003');
  ASSERT public.read_time_capsule('01500000-0000-4000-8000-000000000003') = 'Synthetic legacy body';
END; $$;

SELECT set_config('request.jwt.claim.sub', '01500000-0000-4000-8000-000000000002', true);
DO $$ BEGIN
  ASSERT (SELECT count(*) = 0 FROM public.time_capsule_metadata);
  ASSERT public.read_time_capsule('01500000-0000-4000-8000-000000000003') IS NULL;
  DELETE FROM public.time_capsules WHERE id = '01500000-0000-4000-8000-000000000003';
  ASSERT NOT FOUND;
END; $$;

RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
  ASSERT NOT has_function_privilege('public.read_time_capsule(uuid)', 'EXECUTE');
  ASSERT NOT has_table_privilege('public.time_capsule_metadata', 'SELECT');
END; $$;

RESET ROLE;
DELETE FROM auth.users WHERE id = '01500000-0000-4000-8000-000000000001';
DO $$ BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM public.time_capsules WHERE user_id = '01500000-0000-4000-8000-000000000001');
END; $$;
ROLLBACK;
