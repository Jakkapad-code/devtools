import "server-only";
import { createHash } from "node:crypto";
import { getPool, query } from "@/server/db/pool";
import { getAppConfig } from "@/server/config/config.app";

function detectedMimeType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

export async function readValidatedImage(file) {
  const { maxMediaBytes, acceptedMediaTypes } = getAppConfig();
  if (!file || typeof file.arrayBuffer !== "function") throw new Error("An image file is required");
  if (file.size < 1 || file.size > maxMediaBytes) throw new Error(`Image must be ${maxMediaBytes} bytes or smaller`);
  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = detectedMimeType(bytes);
  if (!mimeType || !acceptedMediaTypes.includes(file.type) || file.type !== mimeType) throw new Error("Only valid JPEG, PNG, or WebP images are allowed");
  return { bytes, mimeType, sha256: createHash("sha256").update(bytes).digest("hex") };
}

export async function createMedia(ownerId, image) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    // Serialize this account's uploads so the per-account quota is reliable.
    const owner = await client.query("SELECT id FROM accounts WHERE id = $1 AND deleted_at IS NULL FOR UPDATE", [ownerId]);
    if (!owner.rows[0]) throw new Error("Account not found");
    // Keep the row for soft-deleted resources' foreign keys, but release its
    // image bytes. A tombstone is never served or counted against the quota.
    await client.query(`
      UPDATE media_files m SET deleted_at = NOW(), bytes = decode('00', 'hex'), size_bytes = 1,
        sha256 = '6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d'
      WHERE m.owner_id = $1 AND m.deleted_at IS NULL
        AND m.created_at < NOW() - INTERVAL '24 hours'
        AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.avatar_media_id = m.id AND a.deleted_at IS NULL)
        AND NOT EXISTS (SELECT 1 FROM pets p WHERE p.photo_media_id = m.id AND p.deleted_at IS NULL)
        AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.photo_media_id = m.id AND p.deleted_at IS NULL)
        AND NOT EXISTS (SELECT 1 FROM pet_media pm WHERE pm.media_id = m.id)
        AND NOT EXISTS (SELECT 1 FROM post_media pm WHERE pm.media_id = m.id)`, [ownerId]);
    const count = await client.query("SELECT COUNT(*)::integer AS count FROM media_files WHERE owner_id = $1 AND deleted_at IS NULL", [ownerId]);
    if (count.rows[0].count >= getAppConfig().maxMediaPerAccount) throw new Error("Media storage limit reached");
    const result = await client.query(`INSERT INTO media_files (owner_id, bytes, mime_type, size_bytes, sha256) VALUES ($1, $2, $3, $4, $5) RETURNING id`, [ownerId, image.bytes, image.mimeType, image.bytes.length, image.sha256]);
    await client.query("COMMIT");
    return result.rows[0].id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/** Owners can read unattached uploads; others only see a live, unblocked resource. */
export async function getVisibleMedia(viewerId, mediaId) {
  const result = await query(`
    SELECT m.bytes, m.mime_type AS "mimeType", m.sha256
    FROM media_files m
    WHERE m.id = $2 AND m.deleted_at IS NULL
      AND (
        m.owner_id = $1
        OR EXISTS (
          SELECT 1 FROM accounts a
          WHERE a.avatar_media_id = m.id AND a.deleted_at IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = a.id)
                OR (b.blocker_id = a.id AND b.blocked_id = $1)
            )
        )
        OR EXISTS (
          SELECT 1 FROM pets p JOIN accounts a ON a.id = p.owner_id
          WHERE p.photo_media_id = m.id AND p.deleted_at IS NULL AND a.deleted_at IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = a.id)
                OR (b.blocker_id = a.id AND b.blocked_id = $1)
            )
        )
        OR EXISTS (
          SELECT 1 FROM posts p JOIN accounts a ON a.id = p.author_id
          WHERE p.photo_media_id = m.id AND p.deleted_at IS NULL AND a.deleted_at IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = a.id)
                OR (b.blocker_id = a.id AND b.blocked_id = $1)
            )
        )
      )`, [viewerId, mediaId]);
  return result.rows[0] ?? null;
}
