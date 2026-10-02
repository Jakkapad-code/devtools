import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAccount } from "@/server/auth/session";
import { query } from "@/server/db/pool";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";
const idSchema = z.string().uuid(); const inputSchema = z.object({ active: z.boolean() });
export async function PUT(request, context) {
  try {
    await requireSameOrigin();
    const account = await getCurrentAccount();
    if (!account) return jsonError("Unauthorized", 401);
    const { userId } = await context.params;
    const id = idSchema.safeParse(userId);
    const input = inputSchema.safeParse(await request.json());
    if (!id.success || !input.success || id.data === account.id) return jsonError("Invalid request", 422);
    if (input.data.active) {
      const result = await query(`INSERT INTO follows (follower_id, followed_id)
        SELECT $1, a.id FROM accounts a WHERE a.id = $2 AND a.deleted_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = a.id) OR (b.blocker_id = a.id AND b.blocked_id = $1))
        ON CONFLICT DO NOTHING RETURNING follower_id`, [account.id, id.data]);
      if (!result.rows[0]) {
        const existing = await query("SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = $2", [account.id, id.data]);
        if (!existing.rows[0]) return jsonError("User not found or blocked", 404);
      }
    } else await query("DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2", [account.id, id.data]);
    return NextResponse.json({ following: input.data.active });
  } catch (error) {
    return error?.message === "Forbidden cross-origin request" ? jsonError("Forbidden", 403) : jsonError("Unable to update follow", 500);
  }
}
