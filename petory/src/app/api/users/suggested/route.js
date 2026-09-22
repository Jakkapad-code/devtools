import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/session";
import { query } from "@/server/db/pool";
import { jsonError } from "@/server/http/response";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) return jsonError("Unauthorized", 401);

  const result = await query(
    `SELECT a.id, a.display_name AS "displayName", a.bio, a.location_label AS "locationLabel"
     FROM accounts a
     WHERE a.id <> $1 AND a.deleted_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = $1 AND f.followed_id = a.id)
       AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = a.id) OR (b.blocker_id = a.id AND b.blocked_id = $1))
     ORDER BY a.created_at DESC
     LIMIT 5`,
    [account.id]
  );
  return NextResponse.json({ users: result.rows });
}
