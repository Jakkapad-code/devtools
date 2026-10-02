import { NextResponse } from "next/server";
import { loginSchema } from "@/features/auth/schema";
import { verifyPassword } from "@/server/auth/password";
import { createSession, getAccountById } from "@/server/auth/session";
import { query } from "@/server/db/pool";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";
import { checkRateLimit, rateLimitResponse } from "@/server/security/rate-limit";

export async function POST(request) {
  try {
    await requireSameOrigin();
    const input = loginSchema.safeParse(await request.json());
    if (!input.success) return jsonError("Invalid email or password", 422);
    const globalLimit = await checkRateLimit("loginGlobal", "all");
    if (!globalLimit.allowed) return rateLimitResponse(globalLimit.retryAfter);
    const limit = await checkRateLimit("login", input.data.email);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const result = await query(
      `SELECT id, email, display_name, password_hash, suspension_reason,
              (suspended_at IS NOT NULL AND (suspended_until IS NULL OR suspended_until > NOW())) AS suspended,
              suspended_until
       FROM accounts
       WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`,
      [input.data.email]
    );
    const account = result.rows[0];
    if (!account || !(await verifyPassword(input.data.password, account.password_hash))) {
      return jsonError("Invalid email or password", 401);
    }

    // Checked after the password so a wrong password cannot be used to discover
    // which accounts are suspended.
    if (account.suspended) {
      const until = account.suspended_until
        ? `ถึง ${new Date(account.suspended_until).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`
        : "ถาวร";
      return jsonError(`บัญชีนี้ถูกระงับ (${until}) · ${account.suspension_reason || "ผิดกฎของชุมชน"}`, 403);
    }

    await createSession(account.id);
    return NextResponse.json({ account: await getAccountById(account.id) });
  } catch (error) {
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    return jsonError("Unable to sign in", 500);
  }
}
