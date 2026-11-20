ALTER TABLE public.role_assessments ADD COLUMN check_results jsonb;

CREATE OR REPLACE FUNCTION public.start_selected_role_assessment(
  p_user uuid, p_profession text, p_role text, p_rubric text, p_context text, p_consent text
) RETURNS public.role_assessments
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE completed_forms integer;
BEGIN
  PERFORM 1 FROM public.profiles
    WHERE id = p_user AND onboarding_completed IS TRUE AND profession = p_profession FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Your selected profession changed. Reload before starting.' USING ERRCODE = 'P0001'; END IF;

  IF p_rubric = 'work-sample-2' AND NOT EXISTS (
    SELECT 1 FROM public.role_assessments
    WHERE user_id = p_user AND role_id = p_role AND rubric_version = p_rubric AND status = 'draft'
  ) THEN
    SELECT count(*) INTO completed_forms FROM public.role_assessments
    WHERE user_id = p_user AND role_id = p_role AND rubric_version = p_rubric AND status = 'scored';
    IF completed_forms >= 4 THEN
      RAISE EXCEPTION 'You completed the available forms for this series. Unscored practice is still available.' USING ERRCODE = 'P0001';
    END IF;
    IF completed_forms > 0 AND NOT EXISTS (
      SELECT 1 FROM public.imprint_tasks
      WHERE user_id = p_user AND role_id = p_role AND rubric_version = p_rubric
        AND kind = 'reassessment' AND completed_at IS NULL AND due_at <= now()
    ) THEN
      RAISE EXCEPTION 'Your next scored reassessment opens on its scheduled date. Unscored practice is available now.' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN public.start_role_assessment(p_user, p_role, p_rubric, p_context, p_consent);
END;
$$;
