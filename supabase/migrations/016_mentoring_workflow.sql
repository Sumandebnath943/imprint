CREATE TABLE public.mentor_applications (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  profession text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_note text,
  PRIMARY KEY (user_id, profession)
);
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mentor_applications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.mentor_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_applications TO service_role;
CREATE POLICY mentor_application_read_own ON public.mentor_applications FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Keep legacy settings and history. A listing first needs a review and a new opt-in.
UPDATE public.profiles SET accepting_mentees = false WHERE accepting_mentees;
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY mentee_id ORDER BY started_at NULLS LAST, id) AS position
  FROM public.mentorships WHERE status = 'active' AND mentee_id IS NOT NULL AND mentor_id IS NOT NULL AND mentee_id <> mentor_id
)
UPDATE public.mentorships m SET status = 'ended' FROM ranked r WHERE m.id = r.id AND r.position > 1;
UPDATE public.mentorships SET status = 'ended' WHERE status = 'active' AND
  (mentor_id IS NULL OR mentee_id IS NULL OR mentor_id = mentee_id);
UPDATE public.mentorship_requests r SET status = 'declined' WHERE status = 'pending' AND (
  requester_id IS NULL OR mentor_id IS NULL OR requester_id = mentor_id OR
  EXISTS (SELECT 1 FROM public.mentorships m WHERE m.mentee_id = r.requester_id AND m.status = 'active')
);
CREATE UNIQUE INDEX mentorships_one_active_mentor ON public.mentorships(mentee_id) WHERE status = 'active';
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.mentorships, public.mentorship_requests FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.guard_mentor_profile() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.onboarding_completed IS TRUE OR NEW.accepting_mentees IS TRUE OR NEW.mentor_bio IS NOT NULL
       OR NEW.mentoring_style IS NOT NULL OR NEW.max_mentees IS DISTINCT FROM 2 THEN
      RAISE EXCEPTION 'Use the onboarding or mentoring workflow' USING ERRCODE = '42501';
    END IF;
  ELSIF ROW(NEW.onboarding_completed, NEW.accepting_mentees, NEW.mentor_bio, NEW.mentoring_style, NEW.max_mentees)
      IS DISTINCT FROM ROW(OLD.onboarding_completed, OLD.accepting_mentees, OLD.mentor_bio, OLD.mentoring_style, OLD.max_mentees) THEN
    RAISE EXCEPTION 'Use the onboarding or mentoring workflow' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER guard_mentor_profile BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_mentor_profile();

-- Limit the existing anonymous projection to credential and leaderboard opt-ins.
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT p.id, p.full_name, p.username, p.avatar_url, p.bio, p.location, p.profession, p.profession_cluster,
       p.imprint_score, p.credential_code, p.credential_public, p.leaderboard_opt_in,
       false AS accepting_mentees, NULL::integer AS max_mentees, NULL::text AS mentor_bio,
       NULL::text[] AS mentoring_style, p.created_at,
       d.score AS latest_drift_score, d.score_label AS latest_drift_label
FROM public.profiles p
LEFT JOIN LATERAL (SELECT score, score_label FROM public.drift_scores WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1) d ON true
WHERE p.credential_public IS TRUE OR p.leaderboard_opt_in IS TRUE;

CREATE VIEW public.mentor_approved_profiles AS
SELECT p.id, p.full_name, p.profession, p.mentor_bio, p.mentoring_style, p.accepting_mentees,
       greatest(coalesce(p.max_mentees, 2) - (SELECT count(*)::integer FROM public.mentorships m
         WHERE m.mentor_id = p.id AND m.status = 'active'), 0) AS remaining_capacity
