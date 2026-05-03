-- ─── 004 IDENTITY & ACCOUNT SCHEMA ─────────────────────────────
-- Additions for Profile, Settings, and Credential pages

-- Profile Details
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- Credential & Sharing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credential_public BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credential_code TEXT UNIQUE;

-- AI Reduction Protocol
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_reduction_protocol_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS protocol_start_date TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS protocol_end_date TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS protocol_level TEXT;

-- Preferences & Settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calibration_frequency TEXT DEFAULT 'biweekly';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS font_size_preference TEXT DEFAULT 'default';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reduce_motion BOOLEAN DEFAULT false;

-- Create function to generate credential code for new users (if not exists)
-- This would typically be done in the app layer upon signup, but we'll ensure existing users have one.

DO $$ 
DECLARE
  profile_rec RECORD;
BEGIN
  FOR profile_rec IN SELECT id FROM profiles WHERE credential_code IS NULL LOOP
    UPDATE profiles 
    SET credential_code = 'IMPRINT-' || UPPER(SUBSTRING(profile_rec.id::text FROM 1 FOR 8)) || '-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6))
    WHERE id = profile_rec.id;
  END LOOP;
END $$;
