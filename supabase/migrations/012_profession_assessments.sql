CREATE TABLE public.role_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id text NOT NULL,
  rubric_version text NOT NULL,
  form integer NOT NULL CHECK (form >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scored')),
  role_context text NOT NULL DEFAULT '',
  answers jsonb NOT NULL DEFAULT '{}',
  results jsonb,
  score integer CHECK (score BETWEEN 0 AND 100),
  progress_version integer NOT NULL DEFAULT 0,
  scoring_token uuid,
  scoring_started_at timestamptz,
  consent_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  scored_at timestamptz,
  UNIQUE (user_id, role_id, rubric_version, form),
  CHECK (status = 'draft' OR (score IS NOT NULL AND results IS NOT NULL AND scored_at IS NOT NULL))
);
CREATE INDEX role_assessments_user_date ON public.role_assessments (user_id, scored_at DESC);
CREATE UNIQUE INDEX role_assessments_open ON public.role_assessments (user_id, role_id, rubric_version) WHERE status = 'draft';
ALTER TABLE public.role_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_assessments_read_own ON public.role_assessments FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.role_assessments FROM authenticated, anon;

CREATE TABLE public.imprint_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id text NOT NULL,
  rubric_version text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('practice', 'check-in', 'reassessment')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NOT NULL,
  completed_at timestamptz,
  completion jsonb,
  CHECK (due_at >= assigned_at)
);
CREATE INDEX imprint_tasks_user_date ON public.imprint_tasks (user_id, due_at);
CREATE UNIQUE INDEX imprint_tasks_pending ON public.imprint_tasks (user_id, role_id, rubric_version, kind) WHERE completed_at IS NULL;
ALTER TABLE public.imprint_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY imprint_tasks_read_own ON public.imprint_tasks FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.imprint_tasks FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.start_role_assessment(
  p_user uuid, p_role text, p_rubric text, p_context text, p_consent text
)
RETURNS public.role_assessments
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  attempt public.role_assessments;
  next_form integer;
BEGIN
  PERFORM 1 FROM public.profiles WHERE id = p_user FOR UPDATE;
  SELECT * INTO attempt FROM public.role_assessments
    WHERE user_id = p_user AND role_id = p_role AND rubric_version = p_rubric AND status = 'draft';
  IF FOUND THEN
    IF attempt.consent_version <> p_consent THEN
      UPDATE public.role_assessments SET consent_version = p_consent
        WHERE id = attempt.id RETURNING * INTO attempt;
    END IF;
    RETURN attempt;
  END IF;

  SELECT coalesce(max(form), -1) + 1 INTO next_form FROM public.role_assessments
    WHERE user_id = p_user AND role_id = p_role AND rubric_version = p_rubric;
  INSERT INTO public.role_assessments (user_id, role_id, rubric_version, form, role_context, consent_version)
  VALUES (p_user, p_role, p_rubric, next_form, p_context, p_consent) RETURNING * INTO attempt;
  RETURN attempt;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_imprint_tasks(p_user uuid, p_role text, p_rubric text)
RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$
  INSERT INTO public.imprint_tasks (user_id, role_id, rubric_version, kind, due_at)
  SELECT p_user, p_role, p_rubric, schedule.kind, now() + schedule.interval
  FROM (VALUES ('practice', interval '7 days'), ('check-in', interval '7 days'),
               ('reassessment', interval '28 days')) AS schedule(kind, interval)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.imprint_tasks AS task
    WHERE task.user_id = p_user AND task.role_id = p_role AND task.rubric_version = p_rubric
      AND task.kind = schedule.kind AND task.completed_at IS NULL
  )
  ON CONFLICT (user_id, role_id, rubric_version, kind) WHERE completed_at IS NULL DO NOTHING;
$$;

CREATE OR REPLACE FUNCTION public.finish_role_assessment(
  p_user uuid, p_attempt uuid, p_token uuid, p_score integer, p_results jsonb
)
RETURNS public.role_assessments
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  attempt public.role_assessments;
BEGIN
  PERFORM 1 FROM public.profiles WHERE id = p_user FOR UPDATE;
  UPDATE public.role_assessments SET
    status = 'scored', score = p_score, results = p_results, scored_at = now(),
    scoring_token = NULL, scoring_started_at = NULL
  WHERE id = p_attempt AND user_id = p_user AND status = 'draft' AND scoring_token = p_token
  RETURNING * INTO attempt;
  IF NOT FOUND THEN RAISE EXCEPTION 'Assessment changed during scoring' USING ERRCODE = 'P0001'; END IF;

  IF attempt.form > 0 THEN
    UPDATE public.imprint_tasks SET completed_at = now(), completion = jsonb_build_object('assessmentId', attempt.id)
    WHERE user_id = p_user AND role_id = attempt.role_id AND rubric_version = attempt.rubric_version
      AND kind = 'reassessment' AND completed_at IS NULL AND assigned_at <= attempt.created_at;
  END IF;
  PERFORM public.assign_imprint_tasks(p_user, attempt.role_id, attempt.rubric_version);
  RETURN attempt;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_imprint_task(
  p_user uuid, p_task uuid, p_completion jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  task public.imprint_tasks;
BEGIN
  PERFORM 1 FROM public.profiles WHERE id = p_user FOR UPDATE;
  SELECT * INTO task FROM public.imprint_tasks WHERE id = p_task AND user_id = p_user FOR UPDATE;
  IF NOT FOUND OR task.kind = 'reassessment' THEN
    RAISE EXCEPTION 'Task is unavailable' USING ERRCODE = 'P0001';
  END IF;
  IF task.completed_at IS NOT NULL THEN RETURN; END IF;
  IF task.kind = 'practice' AND EXISTS (
    SELECT 1 FROM public.imprint_tasks AS pending
    WHERE pending.user_id = p_user AND pending.role_id = task.role_id
      AND pending.rubric_version = task.rubric_version AND pending.kind = 'check-in'
      AND pending.completed_at IS NULL AND pending.due_at + interval '2 days' < now()
  ) THEN
    RAISE EXCEPTION 'Complete your overdue AI-use check-in before continuing guided practice' USING ERRCODE = 'P0001';
  END IF;
  UPDATE public.imprint_tasks SET completed_at = now(), completion = p_completion WHERE id = p_task;
  PERFORM public.assign_imprint_tasks(p_user, task.role_id, task.rubric_version);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.start_role_assessment(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_imprint_tasks(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.finish_role_assessment(uuid, uuid, uuid, integer, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_imprint_task(uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_role_assessment(uuid, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_imprint_tasks(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_role_assessment(uuid, uuid, uuid, integer, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_imprint_task(uuid, uuid, jsonb) TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('assessment-evidence', 'assessment-evidence', false, 4000000,
    ARRAY['image/jpeg','image/png','image/webp','audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav','video/webm','video/mp4'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY assessment_evidence_read_own ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'assessment-evidence' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
