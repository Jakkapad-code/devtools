import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/session";
import { createMedia, readValidatedImage } from "@/server/media/service";
import { query } from "@/server/db/pool";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

export async function POST(request) {
  try {
    await requireSameOrigin();
    const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401);
    const image = await readValidatedImage((await request.formData()).get("file"));
    const mediaId = await createMedia(account.id, image);
    await query(`UPDATE accounts SET avatar_media_id = $2 WHERE id = $1`, [account.id, mediaId]);
    return NextResponse.json({ mediaId, url: `/api/media/${mediaId}` }, { status: 201 });
  } catch (error) { return error?.message === "Forbidden cross-origin request" ? jsonError("Forbidden", 403) : jsonError(error.message || "Unable to upload image", 422); }
}
