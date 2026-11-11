-- Keep the existing primary photo column for compatibility with existing clients.
CREATE TABLE pet_photos (
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  position SMALLINT NOT NULL CHECK (position BETWEEN 0 AND 4),
  PRIMARY KEY (pet_id, position),
  UNIQUE (pet_id, media_id)
);

INSERT INTO pet_photos (pet_id, media_id, position)
SELECT id, photo_media_id, 0 FROM pets WHERE photo_media_id IS NOT NULL;
