DROP POLICY "Circle members can view circles" ON public.human_circles;
CREATE POLICY circle_members_read ON public.human_circles FOR SELECT TO authenticated USING (public.is_circle_member(id));
REVOKE ALL ON public.human_circles, public.circle_members, public.circle_checkins, public.checkin_reactions FROM PUBLIC, anon;
REVOKE INSERT, UPDATE ON public.circle_members FROM authenticated;
REVOKE INSERT ON public.human_circles FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.find_circle_by_invite(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_circle_member(cid uuid, uid uuid DEFAULT auth.uid()) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT uid = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.circle_members WHERE circle_id = cid AND user_id = uid);
$$;
CREATE OR REPLACE FUNCTION public.is_circle_admin(cid uuid, uid uuid DEFAULT auth.uid()) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT uid = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.circle_members WHERE circle_id = cid AND user_id = uid AND role = 'admin');
$$;
CREATE OR REPLACE FUNCTION public.checkin_circle_id(chid uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT circle_id FROM public.circle_checkins WHERE id = chid AND public.is_circle_member(circle_id);
$$;
REVOKE EXECUTE ON FUNCTION public.is_circle_member(uuid,uuid), public.is_circle_admin(uuid,uuid), public.checkin_circle_id(uuid) FROM PUBLIC, anon;

CREATE FUNCTION public.public_circle_directory()
RETURNS TABLE(id uuid, name text, description text, cluster_focus text, member_limit integer, member_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT c.id, c.name, c.description, c.cluster_focus, c.member_limit, count(m.id)::integer
  FROM public.human_circles c LEFT JOIN public.circle_members m ON m.circle_id = c.id
  WHERE auth.uid() IS NOT NULL AND NOT c.is_private AND NOT public.is_circle_member(c.id)
  GROUP BY c.id ORDER BY c.name, c.id LIMIT 100;
$$;

CREATE FUNCTION public.create_human_circle(p_name text, p_description text, p_focus text, p_private boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE owner uuid := auth.uid(); c public.human_circles;
BEGIN
  IF owner IS NULL THEN RAISE EXCEPTION 'Sign in to create a circle' USING ERRCODE = '42501'; END IF;
  IF coalesce(length(btrim(p_name)),0) NOT BETWEEN 2 AND 60 OR coalesce(length(btrim(p_focus)),0) NOT BETWEEN 1 AND 60
     OR length(p_description) > 500 OR p_private IS NULL THEN
    RAISE EXCEPTION 'Check the circle details' USING ERRCODE = '22023';
  END IF;
  LOOP
    INSERT INTO public.human_circles (name,description,cluster_focus,created_by,is_private,invite_code)
    VALUES (btrim(p_name), coalesce(btrim(p_description),''), btrim(p_focus), owner, p_private,
      upper(left(replace(gen_random_uuid()::text, '-', ''), 12)))
    ON CONFLICT (invite_code) DO NOTHING RETURNING * INTO c;
    EXIT WHEN FOUND;
  END LOOP;
  INSERT INTO public.circle_members (circle_id,user_id,role) VALUES (c.id,owner,'admin');
  RETURN jsonb_build_object('id',c.id,'invite_code',c.invite_code);
END; $$;

CREATE FUNCTION public.join_human_circle(p_circle uuid DEFAULT NULL, p_code text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE viewer uuid := auth.uid(); c public.human_circles;
BEGIN
  IF viewer IS NULL THEN RAISE EXCEPTION 'Sign in to join a circle' USING ERRCODE = '42501'; END IF;
  IF (p_circle IS NULL) = (p_code IS NULL) OR length(p_code) > 16 THEN
    RAISE EXCEPTION 'Choose a public circle or enter an invite code' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO c FROM public.human_circles WHERE (id = p_circle AND NOT is_private) OR invite_code = upper(btrim(p_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Circle or invite code unavailable' USING ERRCODE = 'P0002'; END IF;
  IF EXISTS (SELECT 1 FROM public.circle_members WHERE circle_id = c.id AND user_id = viewer) THEN
    RETURN jsonb_build_object('id', c.id, 'already_member', true);
  END IF;
  IF (SELECT count(*) FROM public.circle_members WHERE circle_id = c.id) >= c.member_limit THEN
    RAISE EXCEPTION 'This circle is full' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.circle_members (circle_id,user_id,role) VALUES (c.id,viewer,'member');
  RETURN jsonb_build_object('id', c.id, 'already_member', false);
END; $$;

REVOKE EXECUTE ON FUNCTION public.public_circle_directory(), public.create_human_circle(text,text,text,boolean), public.join_human_circle(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.public_circle_directory(), public.create_human_circle(text,text,text,boolean), public.join_human_circle(uuid,text) TO authenticated;
