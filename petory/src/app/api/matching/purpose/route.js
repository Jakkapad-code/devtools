import { NextResponse } from "next/server";
import { matchingPurposeSchema } from "@/features/matching/schema";
import { getCurrentAccount } from "@/server/auth/session";
import { setMatchingPurpose } from "@/server/matching/repository";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

export async function POST(request) {
  try {
    await requireSameOrigin();
    const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401);
    const input = matchingPurposeSchema.safeParse(await request.json()); if (!input.success) return jsonError("Invalid matching purpose", 422);
    const matchingPurpose = await setMatchingPurpose(account.id, input.data.purpose);
    return matchingPurpose ? NextResponse.json({ matchingPurpose }) : jsonError("Account not found", 404);
  } catch (error) { return error?.message === "Forbidden cross-origin request" ? jsonError("Forbidden", 403) : jsonError("Unable to save matching purpose", 500); }
}
