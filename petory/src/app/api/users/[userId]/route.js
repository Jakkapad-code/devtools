import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAccount } from "@/server/auth/session";
import { query } from "@/server/db/pool";
import { listPetsForOwner } from "@/server/pets/repository";
import { jsonError } from "@/server/http/response";

const idSchema = z.string().uuid();

export async function GET(_request, context) {
  const viewer = await getCurrentAccount(); if (!viewer) return jsonError("Unauthorized", 401);
  const { userId } = await context.params; const id = idSchema.safeParse(userId); if (!id.success) return jsonError("User not found", 404);
  const result = await query(`SELECT a.id, a.display_name AS "displayName", a.bio, a.location_label AS "locationLabel", a.avatar_url AS "avatarUrl", a.avatar_media_id AS "avatarMediaId", EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = $1 AND f.followed_id = a.id) AS following, EXISTS(SELECT 1 FROM blocks b WHERE b.blocker_id = $1 AND b.blocked_id = a.id) AS blocked FROM accounts a WHERE a.id = $2 AND a.deleted_at IS NULL`, [viewer.id, id.data]);
  if (!result.rows[0]) return jsonError("User not found", 404);
  return NextResponse.json({ user: result.rows[0], pets: await listPetsForOwner(id.data) });
}
