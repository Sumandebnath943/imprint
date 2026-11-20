CREATE FUNCTION public.save_selected_role_assessment_draft(
  p_user uuid, p_profession text, p_attempt uuid, p_version integer, p_answers jsonb
) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE saved_version integer;
BEGIN
  PERFORM 1 FROM public.profiles
    WHERE id = p_user AND onboarding_completed IS TRUE AND profession = p_profession FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Your selected profession changed.' USING ERRCODE = 'P0001'; END IF;
  UPDATE public.role_assessments SET answers = p_answers, progress_version = p_version + 1, check_results = NULL
    WHERE id = p_attempt AND user_id = p_user AND status = 'draft' AND progress_version = p_version
      AND (scoring_token IS NULL OR scoring_started_at < now() - interval '2 minutes')
    RETURNING progress_version INTO saved_version;
  RETURN saved_version;
END;
$$;

CREATE FUNCTION public.finish_selected_role_assessment(
  p_user uuid, p_profession text, p_attempt uuid, p_token uuid, p_score integer, p_results jsonb
) RETURNS public.role_assessments LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  PERFORM 1 FROM public.profiles
    WHERE id = p_user AND onboarding_completed IS TRUE AND profession = p_profession FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Your selected profession changed. Your work is saved.' USING ERRCODE = 'P0001'; END IF;
  RETURN public.finish_role_assessment(p_user, p_attempt, p_token, p_score, p_results);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.save_selected_role_assessment_draft(uuid,text,uuid,integer,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_selected_role_assessment_draft(uuid,text,uuid,integer,jsonb) TO service_role;
REVOKE EXECUTE ON FUNCTION public.finish_selected_role_assessment(uuid,text,uuid,uuid,integer,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_selected_role_assessment(uuid,text,uuid,uuid,integer,jsonb) TO service_role;
