-- Migration: Add Connect (Weekly Family Questions) feature
-- Description: Create tables for weekly rotating questions and family answers

-- 1. Create weekly_questions table
CREATE TABLE IF NOT EXISTS weekly_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  week_start_date date NOT NULL,
  week_number integer NOT NULL,
  assigned_user_id uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  is_preset boolean DEFAULT false,
  is_current boolean DEFAULT true,
  archived_at timestamptz,
  created_at timestamptz DEFAULT now(),

  UNIQUE(family_id, week_number)
);

-- 2. Create question_answers table
CREATE TABLE IF NOT EXISTS question_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES weekly_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  is_current boolean DEFAULT true,
  archived_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Partial unique index - only one current answer per user per question
CREATE UNIQUE INDEX IF NOT EXISTS idx_question_answers_current_unique
  ON question_answers(question_id, user_id)
  WHERE is_current = true;

-- Index for querying answer history
CREATE INDEX IF NOT EXISTS idx_question_answers_history
  ON question_answers(question_id, user_id, created_at DESC)
  WHERE is_current = false;

-- Index for fast current answer lookups
CREATE INDEX IF NOT EXISTS idx_question_answers_current
  ON question_answers(question_id, user_id)
  WHERE is_current = true;

-- 3. Create preset_questions table
CREATE TABLE IF NOT EXISTS preset_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL UNIQUE,
  category text,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies for weekly_questions
ALTER TABLE weekly_questions ENABLE ROW LEVEL SECURITY;

-- Users can view questions from their family
CREATE POLICY "Users can view family questions"
  ON weekly_questions FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can create questions for their family
CREATE POLICY "Users can create questions for family"
  ON weekly_questions FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update questions in their family
CREATE POLICY "Users can update family questions"
  ON weekly_questions FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for question_answers
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;

-- Users can view answers from their family
CREATE POLICY "Users can view family answers"
  ON question_answers FOR SELECT
  USING (
    question_id IN (
      SELECT id FROM weekly_questions
      WHERE family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Users can create their own answers
CREATE POLICY "Users can create own answers"
  ON question_answers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own answers
CREATE POLICY "Users can update own answers"
  ON question_answers FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for preset_questions
ALTER TABLE preset_questions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view preset questions
CREATE POLICY "Authenticated users can view preset questions"
  ON preset_questions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_questions_family ON weekly_questions(family_id);
CREATE INDEX IF NOT EXISTS idx_weekly_questions_current ON weekly_questions(family_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_weekly_questions_week ON weekly_questions(week_number DESC);
CREATE INDEX IF NOT EXISTS idx_question_answers_question ON question_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_user ON question_answers(user_id);

-- Function to auto-set archived_at when an answer is replaced
CREATE OR REPLACE FUNCTION set_answer_archived_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = false AND OLD.is_current = true THEN
    NEW.archived_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set archived_at for answers
DROP TRIGGER IF EXISTS answer_archive_timestamp ON question_answers;
CREATE TRIGGER answer_archive_timestamp
  BEFORE UPDATE ON question_answers
  FOR EACH ROW
  EXECUTE FUNCTION set_answer_archived_at();

-- Seed initial preset questions
INSERT INTO preset_questions (question_text, category) VALUES
  ('What made you smile this week?', 'reflection'),
  ('What is one thing you are grateful for today?', 'gratitude'),
  ('What is a goal you want to achieve this month?', 'goal-setting'),
  ('Share a favorite memory from your childhood.', 'fun'),
  ('What is something new you learned recently?', 'reflection'),
  ('Who is someone you admire and why?', 'reflection'),
  ('What is your favorite way to spend a weekend?', 'fun'),
  ('What is a challenge you overcame this year?', 'reflection'),
  ('If you could travel anywhere, where would you go?', 'fun'),
  ('What is a book or movie that impacted you?', 'reflection'),
  ('What is your favorite family tradition?', 'fun'),
  ('What is one thing you want to learn or try?', 'goal-setting'),
  ('Share something kind someone did for you.', 'gratitude'),
  ('What does a perfect day look like for you?', 'fun'),
  ('What is a lesson you want to pass on?', 'reflection'),
  ('What are you most proud of this year?', 'reflection'),
  ('What is your favorite way to relax?', 'fun'),
  ('Who has influenced your life the most?', 'reflection'),
  ('What is something that makes you feel alive?', 'reflection'),
  ('What is a simple pleasure you enjoy?', 'gratitude'),
  ('What is your favorite season and why?', 'fun'),
  ('What is one thing you wish you had more time for?', 'reflection'),
  ('Share a piece of advice that changed your life.', 'reflection'),
  ('What is something you are looking forward to?', 'goal-setting'),
  ('What does home mean to you?', 'reflection')
ON CONFLICT (question_text) DO NOTHING;
