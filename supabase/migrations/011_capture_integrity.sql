ALTER TABLE public.calibration_sessions
  ADD COLUMN IF NOT EXISTS prompts jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS progress_version integer NOT NULL DEFAULT 0;

ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS forge_attempt_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS journal_forge_attempt
  ON public.journal_entries (user_id, forge_attempt_id)
  WHERE forge_attempt_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.start_imprint_calibration(
  p_user_id uuid, p_cluster text, p_prompt_sets jsonb, p_due timestamptz
)
RETURNS public.calibration_sessions
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  session public.calibration_sessions;
  next_number integer;
BEGIN
  PERFORM 1 FROM public.profiles WHERE id = p_user_id AND profession_cluster IS NOT DISTINCT FROM p_cluster FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Calibration profile is unavailable'; END IF;

  SELECT * INTO session FROM public.calibration_sessions
  WHERE user_id = p_user_id AND status = 'in_progress'
  ORDER BY created_at DESC, id DESC LIMIT 1;

  IF FOUND THEN
    IF jsonb_array_length(session.prompts) = 0 THEN
      UPDATE public.calibration_sessions
      SET prompts = p_prompt_sets -> ((session.session_number - 1) % jsonb_array_length(p_prompt_sets))
      WHERE id = session.id RETURNING * INTO session;
    END IF;
    RETURN session;
  END IF;

  SELECT coalesce(max(session_number), 0) + 1 INTO next_number
  FROM public.calibration_sessions WHERE user_id = p_user_id;
  INSERT INTO public.calibration_sessions
    (user_id, session_number, status, prompts, next_session_due)
  VALUES (p_user_id, next_number, 'in_progress',
    p_prompt_sets -> ((next_number - 1) % jsonb_array_length(p_prompt_sets)), p_due)
  RETURNING * INTO session;
  RETURN session;
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_imprint_calibration(
  p_user_id uuid, p_session_id uuid, p_version integer, p_result jsonb, p_comparison jsonb, p_imprint integer
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  session public.calibration_sessions;
  previous_score integer;
  saved public.drift_scores;
  output jsonb;
  completion_time timestamptz := now();
BEGIN
  PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  SELECT * INTO session FROM public.calibration_sessions
    WHERE id = p_session_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Calibration is unavailable' USING ERRCODE = 'P0001'; END IF;

  IF session.status = 'completed' THEN
    SELECT * INTO saved FROM public.drift_scores
      WHERE user_id = p_user_id AND calibration_session_id = p_session_id ORDER BY created_at DESC LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('score', saved.score, 'scoreLabel', saved.score_label,
        'delta', session.comparison_vs_baseline -> 'delta', 'signals', saved.contributing_signals,
        'nextSessionDue', session.next_session_due);
    END IF;
  ELSIF session.status <> 'in_progress' THEN
    RAISE EXCEPTION 'Calibration cannot be completed' USING ERRCODE = 'P0001';
  END IF;
  IF session.progress_version <> p_version THEN
    RAISE EXCEPTION 'Responses changed. Reload the assessment and retry' USING ERRCODE = 'P0001';
  END IF;

  SELECT score INTO previous_score FROM public.drift_scores
    WHERE user_id = p_user_id AND calibration_session_id IS NOT NULL ORDER BY created_at DESC LIMIT 1;
  output := p_result || jsonb_build_object('delta',
    CASE WHEN previous_score IS NOT NULL THEN (p_result ->> 'score')::integer - previous_score END);
  UPDATE public.calibration_sessions SET status = 'completed',
    drift_score_produced = (output ->> 'score')::integer,
    comparison_vs_baseline = p_comparison || jsonb_build_object('delta', output -> 'delta'),
    completed_at = completion_time, updated_at = completion_time,
    next_session_due = (output ->> 'nextSessionDue')::timestamptz
  WHERE id = p_session_id;
  INSERT INTO public.drift_scores
    (user_id, score, score_label, calibration_session_id, delta_from_previous, contributing_signals, week_number, year)
  VALUES (p_user_id, (output ->> 'score')::integer, output ->> 'scoreLabel', p_session_id,
    coalesce((output ->> 'delta')::integer, 0), output -> 'signals',
    extract(week from completion_time)::integer, extract(isoyear from completion_time)::integer);
  UPDATE public.profiles SET imprint_score = p_imprint WHERE id = p_user_id;
  RETURN output;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_baseline_capture(p_capture jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  owner_id uuid := auth.uid();
  existing_id uuid;
  finished boolean;
  capture public.baseline_imprints;
BEGIN
  SELECT onboarding_completed INTO finished FROM public.profiles WHERE id = owner_id FOR UPDATE;
  IF NOT FOUND OR finished THEN
    RAISE EXCEPTION 'Onboarding is closed' USING ERRCODE = 'P0001';
  END IF;

  capture := jsonb_populate_record(NULL::public.baseline_imprints, p_capture);
  SELECT id INTO existing_id FROM public.baseline_imprints
    WHERE user_id = owner_id AND module_id = capture.module_id
    ORDER BY created_at DESC, id DESC LIMIT 1;

  IF existing_id IS NULL THEN
    INSERT INTO public.baseline_imprints
      (user_id, cluster, module_id, module_name, prompt_given, response_text, response_audio_url,
       response_file_url, response_type, word_count, avg_sentence_length, vocabulary_richness, response_time_seconds)
    VALUES
      (owner_id, capture.cluster, capture.module_id, capture.module_name, capture.prompt_given,
       capture.response_text, capture.response_audio_url, capture.response_file_url, capture.response_type,
       capture.word_count, capture.avg_sentence_length, capture.vocabulary_richness, capture.response_time_seconds);
  ELSE
    UPDATE public.baseline_imprints SET
      cluster = capture.cluster, module_name = capture.module_name, prompt_given = capture.prompt_given,
      response_text = capture.response_text, response_audio_url = capture.response_audio_url,
      response_file_url = capture.response_file_url, response_type = capture.response_type,
      word_count = capture.word_count, avg_sentence_length = capture.avg_sentence_length,
      vocabulary_richness = capture.vocabulary_richness, response_time_seconds = capture.response_time_seconds
    WHERE id = existing_id AND user_id = owner_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_imprint_onboarding(
  p_user_id uuid, p_profession text, p_cluster text, p_age_group text, p_exposure text,
  p_context text[], p_skills jsonb, p_required_modules text[]
)
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  finished boolean;
BEGIN
  SELECT onboarding_completed INTO finished FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile is unavailable'; END IF;
  IF finished THEN RETURN; END IF;

  IF EXISTS (
    SELECT 1 FROM unnest(p_required_modules) AS required(id)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.baseline_imprints WHERE user_id = p_user_id AND module_id = required.id
    )
  ) THEN
    RAISE EXCEPTION 'Required baseline responses are missing' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.skill_vault
    (user_id, skill_name, skill_category, cluster, strength_level, times_practiced, last_exercised)
  SELECT p_user_id, item.name, 'general', p_cluster, item.strength, 0, NULL
  FROM jsonb_to_recordset(p_skills) AS item(name text, strength integer)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.skill_vault s WHERE s.user_id = p_user_id AND lower(s.skill_name) = lower(item.name)
  );

  UPDATE public.profiles SET
    profession = p_profession, profession_cluster = p_cluster, age_group = p_age_group,
    ai_exposure_level = p_exposure, ai_use_context = p_context,
    onboarding_step = 7, onboarding_completed = true
  WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_imprint_forge(
  p_attempt_id uuid, p_entry jsonb, p_challenge_id uuid, p_skill_id uuid
)
RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  owner_id uuid := auth.uid();
  entry_id uuid;
  record public.journal_entries;
  challenge public.vault_challenges;
  practiced_skill_id uuid := p_skill_id;
