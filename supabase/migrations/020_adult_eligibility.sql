ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_age_group_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_age_group_check CHECK (
  age_group IN ('child_8_12','teen_13_15','teen_16_18','adult_18_64','adult_19_64','senior_65_plus')
);

-- Copy an explicit email-signup declaration to server-owned app metadata once.
-- Later edits to user metadata give no access, and other sign-in providers go through the app gate.
CREATE FUNCTION public.imprint_record_signup_age_confirmation()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.raw_app_meta_data->>'provider' = 'email'
     AND NEW.raw_user_meta_data->'imprint_adult_confirmed' = 'true'::jsonb THEN
    NEW.raw_app_meta_data := NEW.raw_app_meta_data || '{"imprint_adult_confirmed": true}'::jsonb;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.imprint_record_signup_age_confirmation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER imprint_record_signup_age_confirmation
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.imprint_record_signup_age_confirmation();
