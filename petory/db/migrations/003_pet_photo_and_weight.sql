ALTER TABLE pets ADD COLUMN weight_kg NUMERIC(5,2) CHECK (weight_kg > 0 AND weight_kg <= 500);

-- Mirrors accounts.avatar_media_id: one primary photo per pet, which is what the
-- pet profile renders. The older pet_media gallery table is still unused.
ALTER TABLE pets ADD COLUMN photo_media_id UUID REFERENCES media_files(id) ON DELETE SET NULL;
