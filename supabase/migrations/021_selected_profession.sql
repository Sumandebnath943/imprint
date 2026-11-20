-- Retain the previous RPCs for the deployed revision during the upgrade.
CREATE FUNCTION public.start_selected_role_assessment(
  p_user uuid, p_profession text, p_role text, p_rubric text, p_context text, p_consent text
) RETURNS public.role_assessments
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  PERFORM 1 FROM public.profiles
    WHERE id = p_user AND onboarding_completed IS TRUE AND profession = p_profession FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Your selected profession changed.' USING ERRCODE = 'P0001'; END IF;
  RETURN public.start_role_assessment(p_user, p_role, p_rubric, p_context, p_consent);
END;
$$;

CREATE FUNCTION public.finish_selected_profession_onboarding(
  p_user_id uuid, p_profession text, p_cluster text, p_age_group text, p_exposure text, p_context text[],
  p_skills jsonb, p_required_modules text[], p_reflection text
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE selected_profession text;
BEGIN
  SELECT profession INTO selected_profession FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF nullif(btrim(selected_profession), '') IS NOT NULL AND selected_profession <> p_profession THEN
    RAISE EXCEPTION 'Your selected profession changed.' USING ERRCODE = 'P0001';
  END IF;
  PERFORM public.finish_imprint_onboarding_with_reflection(
    p_user_id, p_profession, p_cluster, p_age_group, p_exposure, p_context, p_skills, p_required_modules, p_reflection
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.start_selected_role_assessment(uuid,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_selected_role_assessment(uuid,text,text,text,text,text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.finish_selected_profession_onboarding(uuid,text,text,text,text,text[],jsonb,text[],text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_selected_profession_onboarding(uuid,text,text,text,text,text[],jsonb,text[],text) TO service_role;
