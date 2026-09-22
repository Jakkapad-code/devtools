import { NextResponse } from "next/server";
import { postIdSchema, postInputSchema } from "@/features/posts/schema";
import { getCurrentAccount } from "@/server/auth/session";
import { deleteOwnedPost, getOwnedPost, updateOwnedPost } from "@/server/posts/repository";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

async function resolve(context) {
  const account = await getCurrentAccount();
  if (!account) return { error: jsonError("Unauthorized", 401) };
  const { postId } = await context.params;
  const parsed = postIdSchema.safeParse(postId);
  if (!parsed.success) return { error: jsonError("Post not found", 404) };
  return { account, postId: parsed.data };
}

export const dynamic = "force-dynamic";

export async function GET(_request, context) {
  const current = await resolve(context); if (current.error) return current.error;
  const post = await getOwnedPost(current.account.id, current.postId);
  return post ? NextResponse.json({ post }) : jsonError("Post not found", 404);
}

export async function PUT(request, context) {
  try {
    await requireSameOrigin();
    const current = await resolve(context); if (current.error) return current.error;
    const input = postInputSchema.safeParse(await request.json());
    if (!input.success) return jsonError("Invalid post data", 422);
    const post = await updateOwnedPost(current.account.id, current.postId, input.data);
    return post ? NextResponse.json({ post }) : jsonError("Post not found", 404);
  } catch (error) {
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    return jsonError("Unable to update post", 500);
  }
}

export async function DELETE(_request, context) {
  try {
    await requireSameOrigin();
    const current = await resolve(context); if (current.error) return current.error;
    return await deleteOwnedPost(current.account.id, current.postId) ? new NextResponse(null, { status: 204 }) : jsonError("Post not found", 404);
  } catch (error) {
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    return jsonError("Unable to delete post", 500);
  }
}
