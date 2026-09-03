-- ============================================================
-- IMPRINT — 008 JOURNAL GALLERY COLUMNS
-- ============================================================
-- Adds three columns to journal_entries that 001 declares but the live
-- database never got: item_type, source, response_file_url.
--
-- How they went missing: 001_initial_schema.sql lists all three in its
-- CREATE TABLE, but that table already existed by the time they were added
-- to the file, and CREATE TABLE IF NOT EXISTS does not alter an existing
-- table. Every deployment created before that edit is missing them.
--
-- Why it matters now: the gallery stores what kind of item each entry is in
-- these columns. Without them the Forge save route and the gallery upload
-- both fail on insert, and the gallery falls back to parsing the file path
-- out of the entry body and guessing the type from its extension — which is
-- what it used to do, and why a .png sketch came back labelled "Photo".
--
-- Safe to re-run.
-- ============================================================

ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS item_type         TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS source            TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS response_file_url TEXT;

-- Constrain item_type to the values the gallery renders. Added separately so
-- the column can exist on rows written before the constraint.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'journal_entries_item_type_check'
  ) THEN
    ALTER TABLE journal_entries
      ADD CONSTRAINT journal_entries_item_type_check
      CHECK (item_type IS NULL OR item_type IN
        ('sketch','handwriting','photo','voice','document'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'journal_entries_source_check'
  ) THEN
    ALTER TABLE journal_entries
      ADD CONSTRAINT journal_entries_source_check
      CHECK (source IS NULL OR source IN ('forge','direct_upload'));
  END IF;
END $$;

-- ─── Backfill existing rows ──────────────────────────────────
-- Entries written before this migration carry their file path inside the
-- body as "[Attached File: <path>]". Lift it into the column so the gallery
-- stops having to regex it back out, and derive the type from the extension
-- the same way the fallback does.

UPDATE journal_entries
SET response_file_url = substring(content from '\[Attached File: ([^\]]+)\]')
WHERE response_file_url IS NULL
  AND content ~ '\[Attached File: [^\]]+\]';

UPDATE journal_entries
SET item_type = CASE
      WHEN lower(response_file_url) ~ '\.(webm|mp3|m4a|wav|ogg|aac|flac)$' THEN 'voice'
      WHEN lower(response_file_url) ~ '\.(png|jpg|jpeg|gif|webp|avif|heic|svg)$' THEN 'photo'
      ELSE 'document'
    END
WHERE item_type IS NULL
  AND response_file_url IS NOT NULL;

UPDATE journal_entries
SET source = CASE WHEN is_forge_entry THEN 'forge' ELSE 'direct_upload' END
WHERE source IS NULL
  AND response_file_url IS NOT NULL;

-- Gallery reads are "this user's entries that have a file", newest first.
CREATE INDEX IF NOT EXISTS idx_journal_entries_gallery
  ON journal_entries(user_id, created_at DESC)
  WHERE response_file_url IS NOT NULL;
