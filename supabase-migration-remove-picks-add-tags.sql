-- Add Tags to Interest Cards
-- This migration enhances interest cards with tags to show specific things within each interest

-- Add tags column to interest_cards
ALTER TABLE interest_cards
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Update the comment
COMMENT ON COLUMN interest_cards.tags IS 'Specific things the user likes within this interest (e.g., for Tech: Claude, Gemini, AI)';