BEGIN
  IF owner_id IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  PERFORM 1 FROM public.profiles WHERE id = owner_id FOR UPDATE;
  SELECT id INTO entry_id FROM public.journal_entries
    WHERE user_id = owner_id AND forge_attempt_id = p_attempt_id;
  IF FOUND THEN RETURN entry_id; END IF;

  IF p_challenge_id IS NOT NULL THEN
    SELECT * INTO challenge FROM public.vault_challenges
      WHERE id = p_challenge_id AND user_id = owner_id FOR UPDATE;
    IF NOT FOUND OR challenge.status <> 'pending' THEN
      RAISE EXCEPTION 'Challenge is unavailable' USING ERRCODE = 'P0001';
    END IF;
    practiced_skill_id := challenge.skill_id;
  END IF;

  IF practiced_skill_id IS NOT NULL THEN
    UPDATE public.skill_vault SET times_practiced = times_practiced + 1, last_exercised = now()
      WHERE id = practiced_skill_id AND user_id = owner_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Skill is unavailable' USING ERRCODE = 'P0001'; END IF;
  END IF;

  record := jsonb_populate_record(NULL::public.journal_entries, p_entry);
  INSERT INTO public.journal_entries (
    user_id, forge_attempt_id, title, content, word_count, is_forge_entry, has_ai_assistance,
    was_timed, time_limit_seconds, drift_signals, response_file_url, item_type, source
  ) VALUES (
    owner_id, p_attempt_id, record.title, record.content, record.word_count, true, false,
    record.was_timed, record.time_limit_seconds, record.drift_signals, record.response_file_url,
    record.item_type, record.source
  ) RETURNING id INTO entry_id;

  IF p_challenge_id IS NOT NULL THEN
    UPDATE public.vault_challenges SET
      status = 'completed', completed_at = now(), strength_gained = 0,
      submission_text = CASE WHEN record.response_file_url IS NULL THEN record.content END,
      submission_audio_url = CASE WHEN record.item_type = 'voice' THEN record.response_file_url END,
      submission_file_url = CASE WHEN record.item_type <> 'voice' THEN record.response_file_url END
    WHERE id = p_challenge_id AND user_id = owner_id;
  END IF;

  RETURN entry_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_baseline_capture(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_baseline_capture(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.finish_imprint_onboarding(uuid, text, text, text, text, text[], jsonb, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_imprint_onboarding(uuid, text, text, text, text, text[], jsonb, text[]) TO service_role;
REVOKE EXECUTE ON FUNCTION public.save_imprint_forge(uuid, jsonb, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_imprint_forge(uuid, jsonb, uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.start_imprint_calibration(uuid, text, jsonb, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_imprint_calibration(uuid, text, jsonb, timestamptz) TO service_role;
REVOKE EXECUTE ON FUNCTION public.finish_imprint_calibration(uuid, uuid, integer, jsonb, jsonb, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_imprint_calibration(uuid, uuid, integer, jsonb, jsonb, integer) TO service_role;
