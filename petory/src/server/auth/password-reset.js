import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getPool, query } from "@/server/db/pool";
import { hashPassword } from "@/server/auth/password";
import { getAppConfig } from "@/server/config/config.app";
import { sendPasswordResetEmail } from "./reset-mail";

function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

/** The same public response is returned whether or not an account exists. */
export async function requestPasswordReset(email, send = sendPasswordResetEmail) {
  const config = getAppConfig();
  if (config.mail.provider === "disabled") return { configured: false };
  const account = await query("SELECT id FROM accounts WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL", [email]);
  if (!account.rows[0]) return { configured: true };

  const token = randomBytes(32).toString("base64url");
  const hash = tokenHash(token);
  await query(
    `INSERT INTO password_reset_tokens (account_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 minute'))`,
    [account.rows[0].id, hash, config.passwordResetTtlMinutes]
  );
  const resetUrl = new URL("/petory/reset", config.appUrl);
  resetUrl.searchParams.set("token", token);
  try {
    await send(email, resetUrl.toString(), config.mail);
  } catch {
    await query("UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1", [hash]);
    console.error("Password reset email delivery failed");
  }
  return { configured: true };
}

/** Consuming the token, changing the password and ending sessions are atomic. */
export async function resetPassword(token, password) {
  const passwordHash = await hashPassword(password);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const consumed = await client.query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       RETURNING account_id`,
      [tokenHash(token)]
    );
    if (!consumed.rows[0]) {
      await client.query("ROLLBACK");
      return false;
    }
    const accountId = consumed.rows[0].account_id;
    const account = await client.query(
      "UPDATE accounts SET password_hash = $2 WHERE id = $1 AND deleted_at IS NULL RETURNING id",
      [accountId, passwordHash]
    );
    if (!account.rows[0]) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query("DELETE FROM sessions WHERE account_id = $1", [accountId]);
    await client.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE account_id = $1 AND used_at IS NULL", [accountId]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
