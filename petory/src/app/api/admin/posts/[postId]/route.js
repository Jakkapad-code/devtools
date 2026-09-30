import { NextResponse } from "next/server";
import { uuidSchema } from "@/features/admin/schema";
import { adminError, adminGuard } from "@/server/admin/guard";
import { getPost, recordAction, removePost } from "@/server/admin/repository";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

/** Soft-deletes a post as a moderator and closes the reports about it. */
export async function DELETE(request, context) {
  const { account, response } = await adminGuard();
  if (response) return response;

  try {
    await requireSameOrigin();
    const { postId } = await context.params;
    const id = uuidSchema.safeParse(postId);
    if (!id.success) return jsonError("Invalid post", 422);

    const post = await getPost(id.data);
    if (!post || post.deletedAt) return jsonError("Post not found", 404);

    await removePost(id.data, "ลบโพสต์แล้ว", account.id);
    await recordAction(account.id, "delete_post", "post", id.data, `ของ ${post.authorName}`);
    return NextResponse.json({ removed: true });
  } catch (error) {
    return adminError(error, "Unable to delete the post");
  }
}
