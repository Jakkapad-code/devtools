import "server-only";
import { query } from "@/server/db/pool";

/**
 * The console speaks the moderator's vocabulary, the schema speaks its own:
 * a queued report is 'open' in the table and "pending" on screen, and a
 * reported account is an 'account' row and a "user" card. Both directions are
 * translated here so no route or component has to know the other spelling.
 */
const STATUS_TO_DB = { pending: "open", resolved: "resolved", dismissed: "dismissed" };
const STATUS_FROM_DB = { open: "pending", reviewing: "pending", resolved: "resolved", dismissed: "dismissed" };
const TYPE_TO_DB = { user: "account", post: "post" };
const TYPE_FROM_DB = { account: "user", post: "post" };

/** Suspended right now: permanent (no end date) or still inside its window. */
const ACTIVE_SUSPENSION = "a.suspended_at IS NOT NULL AND (a.suspended_until IS NULL OR a.suspended_until > NOW())";

const SUSPENSION_FIELDS = `
  (${ACTIVE_SUSPENSION}) AS "isSuspended",
  a.suspended_until AS "suspendedUntil",
  a.suspension_reason AS "suspensionReason"`;

function toReportRow(row) {
  return {
    ...row,
    type: TYPE_FROM_DB[row.type] ?? row.type,
    status: STATUS_FROM_DB[row.status] ?? row.status,
  };
}

/**
 * One report with everything the detail pane shows: who was reported, whether
 * they are suspended, and — for a post report — the caption, even after the
 * post was soft-deleted, so a resolved report still reads as something.
 */
const REPORT_QUERY = `
  SELECT r.id, r.target_type AS type, r.target_id AS "targetId", r.reason, r.status,
         r.resolution, r.created_at AS "createdAt", r.resolved_at AS "resolvedAt",
         reporter.display_name AS "reporterName",
         COALESCE(owner.id, r.target_id) AS "ownerId",
         COALESCE(owner.display_name, 'บัญชีที่ถูกลบ') AS "targetName",
         owner.location_label AS "targetLocation",
         owner.avatar_media_id AS "targetAvatarMediaId",
         (SELECT COUNT(*)::integer FROM posts op WHERE op.author_id = owner.id AND op.deleted_at IS NULL) AS "targetPostCount",
         (owner.suspended_at IS NOT NULL AND (owner.suspended_until IS NULL OR owner.suspended_until > NOW())) AS "targetSuspended",
         rp.id AS "postId", rp.caption, rp.photo_media_id AS "postPhotoMediaId",
         rp.deleted_at IS NOT NULL AS "postDeleted"
  FROM reports r
  JOIN accounts reporter ON reporter.id = r.reporter_id
  LEFT JOIN posts rp ON r.target_type = 'post' AND rp.id = r.target_id
  LEFT JOIN accounts owner ON owner.id = CASE WHEN r.target_type = 'post' THEN rp.author_id ELSE r.target_id END`;

export async function listReports({ status = "all", type = "all" } = {}) {
  const values = [];
  const where = [];
  if (status !== "all") {
    // 'pending' covers both queue states a report can sit in.
    values.push(status === "pending" ? ["open", "reviewing"] : [STATUS_TO_DB[status]]);
    where.push(`r.status = ANY($${values.length}::text[])`);
  }
  if (type !== "all") {
    values.push(TYPE_TO_DB[type]);
    where.push(`r.target_type = $${values.length}`);
  }
  // Reports about pets or messages have no screen in the console yet.
  where.push("r.target_type IN ('account', 'post')");

  const result = await query(
    `${REPORT_QUERY} WHERE ${where.join(" AND ")} ORDER BY r.created_at DESC LIMIT 200`,
    values
  );
  return result.rows.map(toReportRow);
}

export async function getReport(reportId) {
  const result = await query(`${REPORT_QUERY} WHERE r.id = $1`, [reportId]);
  return result.rows[0] ? toReportRow(result.rows[0]) : null;
}

/** Counts for the KPI tiles and every filter chip, in one round trip. */
export async function countReportsByStatus() {
  const result = await query(
    `SELECT status, COUNT(*)::integer AS count FROM reports
     WHERE target_type IN ('account', 'post') GROUP BY status`
  );
  const counts = { pending: 0, resolved: 0, dismissed: 0 };
  result.rows.forEach((row) => { counts[STATUS_FROM_DB[row.status]] += row.count; });
  return counts;
}

/** The dashboard's "รายงานตามเหตุผล" bars: one row per type + reason. */
export async function tallyReportReasons() {
  const result = await query(
    `SELECT target_type AS type, reason, COUNT(*)::integer AS count
     FROM reports WHERE target_type IN ('account', 'post')
     GROUP BY target_type, reason ORDER BY count DESC`
  );
  return result.rows.map((row) => ({ ...row, type: TYPE_FROM_DB[row.type] }));
}

