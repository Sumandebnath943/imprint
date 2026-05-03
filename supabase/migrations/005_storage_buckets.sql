-- ─── 005 STORAGE BUCKETS & POLICIES ─────────────────────────────

-- Create required buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('forge-audio', 'forge-audio', false),
  ('forge-files', 'forge-files', false),
  ('baseline-audio', 'baseline-audio', false),
  ('baseline-files', 'baseline-files', false),
  ('gallery', 'gallery', false),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ─── AVATARS (Public Read, Private Write) ───────────────────────
-- Anyone can read avatars
CREATE POLICY "Avatar Public Read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Users can only upload/update avatars in their own folder (folder name = user_id)
CREATE POLICY "Avatar User Insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );
  
CREATE POLICY "Avatar User Update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Avatar User Delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- ─── PRIVATE BUCKETS (forge-audio, forge-files, baseline-audio, baseline-files, gallery)
-- Users can completely manage their own files (path must start with user_id)

-- 1. forge-audio
CREATE POLICY "Forge Audio User All" ON storage.objects
  FOR ALL USING (
    bucket_id = 'forge-audio' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  ) WITH CHECK (
    bucket_id = 'forge-audio' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- 2. forge-files
CREATE POLICY "Forge Files User All" ON storage.objects
  FOR ALL USING (
    bucket_id = 'forge-files' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  ) WITH CHECK (
    bucket_id = 'forge-files' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- 3. baseline-audio
CREATE POLICY "Baseline Audio User All" ON storage.objects
  FOR ALL USING (
    bucket_id = 'baseline-audio' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  ) WITH CHECK (
    bucket_id = 'baseline-audio' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- 4. baseline-files
CREATE POLICY "Baseline Files User All" ON storage.objects
  FOR ALL USING (
    bucket_id = 'baseline-files' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  ) WITH CHECK (
    bucket_id = 'baseline-files' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- 5. gallery
CREATE POLICY "Gallery User All" ON storage.objects
  FOR ALL USING (
    bucket_id = 'gallery' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  ) WITH CHECK (
    bucket_id = 'gallery' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );
