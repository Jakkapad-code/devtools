import "server-only";
import { getServerEnv } from "@/shared/config/env";

/** One DB policy for the Next.js process; CLI scripts use parseDatabaseEnv. */
export function getDbConfig() {
  const env = getServerEnv();
  return {
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: true } : false,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
  };
}
