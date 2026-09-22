import { getCurrentAccount } from "@/server/auth/session";
import { getMedia } from "@/server/media/service";
import { jsonError } from "@/server/http/response";

export async function GET(_request, context) {
  const account = await getCurrentAccount(); if (!account) return jsonError("Unauthorized", 401);
  const { mediaId } = await context.params;
  const media = await getMedia(mediaId); if (!media) return jsonError("Not found", 404);
  return new Response(media.bytes, { headers: { "Content-Type": media.mimeType, "Content-Length": String(media.bytes.length), "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff", ETag: media.sha256 } });
}
