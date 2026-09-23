import "server-only";
import { getPool, query } from "@/server/db/pool";

export async function listCandidates(accountId, actorPetId, filters = {}) {
  const owned = await query(`SELECT id FROM pets WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL`, [actorPetId, accountId]);
  if (!owned.rows[0]) return null;
  const values = [actorPetId, accountId];
  const where = ["p.id <> $1", "p.deleted_at IS NULL", "a.deleted_at IS NULL", "p.owner_id <> $2", "NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $2 AND b.blocked_id = p.owner_id) OR (b.blocker_id = p.owner_id AND b.blocked_id = $2))", "NOT EXISTS (SELECT 1 FROM match_interactions i WHERE i.actor_pet_id = $1 AND i.target_pet_id = p.id)"];
  const add = (value) => { values.push(value); return `$${values.length}`; };
  if (filters.species && filters.species !== "all") where.push(`p.species = ${add(filters.species)}`);
  if (filters.gender && filters.gender !== "any") where.push(`p.gender = ${add(filters.gender)}`);
  if (filters.size && filters.size !== "all") where.push(`p.size = ${add(filters.size)}`);
  if (filters.personality?.length) where.push(`p.personality && ${add(filters.personality)}::text[]`);
  const result = await query(`SELECT p.id, p.owner_id AS "ownerId", p.name, p.species, p.breed, p.gender, p.size, p.bio, p.personality, p.interests, p.photo_media_id AS "photoMediaId", COALESCE(EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.birth_date))::integer, 0) AS age, a.display_name AS "ownerName" FROM pets p JOIN accounts a ON a.id = p.owner_id WHERE ${where.join(" AND ")} ORDER BY p.created_at DESC LIMIT 30`, values);
  return result.rows;
}

export async function recordInteraction(accountId, input) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const actor = await client.query(`SELECT owner_id FROM pets WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [input.actorPetId]);
    const target = await client.query(`SELECT owner_id FROM pets WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [input.targetPetId]);
    if (!actor.rows[0] || !target.rows[0] || actor.rows[0].owner_id !== accountId || actor.rows[0].owner_id === target.rows[0].owner_id) { await client.query("ROLLBACK"); return null; }
    await client.query(`INSERT INTO match_interactions (actor_pet_id, target_pet_id, action) VALUES ($1, $2, $3) ON CONFLICT (actor_pet_id, target_pet_id) DO UPDATE SET action = EXCLUDED.action, created_at = NOW()`, [input.actorPetId, input.targetPetId, input.action]);
    let match = null;
    if (input.action === "interest") {
      const reverse = await client.query(`SELECT 1 FROM match_interactions WHERE actor_pet_id = $1 AND target_pet_id = $2 AND action = 'interest'`, [input.targetPetId, input.actorPetId]);
      if (reverse.rows[0]) {
        const [petA, petB] = [input.actorPetId, input.targetPetId].sort();
        const created = await client.query(`INSERT INTO matches (pet_a_id, pet_b_id) VALUES ($1, $2) ON CONFLICT (pet_a_id, pet_b_id) DO UPDATE SET status = 'active', unmatched_at = NULL RETURNING id`, [petA, petB]);
        match = created.rows[0];
        const conversation = await client.query(`INSERT INTO conversations (match_id) VALUES ($1) ON CONFLICT (match_id) DO UPDATE SET closed_at = NULL RETURNING id`, [match.id]);
        await client.query(`INSERT INTO conversation_members (conversation_id, account_id) VALUES ($1, $2), ($1, $3) ON CONFLICT DO NOTHING`, [conversation.rows[0].id, actor.rows[0].owner_id, target.rows[0].owner_id]);
      }
    }
    await client.query("COMMIT");
    return { action: input.action, matchId: match?.id ?? null };
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
