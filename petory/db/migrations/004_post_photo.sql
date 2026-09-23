-- Mirrors pets.photo_media_id: one optional photo per post, stored in media_files.
ALTER TABLE posts ADD COLUMN photo_media_id UUID REFERENCES media_files(id) ON DELETE SET NULL;
