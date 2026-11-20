CREATE TABLE public.onboarding_reflections (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text NOT NULL CHECK (length(btrim(note)) BETWEEN 1 AND 2000),
  captured_at timestamptz NOT NULL DEFAULT statement_timestamp()
);
ALTER TABLE public.onboarding_reflections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.onboarding_reflections FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.onboarding_reflections TO authenticated;
CREATE POLICY onboarding_reflections_read_own ON public.onboarding_reflections FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE FUNCTION public.finish_imprint_onboarding_with_reflection(
  p_user_id uuid, p_profession text, p_cluster text, p_age_group text, p_exposure text, p_context text[],
  p_skills jsonb, p_required_modules text[], p_reflection text
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE already_finished boolean;
BEGIN
  SELECT onboarding_completed INTO already_finished FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile is unavailable'; END IF;
  IF already_finished IS TRUE THEN RETURN; END IF;

  PERFORM public.finish_imprint_onboarding(p_user_id,p_profession,p_cluster,p_age_group,p_exposure,p_context,p_skills,p_required_modules);
  IF nullif(btrim(p_reflection), '') IS NOT NULL THEN
    INSERT INTO public.onboarding_reflections(user_id,note) VALUES (p_user_id,p_reflection)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END; $$;

CREATE FUNCTION public.due_onboarding_reflection() RETURNS TABLE(note text, captured_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT r.note,r.captured_at FROM public.onboarding_reflections r
  WHERE r.user_id = (SELECT auth.uid()) AND r.captured_at + interval '2160 hours' <= statement_timestamp();
$$;
REVOKE EXECUTE ON FUNCTION public.finish_imprint_onboarding_with_reflection(uuid,text,text,text,text,text[],jsonb,text[],text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_imprint_onboarding_with_reflection(uuid,text,text,text,text,text[],jsonb,text[],text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.due_onboarding_reflection() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.due_onboarding_reflection() TO authenticated;
