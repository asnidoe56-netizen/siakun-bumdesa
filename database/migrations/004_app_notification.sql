CREATE TYPE notification_status AS ENUM (
  'UNREAD',
  'READ'
);

CREATE TABLE app_notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
  target_role role_code,
  bum_desa_id UUID REFERENCES bum_desa(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  href TEXT,
  status notification_status NOT NULL DEFAULT 'UNREAD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_app_notification_user_id_status ON app_notification(user_id, status);
CREATE INDEX idx_app_notification_target_role_status ON app_notification(target_role, status);
CREATE INDEX idx_app_notification_created_at ON app_notification(created_at DESC);
