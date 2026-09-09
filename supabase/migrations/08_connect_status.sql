-- Migration: Add status field to weekly_questions for pending/active states
-- Description: Allows questions to be "pending" (assigned person hasn't chosen yet) or "active" (ready for everyone to answer)

-- Add status column to weekly_questions
ALTER TABLE weekly_questions
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'active'));

-- Add suggested_question_text for pending questions
ALTER TABLE weekly_questions
ADD COLUMN IF NOT EXISTS suggested_question_text text;

-- Update existing questions to be active
UPDATE weekly_questions
SET status = 'active'
WHERE status IS NULL OR status = 'pending';

-- Add index for querying pending questions
CREATE INDEX IF NOT EXISTS idx_weekly_questions_status
  ON weekly_questions(family_id, status, week_number);

-- Update RLS policies to work with status field (no changes needed, but documenting)
-- Users can still view, create, and update questions in their family
-- The status field is just an additional state indicator
