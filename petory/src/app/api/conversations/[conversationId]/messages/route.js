import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAccount } from "@/server/auth/session";
import { addMessage, listMessages } from "@/server/conversations/repository";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";
const idSchema = z.string().uuid(); const bodySchema = z.object({ body: z.string().trim().min(1).max(4_000) });
export async function GET(_request, context) { const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401); const { conversationId } = await context.params; if (!idSchema.safeParse(conversationId).success) return jsonError("Not found", 404); const messages = await listMessages(account.id, conversationId); return messages ? NextResponse.json({ messages }) : jsonError("Not found", 404); }
export async function POST(request, context) { try { await requireSameOrigin(); const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401); const { conversationId } = await context.params; const body = bodySchema.safeParse(await request.json()); if (!idSchema.safeParse(conversationId).success || !body.success) return jsonError("Invalid message", 422); const message = await addMessage(account.id, conversationId, body.data.body); return message ? NextResponse.json({ message }, { status: 201 }) : jsonError("Not found", 404); } catch (error) { return error?.message === "Forbidden cross-origin request" ? jsonError("Forbidden", 403) : jsonError("Unable to send message", 500); } }
