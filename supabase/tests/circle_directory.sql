BEGIN;
INSERT INTO auth.users(id,email) VALUES
 ('01700000-0000-4000-8000-000000000001','circle-owner@example.test'),
 ('01700000-0000-4000-8000-000000000002','circle-member@example.test');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '01700000-0000-4000-8000-000000000001', true);
SELECT set_config('qa.circle.public', (public.create_human_circle('Public fixture','','QA',false)->>'id'), true);
SELECT set_config('qa.circle.private', public.create_human_circle('Private fixture','','QA',true)::text, true);
SELECT set_config('request.jwt.claim.sub', '01700000-0000-4000-8000-000000000002', true);
DO $$
DECLARE open_circle uuid := current_setting('qa.circle.public')::uuid;
        closed_circle jsonb := current_setting('qa.circle.private')::jsonb;
BEGIN
  ASSERT NOT has_table_privilege('public.circle_members','INSERT');
  ASSERT NOT has_function_privilege('public.find_circle_by_invite(text)','EXECUTE');
  ASSERT (SELECT count(*) = 0 FROM public.human_circles WHERE id IN (open_circle, (closed_circle->>'id')::uuid));
  ASSERT (SELECT count(*) = 0 FROM public.circle_members WHERE circle_id = open_circle);
  ASSERT (SELECT count(*) = 0 FROM public.circle_member_profiles(open_circle));
  ASSERT (SELECT count(*) = 1 FROM public.public_circle_directory() WHERE id = open_circle);
  ASSERT (SELECT count(*) = 0 FROM public.public_circle_directory() WHERE id = (closed_circle->>'id')::uuid);
  BEGIN
    PERFORM public.join_human_circle((closed_circle->>'id')::uuid);
    RAISE EXCEPTION 'Private circle joined by ID';
  EXCEPTION WHEN no_data_found THEN NULL;
  END;
  ASSERT (public.join_human_circle(open_circle)->>'already_member')::boolean = false;
  ASSERT (public.join_human_circle(open_circle)->>'already_member')::boolean = true;
  ASSERT (public.join_human_circle(p_code => closed_circle->>'invite_code')->>'already_member')::boolean = false;
END; $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN ASSERT NOT has_function_privilege('public.public_circle_directory()','EXECUTE'); END; $$;
ROLLBACK;
