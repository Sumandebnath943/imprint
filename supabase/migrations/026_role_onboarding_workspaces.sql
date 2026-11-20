CREATE TABLE public.onboarding_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id text NOT NULL,
  rubric_version text NOT NULL,
  form integer NOT NULL CHECK (form >= 0),
  difficulty text NOT NULL DEFAULT 'Basic' CHECK (difficulty IN ('Basic', 'Intermediate', 'Advanced')),
  capture_reflections boolean NOT NULL DEFAULT true,
  answers jsonb NOT NULL DEFAULT '{}',
  progress_version integer NOT NULL DEFAULT 0,
  scoring_token uuid,
  scoring_started_at timestamptz,
  feedback jsonb,
  assessment_id uuid REFERENCES public.role_assessments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id, rubric_version, form)
);

ALTER TABLE public.onboarding_workspaces ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.onboarding_workspaces FROM PUBLIC, anon, authenticated;
GRANT SELECT (id,user_id,role_id,rubric_version,form,difficulty,capture_reflections,answers,progress_version,feedback,assessment_id,created_at) ON public.onboarding_workspaces TO authenticated;
CREATE POLICY workspace_read_own ON public.onboarding_workspaces FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE FUNCTION public.open_role_onboarding_workspace(
  p_user uuid, p_profession text, p_role text, p_rubric text, p_reassessment boolean, p_difficulty text
) RETURNS public.onboarding_workspaces LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  finished boolean;
  work public.onboarding_workspaces;
  next_form integer := 0;
BEGIN
  SELECT onboarding_completed INTO finished FROM public.profiles WHERE id = p_user AND profession = p_profession FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'The selected profession changed.' USING ERRCODE = 'P0001'; END IF;
  SELECT * INTO work FROM public.onboarding_workspaces
    WHERE user_id = p_user AND role_id = p_role AND rubric_version = p_rubric ORDER BY form DESC LIMIT 1;
  IF p_reassessment THEN
    IF finished IS NOT TRUE OR work.id IS NULL THEN RAISE EXCEPTION 'Complete onboarding first.' USING ERRCODE = 'P0001'; END IF;
    IF work.assessment_id IS NULL THEN RETURN work; END IF;
    IF work.form >= (CASE WHEN p_role = 'software-developer' AND work.difficulty = 'Basic' THEN 3 ELSE 1 END) THEN
      RAISE EXCEPTION 'You reached the end of this assessment series. Practice is available.' USING ERRCODE = 'P0001';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.imprint_tasks WHERE user_id = p_user AND role_id = p_role
      AND rubric_version = p_rubric AND kind = 'reassessment' AND completed_at IS NULL AND due_at <= now()) THEN
      RAISE EXCEPTION 'Reassessment opens on its scheduled date.' USING ERRCODE = 'P0001';
    END IF;
    IF EXISTS (SELECT 1 FROM public.imprint_tasks WHERE user_id = p_user AND role_id = p_role
      AND rubric_version = p_rubric AND kind IN ('practice','check-in') AND completed_at IS NULL AND due_at + interval '2 days' < now()) THEN
      RAISE EXCEPTION 'Complete overdue practice and check-ins first.' USING ERRCODE = 'P0001';
    END IF;
    next_form := work.form + 1;
    p_difficulty := work.difficulty;
  ELSE
    IF work.id IS NOT NULL THEN
      SELECT * INTO work FROM public.onboarding_workspaces
        WHERE user_id = p_user AND role_id = p_role AND rubric_version = p_rubric AND form = 0;
      RETURN work;
    END IF;
  END IF;
  INSERT INTO public.onboarding_workspaces (user_id,role_id,rubric_version,form,difficulty,capture_reflections)
    VALUES (p_user,p_role,p_rubric,next_form,p_difficulty,finished IS NOT TRUE) RETURNING * INTO work;
  RETURN work;
END;
$$;

