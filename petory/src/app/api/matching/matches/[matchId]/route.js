import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAccount } from "@/server/auth/session";
import { unmatch } from "@/server/matching/repository";
import { requireSameOrigin } from "@/server/security/origin";
import { jsonError } from "@/server/http/response";

const idSchema = z.string().uuid();

export async function DELETE(_request, context) {
  try {
    await requireSameOrigin();
    const account = await getCurrentAccount();
    if (!account) return jsonError("Unauthorized", 401);
    const { matchId } = await context.params;
    const id = idSchema.safeParse(matchId);
    if (!id.success) return jsonError("Invalid match", 422);
    const cancelled = await unmatch(account.id, id.data);
    return cancelled ? NextResponse.json({ match: cancelled }) : jsonError("Match not found", 404);
  } catch (error) {
    return error?.message === "Forbidden cross-origin request" ? jsonError("Forbidden", 403) : jsonError("Unable to cancel match", 500);
  }
}
