/**
 * Manages the admin role from outside the app.
 *
 * There is no way to make the first admin from inside it — the console is gated
 * on a role only an admin could hand out — so it is done here.
 *
 *   node scripts/promote-admin.mjs --list
 *   node scripts/promote-admin.mjs someone@example.com                       # promote an existing account
 *   node scripts/promote-admin.mjs someone@example.com --revoke              # back to member
 *   node scripts/promote-admin.mjs admin@petory.co --create --password=...   # new admin account
 *
 * --create reuses the app's own scrypt hashing, so the account signs in through
 * the normal login form like any other.
 */
import process from "node:process";
import nextEnv from "@next/env";
import pg from "pg";
import { hashPassword } from "../src/server/auth/password.js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const args = process.argv.slice(2);
const list = args.includes("--list");
const revoke = args.includes("--revoke");
const create = args.includes("--create");
const password = args.find((arg) => arg.startsWith("--password="))?.slice("--password=".length);
const name = args.find((arg) => arg.startsWith("--name="))?.slice("--name=".length);
const email = args.find((arg) => !arg.startsWith("--"));

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (!list && !email) throw new Error("Usage: node scripts/promote-admin.mjs <email> [--revoke] [--create --password=...] | --list");
if (create && (!password || password.length < 8)) throw new Error("--create needs --password= of at least 8 characters.");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  if (list) {
    const result = await client.query(
      `SELECT email, display_name, role,
              (suspended_at IS NOT NULL AND (suspended_until IS NULL OR suspended_until > NOW())) AS suspended
       FROM accounts WHERE deleted_at IS NULL ORDER BY role DESC, created_at`
    );
    console.table(result.rows);
  } else if (create) {
    const existing = await client.query(
      `SELECT id FROM accounts WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`, [email]
    );
    if (existing.rowCount) {
      // Re-running should be safe: reset the password and make sure it is admin.
      const result = await client.query(
        `UPDATE accounts SET password_hash = $2, role = 'admin' WHERE id = $1
         RETURNING email, display_name, role`,
        [existing.rows[0].id, await hashPassword(password)]
      );
      console.log("Updated existing account:", result.rows[0]);
    } else {
      const result = await client.query(
        `INSERT INTO accounts (email, password_hash, display_name, role)
         VALUES ($1, $2, $3, 'admin') RETURNING email, display_name, role`,
        [email, await hashPassword(password), name || "ผู้ดูแลระบบ"]
      );
      console.log("Created:", result.rows[0]);
    }
  } else {
    const result = await client.query(
      `UPDATE accounts SET role = $2 WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL
       RETURNING email, display_name, role`,
      [email, revoke ? "member" : "admin"]
    );
    if (!result.rowCount) {
      console.error(`No account found for ${email}`);
      process.exitCode = 1;
    } else {
      console.log(result.rows[0]);
    }
  }
} finally {
  await client.end();
}
