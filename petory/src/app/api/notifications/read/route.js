import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/session";
import { jsonError } from "@/server/http/response";
import { query } from "@/server/db/pool";
import { requireSameOrigin } from "@/server/security/origin";
import { z } from "zod";

const requestSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(100) });

export async function POST(request) {
  try {
    await requireSameOrigin();
    const account = await getCurrentAccount();
    if (!account) return jsonError("Unauthorized", 401);
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError("Invalid notifications", 422);
    await query(`UPDATE notifications SET read_at = NOW() WHERE account_id = $1 AND id = ANY($2::uuid[]) AND read_at IS NULL`, [account.id, parsed.data.ids]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return error?.message === "Forbidden cross-origin request" ? jsonError("Forbidden", 403) : jsonError("Unable to mark notifications as read", 500);
  }
}
