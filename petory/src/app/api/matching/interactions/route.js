import { NextResponse } from "next/server";
import { interactionInputSchema } from "@/features/matching/schema";
import { getCurrentAccount } from "@/server/auth/session";
import { recordInteraction } from "@/server/matching/repository";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

export async function POST(request) {
  try {
    await requireSameOrigin();
    const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401);
    const input = interactionInputSchema.safeParse(await request.json()); if (!input.success) return jsonError("Invalid interaction", 422);
    const interaction = await recordInteraction(account.id, input.data);
    return interaction ? NextResponse.json({ interaction }) : jsonError("Pet not found", 404);
  } catch (error) { return error?.message === "Forbidden cross-origin request" ? jsonError("Forbidden", 403) : jsonError("Unable to save interaction", 500); }
}
