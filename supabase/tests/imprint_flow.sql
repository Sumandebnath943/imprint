BEGIN;
DO $$
DECLARE
  me uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  other uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  attempt_id uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  token uuid := 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  capture jsonb := '{"cluster":"universal","module_id":"U1","module_name":"Belief","prompt_given":"Test prompt","response_text":"Test answer","response_type":"text","word_count":2,"avg_sentence_length":2,"vocabulary_richness":1,"response_time_seconds":5}';
  first_entry uuid;
  second_entry uuid;
  skill uuid;
  challenge uuid;
  practice_id uuid;
  role_attempt public.role_assessments;
  calibration public.calibration_sessions;
  scored jsonb;
  reminder_count integer;
BEGIN
  INSERT INTO auth.users(id, email) VALUES (me, 'imprint-test@example.test'), (other, 'imprint-other@example.test');
  PERFORM set_config('request.jwt.claim.sub', me::text, true);
  PERFORM public.save_baseline_capture(capture);
  PERFORM public.save_baseline_capture(capture || '{"response_text":"Retry updated"}');
  ASSERT (SELECT count(*) = 1 FROM public.baseline_imprints WHERE user_id = me AND module_id = 'U1');
  ASSERT (SELECT response_text = 'Retry updated' FROM public.baseline_imprints WHERE user_id = me AND module_id = 'U1');

  BEGIN
    PERFORM public.finish_imprint_onboarding(me, 'Writer', 'language_voice', 'adult_19_64', 'none', '{}',
      '[{"name":"Argument and structure","strength":60}]', ARRAY['U1','U2']);
    RAISE EXCEPTION 'Onboarding accepted missing evidence' USING ERRCODE = 'XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
  END;
  PERFORM public.finish_imprint_onboarding(me, 'Writer', 'language_voice', 'adult_19_64', 'none', '{}',
    '[{"name":"Argument and structure","strength":60}]', ARRAY['U1']);
  PERFORM public.finish_imprint_onboarding(me, 'Writer', 'language_voice', 'adult_19_64', 'none', '{}',
    '[{"name":"Argument and structure","strength":60}]', ARRAY['U1']);
  ASSERT (SELECT count(*) = 0 FROM public.drift_scores WHERE user_id = me);
  ASSERT (SELECT count(*) = 1 FROM public.skill_vault WHERE user_id = me);
  SELECT id INTO skill FROM public.skill_vault WHERE user_id = me;
  ASSERT (SELECT last_exercised IS NULL FROM public.skill_vault WHERE id = skill);

  INSERT INTO public.vault_challenges
    (user_id, skill_id, challenge_title, challenge_description, challenge_type, assigned_date, due_date, strength_gained)
  VALUES (me, skill, 'Practice', 'Practice a skill', 'timed_write', current_date, current_date + 3, 5)
  RETURNING id INTO challenge;
  first_entry := public.save_imprint_forge(attempt_id, '{"title":"Practice","content":"A response","word_count":2,"was_timed":false}', challenge, NULL);
  second_entry := public.save_imprint_forge(attempt_id, '{"title":"Practice","content":"A response","word_count":2,"was_timed":false}', challenge, NULL);
  ASSERT first_entry = second_entry;
  ASSERT (SELECT strength_level = 60 AND times_practiced = 1 FROM public.skill_vault WHERE id = skill);
  ASSERT (SELECT status = 'completed' AND strength_gained = 0 FROM public.vault_challenges WHERE id = challenge);

  calibration := public.start_imprint_calibration(me, 'language_voice', '[[{"id":"U1-A"}]]', now() + interval '14 days');
  ASSERT calibration.prompts -> 0 ->> 'id' = 'U1-A';
  ASSERT (public.start_imprint_calibration(me, 'language_voice', '[[{"id":"U1-A"}]]', now())).id = calibration.id;
  scored := public.finish_imprint_calibration(me, calibration.id, 0,
    '{"score":25,"scoreLabel":"anchored","nextSessionDue":"2026-12-30T00:00:00Z","signals":{"baseline_divergence":10}}', '{}', 0);
  ASSERT scored ->> 'score' = '25';
  ASSERT scored ->> 'delta' IS NULL;
  PERFORM public.finish_imprint_calibration(me, calibration.id, 0,
    '{"score":99,"scoreLabel":"crisis","nextSessionDue":"2026-12-30T00:00:00Z","signals":{}}', '{}', 0);
  ASSERT (SELECT count(*) = 1 AND min(score) = 25 FROM public.drift_scores WHERE calibration_session_id = calibration.id);

  role_attempt := public.start_role_assessment(me, 'writer', 'pilot-1', 'fiction', 'consent-test');
  ASSERT role_attempt.form = 0;
  ASSERT (public.start_role_assessment(me, 'writer', 'pilot-1', 'fiction', 'consent-test')).id = role_attempt.id;
  UPDATE public.role_assessments SET scoring_token = token WHERE id = role_attempt.id;
  role_attempt := public.finish_role_assessment(me, role_attempt.id, token, 65, '{"criteria":[]}');
  ASSERT role_attempt.status = 'scored';
  ASSERT (SELECT count(*) = 3 FROM public.imprint_tasks WHERE user_id = me);
  SELECT id INTO practice_id FROM public.imprint_tasks WHERE user_id = me AND kind = 'practice';
  PERFORM public.complete_imprint_task(me, practice_id, '{"kind":"practice"}');
  PERFORM public.complete_imprint_task(me, practice_id, '{"kind":"practice"}');
  ASSERT (SELECT count(*) = 1 FROM public.imprint_tasks WHERE user_id = me AND kind = 'practice' AND completed_at IS NULL);

  PERFORM public.update_imprint_task_preferences(true, 3, 'UTC');
  SELECT count(*) INTO reminder_count FROM public.claim_imprint_reminders(25);
  ASSERT reminder_count = 3;
  SELECT count(*) INTO reminder_count FROM public.claim_imprint_reminders(25);
  ASSERT reminder_count = 0;
  SELECT id INTO practice_id FROM public.imprint_tasks WHERE user_id = me AND kind = 'practice' AND completed_at IS NULL;
  PERFORM public.reschedule_imprint_task(me, practice_id);
  ASSERT (SELECT schedule_revision = 1 FROM public.imprint_tasks WHERE id = practice_id);
  SELECT count(*) INTO reminder_count FROM public.claim_imprint_reminders(25);
  ASSERT reminder_count = 1;
  BEGIN
    PERFORM public.reschedule_imprint_task(me, practice_id);
    RAISE EXCEPTION 'Rescheduling repeatedly bypassed the limit' USING ERRCODE = 'XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
  END;
  UPDATE public.imprint_tasks SET assigned_at = now() - interval '40 days', due_at = now() - interval '8 days'
    WHERE user_id = me AND kind = 'reassessment' AND completed_at IS NULL;
  BEGIN
    UPDATE public.profiles SET credential_public = true WHERE id = me;
    RAISE EXCEPTION 'Overdue credential gate failed' USING ERRCODE = 'XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
  END;
END $$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
DO $$
BEGIN
  ASSERT (SELECT count(*) = 0 FROM public.role_assessments);
  ASSERT (SELECT count(*) = 0 FROM public.imprint_tasks);
  BEGIN
    PERFORM public.start_role_assessment('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'writer', 'pilot-1', '', 'consent-test');
    RAISE EXCEPTION 'Direct assessment write was permitted' USING ERRCODE = 'XX000';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
ROLLBACK;
