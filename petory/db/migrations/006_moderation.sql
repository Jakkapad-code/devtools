-- Moderation: who may open the admin console, what a suspension is, and the
-- record of what an operator did. Reports already existed; they gain the
-- outcome fields the console writes when a report is closed.

ALTER TABLE accounts
  ADD COLUMN role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin'));

-- A suspension is one open-ended fact on the account rather than a row per
-- punishment: the console only ever asks "is this account suspended right now".
-- suspended_until NULL while suspended_at is set means permanent.
ALTER TABLE accounts
  ADD COLUMN suspended_at TIMESTAMPTZ,
  ADD COLUMN suspended_until TIMESTAMPTZ,
  ADD COLUMN suspension_reason TEXT,
  ADD COLUMN suspended_by UUID REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX accounts_suspended_idx ON accounts(suspended_at) WHERE suspended_at IS NOT NULL;

ALTER TABLE reports
  ADD COLUMN resolution TEXT,
  ADD COLUMN resolved_at TIMESTAMPTZ,
  ADD COLUMN resolved_by UUID REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX reports_status_idx ON reports(status, created_at DESC);
CREATE INDEX reports_target_idx ON reports(target_type, target_id);

-- The console's "การดำเนินการล่าสุด" feed. Kept separate from reports because an
-- action can close several reports at once, and an unsuspend closes none.
CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('suspend', 'unsuspend', 'delete_post', 'dismiss_report')),
  target_type TEXT NOT NULL CHECK (target_type IN ('account', 'post', 'report')),
  target_id UUID,
  detail TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX moderation_actions_recent_idx ON moderation_actions(created_at DESC);
