import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/session";
import { jsonError } from "@/server/http/response";
import { query } from "@/server/db/pool";
import { requireSameOrigin } from "@/server/security/origin";
export async function POST() { try { await requireSameOrigin(); const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401); await query(`UPDATE notifications SET read_at = NOW() WHERE account_id = $1 AND read_at IS NULL`, [account.id]); return new NextResponse(null, { status: 204 }); } catch (error) { return error?.message === "Forbidden cross-origin request" ? jsonError("Forbidden", 403) : jsonError("Unable to mark notifications as read", 500); } }
