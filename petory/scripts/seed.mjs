import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import nextEnv from "@next/env";
import pg from "pg";
import { hashPassword } from "../src/server/auth/password.js";
import { parseDatabaseEnv } from "../src/shared/config/env-schema.js";
import { demoPhotoByTitle, validateDemoPhotos } from "./demo-photos.mjs";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed a production database.");
const database = parseDatabaseEnv(process.env);

const { Client } = pg;
const client = new Client({ connectionString: database.DATABASE_URL, ssl: database.DATABASE_SSL ? { rejectUnauthorized: true } : false, connectionTimeoutMillis: database.DB_CONNECTION_TIMEOUT_MS });
const passwordHash = await hashPassword("petory-demo-password-2026");
await validateDemoPhotos();

const people = [
  ["Aom Supaporn", "aom", "ชอบทำขนมโฮมเมดให้น้องหมากิน", "Bangkok"],
  ["Niran Kittisak", "niran", "พาโกลเด้นไปวิ่งสวนทุกเช้า", "Bangkok"],
  ["Mali Wattan", "mali", "ทาสแมวบริติชช็อตแฮร์", "Chiang Mai"],
  ["Beam Rattan", "beam", "พาน้องเที่ยวคาเฟ่ทุกสุดสัปดาห์", "Bangkok"],
  ["Ploy Chai", "ploy", "แม่แมวเมนคูน 1 ตัว", "Nonthaburi"],
  ["Tee Somchai", "tee", "คอร์กี้ขาสั้นแต่วิ่งไว", "Bangkok"],
  ["Nok Napat", "nok", "รับเลี้ยงแมวจร 2 ตัว", "Chonburi"],
  ["Korn P", "korn", "ลาบราดอร์สายว่ายน้ำ", "Bangkok"],
];

// [ownerIndex, name, species, breed, gender, size, weightKg, bio, personality, interests, photo]
const pets = [
  [0, "Mochi", "Dog", "Shiba Inu", "Male", "Medium", 9.5, "ขี้อ้อนแต่ดื้อนิดหน่อย", ["Playful", "Social"], ["Walks", "Treats"], "mochi-shiba.jpg"],
  [1, "Luna", "Dog", "Golden Retriever", "Female", "Large", 27.0, "ชอบวิ่งไล่ลูกบอลไม่มีหยุด", ["Friendly", "Energetic"], ["Fetch", "Park", "Swimming"], "luna-golden.jpg"],
  [2, "Milo", "Cat", "British Shorthair", "Male", "Medium", 5.2, "นอนวันละ 16 ชั่วโมง", ["Calm"], ["Naps", "Windows"], "milo-cat.jpg"],
  [3, "Coco", "Dog", "Toy Poodle", "Female", "Small", 3.4, "รักทุกคนที่เจอ", ["Friendly", "Playful"], ["Cuddles", "Walks"], "bella-corgi.jpg"],
  [4, "Simba", "Cat", "Maine Coon", "Male", "Large", 8.1, "ตัวใหญ่แต่ใจดีมาก", ["Calm", "Friendly"], ["Sunbathing"], "milo-cat.jpg"],
  [5, "Bella", "Dog", "Corgi", "Female", "Medium", 11.0, "ขาสั้นแต่วิ่งไม่แพ้ใคร", ["Energetic", "Playful"], ["Walks", "Park"], "bella-corgi.jpg"],
  [6, "Whiskers", "Cat", "Domestic Shorthair", "Female", "Small", 3.9, "แมวจรที่กลายมาเป็นเจ้าหญิง", ["Calm", "Social"], ["Naps", "Treats"], "milo-cat.jpg"],
  [7, "Buddy", "Dog", "Labrador", "Male", "Large", 30.5, "ว่ายน้ำเก่งที่สุดในซอย", ["Energetic", "Social"], ["Swimming", "Fetch"], "buddy-dog.jpg"],
];

