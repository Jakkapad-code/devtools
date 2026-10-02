import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import nextEnv from "@next/env";
import pg from "pg";
import { runAuthenticatedView, runBrowserSmoke } from "./browser-smoke.mjs";

nextEnv.loadEnvConfig(process.cwd());
if (process.env.PETORY_INTEGRATION_DB !== "1") {
  throw new Error("Set PETORY_INTEGRATION_DB=1 only for an isolated, disposable local/CI database.");
}
const databaseUrl = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1"].includes(databaseUrl.hostname)) {
  throw new Error("Integration smoke tests refuse a non-local database.");
}
const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false });
await db.connect();
try {
  const safety = await db.query("SELECT COUNT(*)::integer AS count FROM accounts WHERE email NOT LIKE '%@petory.local'");
  if (safety.rows[0].count !== 0) throw new Error("Integration smoke tests refuse a database containing non-demo accounts.");
  await db.query("TRUNCATE rate_limit_counters");
} finally {
  await db.end();
}

const port = Number(process.env.PETORY_INTEGRATION_PORT || 3110);
const base = `http://localhost:${port}`;
const networkBase = `http://127.0.0.1:${port}`;
let lastMail = null;
const mailServer = http.createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/emails") {
    response.writeHead(404).end();
    return;
  }
  let body = "";
  for await (const chunk of request) body += chunk;
  lastMail = JSON.parse(body);
  response.writeHead(200, { "Content-Type": "application/json" }).end('{"id":"integration-mail"}');
});
await new Promise((resolve) => mailServer.listen(0, "127.0.0.1", resolve));
const mailPort = mailServer.address().port;

const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: "development",
    NEXT_PUBLIC_APP_URL: base,
    ALLOWED_ORIGINS: base,
    MAIL_PROVIDER: "resend",
    MAIL_FROM: "hello@petory.test",
    RESEND_API_KEY: "integration-key",
    MAIL_API_URL: `http://127.0.0.1:${mailPort}/emails`,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let appOutput = "";
for (const stream of [child.stdout, child.stderr]) stream.on("data", (chunk) => { appOutput = (appOutput + chunk.toString()).slice(-3_000); });

function request(path, { method = "GET", cookie, body } = {}) {
  return fetch(networkBase + path, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(method !== "GET" ? { Origin: base } : {}),
      ...(body === undefined || body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: body instanceof FormData ? body : JSON.stringify(body) }),
  });
}

