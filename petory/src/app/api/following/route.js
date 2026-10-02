import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/session";
import { query } from "@/server/db/pool";
import { jsonError } from "@/server/http/response";
export async function GET() {
  const account = await getCurrentAccount();
  if (!account) return jsonError("Unauthorized", 401);
  const result = await query(`SELECT a.id, a.display_name AS "displayName", a.bio, a.location_label AS "locationLabel", a.avatar_media_id AS "avatarMediaId"
    FROM follows f JOIN accounts a ON a.id = f.followed_id
    WHERE f.follower_id = $1 AND a.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = a.id) OR (b.blocker_id = a.id AND b.blocked_id = $1))
    ORDER BY f.created_at DESC`, [account.id]);
  return NextResponse.json({ users: result.rows });
}
