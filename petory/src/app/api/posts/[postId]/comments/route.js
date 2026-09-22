import { NextResponse } from "next/server";
import { commentInputSchema, postIdSchema } from "@/features/posts/schema";
import { getCurrentAccount } from "@/server/auth/session";
import { addPostComment } from "@/server/posts/repository";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

export async function POST(request, context) {
  try {
    await requireSameOrigin();
    const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401);
    const { postId } = await context.params;
    const id = postIdSchema.safeParse(postId); const input = commentInputSchema.safeParse(await request.json());
    if (!id.success || !input.success) return jsonError("Invalid comment", 422);
    const comment = await addPostComment(account.id, id.data, input.data.body);
    return comment ? NextResponse.json({ comment }, { status: 201 }) : jsonError("Post not found", 404);
  } catch (error) {
    return error?.message === "Forbidden cross-origin request" ? jsonError("Forbidden", 403) : jsonError("Unable to add comment", 500);
  }
}
