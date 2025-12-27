-- Migration: Add pick history tracking
-- This allows users to see how their favorite picks change over time

-- Add new columns
ALTER TABLE picks ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT false;
ALTER TABLE picks ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Mark all existing picks as current
UPDATE picks SET is_current = true WHERE is_current IS NULL OR is_current = false;

-- Make is_current non-nullable
ALTER TABLE picks ALTER COLUMN is_current SET NOT NULL;

-- Drop old unique constraint (only allows 1 pick per category total)
ALTER TABLE picks DROP CONSTRAINT IF EXISTS picks_user_id_category_key;

-- Create new partial unique index (allows only 1 CURRENT pick per category)
-- This allows multiple archived picks for the same category
CREATE UNIQUE INDEX IF NOT EXISTS idx_picks_current_unique
  ON picks(user_id, category)
  WHERE is_current = true;

-- Add index for querying history (archived picks)
CREATE INDEX IF NOT EXISTS idx_picks_history
  ON picks(user_id, category, created_at DESC)
  WHERE is_current = false;

-- Add index for fast current pick lookups
CREATE INDEX IF NOT EXISTS idx_picks_current
  ON picks(user_id, category)
  WHERE is_current = true;

-- Create function to auto-set archived_at timestamp when a pick is archived
CREATE OR REPLACE FUNCTION set_archived_at()
RETURNS TRIGGER AS $$
BEGIN
  -- When a pick is changed from current to archived, set the archived_at timestamp
  IF NEW.is_current = false AND OLD.is_current = true THEN
    NEW.archived_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set archived_at
DROP TRIGGER IF EXISTS picks_archive_timestamp ON picks;
CREATE TRIGGER picks_archive_timestamp
  BEFORE UPDATE ON picks
  FOR EACH ROW
  EXECUTE FUNCTION set_archived_at();
