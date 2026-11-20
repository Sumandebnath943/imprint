BEGIN;
DO $$
DECLARE
  applicant uuid := '02600000-0000-4000-8000-000000000001';
  outsider uuid := '02600000-0000-4000-8000-000000000002';
  claim uuid := '02600000-0000-4000-8000-000000000003';
  work public.onboarding_workspaces;
  result public.role_assessments;
  question integer;
  rubric text := 'onboarding-work-1';
BEGIN
  INSERT INTO auth.users(id,email) VALUES (applicant,'onboarding-workspace@example.test'), (outsider,'onboarding-outsider@example.test');
  UPDATE public.profiles SET profession = 'Writer', profession_cluster = 'language_voice' WHERE id = applicant;
  work := public.open_role_onboarding_workspace(applicant,'Writer','writer',rubric,false,'Basic');
  ASSERT work.form = 0 AND work.capture_reflections;
  ASSERT (public.open_role_onboarding_workspace(applicant,'Writer','writer',rubric,false,'Basic')).id = work.id;
  BEGIN
    PERFORM public.finish_workspace_onboarding(applicant,'Writer','writer',rubric,'language_voice','adult_18_64','none','{}','[]','');
    RAISE EXCEPTION 'Incomplete workspace was accepted' USING ERRCODE = 'XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
  END;
  FOR question IN 1..7 LOOP
    ASSERT public.save_role_workspace_answer(applicant,'Writer',work.id,question,question - 1,'{"fields":["fixture"],"choices":[],"order":[]}') = question;
  END LOOP;
  ASSERT public.save_role_workspace_answer(applicant,'Writer',work.id,1,5,'{}') IS NULL;
  UPDATE public.onboarding_workspaces SET scoring_token = claim, scoring_started_at = now() WHERE id = work.id;
  ASSERT public.save_role_workspace_answer(applicant,'Writer',work.id,5,7,'{}') IS NULL;
  PERFORM public.record_role_workspace_score(applicant,'Writer',work.id,claim,NULL,NULL,'{}','fixture','[]');
  ASSERT (SELECT assessment_id IS NULL AND scoring_token IS NULL FROM public.onboarding_workspaces WHERE id = work.id);
  UPDATE public.onboarding_workspaces SET scoring_token = claim, scoring_started_at = now() WHERE id = work.id;
  result := public.record_role_workspace_score(applicant,'Writer',work.id,claim,75,'{"criteria":[],"difficulty":"Basic"}',
    '{"writer-5":{"text":"fixture"}}','fixture','[]');
  ASSERT result.score = 75;
  ASSERT (SELECT NOT (answers ? '4') AND rubric_version = rubric FROM public.role_assessments WHERE id = result.id);
  PERFORM public.finish_workspace_onboarding(applicant,'Writer','writer',rubric,'language_voice','adult_18_64','none','{}',
    '[{"name":"Writing","strength":70},{"name":"Revision","strength":70},{"name":"Research","strength":70}]','');
  ASSERT (SELECT onboarding_completed IS TRUE FROM public.profiles WHERE id = applicant);
  BEGIN
    PERFORM public.open_role_onboarding_workspace(applicant,'Writer','writer',rubric,true,'Basic');
    RAISE EXCEPTION 'Early reassessment was accepted' USING ERRCODE = 'XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
  END;
  UPDATE public.imprint_tasks SET assigned_at = now() - interval '28 days', due_at = now()
    WHERE user_id = applicant AND kind = 'reassessment';
  work := public.open_role_onboarding_workspace(applicant,'Writer','writer',rubric,true,'Basic');
  ASSERT work.form = 1 AND NOT work.capture_reflections;
  ASSERT public.save_role_workspace_answer(applicant,'Writer',work.id,4,0,'{}') IS NULL;
  ASSERT public.save_role_workspace_answer(applicant,'Writer',work.id,5,0,'{"fields":["fixture"]}') = 1;
  ASSERT public.save_role_workspace_answer(applicant,'Writer',work.id,6,1,'{"fields":["fixture"]}') = 2;
  UPDATE public.onboarding_workspaces SET scoring_token = claim, scoring_started_at = now() WHERE id = work.id;
  PERFORM public.record_role_workspace_score(applicant,'Writer',work.id,claim,63,'{"criteria":[],"difficulty":"Basic"}','{}','fixture','[]');
  ASSERT NOT EXISTS (SELECT 1 FROM public.imprint_tasks WHERE user_id = applicant AND kind = 'reassessment' AND completed_at IS NULL);
  INSERT INTO public.imprint_tasks(user_id, role_id, rubric_version, kind, due_at, assigned_at)
    VALUES (applicant, 'writer', rubric, 'reassessment', now() - interval '8 days', now() - interval '36 days');
  ASSERT public.has_overdue_current_role_reassessment(applicant, 'Writer');
  UPDATE public.profiles SET profession = 'Illustrator', profession_cluster = 'visual_creative' WHERE id = applicant;
  ASSERT NOT public.has_overdue_current_role_reassessment(applicant, 'Illustrator');
  UPDATE public.profiles SET credential_public = true WHERE id = applicant;
  work := public.open_role_onboarding_workspace(applicant,'Illustrator','illustrator',rubric,false,'Basic');
  ASSERT work.form = 0 AND NOT work.capture_reflections;
  ASSERT public.save_role_workspace_answer(applicant,'Illustrator',work.id,4,0,'{}') IS NULL;
  ASSERT public.save_role_workspace_answer(applicant,'Illustrator',work.id,5,0,'{"fields":["fixture"]}') = 1;
  ASSERT (SELECT count(*) = 2 FROM public.role_assessments WHERE user_id = applicant AND role_id = 'writer');
END $$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','02600000-0000-4000-8000-000000000002',true);
DO $$ BEGIN
  ASSERT (SELECT count(id) = 0 FROM public.onboarding_workspaces);
  BEGIN
    PERFORM public.open_role_onboarding_workspace('02600000-0000-4000-8000-000000000001','Writer','writer','onboarding-work-1',false,'Basic');
    RAISE EXCEPTION 'Client could open a workspace for another user' USING ERRCODE = 'XX000';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
SELECT set_config('request.jwt.claim.sub','02600000-0000-4000-8000-000000000001',true);
DO $$ BEGIN
  ASSERT (SELECT count(id) = 3 FROM public.onboarding_workspaces);
  BEGIN
    PERFORM scoring_token FROM public.onboarding_workspaces;
    RAISE EXCEPTION 'The client saw internal scoring state' USING ERRCODE = 'XX000';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
ROLLBACK;
