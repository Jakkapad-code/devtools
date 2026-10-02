import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/schema";
import { resetPassword } from "@/server/auth/password-reset";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";
import { checkRateLimit, rateLimitResponse } from "@/server/security/rate-limit";

const resetSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(128),
});

export async function POST(request) {
  try {
    await requireSameOrigin();
    const input = resetSchema.safeParse(await request.json());
    if (!input.success) return jsonError("Invalid reset data", 422);
    const limit = await checkRateLimit("resetConfirm", input.data.token);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);
    const changed = await resetPassword(input.data.token, input.data.password);
    return changed ? Response.json({ reset: true }) : jsonError("Reset link is invalid or expired", 400);
  } catch (error) {
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    return jsonError("Unable to reset password", 500);
  }
}
