-- Enable realtime on specific tables (not all — saves resources)
-- Only enable on tables that need live updates

-- Orders: vendors see new orders in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Notifications: users see new notifications instantly
-- Note: Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- DO NOT enable realtime on: profiles, payments, audit_logs (sensitive/heavy)
