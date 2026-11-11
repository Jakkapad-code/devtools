import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";

// Called only by integration-smoke after its disposable-database safety checks.
export async function runChatPaginationSmoke(request, owner, partner, conversationId) {
  if (process.env.PETORY_INTEGRATION_DB !== "1") throw new Error("Chat smoke requires an isolated integration database");
  const url = new URL(process.env.DATABASE_URL);
  if (!["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Chat smoke refuses a non-local database");
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false });
  await db.connect();
  const prefix = `chat-pagination-smoke-${randomUUID()}`;
  const notificationIds = [];
  let insertedBlock = false;
  const path = `/api/conversations/${conversationId}/messages`;
  try {
    await db.query(`INSERT INTO messages (conversation_id, sender_id, body, created_at)
      SELECT $1, $2, $3 || '-' || n, '2021-01-01 00:00:00+00'::timestamptz + ((n / 2) * interval '1 microsecond')
      FROM generate_series(0, 204) n`, [conversationId, owner.id, prefix]);
    const expected = (await db.query(`SELECT id, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt"
      FROM messages WHERE conversation_id = $1 AND deleted_at IS NULL ORDER BY created_at, id`, [conversationId])).rows;
    assert(expected.length > 200);
    const read = async (cursor = "") => {
      const response = await request(`${path}${cursor}`, { cookie: owner.cookie });
      assert.equal(response.status, 200);
      return response.json();
    };
    const latest = await read();
    assert.equal(latest.messages.length, 100);
    assert.equal(latest.hasMore, true);
    assert.deepEqual(latest.messages.map(({ id, createdAt }) => ({ id, createdAt })), expected.slice(-100));

    let page = latest;
    let backwards = [...page.messages];
    while (page.hasMore) {
      page = await read(`?before=${page.messages[0].id}`);
      assert(page.messages.length > 0, "Older cursor must advance");
      backwards = page.messages.concat(backwards);
      assert(backwards.length <= expected.length, "Older pagination repeated messages");
    }
    assert.deepEqual(backwards.map(({ id }) => id), expected.map(({ id }) => id), "Backwards pagination lost or duplicated messages");
    let forwards = [backwards[0]];
    do {
      page = await read(`?after=${forwards.at(-1).id}`);
      forwards = forwards.concat(page.messages);
      assert(forwards.length <= expected.length && (!page.hasMore || page.messages.length > 0), "Forward polling did not advance");
    } while (page.hasMore);
    assert.deepEqual(forwards.map(({ id }) => id), expected.map(({ id }) => id), "Forward polling lost or duplicated messages");

    const insertNotification = async (accountId) => {
      const { rows } = await db.query(`INSERT INTO notifications (account_id, actor_id, type, resource_type, resource_id)
        VALUES ($1, NULL, 'message', 'conversation', $2) RETURNING id`, [accountId, conversationId]);
      notificationIds.push(rows[0].id);
      return rows[0].id;
    };
    const observed = await insertNotification(owner.id);
    const foreign = await insertNotification(partner.id);
    const listResponse = await request("/api/notifications", { cookie: owner.cookie });
    assert.equal(listResponse.status, 200);
    assert((await listResponse.json()).notifications.some((item) => item.id === observed && !item.readAt));
    const unseen = await insertNotification(owner.id);
    assert.equal((await request("/api/notifications/read", { method: "POST", cookie: owner.cookie, body: { ids: [observed, foreign] } })).status, 204);
    const result = await db.query(`SELECT id, read_at IS NOT NULL AS read FROM notifications WHERE id = ANY($1::uuid[])`, [notificationIds]);
    const readById = new Map(result.rows.map((row) => [row.id, row.read]));
    assert.equal(readById.get(observed), true);
    assert.equal(readById.get(unseen), false, "Notification created after list must remain unread");
    assert.equal(readById.get(foreign), false, "One owner cannot mark another owner's notification read");

    const existingBlock = await db.query("SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)", [owner.id, partner.id]);
    assert.equal(existingBlock.rowCount, 0, "Chat fixture requires unblocked owners");
    await db.query("INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)", [owner.id, partner.id]);
    insertedBlock = true;
    for (const account of [owner, partner]) {
      assert.equal((await request(path, { cookie: account.cookie })).status, 404);
      assert.equal((await request(path, { method: "POST", cookie: account.cookie, body: { body: "blocked" } })).status, 404);
    }
  } finally {
    if (insertedBlock) await db.query("DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2", [owner.id, partner.id]);
    if (notificationIds.length) await db.query("DELETE FROM notifications WHERE id = ANY($1::uuid[])", [notificationIds]);
    await db.query("DELETE FROM messages WHERE conversation_id = $1 AND left(body, length($2)) = $2", [conversationId, prefix]);
    await db.end();
  }
  assert.equal((await request(path, { cookie: owner.cookie })).status, 200, "Unblocking restores conversation access");
}
