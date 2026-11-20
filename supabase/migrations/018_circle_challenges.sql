CREATE TABLE public.circle_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.human_circles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (length(title) BETWEEN 2 AND 100),
  instructions text NOT NULL CHECK (length(instructions) BETWEEN 5 AND 3000),
  criteria text NOT NULL CHECK (length(criteria) BETWEEN 5 AND 1500),
  response_mode text NOT NULL CHECK (response_mode IN ('text','code','image','audio')),
  due_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX circle_challenges_by_circle ON public.circle_challenges(circle_id, created_at DESC);
CREATE TABLE public.circle_challenge_responses (
  challenge_id uuid REFERENCES public.circle_challenges(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  response text CHECK (length(response) <= 12000),
  forge_entry_id uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id,user_id)
);
ALTER TABLE public.circle_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_challenge_responses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.circle_challenges, public.circle_challenge_responses FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.circle_challenges, public.circle_challenge_responses TO authenticated;
CREATE POLICY circle_challenges_read ON public.circle_challenges FOR SELECT TO authenticated USING (public.is_circle_member(circle_id));
CREATE POLICY circle_responses_read_own ON public.circle_challenge_responses FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.circle_challenges c WHERE c.id = challenge_id));

CREATE FUNCTION public.assign_circle_challenge(p_circle uuid, p_title text, p_instructions text, p_criteria text, p_mode text, p_due date)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE assignment uuid;
BEGIN
  IF NOT coalesce(public.is_circle_admin(p_circle),false) THEN RAISE EXCEPTION 'Only circle admins can assign a challenge' USING ERRCODE = '42501'; END IF;
  IF p_due IS NULL OR p_due < (statement_timestamp() AT TIME ZONE 'UTC')::date THEN
    RAISE EXCEPTION 'Choose today or a future UTC due date' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.circle_challenges(circle_id,assigned_by,title,instructions,criteria,response_mode,due_date)
  VALUES (p_circle, auth.uid(), btrim(p_title), btrim(p_instructions), btrim(p_criteria), p_mode, p_due) RETURNING id INTO assignment;
  RETURN assignment;
END; $$;

CREATE FUNCTION public.complete_circle_challenge(p_challenge uuid, p_response text, p_forge_entry uuid) RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE viewer uuid := auth.uid(); challenge public.circle_challenges; saved timestamptz; attachment text;
BEGIN
  SELECT * INTO challenge FROM public.circle_challenges WHERE id = p_challenge;
  IF NOT FOUND OR NOT coalesce(public.is_circle_member(challenge.circle_id),false) THEN
    RAISE EXCEPTION 'This challenge is unavailable' USING ERRCODE = '42501';
  END IF;
  SELECT completed_at INTO saved FROM public.circle_challenge_responses WHERE challenge_id = p_challenge AND user_id = viewer;
  IF FOUND THEN RETURN saved; END IF;
  IF challenge.due_date < (statement_timestamp() AT TIME ZONE 'UTC')::date THEN
    RAISE EXCEPTION 'The submission deadline has passed' USING ERRCODE = 'P0001';
  END IF;
  IF challenge.response_mode IN ('text','code') THEN
    IF nullif(btrim(p_response),'') IS NULL OR length(p_response) > 12000 OR p_forge_entry IS NOT NULL THEN
      RAISE EXCEPTION 'Enter a response of up to 12,000 characters' USING ERRCODE = '22023';
    END IF;
  ELSE
    SELECT response_file_url INTO attachment FROM public.journal_entries
    WHERE id = p_forge_entry AND user_id = viewer AND is_forge_entry IS TRUE
      AND (CASE WHEN challenge.response_mode = 'audio' THEN item_type = 'voice' ELSE item_type IN ('sketch','handwriting','photo') END);
    IF p_response IS NOT NULL OR attachment IS NULL OR split_part(attachment,'/',1) <> viewer::text OR NOT EXISTS (
      SELECT 1 FROM storage.objects WHERE name = attachment
        AND bucket_id = CASE WHEN challenge.response_mode = 'audio' THEN 'forge-audio' ELSE 'forge-files' END
    ) THEN
      RAISE EXCEPTION 'Choose one of your saved Forge attachments in the requested format' USING ERRCODE = '22023';
    END IF;
  END IF;
  INSERT INTO public.circle_challenge_responses(challenge_id,user_id,response,forge_entry_id)
  VALUES(p_challenge,viewer,p_response,p_forge_entry) ON CONFLICT DO NOTHING;
  SELECT completed_at INTO saved FROM public.circle_challenge_responses WHERE challenge_id = p_challenge AND user_id = viewer;
  RETURN saved;
END; $$;

CREATE FUNCTION public.circle_challenge_progress(p_circle uuid)
RETURNS TABLE(challenge_id uuid, completed integer, members integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT c.id, count(r.user_id)::integer, count(m.user_id)::integer FROM public.circle_challenges c
  LEFT JOIN public.circle_members m ON m.circle_id = c.circle_id
  LEFT JOIN public.circle_challenge_responses r ON r.challenge_id = c.id AND r.user_id = m.user_id
  WHERE c.circle_id = p_circle AND public.is_circle_admin(p_circle) GROUP BY c.id;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_circle_challenge(uuid,text,text,text,text,date), public.complete_circle_challenge(uuid,text,uuid), public.circle_challenge_progress(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_circle_challenge(uuid,text,text,text,text,date), public.complete_circle_challenge(uuid,text,uuid), public.circle_challenge_progress(uuid) TO authenticated;
