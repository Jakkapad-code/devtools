import "server-only";
import { createHmac } from "node:crypto";
import { query } from "@/server/db/pool";
import { getServerEnv } from "@/shared/config/env";
import { getAppConfig } from "@/server/config/config.app";

/** Persistent, atomic counters work with more than one Next.js process. */
export async function checkRateLimit(scope, subject) {
  const policy = getAppConfig().rateLimits[scope];
  if (!policy) throw new Error(`Unknown rate limit scope: ${scope}`);
  const keyHash = createHmac("sha256", getServerEnv().SESSION_SECRET)
    .update(`${scope}:${String(subject).toLowerCase()}`).digest("hex");
  const result = await query(`
    INSERT INTO rate_limit_counters (scope, key_hash, window_started_at, attempts)
    VALUES ($1, $2, NOW(), 1)
    ON CONFLICT (scope, key_hash) DO UPDATE SET
      attempts = CASE
        WHEN rate_limit_counters.window_started_at <= NOW() - ($3 * INTERVAL '1 second') THEN 1
        ELSE rate_limit_counters.attempts + 1
      END,
      window_started_at = CASE
        WHEN rate_limit_counters.window_started_at <= NOW() - ($3 * INTERVAL '1 second') THEN NOW()
        ELSE rate_limit_counters.window_started_at
      END
    RETURNING attempts,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (window_started_at + ($3 * INTERVAL '1 second') - NOW()))))::integer AS "retryAfter"`,
    [scope, keyHash, policy.windowSeconds]);
  const counter = result.rows[0];
  return counter.attempts <= policy.attempts
    ? { allowed: true, retryAfter: 0 }
    : { allowed: false, retryAfter: counter.retryAfter };
}

export function rateLimitResponse(retryAfter) {
  return Response.json({ error: "Too many requests. Please try again later." }, {
    status: 429,
    headers: { "Retry-After": String(retryAfter) },
  });
}
