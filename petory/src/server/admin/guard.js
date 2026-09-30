import "server-only";
import { requireAdmin } from "@/server/auth/session";
import { jsonError } from "@/server/http/response";

/**
 * Every admin route funnels its failures through one place so a missing role,
 * a stale session and a cross-origin write all answer with the same shape.
 * Returns { account } on success or { response } to return as-is.
 */
export async function adminGuard() {
  try {
    return { account: await requireAdmin() };
  } catch (error) {
    if (error?.message === "Forbidden") return { response: jsonError("Admin access required", 403) };
    if (error?.message === "Unauthorized") return { response: jsonError("Unauthorized", 401) };
    throw error;
  }
}

export function adminError(error, fallback) {
  if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
  return jsonError(fallback, 500);
}
