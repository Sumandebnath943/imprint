BEGIN;
INSERT INTO auth.users (id,email) VALUES
 ('01600000-0000-4000-8000-000000000001','mentor-policy@example.test'),
 ('01600000-0000-4000-8000-000000000002','reviewer-policy@example.test'),
 ('01600000-0000-4000-8000-000000000003','mentee-policy@example.test');
UPDATE public.profiles SET profession = 'Writer', onboarding_completed = true
WHERE id = '01600000-0000-4000-8000-000000000001';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '01600000-0000-4000-8000-000000000001', true);
DO $$ BEGIN
  ASSERT NOT has_function_privilege('public.review_mentor_application(uuid,uuid,text,boolean,text)', 'EXECUTE');
  ASSERT NOT has_table_privilege('public.mentorships', 'UPDATE');
  ASSERT NOT has_table_privilege('public.mentorship_requests', 'INSERT');
  BEGIN
    UPDATE public.profiles SET accepting_mentees = true WHERE id = auth.uid();
    RAISE EXCEPTION 'Direct mentor publishing succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.set_mentor_availability(true);
    RAISE EXCEPTION 'Publication succeeded before review';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  ASSERT public.apply_to_mentor('Legacy applicant with role experience', ARRAY['Feedback'], 1) = 'pending';
END; $$;
RESET ROLE;
SELECT public.review_mentor_application('01600000-0000-4000-8000-000000000002',
 '01600000-0000-4000-8000-000000000001', 'Writer', true, 'Reviewed legacy qualifications without a pilot score');
SET LOCAL ROLE authenticated;
DO $$ BEGIN ASSERT public.set_mentor_availability(true); END; $$;
SELECT set_config('request.jwt.claim.sub', '01600000-0000-4000-8000-000000000003', true);
DO $$ BEGIN
  ASSERT (SELECT remaining_capacity = 1 FROM public.mentor_directory() WHERE id = '01600000-0000-4000-8000-000000000001');
  ASSERT (SELECT count(*) = 0 FROM public.mentor_applications);
END; $$;
RESET ROLE;
UPDATE public.profiles SET profession = 'Designer' WHERE id = '01600000-0000-4000-8000-000000000001';
SET LOCAL ROLE authenticated;
DO $$ BEGIN ASSERT NOT EXISTS (SELECT 1 FROM public.mentor_directory() WHERE id = '01600000-0000-4000-8000-000000000001'); END; $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN ASSERT NOT has_function_privilege('public.mentor_directory()', 'EXECUTE'); END; $$;
ROLLBACK;
