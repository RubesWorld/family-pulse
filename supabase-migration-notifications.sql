-- Migration: Add notification system
-- Description: Create tables for notification preferences and push subscriptions

-- 1. Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Tier 1: Critical (always on, but we store the setting)
  notify_your_turn boolean DEFAULT true,
  notify_pending_reminder boolean DEFAULT true,

  -- Tier 2: Engagement
  notify_last_to_answer boolean DEFAULT true,
  notify_weekly_digest boolean DEFAULT false,

  -- Tier 3: Nice-to-have (default off)
  notify_activities boolean DEFAULT false,
  notify_answers boolean DEFAULT false,
  notify_picks boolean DEFAULT false,

  -- Quiet hours
  quiet_hours_start time DEFAULT '21:00:00',
  quiet_hours_end time DEFAULT '09:00:00',
  quiet_hours_enabled boolean DEFAULT true,

  -- Notification method preferences
  push_enabled boolean DEFAULT false,
  email_enabled boolean DEFAULT false,
  sms_enabled boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id)
);

-- 2. Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Web Push subscription data
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,

  -- Device/browser info
  user_agent text,

  -- Status
  is_active boolean DEFAULT true,
  last_used_at timestamptz DEFAULT now(),

  created_at timestamptz DEFAULT now(),

  UNIQUE(user_id, endpoint)
);

-- 3. Create notification_log table (for tracking what we sent)
CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  notification_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,

  -- What triggered it
  related_question_id uuid REFERENCES weekly_questions(id) ON DELETE SET NULL,
  related_activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,

  -- Delivery
  delivery_method text NOT NULL, -- 'push', 'email', 'sms'
  delivered_at timestamptz DEFAULT now(),
  clicked_at timestamptz,

  created_at timestamptz DEFAULT now()
);

-- RLS Policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for notification_log
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification log"
  ON notification_log FOR SELECT
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type, created_at DESC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Create default preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;
