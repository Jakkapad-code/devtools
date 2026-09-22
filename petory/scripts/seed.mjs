import nextEnv from "@next/env";
import pg from "pg";
import { hashPassword } from "../src/server/auth/password.js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed a production database.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to seed.");

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false });
const passwordHash = await hashPassword("petory-demo-password-2026");
const people = [
  ["Aom Supaporn", "aom"], ["Niran Kittisak", "niran"], ["Mali Wattan", "mali"], ["Beam Rattan", "beam"], ["Ploy Chai", "ploy"], ["Tee Somchai", "tee"], ["Nok Napat", "nok"], ["Korn P", "korn"],
];
const petTemplates = [["Mochi", "Dog", "Shiba Inu", "Male", "Medium"], ["Luna", "Dog", "Golden Retriever", "Female", "Large"], ["Milo", "Cat", "British Shorthair", "Male", "Medium"], ["Coco", "Dog", "Toy Poodle", "Female", "Small"], ["Simba", "Cat", "Maine Coon", "Male", "Large"], ["Bella", "Dog", "Corgi", "Female", "Medium"], ["Whiskers", "Cat", "Domestic Shorthair", "Female", "Small"], ["Buddy", "Dog", "Labrador", "Male", "Large"]];
const captions = ["เช้านี้พาไปวิ่งที่สวน สนุกมาก!", "ใครมีร้าน pet friendly แนะนำบ้างครับ", "สูตรขนมง่ายๆ สำหรับน้องหมา", "ตรวจสุขภาพประจำปีเรียบร้อย", "วันนี้นอนทั้งวันเลย", "เจอเพื่อนใหม่ที่สวนแล้ว", "เทคนิคฝึกให้น้องกินอาหารเม็ด", "พาไปคาเฟ่ครั้งแรก", "ดูนกที่หน้าต่างทั้งบ่าย", "วันหยุดกับสัตว์เลี้ยงของเรา"];

await client.connect();
try {
  await client.query("BEGIN");
  await client.query("DELETE FROM accounts WHERE email LIKE '%@petory.local'");
  const accounts = [];
  for (const [name, slug] of people) {
    const result = await client.query(`INSERT INTO accounts (display_name, email, password_hash, bio, location_label) VALUES ($1, $2, $3, $4, 'Bangkok') RETURNING id`, [name, `${slug}@petory.local`, passwordHash, `รักสัตว์และกำลังหาเพื่อนใหม่ให้สัตว์เลี้ยง`]);
    accounts.push({ id: result.rows[0].id, name });
  }
  const pets = [];
  for (const [index, pet] of petTemplates.entries()) {
    const result = await client.query(`INSERT INTO pets (owner_id, name, species, breed, gender, size, birth_date, bio, personality, interests) VALUES ($1, $2, $3, $4, $5, $6, '2023-01-01', $7, $8, $9) RETURNING id`, [accounts[index].id, pet[0], pet[1], pet[2], pet[3], pet[4], `${pet[0]} พร้อมเล่นและชอบเจอเพื่อนใหม่`, ["Friendly", index % 2 ? "Playful" : "Calm"], ["Walks", "Treats", "Park"]]);
    pets.push({ id: result.rows[0].id, ownerId: accounts[index].id, name: pet[0] });
  }
  for (let index = 0; index < 32; index += 1) {
    await client.query(`INSERT INTO posts (author_id, pet_id, category, title, caption, location_label, created_at) VALUES ($1, $2, $3, $4, $5, 'Bangkok', NOW() - ($6 * INTERVAL '1 hour'))`, [accounts[index % accounts.length].id, pets[index % pets.length].id, index % 3 === 0 ? "story" : index % 3 === 1 ? "tips" : "place", index % 3 === 1 ? `Pet tip #${index + 1}` : null, captions[index % captions.length], index]);
  }
  const postRows = (await client.query("SELECT id, author_id FROM posts WHERE author_id = ANY($1::uuid[]) ORDER BY created_at DESC", [accounts.map((account) => account.id)])).rows;
  for (const [index, post] of postRows.entries()) {
    const actor = accounts[(index + 1) % accounts.length];
    if (actor.id !== post.author_id) {
      await client.query("INSERT INTO post_likes (post_id, account_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [post.id, actor.id]);
      await client.query("INSERT INTO post_comments (post_id, author_id, body, created_at) VALUES ($1, $2, $3, NOW() - ($4 * INTERVAL '1 minute'))", [post.id, actor.id, ["น่ารักมากเลย!", "ไว้เจอกันที่สวนครับ", "ขอบคุณสำหรับทิปนะ", "อยากพาน้องไปบ้างจัง"][index % 4], index]);
      if (index < 12) await client.query("INSERT INTO notifications (account_id, actor_id, type, resource_type, resource_id) VALUES ($1, $2, 'like', 'post', $3)", [post.author_id, actor.id, post.id]);
    }
  }
  for (const [index, account] of accounts.entries()) {
    const followed = accounts[(index + 1) % accounts.length];
    await client.query("INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [account.id, followed.id]);
    if (index % 2 === 0) await client.query("INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [account.id, accounts[(index + 2) % accounts.length].id]);
  }
  const pairs = [[0, 1], [2, 3], [4, 5]];
  for (const [left, right] of pairs) {
    const petA = pets[left];
    const petB = pets[right];
    const [petOneId, petTwoId] = [petA.id, petB.id].sort();
    await client.query("INSERT INTO match_interactions (actor_pet_id, target_pet_id, action) VALUES ($1, $2, 'interest') ON CONFLICT (actor_pet_id, target_pet_id) DO UPDATE SET action = 'interest'", [petA.id, petB.id]);
    await client.query("INSERT INTO match_interactions (actor_pet_id, target_pet_id, action) VALUES ($1, $2, 'interest') ON CONFLICT (actor_pet_id, target_pet_id) DO UPDATE SET action = 'interest'", [petB.id, petA.id]);
    const match = await client.query("INSERT INTO matches (pet_a_id, pet_b_id, status) VALUES ($1, $2, 'active') ON CONFLICT (pet_a_id, pet_b_id) DO UPDATE SET status = 'active' RETURNING id", [petOneId, petTwoId]);
    const conversation = await client.query("INSERT INTO conversations (match_id) VALUES ($1) ON CONFLICT (match_id) DO UPDATE SET match_id = EXCLUDED.match_id RETURNING id", [match.rows[0].id]);
    for (const accountId of [petA.ownerId, petB.ownerId]) await client.query("INSERT INTO conversation_members (conversation_id, account_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [conversation.rows[0].id, accountId]);
    await client.query("INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3), ($1, $4, $5)", [conversation.rows[0].id, petA.ownerId, `สวัสดีจาก ${petA.name}! ไว้พาน้องไปเจอกันนะ`, petB.ownerId, `ได้เลย ${petB.name} พร้อมมาก!`]);
    await client.query("INSERT INTO notifications (account_id, actor_id, type, resource_type, resource_id) VALUES ($1, $2, 'match', 'match', $3)", [petA.ownerId, petB.ownerId, match.rows[0].id]);
  }
  await client.query("COMMIT");
  console.log(`Seeded ${accounts.length} accounts, ${pets.length} pets, 32 posts, follows, likes, comments, matches, chats, and notifications.`);
  console.log("Demo password for all seed accounts: petory-demo-password-2026");
} catch (error) { await client.query("ROLLBACK"); throw error; } finally { await client.end(); }
