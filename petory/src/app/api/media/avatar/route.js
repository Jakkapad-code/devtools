import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/session";
import { createMedia, readImageFromRequest } from "@/server/media/service";
import { UploadError } from "@/server/media/upload";
import { query } from "@/server/db/pool";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";
import { checkRateLimit, rateLimitResponse } from "@/server/security/rate-limit";

export async function POST(request) {
  try {
    await requireSameOrigin();
    const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401);
    const limit = await checkRateLimit("upload", account.id);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);
    const image = await readImageFromRequest(request);
    const mediaId = await createMedia(account.id, image);
    await query(`UPDATE accounts SET avatar_media_id = $2 WHERE id = $1`, [account.id, mediaId]);
    return NextResponse.json({ mediaId, url: `/api/media/${mediaId}` }, { status: 201 });
  } catch (error) {
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    if (error instanceof UploadError) return jsonError(error.message, error.status);
    console.error("Avatar upload failed", error);
    return jsonError("Unable to upload image", 500);
  }
}
