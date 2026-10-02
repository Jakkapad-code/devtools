import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { query } from "@/server/db/pool";
import { getServerEnv } from "@/shared/config/env";
import { getAppConfig } from "@/server/config/config.app";

const SESSION_COOKIE = "petory_session";

function hashToken(token) {
  return createHash("sha256").update(token).digest("base64url");
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: getServerEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getAppConfig().sessionLifetimeSeconds,
  };
}

export async function createSession(accountId) {
  const token = randomBytes(32).toString("base64url");
  await query(
    `INSERT INTO sessions (account_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 second'))`,
    [accountId, hashToken(token), getAppConfig().sessionLifetimeSeconds]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, cookieOptions());
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
  }
  cookieStore.set(SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

export async function getCurrentAccount() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const result = await query(
    `SELECT a.id, a.email, a.display_name, a.bio, a.phone, a.location_label, a.avatar_url,
            a.avatar_media_id AS "avatarMediaId", a.matching_purpose AS "matchingPurpose", a.created_at,
            a.role
     FROM sessions s
     JOIN accounts a ON a.id = s.account_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW() AND a.deleted_at IS NULL
       AND (a.suspended_at IS NULL OR (a.suspended_until IS NOT NULL AND a.suspended_until <= NOW()))`,
    [hashToken(token)]
  );

  return result.rows[0] ?? null;
}

export async function getAccountById(accountId) {
  const result = await query(
    `SELECT a.id, a.email, a.display_name, a.bio, a.phone, a.location_label, a.avatar_url,
            a.avatar_media_id AS "avatarMediaId", a.matching_purpose AS "matchingPurpose", a.created_at,
            a.role,
            (SELECT COUNT(*)::integer FROM follows f JOIN accounts fa ON fa.id = f.follower_id
               WHERE f.followed_id = a.id AND fa.deleted_at IS NULL) AS "followerCount",
            (SELECT COUNT(*)::integer FROM follows f JOIN accounts fa ON fa.id = f.followed_id
               WHERE f.follower_id = a.id AND fa.deleted_at IS NULL) AS "followingCount"
     FROM accounts a
     WHERE a.id = $1 AND a.deleted_at IS NULL`,
    [accountId]
  );
  return result.rows[0] ?? null;
}

export async function requireCurrentAccount() {
  const account = await getCurrentAccount();
  if (!account) throw new Error("Unauthorized");
  return account;
}

/**
 * The gate on every admin route. It is a separate error from Unauthorized so a
 * signed-in member gets 403 rather than being told to sign in again.
 */
export async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account) throw new Error("Unauthorized");
  if (account.role !== "admin") throw new Error("Forbidden");
  return account;
}
