import "server-only";
import { headers } from "next/headers";
import { getServerEnv } from "@/shared/config/env";
import { isAllowedOrigin } from "./origin-policy";

/** Call this before every state-changing Server Action or Route Handler. */
export async function requireSameOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? requestHeaders.get("referer");
  const env = getServerEnv();

  if (!isAllowedOrigin(origin, env.NEXT_PUBLIC_APP_URL, env.ALLOWED_ORIGINS)) {
    throw new Error("Forbidden cross-origin request");
  }
}
