import { getCurrentAccount } from "@/server/auth/session";
import { getVisibleMedia } from "@/server/media/service";
import { jsonError } from "@/server/http/response";
import { z } from "zod";

export async function GET(_request, context) {
  const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401);
  const { mediaId } = await context.params;
  const parsedId = z.string().uuid().safeParse(mediaId);
  if (!parsedId.success) return jsonError("Not found", 404);
  const media = await getVisibleMedia(account.id, parsedId.data); if (!media) return jsonError("Not found", 404);
  return new Response(media.bytes, { headers: { "Content-Type": media.mimeType, "Content-Length": String(media.bytes.length), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", ETag: media.sha256 } });
}
