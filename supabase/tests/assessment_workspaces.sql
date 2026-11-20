BEGIN;
DO $$
DECLARE
  member uuid := '02300000-0000-4000-8000-000000000001';
  reviewer uuid := '02300000-0000-4000-8000-000000000002';
  attempt public.role_assessments;
  appeal uuid;
  claim uuid := '02300000-0000-4000-8000-000000000003';
BEGIN
  INSERT INTO auth.users (id,email) VALUES (member,'workspace-owner@example.test'), (reviewer,'workspace-reviewer@example.test');
  UPDATE public.profiles SET onboarding_completed = true, profession = 'Illustrator', profession_cluster = 'visual_creative' WHERE id = member;
  BEGIN
    PERFORM public.start_selected_role_assessment(member,'Software Developer','software-developer','work-sample-2','','consent-test');
    RAISE EXCEPTION 'Misrouted assessment was permitted' USING ERRCODE = 'XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
  END;

  attempt := public.start_selected_role_assessment(member,'Illustrator','illustrator','work-sample-2','','consent-test');
  ASSERT attempt.form = 0;
  ASSERT (public.start_selected_role_assessment(member,'Illustrator','illustrator','work-sample-2','','consent-test')).id = attempt.id;
  ASSERT public.save_selected_role_assessment_draft(member,'Illustrator',attempt.id,0,'{"draft":"saved"}') = 1;
  ASSERT public.save_selected_role_assessment_draft(member,'Illustrator',attempt.id,0,'{}') IS NULL;
  UPDATE public.role_assessments SET scoring_token = claim WHERE id = attempt.id;
  attempt := public.finish_selected_role_assessment(member, 'Illustrator', attempt.id, claim, 75, '{"criteria":[],"score":75}');
  ASSERT attempt.score = 75;
  BEGIN
    PERFORM public.start_selected_role_assessment(member,'Illustrator','illustrator','work-sample-2','','consent-test');
    RAISE EXCEPTION 'Early retake was allowed' USING ERRCODE = 'XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
  END;
  UPDATE public.imprint_tasks SET assigned_at = now() - interval '28 days', due_at = now()
    WHERE user_id = member AND kind = 'reassessment';
  ASSERT (public.start_selected_role_assessment(member,'Illustrator','illustrator','work-sample-2','','consent-test')).form = 1;

  INSERT INTO public.assessment_review_requests (user_id, assessment_id, reason)
    VALUES (member, attempt.id, 'Verify the scored evidence') RETURNING id INTO appeal;
  BEGIN
    PERFORM public.resolve_assessment_review(appeal, member, 'Owner cannot self-review', 0, '{}');
    RAISE EXCEPTION 'Self-review was permitted' USING ERRCODE = 'XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
  END;
  PERFORM public.resolve_assessment_review(appeal, reviewer, 'Correct the observed evidence', 63, '{"criteria":[],"score":63}');
  ASSERT (SELECT score = 63 AND results->>'reviewRevision' = '1' FROM public.role_assessments WHERE id = attempt.id);
  ASSERT (SELECT revision = 1 AND original_score = 75 AND corrected_score = 63
    FROM public.assessment_score_corrections WHERE review_id = appeal);
  ASSERT (SELECT resolved_at IS NOT NULL FROM public.assessment_review_requests WHERE id = appeal);
  UPDATE public.role_assessments SET form = 3 WHERE id = attempt.id;
  UPDATE public.imprint_tasks SET completed_at = now() WHERE user_id = member AND kind = 'reassessment';
  PERFORM public.assign_imprint_tasks(member,'illustrator','work-sample-2');
  ASSERT NOT EXISTS (SELECT 1 FROM public.imprint_tasks WHERE user_id = member AND kind = 'reassessment' AND completed_at IS NULL);
END $$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '02300000-0000-4000-8000-000000000002', true);
DO $$ BEGIN
  ASSERT (SELECT count(*) = 0 FROM public.assessment_score_corrections);
END $$;
SELECT set_config('request.jwt.claim.sub', '02300000-0000-4000-8000-000000000001', true);
DO $$ BEGIN
  ASSERT (SELECT count(*) = 1 FROM public.assessment_score_corrections);
END $$;
ROLLBACK;
