import "server-only";
import pg from "pg";
import { getDbConfig } from "@/server/config/config.db";

const { Pool } = pg;
let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool(getDbConfig());
  }

  return pool;
}

export function query(text, values) {
  return getPool().query(text, values);
}
