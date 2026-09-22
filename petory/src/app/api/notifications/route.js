import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/session";
import { jsonError } from "@/server/http/response";
import { query } from "@/server/db/pool";
export async function GET() { const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401); const result = await query(`SELECT n.id, n.type, n.resource_type AS "resourceType", n.resource_id AS "resourceId", n.read_at AS "readAt", n.created_at AS "createdAt", a.display_name AS "actorName" FROM notifications n LEFT JOIN accounts a ON a.id = n.actor_id WHERE n.account_id = $1 ORDER BY n.created_at DESC LIMIT 100`, [account.id]); return NextResponse.json({ notifications: result.rows }); }