export async function listRecentActions(limit = 6) {
  const result = await query(
    `SELECT m.id, m.action, m.detail, m.created_at AS "createdAt", actor.display_name AS "actorName"
     FROM moderation_actions m
     LEFT JOIN accounts actor ON actor.id = m.actor_id
     ORDER BY m.created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function recordAction(actorId, action, targetType, targetId, detail = "") {
  await query(
    `INSERT INTO moderation_actions (actor_id, action, target_type, target_id, detail)
     VALUES ($1, $2, $3, $4, $5)`,
    [actorId, action, targetType, targetId, detail]
  );
}

/**
 * Every account except the operator's own, with the two numbers the table
 * sorts by. A report filed against one of someone's posts counts against them
 * too — that is what "ถูกรายงาน" means to a moderator.
 */
export async function listUsers({ search = "", viewerId } = {}) {
  const values = [viewerId];
  let where = "a.deleted_at IS NULL AND a.id <> $1";
  if (search) {
    values.push(`%${search}%`);
    where += ` AND (a.display_name ILIKE $${values.length} OR a.email ILIKE $${values.length})`;
  }
  const result = await query(
    `SELECT a.id, a.display_name AS "name", a.email, a.location_label AS "location",
            a.avatar_media_id AS "avatarMediaId", a.role, ${SUSPENSION_FIELDS},
            (SELECT COUNT(*)::integer FROM posts p WHERE p.author_id = a.id AND p.deleted_at IS NULL) AS "postCount",
            (SELECT COUNT(*)::integer FROM reports r
               WHERE (r.target_type = 'account' AND r.target_id = a.id)
                  OR (r.target_type = 'post' AND r.target_id IN (SELECT p.id FROM posts p WHERE p.author_id = a.id))
            ) AS "reportCount"
     FROM accounts a WHERE ${where}
     ORDER BY "reportCount" DESC, a.display_name ASC LIMIT 200`,
    values
  );
  return result.rows;
}

export async function listPosts({ search = "" } = {}) {
  const values = [];
  let where = "p.deleted_at IS NULL";
  if (search) {
    values.push(`%${search}%`);
    where += ` AND (p.caption ILIKE $${values.length} OR a.display_name ILIKE $${values.length})`;
  }
  const result = await query(
    `SELECT p.id, p.caption, p.category, p.photo_media_id AS "photoMediaId",
            p.created_at AS "createdAt", p.author_id AS "authorId",
            a.display_name AS "authorName",
            (SELECT COUNT(*)::integer FROM reports r
               WHERE r.target_type = 'post' AND r.target_id = p.id AND r.status IN ('open', 'reviewing')) AS "reportCount"
     FROM posts p JOIN accounts a ON a.id = p.author_id
     WHERE ${where}
     ORDER BY "reportCount" DESC, p.created_at DESC LIMIT 200`,
    values
  );
  return result.rows;
}

export async function countPosts() {
  const result = await query(`SELECT COUNT(*)::integer AS count FROM posts WHERE deleted_at IS NULL`);
  return result.rows[0].count;
}

export async function countRemovedPosts() {
  const result = await query(`SELECT COUNT(*)::integer AS count FROM posts WHERE deleted_at IS NOT NULL`);
  return result.rows[0].count;
}

export async function countAccounts() {
  const result = await query(`SELECT COUNT(*)::integer AS count FROM accounts WHERE deleted_at IS NULL`);
  return result.rows[0].count;
}

export async function countSuspended() {
  const result = await query(
    `SELECT COUNT(*)::integer AS count FROM accounts a WHERE a.deleted_at IS NULL AND ${ACTIVE_SUSPENSION}`
  );
  return result.rows[0].count;
}

export async function getPost(postId) {
  const result = await query(
    `SELECT p.id, p.caption, p.author_id AS "authorId", a.display_name AS "authorName", p.deleted_at AS "deletedAt"
     FROM posts p JOIN accounts a ON a.id = p.author_id WHERE p.id = $1`,
    [postId]
  );
  return result.rows[0] ?? null;
}

export async function getAccount(accountId) {
  const result = await query(
    `SELECT a.id, a.display_name AS "name", a.role, ${SUSPENSION_FIELDS}
     FROM accounts a WHERE a.id = $1 AND a.deleted_at IS NULL`,
    [accountId]
  );
  return result.rows[0] ?? null;
}

/** Soft-deletes the post and closes the reports that asked for it. */
export async function removePost(postId, resolution, moderatorId) {
  await query(`UPDATE posts SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, [postId]);
  await query(
    `UPDATE reports SET status = 'resolved', resolution = $2, resolved_at = NOW(), resolved_by = $3
     WHERE target_type = 'post' AND target_id = $1 AND status IN ('open', 'reviewing')`,
    [postId, resolution, moderatorId]
  );
}

/**
 * Suspending closes every open report against the account and against its
 * posts: the operator has already ruled on that person, so leaving the rest of
 * the queue open would only ask them to rule again.
 */
export async function suspendAccount({ accountId, until, reason, resolution, moderatorId }) {
  await query(
    `UPDATE accounts SET suspended_at = NOW(), suspended_until = $2, suspension_reason = $3, suspended_by = $4
     WHERE id = $1 AND deleted_at IS NULL`,
    [accountId, until, reason, moderatorId]
  );
  await query(
    `UPDATE reports SET status = 'resolved', resolution = $2, resolved_at = NOW(), resolved_by = $3
     WHERE status IN ('open', 'reviewing')
       AND ((target_type = 'account' AND target_id = $1)
            OR (target_type = 'post' AND target_id IN (SELECT id FROM posts WHERE author_id = $1)))`,
    [accountId, resolution, moderatorId]
  );
  // Suspension has to end the sessions too, or the account stays signed in.
  await query(`DELETE FROM sessions WHERE account_id = $1`, [accountId]);
}

export async function unsuspendAccount(accountId) {
  await query(
    `UPDATE accounts SET suspended_at = NULL, suspended_until = NULL, suspension_reason = NULL, suspended_by = NULL
     WHERE id = $1`,
    [accountId]
  );
}

export async function resolveReport({ reportId, status, resolution, moderatorId }) {
  const result = await query(
    `UPDATE reports SET status = $2, resolution = $3, resolved_at = NOW(), resolved_by = $4
     WHERE id = $1 RETURNING id`,
    [reportId, STATUS_TO_DB[status], resolution, moderatorId]
  );
  return result.rows[0] ?? null;
}