async function login(email, password = "petory-demo-password-2026") {
  const response = await request("/api/auth/login", { method: "POST", body: { email, password } });
  assert.equal(response.status, 200, `Login failed for ${email}`);
  return { cookie: response.headers.get("set-cookie").split(";")[0], id: (await response.json()).account.id };
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Next.js exited early: ${appOutput}`);
    try {
      const response = await request("/api/health");
      if (response.ok) { ready = true; break; }
    } catch { /* The local app has not started listening yet. */ }
    await delay(300);
  }
  if (!ready) throw new Error(`Next.js did not become ready: ${appOutput}`);

  const aom = await login("aom@petory.local");
  const niran = await login("niran@petory.local");
  const allPhotos = [];
  for (const [category, count] of [["recipe", 6], ["clinic", 4]]) {
    const response = await request(`/api/posts?scope=explore&category=${category}`, { cookie: aom.cookie });
    assert.equal(response.status, 200);
    const posts = (await response.json()).posts;
    assert.equal(posts.length, count);
    assert(posts.every((post) => post.photoMediaId));
    allPhotos.push(...posts.map((post) => post.photoMediaId));
    for (const species of ["Dog", "Cat"]) {
      const filtered = await request(`/api/posts?scope=explore&category=${category}&species=${species}`, { cookie: aom.cookie });
      assert.equal(filtered.status, 200);
      assert((await filtered.json()).posts.length > 0);
    }
  }
  assert.equal(new Set(allPhotos).size, 10);
  await runBrowserSmoke(base);

  const form = new FormData();
  form.set("file", new Blob([await readFile("public/uploads/demo/recipe-dog-biscuits.jpg")], { type: "image/jpeg" }), "biscuit.jpg");
  const invalidForm = new FormData();
  invalidForm.set("file", new Blob(["not an image"], { type: "image/jpeg" }), "invalid.jpg");
  assert.equal((await request("/api/media", { method: "POST", cookie: aom.cookie, body: invalidForm })).status, 422);
  const oversizedForm = new FormData();
  oversizedForm.set("file", new Blob([Buffer.alloc(2 * 1024 * 1024 + 1)], { type: "image/jpeg" }), "oversized.jpg");
  assert.equal((await request("/api/media", { method: "POST", cookie: aom.cookie, body: oversizedForm })).status, 422);
  const upload = await request("/api/media", { method: "POST", cookie: aom.cookie, body: form });
  assert.equal(upload.status, 201);
  const { mediaId } = await upload.json();
  assert.equal((await request(`/api/media/${mediaId}`, { cookie: niran.cookie })).status, 404);
  assert.equal((await request(`/api/media/${mediaId}`, { cookie: aom.cookie })).status, 200);

  const post = { category: "recipe", title: "Integration smoke", caption: "Temporary test post", locationLabel: "", petId: null, photoMediaId: mediaId };
  assert.equal((await request("/api/posts", { method: "POST", cookie: niran.cookie, body: post })).status, 422);
  assert.equal((await request("/api/posts", { method: "POST", cookie: aom.cookie, body: post })).status, 201);
  assert.equal((await request(`/api/media/${mediaId}`, { cookie: niran.cookie })).status, 200);

  const pet = { name: "Integration Pet", species: "Dog", breed: "Mixed", age: 2, weightKg: 8, photoMediaId: mediaId, gender: "Unknown", size: "Medium", bio: "", personality: [], interests: [] };
  const newPet = await request("/api/pets", { method: "POST", cookie: aom.cookie, body: pet });
  assert.equal(newPet.status, 201);
  const petId = (await newPet.json()).pet.id;
  assert.equal((await request(`/api/pets/${petId}`, { cookie: aom.cookie })).status, 200);
  assert.equal((await request("/api/pets", { method: "POST", cookie: niran.cookie, body: pet })).status, 422);

  const secondForm = new FormData();
  secondForm.set("file", new Blob([await readFile("public/uploads/demo/clinic-cat-exam.jpg")], { type: "image/jpeg" }), "second.jpg");
  const secondUpload = await request("/api/media", { method: "POST", cookie: aom.cookie, body: secondForm });
  assert.equal(secondUpload.status, 201);
  const secondMediaId = (await secondUpload.json()).mediaId;
  const temporaryPost = await request("/api/posts", { method: "POST", cookie: aom.cookie, body: { ...post, photoMediaId: secondMediaId } });
  assert.equal(temporaryPost.status, 201);
  const temporaryPostId = (await temporaryPost.json()).post.id;
  assert.equal((await request(`/api/media/${secondMediaId}`, { cookie: niran.cookie })).status, 200);
  const niranPets = (await (await request("/api/pets", { cookie: niran.cookie })).json()).pets;
  const targetPetId = niranPets[0].id;
  const niranPhoto = niranPets[0].photoMediaId;
  assert.equal((await request(`/api/posts/${temporaryPostId}`, { method: "PUT", cookie: aom.cookie, body: { ...post, photoMediaId: niranPhoto } })).status, 422);
  assert.equal((await request(`/api/posts/${temporaryPostId}`, { method: "PUT", cookie: aom.cookie, body: { ...post, photoMediaId: null } })).status, 200);
  assert.equal((await request(`/api/media/${secondMediaId}`, { cookie: niran.cookie })).status, 404);
  assert.equal((await request(`/api/media/${secondMediaId}`, { cookie: aom.cookie })).status, 200);
  assert.equal((await request(`/api/posts/${temporaryPostId}`, { method: "DELETE", cookie: aom.cookie })).status, 204);
  const cleanupDb = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await cleanupDb.connect();
  try { await cleanupDb.query("UPDATE media_files SET created_at = NOW() - INTERVAL '25 hours' WHERE id = $1", [secondMediaId]); }
  finally { await cleanupDb.end(); }
  const cleanupForm = new FormData();
  cleanupForm.set("file", new Blob([await readFile("public/uploads/demo/recipe-dog-biscuits.jpg")], { type: "image/jpeg" }), "cleanup.jpg");
  assert.equal((await request("/api/media", { method: "POST", cookie: aom.cookie, body: cleanupForm })).status, 201);
  const cleanupCheck = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await cleanupCheck.connect();
  try {
    const deletedMedia = await cleanupCheck.query("SELECT deleted_at IS NOT NULL AS deleted, OCTET_LENGTH(bytes) AS bytes FROM media_files WHERE id = $1", [secondMediaId]);
    assert.deepEqual(deletedMedia.rows[0], { deleted: true, bytes: 1 });
  } finally { await cleanupCheck.end(); }
  assert.equal((await request(`/api/media/${secondMediaId}`, { cookie: aom.cookie })).status, 404);

  const firstInterest = await request("/api/matching/interactions", { method: "POST", cookie: aom.cookie, body: { actorPetId: petId, targetPetId, action: "interest" } });
  assert.equal(firstInterest.status, 200);
  assert.equal((await firstInterest.json()).interaction.matchId, null);
  const mutualInterest = await request("/api/matching/interactions", { method: "POST", cookie: niran.cookie, body: { actorPetId: targetPetId, targetPetId: petId, action: "interest" } });
  assert.equal(mutualInterest.status, 200);
  const newConversationId = (await mutualInterest.json()).interaction.conversationId;
  assert(newConversationId, "Mutual interest should create a conversation");
  assert.equal((await request(`/api/conversations/${newConversationId}/messages`, { method: "POST", cookie: aom.cookie, body: { body: "A fresh match says hello" } })).status, 201);
  await runAuthenticatedView(base, { email: "aom@petory.local", path: `/petory/messages/${newConversationId}`, text: "A fresh match says hello", screenshot: "new-match-chat" });

  const follow = await request(`/api/users/${niran.id}/follow`, { method: "PUT", cookie: aom.cookie, body: { active: true } });
  assert.equal(follow.status, 200);
  const following = await request("/api/following", { cookie: aom.cookie });
  assert((await following.json()).users.some((user) => user.id === niran.id));
  await runAuthenticatedView(base, { email: "aom@petory.local", path: "/petory/following", text: "Niran Kittisak", screenshot: "following" });
  const conversations = await request("/api/conversations", { cookie: aom.cookie });
  assert.equal(conversations.status, 200);
  const withNiran = (await conversations.json()).conversations.find((conversation) => conversation.ownerName === "Niran Kittisak");
  assert(withNiran, "Seed should include an active Aom/Niran conversation");
  const sent = await request(`/api/conversations/${withNiran.id}/messages`, { method: "POST", cookie: aom.cookie, body: { body: "Integration hello" } });
  assert.equal(sent.status, 201);
  const messages = await request(`/api/conversations/${withNiran.id}/messages`, { cookie: aom.cookie });
  assert((await messages.json()).messages.some((message) => message.body === "Integration hello"));
  await runAuthenticatedView(base, { email: "aom@petory.local", path: `/petory/messages/${withNiran.id}`, text: "Integration hello", screenshot: "chat" });

  const block = await request(`/api/users/${niran.id}/block`, { method: "PUT", cookie: aom.cookie, body: { active: true } });
  assert.equal(block.status, 200);
  assert.equal((await request(`/api/media/${mediaId}`, { cookie: niran.cookie })).status, 404);
  assert.equal((await request(`/api/users/${niran.id}`, { cookie: aom.cookie })).status, 404);
  assert.equal((await request(`/api/users/${niran.id}/follow`, { method: "PUT", cookie: aom.cookie, body: { active: true } })).status, 404);
  assert((await (await request("/api/blocked", { cookie: aom.cookie })).json()).users.some((user) => user.id === niran.id));
  await runAuthenticatedView(base, { email: "aom@petory.local", path: "/petory/profile", text: "ผู้ใช้ที่ถูกบล็อก (1)", screenshot: "blocked" });
  assert.equal((await request(`/api/conversations/${withNiran.id}/messages`, { cookie: aom.cookie })).status, 404);
  assert.equal((await request("/api/conversations", { cookie: aom.cookie }).then((response) => response.json())).conversations.some((conversation) => conversation.id === withNiran.id), false);
  assert.equal((await request("/api/matching/interactions", { method: "POST", cookie: aom.cookie, body: { actorPetId: petId, targetPetId, action: "interest" } })).status, 404);

  const report = await request(`/api/users/${niran.id}/report`, { method: "POST", cookie: aom.cookie, body: { reason: "Integration test report" } });
  assert.equal(report.status, 201);
  const adminDb = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await adminDb.connect();
  try { await adminDb.query("UPDATE accounts SET role = 'admin' WHERE email = 'mali@petory.local'"); }
  finally { await adminDb.end(); }
  const mali = await login("mali@petory.local");
  const reports = await request("/api/admin/reports", { cookie: mali.cookie });
  assert((await reports.json()).reports.some((item) => item.targetId === niran.id));
  await runAuthenticatedView(base, { email: "mali@petory.local", path: "/petory/admin/reports", text: "Niran Kittisak", screenshot: "admin-reports" });
  const suspend = await request(`/api/admin/users/${niran.id}/suspension`, { method: "PUT", cookie: mali.cookie, body: { duration: 1, reason: "Integration moderation test" } });
  assert.equal(suspend.status, 200);
  assert.equal((await request("/api/me", { cookie: niran.cookie })).status, 401);
  assert.equal((await request("/api/auth/login", { method: "POST", body: { email: "niran@petory.local", password: "petory-demo-password-2026" } })).status, 403);
  assert.equal((await request(`/api/admin/users/${niran.id}/suspension`, { method: "DELETE", cookie: mali.cookie })).status, 200);
  await login("niran@petory.local");

  const known = await request("/api/auth/forgot", { method: "POST", body: { email: "aom@petory.local" } });
  const unknown = await request("/api/auth/forgot", { method: "POST", body: { email: "missing@petory.local" } });
  assert.equal(known.status, 200);
  assert.equal(unknown.status, 200);
  assert.deepEqual(await known.json(), await unknown.json());
  const token = new URL(lastMail.text.match(/https?:\/\/\S+/)[0]).searchParams.get("token");
  assert(token);
  assert.equal((await request("/api/auth/reset", { method: "POST", body: { token, password: "integration-new-password" } })).status, 200);
  assert.equal((await request("/api/auth/reset", { method: "POST", body: { token, password: "another-password" } })).status, 400);
  assert.equal((await request("/api/me", { cookie: aom.cookie })).status, 401);
  await login("aom@petory.local", "integration-new-password");

  const loginStatuses = [];
  for (let index = 0; index < 11; index += 1) {
    loginStatuses.push((await request("/api/auth/login", { method: "POST", body: { email: "smoke-limit@petory.local", password: "wrong" } })).status);
  }
  assert.deepEqual(loginStatuses, [...Array(10).fill(401), 429]);
  const globalHash = createHmac("sha256", process.env.SESSION_SECRET).update("registerGlobal:all").digest("hex");
  const counterDb = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await counterDb.connect();
  try {
    await counterDb.query(`INSERT INTO rate_limit_counters (scope, key_hash, window_started_at, attempts)
      VALUES ('registerGlobal', $1, NOW(), 30)
      ON CONFLICT (scope, key_hash) DO UPDATE SET window_started_at = NOW(), attempts = 30`, [globalHash]);
  } finally { await counterDb.end(); }
  const globallyLimited = await request("/api/auth/register", { method: "POST", body: { displayName: "Global limit", email: "global-limit@petory.local", password: "valid-password-2026" } });
  assert.equal(globallyLimited.status, 429);
  assert(Number(globallyLimited.headers.get("retry-after")) > 0);
  console.log("Integration smoke passed: browser register/pet/post/Explore/follow/block/admin, media lifecycle, chat/matching policy, report/suspension, reset, session revocation, 429.");
} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => mailServer.close(resolve));
  const cleanup = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await cleanup.connect();
    await cleanup.query("TRUNCATE rate_limit_counters");
  } finally {
    await cleanup.end();
  }
}
