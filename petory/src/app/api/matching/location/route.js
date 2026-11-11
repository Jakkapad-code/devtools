import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAccount } from "@/server/auth/session";
import { query } from "@/server/db/pool";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";
import { checkRateLimit, rateLimitResponse } from "@/server/security/rate-limit";

const locationSchema = z.object({ latitude: z.number().finite().min(-90).max(90), longitude: z.number().finite().min(-180).max(180) }).nullable();

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) return jsonError("Unauthorized", 401);
  const result = await query("SELECT location IS NOT NULL AS shared FROM accounts WHERE id = $1 AND deleted_at IS NULL", [account.id]);
  return NextResponse.json({ shared: result.rows[0]?.shared ?? false });
}

export async function PUT(request) {
  try {
    await requireSameOrigin();
    const account = await getCurrentAccount();
    if (!account) return jsonError("Unauthorized", 401);
    const parsed = locationSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid location", 422);
    // Revoking consent must remain possible even when a user has exhausted their quota.
    if (parsed.data) {
      const limit = await checkRateLimit("locationUpdate", account.id);
      if (!limit.allowed) return rateLimitResponse(limit.retryAfter);
    }
    // Store only coarse coordinates (~1 km), and return no coordinates to clients.
    const location = parsed.data;
    await query("UPDATE accounts SET location = CASE WHEN $2::float8 IS NULL THEN NULL ELSE ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography END WHERE id = $1 AND deleted_at IS NULL", [account.id, location ? Math.round(location.latitude * 100) / 100 : null, location ? Math.round(location.longitude * 100) / 100 : null]);
    return NextResponse.json({ shared: location !== null });
  } catch (error) {
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    return jsonError("Unable to update location", 500);
  }
}
