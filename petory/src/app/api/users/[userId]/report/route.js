import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAccount } from "@/server/auth/session";
import { query } from "@/server/db/pool";
import { isUniqueViolation, jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";
const idSchema = z.string().uuid(); const inputSchema = z.object({ reason: z.string().trim().min(2).max(500) });
export async function POST(request, context) { try { await requireSameOrigin(); const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401); const { userId } = await context.params; const id = idSchema.safeParse(userId); const input = inputSchema.safeParse(await request.json()); if (!id.success || !input.success || id.data === account.id) return jsonError("Invalid report", 422); await query(`INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES ($1, 'account', $2, $3)`, [account.id, id.data, input.data.reason]); return NextResponse.json({ reported: true }, { status: 201 }); } catch (error) { if (isUniqueViolation(error)) return jsonError("You have already reported this user", 409); return error?.message === "Forbidden cross-origin request" ? jsonError("Forbidden", 403) : jsonError("Unable to report user", 500); } }