FROM public.profiles p JOIN public.mentor_applications a ON a.user_id = p.id AND a.profession = p.profession
WHERE p.onboarding_completed IS TRUE AND a.status = 'approved';
CREATE VIEW public.mentor_open_profiles AS
SELECT id, full_name, profession, mentor_bio, mentoring_style, remaining_capacity
FROM public.mentor_approved_profiles WHERE accepting_mentees IS TRUE AND remaining_capacity > 0;
REVOKE ALL ON public.mentor_approved_profiles, public.mentor_open_profiles FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.mentor_directory() RETURNS SETOF public.mentor_open_profiles
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT * FROM public.mentor_open_profiles WHERE id <> (SELECT auth.uid()) ORDER BY full_name, id LIMIT 100;
$$;

CREATE FUNCTION public.apply_to_mentor(p_bio text, p_style text[], p_capacity integer) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  person public.profiles;
  next_status text;
BEGIN
  SELECT * INTO person FROM public.profiles WHERE id = auth.uid() FOR NO KEY UPDATE;
  IF NOT FOUND OR person.onboarding_completed IS NOT TRUE OR nullif(btrim(person.profession), '') IS NULL THEN
    RAISE EXCEPTION 'Complete onboarding and choose a profession before applying' USING ERRCODE = '42501';
  END IF;
  IF length(btrim(coalesce(p_bio, ''))) NOT BETWEEN 12 AND 1000 OR p_capacity IS NULL OR p_capacity NOT BETWEEN 1 AND 10
     OR coalesce(cardinality(p_style), 0) > 6 OR EXISTS (SELECT 1 FROM unnest(p_style) style WHERE length(style) > 40) THEN
    RAISE EXCEPTION 'Enter a bio and choose a capacity from 1 to 10' USING ERRCODE = '22023';
  END IF;
  IF p_capacity < (SELECT count(*) FROM public.mentorships WHERE mentor_id = person.id AND status = 'active') THEN
    RAISE EXCEPTION 'Capacity cannot be lower than your active mentee count' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.mentor_applications AS a (user_id, profession) VALUES (person.id, person.profession)
  ON CONFLICT (user_id, profession) DO UPDATE SET
    status = CASE WHEN a.status = 'declined' THEN 'pending' ELSE a.status END,
    submitted_at = CASE WHEN a.status = 'declined' THEN now() ELSE a.submitted_at END,
    reviewer_id = CASE WHEN a.status = 'declined' THEN NULL ELSE a.reviewer_id END,
    reviewed_at = CASE WHEN a.status = 'declined' THEN NULL ELSE a.reviewed_at END,
    review_note = CASE WHEN a.status = 'declined' THEN NULL ELSE a.review_note END
  RETURNING status INTO next_status;
  UPDATE public.profiles SET mentor_bio = btrim(p_bio), mentoring_style = coalesce(p_style, '{}'), max_mentees = p_capacity,
    accepting_mentees = next_status = 'approved' AND person.accepting_mentees IS TRUE WHERE id = person.id;
  RETURN next_status;
END; $$;

CREATE FUNCTION public.review_mentor_application(p_reviewer uuid, p_user uuid, p_profession text, p_approved boolean, p_note text)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  decision text := CASE WHEN p_approved THEN 'approved' ELSE 'declined' END;
  previous text;
BEGIN
  IF p_reviewer IS NULL OR p_reviewer = p_user OR p_approved IS NULL OR length(btrim(coalesce(p_note, ''))) NOT BETWEEN 12 AND 1000 THEN
    RAISE EXCEPTION 'A separate reviewer must record a reason' USING ERRCODE = '22023';
  END IF;
  PERFORM 1 FROM public.profiles WHERE id = p_user AND profession = p_profession AND onboarding_completed IS TRUE FOR NO KEY UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'The applicant no longer has this profession' USING ERRCODE = 'P0001'; END IF;
  SELECT status INTO previous FROM public.mentor_applications WHERE user_id = p_user AND profession = p_profession FOR UPDATE;
  IF previous = decision THEN RETURN previous; END IF;
  IF previous IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'This application is no longer pending' USING ERRCODE = 'P0001'; END IF;
  UPDATE public.mentor_applications SET status = decision, reviewer_id = p_reviewer, reviewed_at = statement_timestamp(), review_note = btrim(p_note)
  WHERE user_id = p_user AND profession = p_profession;
  UPDATE public.profiles SET accepting_mentees = false WHERE id = p_user;
  RETURN decision;