// Every post's words match its category, so each Explore tab reads as one topic.
const posts = [
  // --- สูตรอาหาร ---
  ["recipe", "ขนมตับไก่อบ ทำ 20 นาที", "โพสต์ตัวอย่างขนมโฮมเมด: เลือกตับไก่สด ปรุงสุกทั่วถึง ไม่ใส่เครื่องปรุง และให้เพียงเล็กน้อยตามคำแนะนำของสัตวแพทย์", null],
  ["recipe", "ไอศกรีมกล้วยโยเกิร์ต คลายร้อน", "ไอเดียของว่าง: กล้วยกับโยเกิร์ตรสธรรมชาติที่ไม่มีน้ำตาลหรือสารให้ความหวาน ตรวจฉลากและถามสัตวแพทย์ก่อนให้น้องกิน", null],
  ["recipe", "ข้าวต้มฟักทองไก่ สำหรับน้องท้องเสีย", "ภาพตัวอย่างอาหารไก่กับฟักทอง หากสัตว์เลี้ยงท้องเสียควรปรึกษาสัตวแพทย์ก่อนเปลี่ยนอาหารหรือรักษาเอง", null],
  ["recipe", "บิสกิตรูปกระดูกสำหรับน้องหมา", "ไอเดียขนมอบรูปกระดูกสำหรับวันพิเศษ ควรเลือกส่วนผสมที่เหมาะกับสัตว์เลี้ยงแต่ละตัวและให้เป็นขนมเสริมเท่านั้น", null],
  ["recipe", "ไอเดียอาหารเปียกเพิ่มความหลากหลายให้แมว", "ลองจัดมื้ออาหารเปียกสำหรับแมวตามปริมาณที่เหมาะสม อ่านส่วนผสมและคำแนะนำบนบรรจุภัณฑ์ก่อนเสิร์ฟ", null],
  ["recipe", "ขนมปังฟักทองโฮมเมด", "ขนมฟักทองโฮมเมดเป็นไอเดียโพสต์ตัวอย่าง ตรวจส่วนผสมและปริมาณกับสัตวแพทย์ โดยเฉพาะสัตว์เลี้ยงที่มีประวัติแพ้อาหาร", null],

  // --- สถานที่ Pet Friendly ---
  ["place", "สวนลุมพินี — ลานวิ่งหมาเปิด 05:00-20:00", "มีลานกั้นรั้วแยกโซนหมาเล็กกับหมาใหญ่ มีน้ำดื่มให้ ที่จอดรถฝั่งถนนพระรามสี่ วันธรรมดาคนน้อยกว่าเยอะ", "Bangkok"],
  ["place", "Pet Cafe Ari — พาน้องเข้าได้ทุกโซน", "มีเมนูสำหรับน้องหมาแยกต่างหาก พื้นเป็นกระเบื้องกันลื่น มีโซนกลางแจ้งด้วย เสาร์-อาทิตย์ควรจองก่อน", "Bangkok"],
  ["place", "สวนเบญจกิติ — ทางเดินริมน้ำ 3 กม.", "ทางเรียบเข็นรถเข็นน้องได้ ร่มตลอดทาง มีจุดทิ้งขยะเป็นระยะ ช่วงเย็นลมดีมาก อย่าลืมถุงเก็บนะครับ", "Bangkok"],
  ["place", "ชายหาดบางแสน โซนอนุญาตสัตว์เลี้ยง", "ฝั่งเหนือของหาดอนุญาตให้พาน้องลงเล่นน้ำได้ มีฝักบัวล้างทรายใกล้ทางขึ้น ควรไปก่อน 9 โมงเพราะทรายร้อน", "Chonburi"],
  ["place", "Dog Park รัชโยธิน — แยกโซนหมาเล็ก/ใหญ่", "ค่าเข้า 100 บาทต่อตัว เล่นได้ไม่จำกัดเวลา หญ้าเทียมนุ่ม มีอ่างอาบน้ำให้ใช้ฟรีก่อนกลับ", "Bangkok"],

  // --- Clinic ---
  ["clinic", "เตรียมตัวพาสัตว์เลี้ยงไปตรวจที่คลินิก", "โพสต์ตัวอย่าง: เตรียมข้อมูลวัคซีน ยาที่ใช้ และอาการที่สังเกตไว้ โทรสอบถามเวลาเปิดและบริการจากคลินิกจริงก่อนเดินทาง", null],
  ["clinic", "พาแมวไปตรวจสุขภาพครั้งแรก", "บันทึกประสบการณ์ตัวอย่าง: ใช้กระเป๋าเดินทางที่เหมาะกับแมวและแจ้งประวัติสุขภาพให้สัตวแพทย์ทราบ", null],
  ["clinic", "คุณหมอตรวจอาการน้องแมว", "ภาพประกอบบรรยากาศการตรวจที่คลินิก การวินิจฉัยและแนวทางรักษาต้องให้สัตวแพทย์ที่ตรวจสัตว์เลี้ยงจริงเป็นผู้แนะนำ", null],
  ["clinic", "รู้จักห้องผ่าตัดสัตวแพทย์", "ภาพตัวอย่างห้องผ่าตัดสัตวแพทย์ หากน้องต้องรับหัตถการ ควรสอบถามขั้นตอน ความเสี่ยง และการดูแลหลังทำกับทีมรักษาโดยตรง", null],

  // --- ทั่วไป (tips / event / question) ---
  ["tips", "5 วิธีฝึกลูกสุนัขให้ขับถ่ายเป็นที่", "1) พาไปจุดเดิมทุกครั้ง 2) ไปหลังตื่นและหลังอาหารทันที 3) ชมทันทีที่ทำถูก 4) ห้ามดุเวลาพลาด 5) ทำความสะอาดให้หมดกลิ่น", null],
  ["tips", "ลดขนร่วงหน้าร้อน แปรงยังไงให้ได้ผล", "ใช้หวีซี่ถี่แปรงตามแนวขน วันละ 5 นาทีพอ เน้นช่วงคอกับต้นขา อาบน้ำไม่เกินสัปดาห์ละครั้งเพราะจะยิ่งทำให้ผิวแห้ง", null],
  ["tips", "สอนแมวใช้ที่ลับเล็บ ไม่ข่วนโซฟา", "วางที่ลับเล็บติดกับจุดที่แมวชอบข่วน โรยแคทนิปนิดหน่อย พอเริ่มใช้ค่อยขยับออกทีละนิด ห้ามจับอุ้งเท้าไปถูเอง", null],
  ["tips", "วิธีตัดเล็บหมาเองที่บ้าน", "ตัดเฉพาะส่วนใสห่างจากเส้นเลือด 2 มม. ถ้ากลัวพลาดให้ตัดทีละนิด เตรียมผงห้ามเลือดไว้ข้างตัว ทำหลังอาบน้ำเล็บจะนิ่มกว่า", null],
  ["tips", "เช็กลิสต์ของใช้ก่อนรับน้องเข้าบ้าน", "กรง/เบาะนอน ชามอาหารสแตนเลส สายจูงแบบอก ทรายแมวหรือแผ่นรองซับ ของเล่นกัดได้ และเบอร์คลินิกใกล้บ้าน", null],
  ["event", "Pet Expo 2026 — บูธตรวจสุขภาพฟรี", "เสาร์-อาทิตย์นี้ที่ไบเทคบางนา มีบูธตรวจเลือดและฉีดวัคซีนราคาพิเศษ พาน้องเข้าได้แต่ต้องใส่สายจูง", "Bangkok"],
  ["event", "นัดรวมพลโกลเด้น สวนลุม อาทิตย์นี้", "เจอกัน 7 โมงเช้าที่ลานหน้าประตู 3 ปีที่แล้วมากัน 30 ตัว ใครสนใจคอมเมนต์ไว้ได้เลยครับ", "Bangkok"],
  ["question", "แมวไม่กินอาหารเม็ดเลย มีทริคไหมคะ", "ลองเปลี่ยนยี่ห้อมา 3 อันแล้วก็ยังไม่กิน กินแต่อาหารเปียกอย่างเดียว กลัวฟันจะไม่แข็งแรง ใครเคยเจอแบบนี้บ้างคะ", null],
  ["question", "หมาเห่าตอนกลางคืน แก้ยังไงดี", "เห่าประมาณตีหนึ่งทุกคืน เพื่อนบ้านเริ่มบ่นแล้ว พาออกไปเดินตอนเย็นแล้วก็ยังเห่าอยู่ มีใครมีวิธีแนะนำไหมครับ", null],

  // --- Pet Story (หน้า Home) ---
  ["story", null, "เช้านี้พาไปวิ่งที่สวน สนุกจนไม่ยอมกลับบ้าน นั่งกอดขาอยู่ตรงประตูสวน 10 นาที", "Bangkok"],
  ["story", null, "วันแรกที่รับน้องมาอยู่ด้วย ตื่นเต้นจนไม่ยอมนอน เดินสำรวจทั้งบ้านถึงเที่ยงคืน", null],
  ["story", null, "ตรวจสุขภาพประจำปีผ่านฉลุย หมอชมว่าน้ำหนักกำลังดี กลับมาได้ขนมเป็นรางวัล", null],
  ["story", null, "วันนี้เจอเพื่อนใหม่ที่สวน เล่นกันจนเหนื่อยทั้งคู่ กลับบ้านหลับยาวเลย", "Bangkok"],
  ["story", null, "นอนอาบแดดตรงหน้าต่างทั้งบ่าย เรียกกินข้าวก็ไม่สนใจ", null],
  ["story", null, "พาไปคาเฟ่ครั้งแรก ตื่นคนนิดหน่อยแต่สุดท้ายก็นอนใต้โต๊ะได้สบาย", "Bangkok"],
  ["story", null, "ฝึกให้นั่งรอก่อนกินข้าวสำเร็จแล้ว ใช้เวลา 2 สัปดาห์ ภูมิใจมาก", null],
  ["story", null, "ฝนตกทั้งวันเลยได้แต่เล่นในบ้าน กัดของเล่นจนขาดไปหนึ่งชิ้น", null],
  ["story", null, "วันเกิดครบ 3 ขวบ ทำขนมฟักทองให้เป็นพิเศษ กินหมดภายใน 30 วินาที", null],
  ["story", null, "พาไปว่ายน้ำครั้งแรก กลัวอยู่ 5 นาทีแรก หลังจากนั้นไม่ยอมขึ้นเลย", "Chonburi"],
];

