import { NextResponse } from "next/server";
import { registerSchema } from "@/features/auth/schema";
import { hashPassword } from "@/server/auth/password";
import { createSession, getAccountById } from "@/server/auth/session";
import { query } from "@/server/db/pool";
import { isUniqueViolation, jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";
import { checkRateLimit, rateLimitResponse } from "@/server/security/rate-limit";

export async function POST(request) {
  try {
    await requireSameOrigin();
    const input = registerSchema.safeParse(await request.json());
    if (!input.success) return jsonError("Invalid registration data", 422);
    const globalLimit = await checkRateLimit("registerGlobal", "all");
    if (!globalLimit.allowed) return rateLimitResponse(globalLimit.retryAfter);
    const limit = await checkRateLimit("register", input.data.email);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const passwordHash = await hashPassword(input.data.password);
    const result = await query(
      `INSERT INTO accounts (display_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [input.data.displayName, input.data.email, passwordHash]
    );
    const accountId = result.rows[0].id;
    await createSession(accountId);
    return NextResponse.json({ account: await getAccountById(accountId) }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("An account with this email already exists", 409);
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    console.error("POST /api/auth/register failed:", error);
    return jsonError("Unable to create account", 500);
  }
}
