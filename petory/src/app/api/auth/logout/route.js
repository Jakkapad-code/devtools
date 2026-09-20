import { NextResponse } from "next/server";
import { clearSession } from "@/server/auth/session";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

export async function POST() {
  try {
    await requireSameOrigin();
    await clearSession();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    return jsonError("Unable to sign out", 500);
  }
}