END; $$;

CREATE FUNCTION public.set_mentor_availability(p_open boolean) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE viewer uuid := auth.uid();
BEGIN
  PERFORM 1 FROM public.profiles WHERE id = viewer FOR NO KEY UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sign in to manage mentoring' USING ERRCODE = '42501'; END IF;
  IF p_open IS NULL OR (p_open AND NOT EXISTS (SELECT 1 FROM public.mentor_approved_profiles WHERE id = viewer)) THEN
    RAISE EXCEPTION 'Your current profession needs reviewer approval' USING ERRCODE = '42501';
  END IF;
  UPDATE public.profiles SET accepting_mentees = p_open WHERE id = viewer;
  RETURN p_open;
END; $$;

CREATE FUNCTION public.request_mentorship(p_mentor uuid, p_message text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE applicant uuid := auth.uid(); request public.mentorship_requests;
BEGIN
  IF applicant IS NULL OR p_mentor IS NULL OR applicant = p_mentor OR length(p_message) > 1000 THEN
    RAISE EXCEPTION 'Choose another mentor and use no more than 1000 characters' USING ERRCODE = '22023';
  END IF;
  PERFORM 1 FROM public.profiles WHERE id IN (applicant, p_mentor) ORDER BY id FOR NO KEY UPDATE;
  SELECT * INTO request FROM public.mentorship_requests WHERE requester_id = applicant AND mentor_id = p_mentor;
  IF FOUND THEN RETURN to_jsonb(request); END IF;
  IF EXISTS (SELECT 1 FROM public.mentorships WHERE mentee_id = applicant AND status = 'active') THEN
    RAISE EXCEPTION 'You already have an active mentor' USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.mentor_open_profiles WHERE id = p_mentor) THEN
    RAISE EXCEPTION 'This mentor has no open places right now' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.mentorship_requests (requester_id, mentor_id, message)
  VALUES (applicant, p_mentor, nullif(btrim(p_message), '')) RETURNING * INTO request;
  RETURN to_jsonb(request);
END; $$;

CREATE FUNCTION public.decide_mentorship_request(p_request uuid, p_accept boolean) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE mentor uuid := auth.uid(); request public.mentorship_requests;
        decision text := CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END;
BEGIN
  SELECT * INTO request FROM public.mentorship_requests WHERE id = p_request AND mentor_id = mentor;
  IF NOT FOUND OR p_accept IS NULL THEN RAISE EXCEPTION 'Request is unavailable' USING ERRCODE = '42501'; END IF;
  PERFORM 1 FROM public.profiles WHERE id IN (mentor, request.requester_id) ORDER BY id FOR NO KEY UPDATE;
  SELECT * INTO request FROM public.mentorship_requests WHERE id = p_request AND mentor_id = mentor FOR UPDATE;
  IF request.status = decision THEN RETURN decision; END IF;
  IF request.status IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'This request already has a decision' USING ERRCODE = 'P0001'; END IF;
  IF p_accept THEN
    IF NOT EXISTS (SELECT 1 FROM public.mentor_open_profiles WHERE id = mentor) THEN
      RAISE EXCEPTION 'Open mentoring and free a place before accepting' USING ERRCODE = 'P0001';
    END IF;
    IF EXISTS (SELECT 1 FROM public.mentorships WHERE mentee_id = request.requester_id AND status = 'active') THEN
      RAISE EXCEPTION 'This person already has an active mentor' USING ERRCODE = 'P0001';
    END IF;
    IF EXISTS (SELECT 1 FROM public.mentorships WHERE mentor_id = mentor AND mentee_id = request.requester_id) THEN
      RAISE EXCEPTION 'This pair has a previous mentorship that must be reviewed' USING ERRCODE = 'P0001';
    END IF;
    INSERT INTO public.mentorships (mentor_id, mentee_id) VALUES (mentor, request.requester_id);
    UPDATE public.mentorship_requests SET status = 'declined'
    WHERE requester_id = request.requester_id AND id <> p_request AND status = 'pending';
  END IF;
  UPDATE public.mentorship_requests SET status = decision WHERE id = p_request;
  RETURN decision;
