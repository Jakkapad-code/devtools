import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAccount } from "@/server/auth/session";
import { query } from "@/server/db/pool";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";
const idSchema = z.string().uuid(); const inputSchema = z.object({ active: z.boolean() });
export async function PUT(request, context) { try { await requireSameOrigin(); const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401); const { userId } = await context.params; const id = idSchema.safeParse(userId); const input = inputSchema.safeParse(await request.json()); if (!id.success || !input.success || id.data === account.id) return jsonError("Invalid request", 422); if (input.data.active) { await query(`INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [account.id, id.data]); await query(`DELETE FROM follows WHERE (follower_id = $1 AND followed_id = $2) OR (follower_id = $2 AND followed_id = $1)`, [account.id, id.data]); } else await query(`DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2`, [account.id, id.data]); return NextResponse.json({ blocked: input.data.active }); } catch (error) { return error?.message === "Forbidden cross-origin request" ? jsonError("Forbidden", 403) : jsonError("Unable to update block", 500); } }
