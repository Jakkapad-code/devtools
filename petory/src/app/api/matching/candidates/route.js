import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/session";
import { listCandidates } from "@/server/matching/repository";
import { jsonError } from "@/server/http/response";
import { z } from "zod";
import { checkRateLimit, rateLimitResponse } from "@/server/security/rate-limit";

const filtersSchema = z.object({
  actorPetId: z.string().uuid(),
  species: z.enum(["all", "Dog", "Cat", "Other"]).default("all"),
  gender: z.enum(["any", "Male", "Female", "Unknown"]).default("any"),
  size: z.enum(["all", "Small", "Medium", "Large", "Unknown"]).default("all"),
  personality: z.array(z.string().min(1).max(40)).max(10),
  minAge: z.coerce.number().int().min(0).max(40).optional(),
  maxAge: z.coerce.number().int().min(0).max(40).optional(),
  distance: z.coerce.number().refine((value) => [1, 5, 10, 25].includes(value)).optional(),
}).refine((value) => value.minAge == null || value.maxAge == null || value.minAge <= value.maxAge);

export async function GET(request) {
  const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401);
  const params = request.nextUrl.searchParams;
  const parsed = filtersSchema.safeParse({ actorPetId: params.get("actorPetId"), species: params.get("species") || undefined, gender: params.get("gender") || undefined, size: params.get("size") || undefined, personality: params.getAll("personality"), minAge: params.get("minAge") || undefined, maxAge: params.get("maxAge") || undefined, distance: params.get("distance") || undefined });
  if (!parsed.success) return jsonError("Invalid matching filters", 422);
  const limit = await checkRateLimit("matchingCandidates", account.id);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);
  const { actorPetId, ...filters } = parsed.data;
  const candidates = await listCandidates(account.id, actorPetId, filters);
  return candidates ? NextResponse.json({ candidates }) : jsonError("Pet not found", 404);
}