END; $$;

CREATE FUNCTION public.check_in_with_mentor(p_pair uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE pair public.mentorships;
        instant timestamptz;
        today date;
        previous date;
        duplicate boolean;
BEGIN
  SELECT * INTO pair FROM public.mentorships WHERE id = p_pair AND status = 'active'
    AND auth.uid() IN (mentor_id, mentee_id) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active mentorship is unavailable' USING ERRCODE = '42501'; END IF;
  instant := clock_timestamp();
  today := (instant AT TIME ZONE 'UTC')::date;
  previous := (pair.last_checkin AT TIME ZONE 'UTC')::date;
  duplicate := coalesce(previous >= today, false);
  IF NOT duplicate THEN
    UPDATE public.mentorships SET last_checkin = instant,
      check_in_streak = CASE WHEN previous = today - 1 THEN coalesce(pair.check_in_streak, 0) + 1 ELSE 1 END
      WHERE id = p_pair RETURNING * INTO pair;
  END IF;
  RETURN jsonb_build_object('alreadyCheckedIn', duplicate, 'check_in_streak', coalesce(pair.check_in_streak, 0), 'last_checkin', pair.last_checkin);
END; $$;

CREATE FUNCTION public.my_mentor_activity() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'pairs', coalesce((SELECT jsonb_agg(jsonb_build_object('id', m.id, 'role',
      CASE WHEN m.mentor_id = auth.uid() THEN 'mentor' ELSE 'mentee' END,
      'name', p.full_name, 'profession', p.profession, 'check_in_streak', m.check_in_streak, 'last_checkin', m.last_checkin)
      ORDER BY m.started_at DESC, m.id)
      FROM public.mentorships m JOIN public.profiles p ON p.id = CASE WHEN m.mentor_id = auth.uid() THEN m.mentee_id ELSE m.mentor_id END
      WHERE m.status = 'active' AND auth.uid() IN (m.mentor_id, m.mentee_id)), '[]'::jsonb),
    'requests', coalesce((SELECT jsonb_agg(jsonb_build_object('id', r.id, 'direction',
      CASE WHEN r.mentor_id = auth.uid() THEN 'inbox' ELSE 'outgoing' END,
      'name', p.full_name, 'message', r.message, 'status', r.status, 'counterpart_id', p.id) ORDER BY r.created_at DESC, r.id)
      FROM public.mentorship_requests r JOIN public.profiles p ON p.id = CASE WHEN r.mentor_id = auth.uid() THEN r.requester_id ELSE r.mentor_id END
      WHERE auth.uid() IN (r.mentor_id, r.requester_id)), '[]'::jsonb),
    'eligible', EXISTS (SELECT 1 FROM public.mentor_approved_profiles WHERE id = auth.uid()),
    'remaining_capacity', coalesce((SELECT remaining_capacity FROM public.mentor_approved_profiles WHERE id = auth.uid()), 0)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.review_mentor_application(uuid, uuid, text, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_mentor_application(uuid, uuid, text, boolean, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.mentor_directory(), public.apply_to_mentor(text, text[], integer),
  public.set_mentor_availability(boolean), public.request_mentorship(uuid, text), public.decide_mentorship_request(uuid, boolean),
  public.check_in_with_mentor(uuid), public.my_mentor_activity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mentor_directory(), public.apply_to_mentor(text, text[], integer),
  public.set_mentor_availability(boolean), public.request_mentorship(uuid, text), public.decide_mentorship_request(uuid, boolean),
  public.check_in_with_mentor(uuid), public.my_mentor_activity() TO authenticated;