const comments = ["น่ารักมากเลยค่ะ", "ขอบคุณสำหรับข้อมูลครับ", "ไว้จะลองทำตามดูนะคะ", "อยากพาน้องไปบ้างจัง", "เป็นประโยชน์มากครับ"];

await client.connect();
try {
  await client.query("BEGIN");
  await client.query("DELETE FROM accounts WHERE email LIKE '%@petory.local'");

  const accounts = [];
  for (const [name, slug, bio, location] of people) {
    const result = await client.query(
      `INSERT INTO accounts (display_name, email, password_hash, bio, location_label) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, `${slug}@petory.local`, passwordHash, bio, location],
    );
    accounts.push({ id: result.rows[0].id, name });
  }

  // Stores a demo photo exactly as an upload would, so seeded pets are not a
  // special case that only renders through the demo-image fallback.
  const storePhoto = async (ownerId, fileName) => {
    const bytes = await readFile(new URL(`../public/uploads/demo/${fileName}`, import.meta.url));
    const result = await client.query(
      `INSERT INTO media_files (owner_id, bytes, mime_type, size_bytes, sha256) VALUES ($1, $2, 'image/jpeg', $3, $4) RETURNING id`,
      [ownerId, bytes, bytes.length, createHash("sha256").update(bytes).digest("hex")],
    );
    return result.rows[0].id;
  };

  const petRows = [];
  for (const [ownerIndex, name, species, breed, gender, size, weight, bio, personality, interests, photo] of pets) {
    const ownerId = accounts[ownerIndex].id;
    const mediaId = await storePhoto(ownerId, photo);
    const result = await client.query(
      `INSERT INTO pets (owner_id, name, species, breed, gender, size, birth_date, weight_kg, bio, personality, interests, photo_media_id)
       VALUES ($1, $2, $3, $4, $5, $6, '2023-01-01', $7, $8, $9, $10, $11) RETURNING id`,
      [ownerId, name, species, breed, gender, size, weight, bio, personality, interests, mediaId],
    );
    petRows.push({ id: result.rows[0].id, ownerId, ownerIndex, name });
  }

  // Round-robin the categories onto the timeline. Listed in blocks they would be
  // posted oldest-first per category, pushing every story past the feed's window.
  const buckets = Object.values(posts.reduce((map, post) => {
    (map[post[0]] ||= []).push(post);
    return map;
  }, {}));
  const ordered = [];
  for (let round = 0; ordered.length < posts.length; round += 1) {
    for (const bucket of buckets) if (bucket[round]) ordered.push(bucket[round]);
  }

  // Spread authors across categories so every Explore tab has several writers.
  let photoPostCount = 0;
  for (const [index, [category, title, caption, location]] of ordered.entries()) {
    const author = accounts[index % accounts.length];
    const ownPet = petRows.find((pet) => pet.ownerId === author.id);
    const photoFile = demoPhotoByTitle.get(title);
    if (["recipe", "clinic"].includes(category) && !photoFile) throw new Error(`Missing demo photo for ${title}`);
    const photoMediaId = photoFile ? await storePhoto(author.id, photoFile) : null;
    if (photoMediaId) photoPostCount += 1;
    await client.query(
      `INSERT INTO posts (author_id, pet_id, category, title, caption, location_label, photo_media_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - ($8 * INTERVAL '3 hours'))`,
      [author.id, ownPet.id, category, title, caption, location, photoMediaId, index],
    );
  }
  if (photoPostCount !== demoPhotoByTitle.size) throw new Error("Not all demo photos were attached to posts");

  const postRows = (await client.query(
    "SELECT id, author_id FROM posts WHERE author_id = ANY($1::uuid[]) ORDER BY created_at DESC",
    [accounts.map((account) => account.id)],
  )).rows;
  for (const [index, post] of postRows.entries()) {
    const actor = accounts[(index + 1) % accounts.length];
    if (actor.id === post.author_id) continue;
    await client.query("INSERT INTO post_likes (post_id, account_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [post.id, actor.id]);
    if (index % 2 === 0) {
      await client.query(
        "INSERT INTO post_comments (post_id, author_id, body, created_at) VALUES ($1, $2, $3, NOW() - ($4 * INTERVAL '1 minute'))",
        [post.id, actor.id, comments[index % comments.length], index],
      );
    }
    if (index < 10) {
      await client.query("INSERT INTO notifications (account_id, actor_id, type, resource_type, resource_id) VALUES ($1, $2, 'like', 'post', $3)", [post.author_id, actor.id, post.id]);
    }
  }

  for (const [index, account] of accounts.entries()) {
    await client.query("INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [account.id, accounts[(index + 1) % accounts.length].id]);
    await client.query("INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [account.id, accounts[(index + 2) % accounts.length].id]);
  }

  // Admirers waiting on each pet, one direction only. Without these nobody has
  // liked you yet, so swiping "interested" can never complete a match.
  const interactionKeys = new Set();
  const mutualPairs = [[0, 1], [2, 3], [4, 5]];
  for (const [left, right] of mutualPairs) {
    interactionKeys.add(`${left}->${right}`);
    interactionKeys.add(`${right}->${left}`);
  }
  for (let target = 0; target < petRows.length; target += 1) {
    for (const offset of [2, 3]) {
      const admirer = (target + offset) % petRows.length;
      if (admirer === target) continue;
      // Leaving our own side unrecorded is what keeps the pet swipeable.
      if (interactionKeys.has(`${admirer}->${target}`) || interactionKeys.has(`${target}->${admirer}`)) continue;
      interactionKeys.add(`${admirer}->${target}`);
      await client.query(
        "INSERT INTO match_interactions (actor_pet_id, target_pet_id, action) VALUES ($1, $2, 'interest') ON CONFLICT (actor_pet_id, target_pet_id) DO NOTHING",
        [petRows[admirer].id, petRows[target].id],
      );
    }
  }

  for (const [left, right] of mutualPairs) {
    const petA = petRows[left];
    const petB = petRows[right];
    const [petOneId, petTwoId] = [petA.id, petB.id].sort();
    for (const [actor, target] of [[petA, petB], [petB, petA]]) {
      await client.query(
        "INSERT INTO match_interactions (actor_pet_id, target_pet_id, action) VALUES ($1, $2, 'interest') ON CONFLICT (actor_pet_id, target_pet_id) DO UPDATE SET action = 'interest'",
        [actor.id, target.id],
      );
    }
    const match = await client.query("INSERT INTO matches (pet_a_id, pet_b_id, status) VALUES ($1, $2, 'active') ON CONFLICT (pet_a_id, pet_b_id) DO UPDATE SET status = 'active' RETURNING id", [petOneId, petTwoId]);
    const conversation = await client.query("INSERT INTO conversations (match_id) VALUES ($1) ON CONFLICT (match_id) DO UPDATE SET match_id = EXCLUDED.match_id RETURNING id", [match.rows[0].id]);
    for (const accountId of [petA.ownerId, petB.ownerId]) {
      await client.query("INSERT INTO conversation_members (conversation_id, account_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [conversation.rows[0].id, accountId]);
    }
    await client.query(
      "INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3), ($1, $4, $5)",
      [conversation.rows[0].id, petA.ownerId, `สวัสดีครับ ${petA.name} อยากไปเดินสวนด้วยกันไหม`, petB.ownerId, `ได้เลยค่ะ ${petB.name} ว่างเสาร์นี้พอดี`],
    );
    await client.query("INSERT INTO notifications (account_id, actor_id, type, resource_type, resource_id) VALUES ($1, $2, 'match', 'match', $3)", [petA.ownerId, petB.ownerId, match.rows[0].id]);
  }

  await client.query("COMMIT");
  const byCategory = posts.reduce((acc, [category]) => ({ ...acc, [category]: (acc[category] || 0) + 1 }), {});
  console.log(`Seeded ${accounts.length} accounts, ${petRows.length} pets, ${posts.length} posts`);
  console.log("Posts per category:", byCategory);
  console.log("Demo password for all seed accounts: petory-demo-password-2026");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
