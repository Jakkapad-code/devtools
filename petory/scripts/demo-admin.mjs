import process from "node:process";
import { pathToFileURL } from "node:url";
import nextEnv from "@next/env";
import pg from "pg";
import { hashPassword } from "../src/server/auth/password.js";
import { parseDatabaseEnv } from "../src/shared/config/env-schema.js";

// Public credentials for disposable demonstration data only, never production.
export const DEMO_ADMIN_EMAIL = "admin@petory.local";
export const DEMO_ADMIN_PASSWORD = "petory-admin-password-2026";

/** Caller must hold a transaction. Never promote or reset an existing account. */
export async function ensureDemoAdmin(client) {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to create a demo admin in production.");
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["petory-demo-admin"]);
  const safety = await client.query("SELECT COUNT(*)::integer AS count FROM accounts WHERE email NOT LIKE '%@petory.local'");
  if (safety.rows[0].count !== 0) throw new Error("Refusing to create a demo admin in a database with non-demo accounts.");
  const existing = await client.query("SELECT role FROM accounts WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL", [DEMO_ADMIN_EMAIL]);
  if (existing.rows[0]) {
    if (existing.rows[0].role !== "admin") throw new Error("Demo admin email is already used by a non-admin account; no changes were made.");
    return false;
  }
  await client.query("INSERT INTO accounts (email, display_name, password_hash, role) VALUES ($1, $2, $3, 'admin')", [
    DEMO_ADMIN_EMAIL, "Petory Demo Admin", await hashPassword(DEMO_ADMIN_PASSWORD),
  ]);
  return true;
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to create a demo admin in production.");
  nextEnv.loadEnvConfig(process.cwd());
  const database = parseDatabaseEnv(process.env);
  const client = new pg.Client({ connectionString: database.DATABASE_URL, ssl: database.DATABASE_SSL ? { rejectUnauthorized: true } : false, connectionTimeoutMillis: database.DB_CONNECTION_TIMEOUT_MS });
  await client.connect();
  try {
    await client.query("BEGIN");
    const created = await ensureDemoAdmin(client);
    await client.query("COMMIT");
    console.log(created ? "Demo admin created." : "Demo admin already exists; its password was not changed.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
