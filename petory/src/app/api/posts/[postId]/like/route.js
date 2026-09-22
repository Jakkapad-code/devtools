import { NextResponse } from "next/server";
import { interactionSchema, postIdSchema } from "@/features/posts/schema";
import { getCurrentAccount } from "@/server/auth/session";
import { setPostLike } from "@/server/posts/repository";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

export async function PUT(request, context) {
  try {
    await requireSameOrigin();
    const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401);
    const { postId } = await context.params;
    const id = postIdSchema.safeParse(postId); const input = interactionSchema.safeParse(await request.json());
    if (!id.success || !input.success) return jsonError("Invalid request", 422);
    const post = await setPostLike(account.id, id.data, input.data.active);
    return post ? NextResponse.json({ post }) : jsonError("Post not found", 404);
  } catch (error) {
    return error?.message === "Forbidden cross-origin request" ? jsonError("Forbidden", 403) : jsonError("Unable to update like", 500);
  }
}
