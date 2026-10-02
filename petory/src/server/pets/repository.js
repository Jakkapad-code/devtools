import "server-only";
import { query } from "@/server/db/pool";

const petFields = `
  p.id, p.owner_id AS "ownerId", p.name, p.species, p.breed, p.gender, p.size,
  COALESCE(EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.birth_date))::integer, 0) AS age,
  p.weight_kg::float8 AS "weightKg", p.photo_media_id AS "photoMediaId",
  p.bio, p.personality, p.interests, p.created_at AS "createdAt", p.updated_at AS "updatedAt"
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
  const result = await query(
    `INSERT INTO pets (owner_id, name, species, breed, gender, size, birth_date, bio, personality, interests, weight_kg, photo_media_id)
     SELECT $1, $2, $3, NULLIF($4, ''), $5, $6, $7, $8, $9, $10, $11, $12
     WHERE $12::uuid IS NULL OR EXISTS (
       SELECT 1 FROM media_files m WHERE m.id = $12 AND m.owner_id = $1 AND m.deleted_at IS NULL
     )
     RETURNING id`,
    [ownerId, input.name, input.species, input.breed, input.gender, input.size, birthDateFromAge(input.age), input.bio, input.personality, input.interests, input.weightKg, input.photoMediaId]
  );
  return result.rows[0] ? getOwnedPet(ownerId, result.rows[0].id) : undefined;
}

export async function updateOwnedPet(ownerId, petId, input) {
  const result = await query(
    `UPDATE pets
     SET name = $3, species = $4, breed = NULLIF($5, ''), gender = $6, size = $7,
         birth_date = $8, bio = $9, personality = $10, interests = $11, weight_kg = $12, photo_media_id = $13
     WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
       AND ($13::uuid IS NULL OR EXISTS (
         SELECT 1 FROM media_files m WHERE m.id = $13 AND m.owner_id = $2 AND m.deleted_at IS NULL
       ))
     RETURNING id`,
    [petId, ownerId, input.name, input.species, input.breed, input.gender, input.size, birthDateFromAge(input.age), input.bio, input.personality, input.interests, input.weightKg, input.photoMediaId]
  );
  if (!result.rows[0]) return await getOwnedPet(ownerId, petId) ? undefined : null;
  return getOwnedPet(ownerId, petId);
}

export async function deleteOwnedPet(ownerId, petId) {
  const result = await query(
    `UPDATE pets SET deleted_at = NOW() WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL`,
    [petId, ownerId]
  );
  return result.rowCount === 1;
}
