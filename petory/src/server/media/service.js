import "server-only";
import { createHash } from "node:crypto";
import { query } from "@/server/db/pool";

export const MAX_MEDIA_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function detectedMimeType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

export async function readValidatedImage(file) {
  if (!file || typeof file.arrayBuffer !== "function") throw new Error("An image file is required");
  if (file.size < 1 || file.size > MAX_MEDIA_BYTES) throw new Error("Image must be 2 MB or smaller");
  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = detectedMimeType(bytes);
  if (!mimeType || !ACCEPTED_MEDIA_TYPES.has(file.type) || file.type !== mimeType) throw new Error("Only valid JPEG, PNG, or WebP images are allowed");
  return { bytes, mimeType, sha256: createHash("sha256").update(bytes).digest("hex") };
}

export async function createMedia(ownerId, image) {
  const result = await query(`INSERT INTO media_files (owner_id, bytes, mime_type, size_bytes, sha256) VALUES ($1, $2, $3, $4, $5) RETURNING id`, [ownerId, image.bytes, image.mimeType, image.bytes.length, image.sha256]);
  return result.rows[0].id;
}

export async function getMedia(mediaId) {
  const result = await query(`SELECT bytes, mime_type AS "mimeType", sha256 FROM media_files WHERE id = $1 AND deleted_at IS NULL`, [mediaId]);
  return result.rows[0] ?? null;
}