CREATE FUNCTION public.save_role_workspace_answer(
  p_user uuid, p_profession text, p_id uuid, p_question integer, p_version integer, p_answer jsonb
) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE version integer;
BEGIN
  PERFORM 1 FROM public.profiles WHERE id = p_user AND profession = p_profession FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'The selected profession changed.' USING ERRCODE = 'P0001'; END IF;
  UPDATE public.onboarding_workspaces SET answers = jsonb_set(answers, ARRAY[p_question::text], p_answer),
    progress_version = progress_version + 1, feedback = NULL
    WHERE id = p_id AND user_id = p_user AND assessment_id IS NULL AND progress_version = p_version
      AND p_question BETWEEN 1 AND 7 AND (capture_reflections OR p_question IN (5,6))
      AND (scoring_token IS NULL OR scoring_started_at < now() - interval '2 minutes')
    RETURNING progress_version INTO version;
  RETURN version;
END;
$$;

CREATE FUNCTION public.finish_workspace_onboarding(
  p_user_id uuid, p_profession text, p_role text, p_rubric text, p_cluster text, p_age_group text,
  p_exposure text, p_context text[], p_skills jsonb, p_reflection text
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  PERFORM 1 FROM public.profiles WHERE id = p_user_id AND profession = p_profession FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS (SELECT 1 FROM public.onboarding_workspaces
    WHERE user_id = p_user_id AND role_id = p_role AND rubric_version = p_rubric AND form = 0 AND capture_reflections
      AND answers ?& ARRAY['1','2','3','4','5','6','7']) THEN
    RAISE EXCEPTION 'Save all seven workspace questions before finishing.' USING ERRCODE = 'P0001';
  END IF;
  PERFORM public.finish_selected_profession_onboarding(p_user_id,p_profession,p_cluster,p_age_group,
    p_exposure,p_context,p_skills,ARRAY[]::text[],p_reflection);
END;
$$;

CREATE FUNCTION public.record_role_workspace_score(
  p_user uuid, p_profession text, p_id uuid, p_token uuid, p_score integer, p_results jsonb,
  p_role_answers jsonb, p_consent text, p_feedback jsonb
) RETURNS public.role_assessments LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE work public.onboarding_workspaces;
DECLARE scored public.role_assessments;
BEGIN
  PERFORM 1 FROM public.profiles WHERE id = p_user AND profession = p_profession FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'The selected profession changed.' USING ERRCODE = 'P0001'; END IF;
  SELECT * INTO work FROM public.onboarding_workspaces
    WHERE id = p_id AND user_id = p_user AND scoring_token = p_token AND assessment_id IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'The saved assessment changed.' USING ERRCODE = 'P0001'; END IF;
  IF p_score IS NULL THEN
    UPDATE public.onboarding_workspaces SET feedback = p_feedback, scoring_token = NULL, scoring_started_at = NULL WHERE id = p_id;
    RETURN NULL;
  END IF;
  INSERT INTO public.role_assessments(user_id,role_id,rubric_version,form,status,answers,results,score,consent_version,scored_at)
    VALUES(p_user,work.role_id,work.rubric_version,work.form,'scored',p_role_answers,p_results,p_score,p_consent,now())
    RETURNING * INTO scored;
  UPDATE public.onboarding_workspaces SET assessment_id = scored.id, feedback = p_feedback,
    scoring_token = NULL, scoring_started_at = NULL WHERE id = p_id;
  IF work.form > 0 THEN
    UPDATE public.imprint_tasks SET completed_at = now(), completion = jsonb_build_object('assessmentId',scored.id)
      WHERE user_id = p_user AND role_id = work.role_id AND rubric_version = work.rubric_version
        AND kind = 'reassessment' AND completed_at IS NULL AND assigned_at <= work.created_at;
  END IF;
  PERFORM public.assign_imprint_tasks(p_user,work.role_id,work.rubric_version);
  RETURN scored;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_imprint_tasks(p_user uuid, p_role text, p_rubric text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  INSERT INTO public.imprint_tasks (user_id, role_id, rubric_version, kind, due_at)
  SELECT p_user, p_role, p_rubric, schedule.kind, now() + schedule.interval
  FROM (VALUES ('practice', interval '7 days'), ('check-in', interval '7 days'), ('reassessment', interval '28 days')) AS schedule(kind, interval)
  WHERE NOT EXISTS (SELECT 1 FROM public.imprint_tasks task WHERE task.user_id = p_user AND task.role_id = p_role
    AND task.rubric_version = p_rubric AND task.kind = schedule.kind AND task.completed_at IS NULL)
  AND (schedule.kind <> 'reassessment' OR NOT EXISTS (
    SELECT 1 FROM public.role_assessments AS result
    WHERE result.user_id = p_user AND result.role_id = p_role AND result.rubric_version = p_rubric AND result.status = 'scored'
    AND ((p_rubric = 'work-sample-2' AND result.form >= 3) OR (p_rubric = 'onboarding-work-1' AND result.form >=
      CASE WHEN p_role = 'software-developer' AND result.results ->> 'difficulty' = 'Basic' THEN 3 ELSE 1 END))
  ))
  ON CONFLICT (user_id, role_id, rubric_version, kind) WHERE completed_at IS NULL DO NOTHING;
$$;

CREATE FUNCTION public.has_overdue_current_role_reassessment(p_user uuid, p_profession text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH selected_track AS (
    SELECT CASE p_profession
      WHEN 'Sales Representative' THEN 'sales'
      WHEN 'Software QA / Tester' THEN 'software-qa'
      ELSE NULLIF(regexp_replace(lower(trim(p_profession)), '[^a-z0-9]+', '-', 'g'), '')
    END AS id
  )
  SELECT EXISTS (
    SELECT 1 FROM public.imprint_tasks task CROSS JOIN selected_track track
    WHERE task.user_id = p_user AND task.kind = 'reassessment' AND task.completed_at IS NULL
      AND task.due_at + interval '7 days' < now()
      AND (track.id IS NULL OR task.role_id = track.id)
      AND (task.rubric_version = 'onboarding-work-1' OR NOT EXISTS (
        SELECT 1 FROM public.onboarding_workspaces work
        WHERE work.user_id = p_user AND work.role_id = task.role_id AND work.rubric_version = 'onboarding-work-1'
      ))
  );
$$;

CREATE OR REPLACE FUNCTION public.check_imprint_credential_freshness()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.credential_public AND NEW.credential_public IS DISTINCT FROM OLD.credential_public
    AND public.has_overdue_current_role_reassessment(NEW.id, NEW.profession) THEN
    RAISE EXCEPTION 'Complete your overdue reassessment before publishing a credential' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_imprint_score_sharing()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.drift_score_shared IS NOT NULL THEN
    IF public.has_overdue_current_role_reassessment(NEW.user_id,
      (SELECT profession FROM public.profiles WHERE id = NEW.user_id)) THEN
      RAISE EXCEPTION 'Complete your overdue reassessment before sharing a score' USING ERRCODE = 'P0001';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.drift_scores score WHERE score.user_id = NEW.user_id
        AND score.score = NEW.drift_score_shared AND score.calibration_session_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'This score is unavailable for sharing' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.has_overdue_current_role_reassessment(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_overdue_current_role_reassessment(uuid,text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.open_role_onboarding_workspace(uuid,text,text,text,boolean,text),
  public.save_role_workspace_answer(uuid,text,uuid,integer,integer,jsonb),
  public.finish_workspace_onboarding(uuid,text,text,text,text,text,text,text[],jsonb,text),
  public.record_role_workspace_score(uuid,text,uuid,uuid,integer,jsonb,jsonb,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.open_role_onboarding_workspace(uuid,text,text,text,boolean,text),
  public.save_role_workspace_answer(uuid,text,uuid,integer,integer,jsonb),
  public.finish_workspace_onboarding(uuid,text,text,text,text,text,text,text[],jsonb,text),
  public.record_role_workspace_score(uuid,text,uuid,uuid,integer,jsonb,jsonb,text,jsonb) TO service_role;
