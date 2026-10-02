import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/session";
import { query } from "@/server/db/pool";
import { jsonError } from "@/server/http/response";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) return jsonError("Unauthorized", 401);
  const result = await query(`SELECT a.id, a.display_name AS "displayName"
    FROM blocks b JOIN accounts a ON a.id = b.blocked_id
    WHERE b.blocker_id = $1 AND a.deleted_at IS NULL
    ORDER BY b.created_at DESC`, [account.id]);
  return NextResponse.json({ users: result.rows });
}
