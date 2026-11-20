BEGIN;
INSERT INTO auth.users(id,email) VALUES
 ('01800000-0000-4000-8000-000000000001','circle-challenge-admin@example.test'),
 ('01800000-0000-4000-8000-000000000002','circle-challenge-member@example.test'),
 ('01800000-0000-4000-8000-000000000003','circle-challenge-outsider@example.test');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '01800000-0000-4000-8000-000000000001', true);
SELECT set_config('qa.circle.id', public.create_human_circle('Assignment fixture','','QA',false)->>'id', true);
SELECT set_config('qa.circle.assignment', public.assign_circle_challenge(current_setting('qa.circle.id')::uuid,
 'Practice code', 'Write a test fixture', 'Include a clear assertion', 'code', (now() AT TIME ZONE 'UTC')::date + 1)::text, true);
SELECT set_config('request.jwt.claim.sub', '01800000-0000-4000-8000-000000000003', true);
DO $$ BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM public.circle_challenges WHERE id = current_setting('qa.circle.assignment')::uuid);
  BEGIN
    PERFORM public.complete_circle_challenge(current_setting('qa.circle.assignment')::uuid, 'Forbidden fixture', NULL);
    RAISE EXCEPTION 'Outsider completed a challenge';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
SELECT set_config('request.jwt.claim.sub', '01800000-0000-4000-8000-000000000002', true);
SELECT public.join_human_circle(current_setting('qa.circle.id')::uuid);
DO $$ DECLARE saved timestamptz; id uuid := current_setting('qa.circle.assignment')::uuid;
BEGIN
  BEGIN
    PERFORM public.assign_circle_challenge(current_setting('qa.circle.id')::uuid, 'Unauthorized','Instructions','Criteria','text',current_date + 1);
    RAISE EXCEPTION 'A member assigned a challenge';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  saved := public.complete_circle_challenge(id, 'Private synthetic code', NULL);
  ASSERT public.complete_circle_challenge(id, 'Do not overwrite', NULL) = saved;
  ASSERT (SELECT response = 'Private synthetic code' FROM public.circle_challenge_responses WHERE challenge_id = id);
  ASSERT NOT EXISTS (SELECT 1 FROM public.circle_challenge_progress(current_setting('qa.circle.id')::uuid));
END; $$;
SELECT set_config('request.jwt.claim.sub', '01800000-0000-4000-8000-000000000001', true);
DO $$ BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM public.circle_challenge_responses WHERE challenge_id = current_setting('qa.circle.assignment')::uuid);
  ASSERT (SELECT completed = 1 AND members = 2 FROM public.circle_challenge_progress(current_setting('qa.circle.id')::uuid));
END; $$;
ROLLBACK;
