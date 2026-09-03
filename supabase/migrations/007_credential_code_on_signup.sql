-- ============================================================
-- IMPRINT — 007 CREDENTIAL CODE ON SIGNUP
-- ============================================================
-- Fixes: every account created after 004 has credential_code = NULL.
--
-- 004 added the column and backfilled it with a one-time DO block, but
-- handle_new_user() — the trigger that creates the profile row — only ever
-- inserted (id, email, full_name). Nothing has generated a code since.
--
-- Consequences for those users:
--   * The credential page falls back to a placeholder that renders as
--     IMPRINT-XXXXXXXX-XXXXXX, which looks like a broken build.
--   * /credential/[code] matches on credential_code, so a NULL can never be
--     found — every share link 404s regardless of the credential_public
--     toggle.
--
-- Generating in the trigger rather than the app covers every signup path,
-- including Google OAuth, which never touches our route handlers.
--
-- Safe to re-run.
-- ============================================================


-- ─── 1. Code generator ───────────────────────────────────────
-- Loops on the UNIQUE constraint rather than trusting one draw. The random
-- suffix makes a collision very unlikely, but "very unlikely" failing here
-- means a signup 500s, so retry instead.

CREATE OR REPLACE FUNCTION public.generate_credential_code(uid UUID)
RETURNS TEXT AS $$
DECLARE
  candidate TEXT;
BEGIN
  FOR _ IN 1..10 LOOP
    candidate :=
      'IMPRINT-' ||
      UPPER(SUBSTRING(uid::text FROM 1 FOR 8)) || '-' ||
      UPPER(SUBSTR(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 6));

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE credential_code = candidate) THEN
      RETURN candidate;
    END IF;
  END LOOP;

  -- Fall back to something guaranteed unique rather than failing the signup.
  RETURN 'IMPRINT-' || UPPER(REPLACE(uid::text, '-', ''));
END;
$$ LANGUAGE plpgsql;


-- ─── 2. Issue a code to every new profile ────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, credential_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    public.generate_credential_code(NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 3. Backfill everyone missed since 004 ───────────────────

UPDATE public.profiles
SET credential_code = public.generate_credential_code(id)
WHERE credential_code IS NULL;
