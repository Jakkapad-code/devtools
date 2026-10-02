-- Persist request counters across app processes; never store raw email/IP keys.
CREATE TABLE rate_limit_counters (
  scope TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempts INTEGER NOT NULL DEFAULT 1 CHECK (attempts > 0),
  PRIMARY KEY (scope, key_hash)
);
CREATE INDEX rate_limit_counters_window_idx ON rate_limit_counters(window_started_at);
