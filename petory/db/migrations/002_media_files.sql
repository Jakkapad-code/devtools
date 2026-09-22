CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  bytes BYTEA NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 2097152),
  sha256 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX media_files_owner_idx ON media_files(owner_id) WHERE deleted_at IS NULL;

ALTER TABLE accounts ADD COLUMN avatar_media_id UUID REFERENCES media_files(id) ON DELETE SET NULL;
ALTER TABLE pet_media ADD COLUMN media_id UUID REFERENCES media_files(id) ON DELETE SET NULL;
ALTER TABLE post_media ADD COLUMN media_id UUID REFERENCES media_files(id) ON DELETE SET NULL;
