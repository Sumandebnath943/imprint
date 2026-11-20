CREATE OR REPLACE FUNCTION public.assign_imprint_tasks(p_user uuid, p_role text, p_rubric text)
RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  INSERT INTO public.imprint_tasks (user_id, role_id, rubric_version, kind, due_at)
  SELECT p_user, p_role, p_rubric, schedule.kind, now() + schedule.interval
  FROM (VALUES ('practice', interval '7 days'), ('check-in', interval '7 days'),
               ('reassessment', interval '28 days')) AS schedule(kind, interval)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.imprint_tasks AS task
    WHERE task.user_id = p_user AND task.role_id = p_role AND task.rubric_version = p_rubric
      AND task.kind = schedule.kind AND task.completed_at IS NULL
  )
  AND (schedule.kind <> 'reassessment' OR p_rubric <> 'work-sample-2' OR NOT EXISTS (
    SELECT 1 FROM public.role_assessments
    WHERE user_id = p_user AND role_id = p_role AND rubric_version = p_rubric AND status = 'scored' AND form >= 3
  ))
  ON CONFLICT (user_id, role_id, rubric_version, kind) WHERE completed_at IS NULL DO NOTHING;
$$;
