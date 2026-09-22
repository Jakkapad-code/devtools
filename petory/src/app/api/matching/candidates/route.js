import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/session";
import { listCandidates } from "@/server/matching/repository";
import { jsonError } from "@/server/http/response";

export async function GET(request) {
  const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401);
  const params = request.nextUrl.searchParams; const actorPetId = params.get("actorPetId");
  if (!actorPetId) return jsonError("actorPetId is required", 422);
  const candidates = await listCandidates(account.id, actorPetId, { species: params.get("species"), gender: params.get("gender"), size: params.get("size"), personality: params.getAll("personality") });
  return candidates ? NextResponse.json({ candidates }) : jsonError("Pet not found", 404);
}
