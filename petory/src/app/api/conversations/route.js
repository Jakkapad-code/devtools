import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/session";
import { listConversations } from "@/server/conversations/repository";
import { jsonError } from "@/server/http/response";
export async function GET() { const account = await getCurrentAccount(); return account ? NextResponse.json({ conversations: await listConversations(account.id) }) : jsonError("Unauthorized", 401); }
