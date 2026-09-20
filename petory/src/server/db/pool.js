import "server-only";
import pg from "pg";
import { getServerEnv } from "@/shared/config/env";

const { Pool } = pg;
let pool;

export function getPool() {
  if (!pool) {
    const { DATABASE_URL, DATABASE_SSL } = getServerEnv();
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_SSL ? { rejectUnauthorized: true } : false,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  return pool;
}

export function query(text, values) {
  return getPool().query(text, values);
}
