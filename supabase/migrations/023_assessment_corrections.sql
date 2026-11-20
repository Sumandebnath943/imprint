CREATE TABLE public.assessment_score_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.role_assessments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id uuid NOT NULL UNIQUE REFERENCES public.assessment_review_requests(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revision integer NOT NULL CHECK (revision > 0),
  reason text NOT NULL,
  original_score integer NOT NULL,
  original_results jsonb NOT NULL,
  corrected_score integer NOT NULL CHECK (corrected_score BETWEEN 0 AND 100),
  corrected_results jsonb NOT NULL,
  corrected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, revision)
);
ALTER TABLE public.assessment_score_corrections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.assessment_score_corrections FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.assessment_score_corrections TO authenticated;
CREATE POLICY assessment_corrections_read_own ON public.assessment_score_corrections FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE FUNCTION public.resolve_assessment_review(
  p_review uuid, p_reviewer uuid, p_reason text, p_score integer, p_results jsonb
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  appeal public.assessment_review_requests;
  assessment public.role_assessments;
  next_revision integer;
BEGIN
  SELECT * INTO appeal FROM public.assessment_review_requests
    WHERE id = p_review AND user_id <> p_reviewer AND resolved_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Review unavailable.' USING ERRCODE = 'P0001'; END IF;

  IF p_results IS NOT NULL THEN
    SELECT * INTO assessment FROM public.role_assessments
      WHERE id = appeal.assessment_id AND user_id = appeal.user_id AND status = 'scored' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Assessment unavailable.' USING ERRCODE = 'P0001'; END IF;
    SELECT COALESCE(max(revision), 0) + 1 INTO next_revision FROM public.assessment_score_corrections
      WHERE assessment_id = assessment.id;
    INSERT INTO public.assessment_score_corrections (
      assessment_id, user_id, review_id, reviewer_id, revision, reason, original_score, original_results, corrected_score, corrected_results
    ) VALUES (
      assessment.id, appeal.user_id, p_review, p_reviewer, next_revision, p_reason,
      assessment.score, assessment.results, p_score, p_results
    );
    UPDATE public.role_assessments SET score = p_score,
      results = p_results || jsonb_build_object('reviewRevision', next_revision)
      WHERE id = assessment.id;
  END IF;
  UPDATE public.assessment_review_requests SET resolution = p_reason, resolved_at = now() WHERE id = p_review;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.resolve_assessment_review(uuid,uuid,text,integer,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_assessment_review(uuid,uuid,text,integer,jsonb) TO service_role;
