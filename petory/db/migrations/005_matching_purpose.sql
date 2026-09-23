-- What an account is matching for. Candidates are only shown between accounts
-- that want the same thing, so a playmate search never surfaces a mate search.
ALTER TABLE accounts
  ADD COLUMN matching_purpose TEXT NOT NULL DEFAULT 'playmate'
  CHECK (matching_purpose IN ('playmate', 'mate'));
