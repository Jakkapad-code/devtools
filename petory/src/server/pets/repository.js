import "server-only";
import { query } from "@/server/db/pool";

const petFields = `
  p.id, p.owner_id AS "ownerId", p.name, p.species, p.breed, p.gender, p.size,
  COALESCE(EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.birth_date))::integer, 0) AS age,
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

export async function createPet(ownerId, input) {
  const result = await query(
    `INSERT INTO pets (owner_id, name, species, breed, gender, size, birth_date, bio, personality, interests)
     VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [ownerId, input.name, input.species, input.breed, input.gender, input.size, birthDateFromAge(input.age), input.bio, input.personality, input.interests]
  );
  return getOwnedPet(ownerId, result.rows[0].id);
}

export async function updateOwnedPet(ownerId, petId, input) {
  const result = await query(
    `UPDATE pets
     SET name = $3, species = $4, breed = NULLIF($5, ''), gender = $6, size = $7,
         birth_date = $8, bio = $9, personality = $10, interests = $11
     WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [petId, ownerId, input.name, input.species, input.breed, input.gender, input.size, birthDateFromAge(input.age), input.bio, input.personality, input.interests]
  );
  if (!result.rows[0]) return null;
  return getOwnedPet(ownerId, petId);
}

export async function deleteOwnedPet(ownerId, petId) {
  const result = await query(
    `UPDATE pets SET deleted_at = NOW() WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL`,
    [petId, ownerId]
  );
  return result.rowCount === 1;
}
