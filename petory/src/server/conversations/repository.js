import "server-only";
import { query } from "@/server/db/pool";

export async function listConversations(accountId) {
  const result = await query(
    `SELECT c.id, c.match_id AS "matchId", c.created_at AS "createdAt", mt.created_at AS "matchedAt",
      p.id AS "petId", p.name AS "petName", p.photo_media_id AS "petPhotoMediaId", a.display_name AS "ownerName",
      a.avatar_media_id AS "ownerAvatarMediaId",
      mine.id AS "myPetId", mine.name AS "myPetName", mine.photo_media_id AS "myPetPhotoMediaId",
      last.body AS "lastMessage", last.created_at AS "lastMessageAt"
     FROM conversations c JOIN conversation_members self ON self.conversation_id = c.id AND self.account_id = $1
     JOIN matches mt ON mt.id = c.match_id AND mt.status = 'active'
     JOIN pets p ON p.id = CASE WHEN mt.pet_a_id IN (SELECT id FROM pets WHERE owner_id = $1) THEN mt.pet_b_id ELSE mt.pet_a_id END
     JOIN pets mine ON mine.id = CASE WHEN mt.pet_a_id IN (SELECT id FROM pets WHERE owner_id = $1) THEN mt.pet_a_id ELSE mt.pet_b_id END
     JOIN accounts a ON a.id = p.owner_id
     LEFT JOIN LATERAL (
       SELECT m.body, m.created_at FROM messages m
       WHERE m.conversation_id = c.id AND m.deleted_at IS NULL
       ORDER BY m.created_at DESC LIMIT 1
     ) last ON TRUE
     WHERE c.closed_at IS NULL AND a.deleted_at IS NULL AND p.deleted_at IS NULL AND mine.deleted_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = a.id) OR (b.blocker_id = a.id AND b.blocked_id = $1))
     ORDER BY COALESCE(last.created_at, c.created_at) DESC`, [accountId]
  );
  return result.rows;
}

async function canUseConversation(accountId, conversationId) {
  const result = await query(`SELECT 1 FROM conversations c
    JOIN conversation_members self ON self.conversation_id = c.id AND self.account_id = $2
    JOIN matches mt ON mt.id = c.match_id AND mt.status = 'active'
    WHERE c.id = $1 AND c.closed_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM conversation_members other
        JOIN blocks b ON (b.blocker_id = $2 AND b.blocked_id = other.account_id)
          OR (b.blocker_id = other.account_id AND b.blocked_id = $2)
        WHERE other.conversation_id = c.id AND other.account_id <> $2
      )`, [conversationId, accountId]);
  return Boolean(result.rows[0]);
}

export async function listMessages(accountId, conversationId) {
  if (!await canUseConversation(accountId, conversationId)) return null;
  const result = await query(`SELECT id, sender_id AS "senderId", body, created_at AS "createdAt" FROM messages WHERE conversation_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 100`, [conversationId]);
  return result.rows;
}

export async function addMessage(accountId, conversationId, body) {
  if (!await canUseConversation(accountId, conversationId)) return null;
  const result = await query(`INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3) RETURNING id, sender_id AS "senderId", body, created_at AS "createdAt"`, [conversationId, accountId, body]);
  const recipient = await query(`SELECT account_id FROM conversation_members WHERE conversation_id = $1 AND account_id <> $2`, [conversationId, accountId]);
  if (recipient.rows[0]) await query(`INSERT INTO notifications (account_id, actor_id, type, resource_type, resource_id) VALUES ($1, $2, 'message', 'conversation', $3)`, [recipient.rows[0].account_id, accountId, conversationId]);
  return result.rows[0];
}
