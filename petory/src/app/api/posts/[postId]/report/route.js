import { NextResponse } from "next/server";
import { z } from "zod";
import { postIdSchema } from "@/features/posts/schema";
import { getCurrentAccount } from "@/server/auth/session";
import { query } from "@/server/db/pool";
import { isUniqueViolation, jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

const inputSchema = z.object({ reason: z.string().trim().min(2).max(500) });

export async function POST(request, context) {
  try {
    await requireSameOrigin();
    const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401);
    const { postId } = await context.params;
    const id = postIdSchema.safeParse(postId); const input = inputSchema.safeParse(await request.json());
    if (!id.success || !input.success) return jsonError("Invalid report", 422);
    const post = await query(`SELECT id FROM posts WHERE id = $1 AND deleted_at IS NULL`, [id.data]);
    if (!post.rows[0]) return jsonError("Post not found", 404);
    await query(`INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES ($1, 'post', $2, $3)`, [account.id, id.data, input.data.reason]);
    return NextResponse.json({ reported: true }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("You have already reported this post", 409);
    return error?.message === "Forbidden cross-origin request" ? jsonError("Forbidden", 403) : jsonError("Unable to report post", 500);
  }
}
