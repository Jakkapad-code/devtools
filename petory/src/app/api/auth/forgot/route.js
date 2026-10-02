import { z } from "zod";
import { requestPasswordReset } from "@/server/auth/password-reset";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";
import { checkRateLimit, rateLimitResponse } from "@/server/security/rate-limit";

const requestSchema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email()) });

export async function POST(request) {
  try {
    await requireSameOrigin();
    const input = requestSchema.safeParse(await request.json());
    if (!input.success) return jsonError("Invalid email", 422);
    const globalLimit = await checkRateLimit("resetRequestGlobal", "all");
    if (!globalLimit.allowed) return rateLimitResponse(globalLimit.retryAfter);
    const limit = await checkRateLimit("resetRequest", input.data.email);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);
    const result = await requestPasswordReset(input.data.email);
    if (!result.configured) return jsonError("Password reset email is not configured", 503);
    return Response.json({ message: "If this email has an account, a reset link will be sent." });
  } catch (error) {
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    return jsonError("Unable to request password reset", 500);
  }
}
