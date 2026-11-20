ALTER TABLE public.imprint_tasks ADD COLUMN schedule_revision integer NOT NULL DEFAULT 0;

CREATE TABLE public.imprint_reminder_delivery (
  task_id uuid NOT NULL REFERENCES public.imprint_tasks(id) ON DELETE CASCADE,
  schedule_revision integer NOT NULL DEFAULT 0,
  event text NOT NULL CHECK (event IN ('scheduled', 'due-soon', 'overdue')),
  claimed_at timestamptz NOT NULL DEFAULT now(),
  first_claimed_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 1,
  provider_id text,
  sent_at timestamptz,
  PRIMARY KEY (task_id, schedule_revision, event)
);
ALTER TABLE public.imprint_reminder_delivery ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.imprint_reminder_delivery FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_imprint_reminders(p_limit integer)
RETURNS TABLE (task_id uuid, event text, recipient text, task_kind text, due_at timestamptz, schedule_revision integer)
LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$
  WITH candidates AS (
    SELECT t.id AS id, p.email, t.kind, t.due_at, t.schedule_revision,
      CASE WHEN t.due_at <= now() THEN 'overdue'
           WHEN t.due_at <= now() + interval '24 hours' THEN 'due-soon'
           ELSE 'scheduled' END AS reminder_event
    FROM public.imprint_tasks t JOIN public.profiles p ON p.id = t.user_id
    WHERE t.completed_at IS NULL AND p.onboarding_completed
      AND p.notification_preferences ->> 'imprint_task_emails' = 'true'
      AND p.email <> ''
  ), eligible AS (
    SELECT c.*
    FROM candidates c
    LEFT JOIN public.imprint_reminder_delivery r ON r.task_id = c.id AND r.event = c.reminder_event
      AND r.schedule_revision = c.schedule_revision
    WHERE r.task_id IS NULL OR (r.sent_at IS NULL AND r.claimed_at < now() - interval '30 minutes'
      AND r.first_claimed_at > now() - interval '23 hours' AND r.attempts < 5)
    ORDER BY c.due_at, c.id
    LIMIT greatest(1, least(50, p_limit))
  ), claims AS (
    INSERT INTO public.imprint_reminder_delivery(task_id, schedule_revision, event)
      SELECT e.id, e.schedule_revision, e.reminder_event FROM eligible e
    ON CONFLICT ON CONSTRAINT imprint_reminder_delivery_pkey DO UPDATE
      SET claimed_at = now(), attempts = public.imprint_reminder_delivery.attempts + 1
      WHERE public.imprint_reminder_delivery.sent_at IS NULL
        AND public.imprint_reminder_delivery.claimed_at < now() - interval '30 minutes'
        AND public.imprint_reminder_delivery.first_claimed_at > now() - interval '23 hours'
        AND public.imprint_reminder_delivery.attempts < 5
    RETURNING imprint_reminder_delivery.task_id, imprint_reminder_delivery.event, imprint_reminder_delivery.schedule_revision
  )
  SELECT c.task_id, c.event, e.email, e.kind, e.due_at, c.schedule_revision
  FROM claims c JOIN eligible e ON e.id = c.task_id AND e.reminder_event = c.event
    AND e.schedule_revision = c.schedule_revision;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_imprint_reminders(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_imprint_reminders(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.reschedule_imprint_task(p_user uuid, p_task uuid)
RETURNS timestamptz
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  new_due timestamptz;
BEGIN
  UPDATE public.imprint_tasks SET due_at = due_at + interval '2 days',
    schedule_revision = schedule_revision + 1
  WHERE id = p_task AND user_id = p_user AND completed_at IS NULL
    AND schedule_revision = 0 AND due_at > now()
  RETURNING due_at INTO new_due;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This task cannot be moved again or is already due' USING ERRCODE = 'P0001';
  END IF;
  RETURN new_due;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.reschedule_imprint_task(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reschedule_imprint_task(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.update_imprint_task_preferences(p_email boolean, p_journal_days integer, p_zone text)
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF p_journal_days NOT BETWEEN 0 AND 7 OR length(p_zone) > 80 THEN
    RAISE EXCEPTION 'Invalid task preferences';
  END IF;
  UPDATE public.profiles SET notification_preferences = coalesce(notification_preferences, '{}'::jsonb) ||
    jsonb_build_object('imprint_task_emails', p_email, 'imprint_journal_days', p_journal_days, 'imprint_time_zone', p_zone)
  WHERE id = auth.uid();
END;
$$;
REVOKE EXECUTE ON FUNCTION public.update_imprint_task_preferences(boolean, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_imprint_task_preferences(boolean, integer, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.check_imprint_credential_freshness()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF NEW.credential_public AND NEW.credential_public IS DISTINCT FROM OLD.credential_public
    AND EXISTS (
      SELECT 1 FROM public.imprint_tasks task
      WHERE task.user_id = NEW.id AND task.kind = 'reassessment' AND task.completed_at IS NULL
        AND task.due_at + interval '7 days' < now()
    )
  THEN
    RAISE EXCEPTION 'Complete your overdue reassessment before publishing a credential' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_imprint_credential_freshness ON public.profiles;
CREATE TRIGGER check_imprint_credential_freshness
BEFORE UPDATE OF credential_public ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.check_imprint_credential_freshness();

CREATE OR REPLACE FUNCTION public.check_imprint_score_sharing()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF NEW.drift_score_shared IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.imprint_tasks task WHERE task.user_id = NEW.user_id
        AND task.kind = 'reassessment' AND task.completed_at IS NULL
        AND task.due_at + interval '7 days' < now()
    ) THEN
      RAISE EXCEPTION 'Complete your overdue reassessment before sharing a score' USING ERRCODE = 'P0001';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.drift_scores score
      WHERE score.user_id = NEW.user_id AND score.score = NEW.drift_score_shared
        AND score.calibration_session_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'This score is unavailable for sharing' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER check_imprint_score_sharing
BEFORE INSERT OR UPDATE OF drift_score_shared ON public.circle_checkins
FOR EACH ROW EXECUTE FUNCTION public.check_imprint_score_sharing();
