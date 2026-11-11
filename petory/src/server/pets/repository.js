import "server-only";
import { getPool, query } from "@/server/db/pool";

const petFields = `
  p.id, p.owner_id AS "ownerId", p.name, p.species, p.breed, p.gender, p.size,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.birth_date))::integer AS age,
  p.weight_kg::float8 AS "weightKg", p.photo_media_id AS "photoMediaId",
  p.bio, p.personality, p.interests, p.created_at AS "createdAt", p.updated_at AS "updatedAt",
  COALESCE((SELECT array_agg(pp.media_id ORDER BY pp.position) FROM pet_photos pp WHERE pp.pet_id = p.id), CASE WHEN p.photo_media_id IS NULL THEN ARRAY[]::uuid[] ELSE ARRAY[p.photo_media_id] END) AS "photoMediaIds"
`;

function birthDateFromAge(age) {
  const year = new Date().getUTCFullYear() - age;
  return `${year}-01-01`;
}

export async function listPetsForOwner(ownerId) {
  const result = await query(
    `SELECT ${petFields}
     FROM pets p
     WHERE p.owner_id = $1 AND p.deleted_at IS NULL
     ORDER BY p.created_at DESC`,
    [ownerId]
  );
  return result.rows;
}

export async function getOwnedPet(ownerId, petId) {
  const result = await query(
    `SELECT ${petFields}
     FROM pets p
     WHERE p.id = $1 AND p.owner_id = $2 AND p.deleted_at IS NULL`,
    [petId, ownerId]
  );
  return result.rows[0] ?? null;
}

/** Any pet a viewer is allowed to look at — their own, or another member's when neither has blocked the other. */
export async function getVisiblePet(viewerId, petId) {
  const result = await query(
    `SELECT ${petFields}, a.display_name AS "ownerName"
     FROM pets p
     JOIN accounts a ON a.id = p.owner_id
     WHERE p.id = $1 AND p.deleted_at IS NULL AND a.deleted_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $2 AND b.blocked_id = p.owner_id) OR (b.blocker_id = p.owner_id AND b.blocked_id = $2))`,
    [petId, viewerId]
  );
  return result.rows[0] ?? null;
}

export async function createPet(ownerId, input) {
  const ids = input.photoMediaIds ?? (input.photoMediaId ? [input.photoMediaId] : []);
  const client = await getPool().connect();
  try {
  await client.query("BEGIN");
  // Media cleanup takes the same owner lock before tombstoning old uploads.
  await client.query("SELECT id FROM accounts WHERE id = $1 FOR UPDATE", [ownerId]);
  const result = await client.query(
    `INSERT INTO pets (owner_id, name, species, breed, gender, size, birth_date, bio, personality, interests, weight_kg, photo_media_id)
     SELECT $1, $2, $3, NULLIF($4, ''), $5, $6, $7, $8, $9, $10, $11, $12
     WHERE (SELECT COUNT(*) FROM media_files m WHERE m.id = ANY($13::uuid[]) AND m.owner_id = $1 AND m.deleted_at IS NULL) = cardinality($13::uuid[])
     RETURNING id`,
    [ownerId, input.name, input.species, input.breed, input.gender, input.size, birthDateFromAge(input.age), input.bio, input.personality, input.interests, input.weightKg, ids[0] ?? null, ids]
  );
  if (!result.rows[0]) { await client.query("ROLLBACK"); return undefined; }
  const petId = result.rows[0].id;
  await client.query(`INSERT INTO pet_photos (pet_id, media_id, position) SELECT $1, media_id, (ord - 1)::smallint FROM unnest($2::uuid[]) WITH ORDINALITY AS x(media_id, ord)`, [petId, ids]);
  await client.query("COMMIT");
  return getOwnedPet(ownerId, petId);
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function updateOwnedPet(ownerId, petId, input) {
  const client = await getPool().connect();
  try {
  await client.query("BEGIN");
  await client.query("SELECT id FROM accounts WHERE id = $1 FOR UPDATE", [ownerId]);
  const existing = await client.query(`SELECT id FROM pets WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL FOR UPDATE`, [petId, ownerId]);
  if (!existing.rows[0]) { await client.query("ROLLBACK"); return null; }
  // Older clients can update a primary photo without erasing the rest of the gallery.
  const prior = await client.query(`SELECT media_id FROM pet_photos WHERE pet_id = $1 ORDER BY position`, [petId]);
  const ids = input.photoMediaIds ?? (input.photoMediaId ? [input.photoMediaId, ...prior.rows.map((row) => row.media_id).filter((id) => id !== input.photoMediaId)] : []);
  if (ids.length > 5) { await client.query("ROLLBACK"); return undefined; }
  const result = await client.query(
    `UPDATE pets
     SET name = $3, species = $4, breed = NULLIF($5, ''), gender = $6, size = $7,
         birth_date = $8, bio = $9, personality = $10, interests = $11, weight_kg = $12, photo_media_id = $13
     WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
       AND (SELECT COUNT(*) FROM media_files m WHERE m.id = ANY($14::uuid[]) AND m.owner_id = $2 AND m.deleted_at IS NULL) = cardinality($14::uuid[])
     RETURNING id`,
    [petId, ownerId, input.name, input.species, input.breed, input.gender, input.size, birthDateFromAge(input.age), input.bio, input.personality, input.interests, input.weightKg, ids[0] ?? null, ids]
  );
  if (!result.rows[0]) { await client.query("ROLLBACK"); return undefined; }
  await client.query(`DELETE FROM pet_photos WHERE pet_id = $1`, [petId]);
  await client.query(`INSERT INTO pet_photos (pet_id, media_id, position) SELECT $1, media_id, (ord - 1)::smallint FROM unnest($2::uuid[]) WITH ORDINALITY AS x(media_id, ord)`, [petId, ids]);
  await client.query("COMMIT");
  return getOwnedPet(ownerId, petId);
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function deleteOwnedPet(ownerId, petId) {
  const result = await query(
    `UPDATE pets SET deleted_at = NOW() WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL`,
    [petId, ownerId]
  );
  return result.rowCount === 1;
}
