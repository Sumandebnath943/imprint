BEGIN;
INSERT INTO auth.users(id,email) VALUES
 ('01900000-0000-4000-8000-000000000001','reflection-owner@example.test'),
 ('01900000-0000-4000-8000-000000000002','reflection-skip@example.test'),
 ('01900000-0000-4000-8000-000000000003','reflection-old@example.test');
DO $$
DECLARE owner uuid := '01900000-0000-4000-8000-000000000001'; skipped uuid := '01900000-0000-4000-8000-000000000002'; captured timestamptz;
BEGIN
  BEGIN
    PERFORM public.finish_imprint_onboarding_with_reflection(owner,'Writer','language_voice','adult_19_64','none','{}','[]','{U1}','Failed attempt');
    RAISE EXCEPTION 'Missing baseline was accepted' USING ERRCODE = 'XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  ASSERT NOT EXISTS(SELECT 1 FROM public.onboarding_reflections WHERE user_id = owner);
  PERFORM public.finish_imprint_onboarding_with_reflection(owner,'Writer','language_voice','adult_19_64','none','{}','[]','{}','Original private note');
  SELECT captured_at INTO captured FROM public.onboarding_reflections WHERE user_id = owner;
  ASSERT captured IS NOT NULL;
  PERFORM public.finish_imprint_onboarding_with_reflection(owner,'Writer','language_voice','adult_19_64','none','{}','[]','{}','Retry must preserve original');
  ASSERT (SELECT note = 'Original private note' AND captured_at = captured FROM public.onboarding_reflections WHERE user_id = owner);
  PERFORM public.finish_imprint_onboarding_with_reflection(skipped,'Writer','language_voice','adult_19_64','none','{}','[]','{}','');
  ASSERT NOT EXISTS(SELECT 1 FROM public.onboarding_reflections WHERE user_id = skipped);
END; $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','01900000-0000-4000-8000-000000000001',true);
DO $$ BEGIN
  ASSERT (SELECT count(*) = 1 FROM public.onboarding_reflections);
  ASSERT NOT EXISTS (SELECT 1 FROM public.due_onboarding_reflection());
  ASSERT NOT has_table_privilege('public.onboarding_reflections','UPDATE');
END; $$;
RESET ROLE;
UPDATE public.onboarding_reflections SET captured_at = statement_timestamp() - interval '2160 hours' WHERE user_id = '01900000-0000-4000-8000-000000000001';
SET LOCAL ROLE authenticated;
DO $$ BEGIN ASSERT (SELECT note = 'Original private note' FROM public.due_onboarding_reflection()); END; $$;
SELECT set_config('request.jwt.claim.sub','01900000-0000-4000-8000-000000000002',true);
DO $$ BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM public.due_onboarding_reflection());
  ASSERT NOT EXISTS (SELECT 1 FROM public.onboarding_reflections);
END; $$;
RESET ROLE;
DELETE FROM auth.users WHERE id = '01900000-0000-4000-8000-000000000001';
DO $$ BEGIN ASSERT NOT EXISTS (SELECT 1 FROM public.onboarding_reflections WHERE user_id = '01900000-0000-4000-8000-000000000001'); END; $$;
ROLLBACK;
