import { NextResponse } from "next/server";
import { registerSchema } from "@/features/auth/schema";
import { hashPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { query } from "@/server/db/pool";
import { isUniqueViolation, jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

export async function POST(request) {
  try {
    await requireSameOrigin();
    const input = registerSchema.safeParse(await request.json());
    if (!input.success) return jsonError("Invalid registration data", 422);

    const passwordHash = await hashPassword(input.data.password);
    const result = await query(
      `INSERT INTO accounts (display_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name`,
      [input.data.displayName, input.data.email, passwordHash]
    );
    const account = result.rows[0];
    await createSession(account.id);
    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("An account with this email already exists", 409);
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    return jsonError("Unable to create account", 500);
  }
}
