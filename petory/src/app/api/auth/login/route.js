import { NextResponse } from "next/server";
import { loginSchema } from "@/features/auth/schema";
import { verifyPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { query } from "@/server/db/pool";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

export async function POST(request) {
  try {
    await requireSameOrigin();
    const input = loginSchema.safeParse(await request.json());
    if (!input.success) return jsonError("Invalid email or password", 422);

    const result = await query(
      `SELECT id, email, display_name, password_hash
       FROM accounts
       WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`,
      [input.data.email]
    );
    const account = result.rows[0];
    if (!account || !(await verifyPassword(input.data.password, account.password_hash))) {
      return jsonError("Invalid email or password", 401);
    }

    await createSession(account.id);
    return NextResponse.json({
      account: { id: account.id, email: account.email, displayName: account.display_name },
    });
  } catch (error) {
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    return jsonError("Unable to sign in", 500);
  }
}
