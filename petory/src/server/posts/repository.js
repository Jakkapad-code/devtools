import "server-only";
import { query } from "@/server/db/pool";

const fields = `p.id, p.author_id AS "authorId", p.pet_id AS "petId", p.category, p.title,
  p.caption, p.location_label AS "locationLabel", p.created_at AS "createdAt", p.updated_at AS "updatedAt"`;

export async function listPostsForAuthor(authorId) {
  const result = await query(
    `SELECT ${fields} FROM posts p
     WHERE p.author_id = $1 AND p.deleted_at IS NULL ORDER BY p.created_at DESC`,
    [authorId]
  );
  return result.rows;
}

export async function listFeedPosts(viewerId, filters = {}) {
  const values = [viewerId];
  const where = ["p.deleted_at IS NULL", "a.deleted_at IS NULL", "NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = p.author_id) OR (b.blocker_id = p.author_id AND b.blocked_id = $1))"];
  const add = (value) => { values.push(value); return `$${values.length}`; };

  if (filters.scope === "explore") where.push("p.category <> 'story'");
  if (filters.category && filters.category !== "all") {
    const categories = filters.category === "tips" ? ["tips", "event", "question"] : [filters.category];
    where.push(`p.category = ANY(${add(categories)}::text[])`);
  }
  if (filters.species && filters.species !== "all") {
    where.push(`EXISTS (SELECT 1 FROM pets filter_pet WHERE filter_pet.id = p.pet_id AND filter_pet.deleted_at IS NULL AND filter_pet.species = ${add(filters.species)})`);
  }
  if (filters.search) {
    const term = add(`%${filters.search}%`);
    where.push(`(p.caption ILIKE ${term} OR COALESCE(p.title, '') ILIKE ${term})`);
  }
  if (filters.cursor && filters.sort !== "popular") {
    const [createdAt, id] = filters.cursor;
    where.push(`(p.created_at, p.id) < (${add(createdAt)}::timestamptz, ${add(id)}::uuid)`);
  }
  const order = filters.sort === "popular" ? "likes DESC, p.created_at DESC, p.id DESC" : "p.created_at DESC, p.id DESC";
  const limit = add((filters.limit || 20) + 1);
  const result = await query(
    `SELECT ${fields}, a.display_name AS "authorName", '#2B5468' AS "authorColor",
       (SELECT COUNT(*)::integer FROM post_likes pl WHERE pl.post_id = p.id) AS likes,
       EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.account_id = $1) AS liked,
       EXISTS(SELECT 1 FROM post_saves ps WHERE ps.post_id = p.id AND ps.account_id = $1) AS saved,
       COALESCE((SELECT json_agg(json_build_object('id', c.id, 'user', ca.display_name, 'color', '#2B5468', 'text', c.body, 'createdAt', c.created_at) ORDER BY c.created_at)
         FROM post_comments c JOIN accounts ca ON ca.id = c.author_id
         WHERE c.post_id = p.id AND c.deleted_at IS NULL), '[]'::json) AS comments
     FROM posts p JOIN accounts a ON a.id = p.author_id
     WHERE ${where.join(" AND ")}
     ORDER BY ${order} LIMIT ${limit}`,
    values
  );
  return result.rows;
}

export async function getOwnedPost(authorId, postId) {
  const result = await query(
    `SELECT ${fields} FROM posts p
     WHERE p.id = $1 AND p.author_id = $2 AND p.deleted_at IS NULL`,
    [postId, authorId]
  );
  return result.rows[0] ?? null;
}

async function ownedPetId(ownerId, petId) {
  if (!petId) return null;
  const result = await query(`SELECT id FROM pets WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL`, [petId, ownerId]);
  return result.rows[0]?.id ?? undefined;
}

export async function createPost(authorId, input) {
  const petId = await ownedPetId(authorId, input.petId);
  if (input.petId && !petId) return undefined;
  const result = await query(
    `INSERT INTO posts (author_id, pet_id, category, title, caption, location_label)
     VALUES ($1, $2, $3, NULLIF($4, ''), $5, NULLIF($6, '')) RETURNING id`,
    [authorId, petId ?? null, input.category, input.title, input.caption, input.locationLabel]
  );
  return getOwnedPost(authorId, result.rows[0].id);
}

export async function updateOwnedPost(authorId, postId, input) {
  const petId = await ownedPetId(authorId, input.petId);
  if (input.petId && !petId) return undefined;
  const result = await query(
    `UPDATE posts SET pet_id = $3, category = $4, title = NULLIF($5, ''), caption = $6, location_label = NULLIF($7, '')
     WHERE id = $1 AND author_id = $2 AND deleted_at IS NULL RETURNING id`,
    [postId, authorId, petId ?? null, input.category, input.title, input.caption, input.locationLabel]
  );
  if (!result.rows[0]) return null;
  return getOwnedPost(authorId, postId);
}

export async function deleteOwnedPost(authorId, postId) {
  const result = await query(`UPDATE posts SET deleted_at = NOW() WHERE id = $1 AND author_id = $2 AND deleted_at IS NULL`, [postId, authorId]);
  return result.rowCount === 1;
}

async function existingPost(postId) {
  const result = await query(`SELECT id FROM posts WHERE id = $1 AND deleted_at IS NULL`, [postId]);
  return result.rows[0]?.id ?? null;
}

export async function setPostLike(accountId, postId, active) {
  if (!await existingPost(postId)) return null;
  if (active) await query(`INSERT INTO post_likes (account_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [accountId, postId]);
  else await query(`DELETE FROM post_likes WHERE account_id = $1 AND post_id = $2`, [accountId, postId]);
  const count = await query(`SELECT COUNT(*)::integer AS likes FROM post_likes WHERE post_id = $1`, [postId]);
  return { liked: active, likes: count.rows[0].likes };
}

export async function setPostSave(accountId, postId, active) {
  if (!await existingPost(postId)) return null;
  if (active) await query(`INSERT INTO post_saves (account_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [accountId, postId]);
  else await query(`DELETE FROM post_saves WHERE account_id = $1 AND post_id = $2`, [accountId, postId]);
  return { saved: active };
}

export async function addPostComment(accountId, postId, body) {
  if (!await existingPost(postId)) return null;
  const result = await query(
    `INSERT INTO post_comments (post_id, author_id, body) VALUES ($1, $2, $3)
     RETURNING id, body AS text, created_at AS "createdAt"`,
    [postId, accountId, body]
  );
  const account = await query(`SELECT display_name AS "user" FROM accounts WHERE id = $1`, [accountId]);
  return { ...result.rows[0], ...account.rows[0], color: "#E3402B" };
}
