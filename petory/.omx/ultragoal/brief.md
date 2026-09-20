# Petory Production Plan (JavaScript + Next.js)

## 1. เป้าหมาย

เปลี่ยน `devtools/petory` จาก frontend prototype ให้เป็นเว็บ Petory ที่ใช้จริงได้ โดย:

- คง Next.js 16, React 19, JavaScript/JSX และ UI/route เดิมไว้
- ทำทุกหน้าที่มีอยู่ให้บันทึกข้อมูลจริง ปลอดภัย และกลับมาใช้งานต่อได้หลังรีสตาร์ต
- ใช้ PostgreSQL + PostGIS เป็นฐานข้อมูล และให้ backend API เป็นเจ้าของข้อมูล/กฎธุรกิจ
- ให้ Next.js ทำหน้าที่ web application และ BFF (Backend for Frontend): browser ไม่เรียกฐานข้อมูลหรือถือ backend token เอง

## 2. สถานะปัจจุบันและขอบเขต

### หลักฐานจากโค้ดปัจจุบัน

- Route เริ่มต้น redirect ไป `/petory/login` (`devtools/petory/src/app/page.jsx:1-5`).
- ทุกหน้าหลักอ่าน/แก้ state ร่วมจาก `PetoryProvider` (`devtools/petory/src/app/petory/layout.jsx:1-36`, `context.jsx:14-329`).
- ข้อมูลผู้ใช้ สัตว์เลี้ยง โพสต์ match และ notification เป็นข้อมูลเริ่มต้นใน browser (`constants.jsx:17-121`); จึงหายเมื่อ refresh และยังไม่มี API call.
- Schema มี PostgreSQL/PostGIS แล้ว (`public/Database/ERD_V1_4_3.sql:1-305`) แต่ยังไม่ถูกเรียกจาก Next.js.
- Package ปัจจุบันมีเพียง `dev`, `build`, `start`, `lint`; ยังไม่มี test/typecheck/production deployment script (`package.json:5-22`).

### ฟีเจอร์ที่ต้องส่งมอบ

| กลุ่ม | หน้า/การทำงานที่ต้องเป็นข้อมูลจริง |
|---|---|
| บัญชี | สมัคร, เข้าสู่ระบบ, ลืม/รีเซ็ตรหัสผ่าน, logout, onboarding |
| โปรไฟล์ | แก้ไข profile, ดูผู้ใช้, follow/unfollow, block/unblock, report |
| สัตว์เลี้ยง | รายการ, สร้าง, แก้ไข, ลบ, ดูรายละเอียด, รูปภาพ |
| เนื้อหา | home feed, explore/search/filter, สร้าง/แก้ไข/ลบโพสต์, like, save, comment, report |
| Matching | เลือกสัตว์ของตน, filter, pass, interest, mutual match |
| การสื่อสาร | รายการบทสนทนา, ส่งข้อความ, unmatch, report/block จากห้องแชต |
| Notification | in-app notification สำหรับ like/comment/follow/match/message และ mark-as-read |

### ขอบเขตที่ไม่ได้สัญญาใน release แรก

- Push notification, email marketing, video call และระบบชำระเงิน
- WebSocket; chat ใช้ persistent message + polling/revalidation ก่อน แล้วเพิ่ม realtime ภายหลังได้
- การเปลี่ยนดีไซน์ครั้งใหญ่; งานนี้รักษา UI ปัจจุบันเป็นหลัก

## 3. สถาปัตยกรรมเป้าหมาย

```text
Browser
  -> Next.js pages/components (JavaScript)
  -> Next.js server actions / route handlers
  -> server-only API client
  -> Backend API (authorization + business rules)
  -> PostgreSQL + PostGIS / object storage
```

### โครงสร้าง frontend ที่ต้องได้

```text
src/
  app/                         # routes และ layout; รับผิดชอบ render/navigation เท่านั้น
  features/
    auth/ profiles/ pets/ posts/ matching/ messages/ notifications/
                                # UI เฉพาะโดเมน, form schema, actions, service adapters
  server/
    api/                        # backend client ที่ import ได้เฉพาะ server
    auth/                       # session, guard, refresh
    security/                   # CSRF/origin checks, authorization helpers
    logging/                    # structured request/error logging
  shared/
    config/                     # env validation
    components/ lib/ types/     # UI และ utility ที่ใช้ร่วมกัน
```

### กติกาหลัก

1. `page.jsx` และ component ห้ามเข้าฐานข้อมูลหรือใส่ secret/backend token.
2. ทุก mutation ต้อง validate ที่ frontend เพื่อ UX และ validate ซ้ำที่ server/backend เพื่อความปลอดภัย.
3. Backend ตรวจสิทธิ์และ ownership ทุกครั้ง; client ไม่ใช่แหล่งตัดสินสิทธิ์.
4. Access/refresh token เก็บเฉพาะ HttpOnly cookie, `Secure` ใน production, `SameSite=Lax` เป็นขั้นต่ำ.
5. ทุก request เขียนข้อมูลมี CSRF/same-origin validation, request ID และ structured logs ที่ไม่บันทึกรหัสผ่าน/token.
6. `.env*` ไม่ commit; ใช้ `.env.example` ที่ไม่มี secret และ inject secret ผ่าน CI/deployment platform.

## 4. แผนทำงานตามลำดับ

### Phase 0 — ตกลง contract และตั้งรั้วคุณภาพ

**งาน**

1. สร้างเอกสาร API contract: request/response/error/status code และ ownership ของทุก resource ในตารางฟีเจอร์ด้านบน.
2. ยืนยันว่า backend อยู่ใน repository/service แยก และเป็นผู้ run migration; Next.js ไม่ต่อ PostgreSQL ตรง.
3. เพิ่ม `.env.example` สำหรับ `BACKEND_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STATIC_URL`, `SESSION_SECRET`, `ALLOWED_ORIGINS`; ตั้ง `.env*` ใน `.gitignore` ต่อจากกติกาที่มีอยู่ (`.gitignore:33-34`).
4. ตั้ง script ขั้นต่ำ: `lint`, `test`, `test:unit`, `test:integration`, `test:e2e`, `build`, `start:prod`. Production build ต้อง fail เมื่อ lint/test/build fail.
5. เพิ่ม CI pipeline ที่รัน `npm ci`, lint, tests และ build ทุก pull request.

**เกณฑ์ผ่าน**

- ทีมสามารถเปิดเอกสาร API แล้วระบุได้ว่าแต่ละปุ่มบน UI เรียก endpoint ใด.
- ไม่มี secret อยู่ใน Git, console log, error response หรือ browser bundle.
- Pull request ที่ lint/test/build ไม่ผ่าน merge ไม่ได้.

### Phase 1 — ปรับฐานข้อมูลให้รองรับผลิตภัณฑ์จริง

**งาน**

1. ย้าย schema จาก `public/Database/` ไปเป็น migration ของ backend; ห้ามให้ SQL schema/seed ที่มีข้อมูลทดสอบเป็น public static asset.
2. แยก migration schema และ seed local/dev; seed ต้อง hash password และห้าม deploy พร้อม production.
3. เติม constraints/indexes ที่จำเป็น: `acc.email` unique, unique follow/block ต่อคู่บัญชี, unique like/save ต่อผู้ใช้+โพสต์, unique pet relationship ต่อคู่สัตว์, foreign keys, timestamps, soft-delete policy และ indexes สำหรับ feed/search/match/message.
4. ปรับ model เนื้อหา: schema ปัจจุบันแยก `h_post` กับ `x_post` (`ERD_V1_4_3.sql:111-182`) แต่ UI ใช้ post เดียวที่มี category (`constants.jsx:48-66`). เลือก model เดียว `posts` + `post_type/category` เพื่อให้ create/edit/like/comment/report ทำงานเสมอกัน.
5. เพิ่ม model ที่ยังไม่มีใน schema: `conversations`/`conversation_members` (messages ปัจจุบันไม่มี room/match reference), `notifications`, `media_uploads`, และ report event ที่เก็บผู้รายงาน/เป้าหมาย/สถานะ.
6. นิยาม matching state (`passed`, `interested`, `matched`, `unmatched`) พร้อม `initiator_pet_id`, `recipient_pet_id`, timestamp และข้อจำกัดไม่ให้สร้างคู่ซ้ำ.
7. ใช้ PostGIS กับ location/province สำหรับ distance filter เท่านั้น พร้อม index แบบ geography; ห้าม expose พิกัดละเอียดของผู้ใช้บน feed.

**เกณฑ์ผ่าน**

- สร้างฐานข้อมูลว่างแล้ว run migrations ได้สำเร็จหนึ่งครั้ง และ run ซ้ำไม่ทำให้ schema เพี้ยน.
- seed local สร้าง account/pet/post/match ที่ login และทดสอบได้ โดยไม่มี plaintext password.
- query feed, message list และ match filter มี index และผ่าน explain baseline ที่ backend ทีมตกลง.

### Phase 2 — Backend API, identity และ media

**งาน**

1. สร้าง auth API: register, login, refresh, logout, forgot password, verify/reset password; password hash ด้วย Argon2id หรือ bcrypt, rate limit endpoint สำคัญ, token rotation และ revoke on logout/reset.
2. สร้าง resource API ตามลำดับ: profile/follow/block/report → pets/media → posts/interactions/comments → matching → conversations/messages → notifications.
3. บังคับ authorization ทุก endpoint: owner แก้/ลบได้เฉพาะ resource ของตน, ผู้ใช้ที่ block กันมองไม่เห็นกัน, report ไม่เปิดให้เจ้าของเป้าหมายเห็นข้อมูลผู้รายงาน.
4. ใช้ object storage สำหรับรูป profile/pet/post; API รับ upload metadata/URL ที่จำกัด type/size, ไม่เก็บ binary ใน database.
5. เขียน OpenAPI document และ generate/maintain JavaScript API client contract จาก source เดียว.
6. สร้าง health/readiness endpoint และ migration rollout procedure.

**เกณฑ์ผ่าน**

- API integration test ครอบคลุมทุก endpoint ที่เปลี่ยนข้อมูลและกรณี 401/403/404/422.
- User A ไม่อ่านหรือแก้ post, pet, message หรือ profile private ของ User B ได้.
- รูปที่อัปโหลดผิดชนิด/เกินขนาดถูกปฏิเสธ และไฟล์ที่อนุญาตเปิดได้ผ่าน URL ที่กำหนด.

### Phase 3 — วาง production foundation ใน Next.js

**งาน**

1. เพิ่ม `src/server/api/client.js` แบบ `server-only`; รวม base URL, request ID, timeout, JSON error normalization และห้าม export token สู่ component client.
2. เพิ่ม `src/server/auth/` สำหรับ read/set/clear session และ `requireAuth`; เพิ่ม middleware ป้องกัน route หลัง login.
3. เพิ่ม `src/server/security/` สำหรับ CSRF/same-origin validation ใน action/route handler ที่เขียนข้อมูล.
4. เพิ่ม `src/shared/config/env.js` ที่ fail fast เมื่อค่าบังคับหาย และไม่ให้ import environment ลับจาก client code.
5. ตั้ง Next config สำหรับ production: security headers/CSP ที่จำกัด origin จริง, `poweredByHeader: false`, remote image allowlist แบบเจาะจง, `output: "standalone"`; ห้ามตั้ง ignore lint/build errors.
6. เพิ่ม error/loading/not-found UI ที่ไม่เผยรายละเอียด infrastructure และ logging ที่ redacts password, cookie, Authorization header.

**ไฟล์เดิมที่กระทบ**

- `src/app/layout.jsx:1-36` — metadata/lang/global shell และ global error boundary.
- `src/app/petory/layout.jsx:1-36` — ย้ายจาก global mock provider ไปเป็น shell/navigation ที่อ่าน session จริง.
- `next.config.mjs:1-7` — ขยายจาก config เริ่มต้นเป็น deploy/security config.
- `package.json:5-22` — เพิ่ม quality/deploy scripts และ dependencies ที่อนุมัติ.

**เกณฑ์ผ่าน**

- เปิด dev/staging/production ด้วย environment คนละชุดได้ และค่าบังคับหายจะ fail ก่อนรับ traffic.
- เปิด route ที่ป้องกันโดยไม่มี session แล้ว redirect ไป login; session หมดอายุ refresh ได้หรือ logout อย่างปลอดภัย.
- browser DevTools ไม่พบ backend token หรือ `BACKEND_URL` ที่เป็น secret.

### Phase 4 — ย้ายบัญชี, profile และสัตว์เลี้ยงก่อน

**งาน**

1. แยก `context.jsx` ออกเป็น feature-level hooks/actions; เริ่มจาก auth, current user และ pet data.
2. เปลี่ยน [login](/Users/muftee/Desktop/devtool/devtools/petory/src/app/petory/login/page.jsx:1), register, forgot-password และ onboarding ให้เรียก action จริง พร้อม field validation/loading/error state.
3. เปลี่ยน [profile](/Users/muftee/Desktop/devtool/devtools/petory/src/app/petory/profile/page.jsx:1), [pets list](/Users/muftee/Desktop/devtool/devtools/petory/src/app/petory/pets/page.jsx:1), create/edit/detail ให้โหลดและ mutate ข้อมูลจริง.
4. ทำ image upload ของ profile และ pet; วาด placeholder เดิมระหว่างรูปยังไม่พร้อม.
5. ทำ follow/unfollow, block/unblock, report user โดยให้ UI revalidate หลัง server สำเร็จเท่านั้น.

**เกณฑ์ผ่าน**

- สมัคร → onboarding → สร้างสัตว์เลี้ยง → logout/login ใหม่ แล้วยังเห็นข้อมูลเดิม.
- ผู้ใช้ไม่สามารถแก้ไข/ลบสัตว์ของคนอื่นผ่าน UI หรือเรียก API ตรง.
- Block แล้ว target ไม่ปรากฏใน feed/matching/profile ตาม policy.

### Phase 5 — ย้าย feed และ interaction ทั้งหมด

**งาน**

1. แทน `initialState().posts` ด้วย paginated server data; คง UX ของ Home/Explore เดิม (`home/page.jsx:7-94`, `explore/page.jsx:12-87`).
2. ทำ category, species, search, sort และ cursor pagination ผ่าน query parameters ที่ validate แล้ว.
3. ทำ create/edit/delete post พร้อม ownership, media attachment และ optimistic UI ที่ rollback เมื่อ server fail.
4. ทำ like, save, comment, report post ด้วย idempotent API และ count ที่ได้จาก server.
5. แก้ helper/view model (`helpers.jsx:17-46`) ให้ map API DTO เป็น display model แทน mock data โดยไม่ผูก component กับ API response ตรง.

**เกณฑ์ผ่าน**

- โพสต์/แก้ไข/ลบ/like/save/comment คงอยู่หลัง refresh และแสดงเฉพาะคนที่ได้รับสิทธิ์.
- Search/filter/sort ให้ผลตาม query และไม่โหลดข้อมูลทั้งระบบใน browser.
- เรียก like หรือ save ซ้ำจาก retry ไม่ทำให้ count หรือ relation ซ้ำ.

### Phase 6 — Matching, chat และ notification

**งาน**

1. แทน queue ที่คำนวณจาก mock data ใน [matching/page.jsx](/Users/muftee/Desktop/devtool/devtools/petory/src/app/petory/matching/page.jsx:8) ด้วย endpoint candidate ที่ filter ที่ server (species, distance, gender, size, personality, block/pass state).
2. ทำ pass/interest เป็น state transition ที่ idempotent; เมื่อทั้งคู่สนใจ ให้ backend สร้าง match+conversation atomically.
3. ย้าย conversation list และ [chat room](/Users/muftee/Desktop/devtool/devtools/petory/src/app/petory/messages/[matchId]/page.jsx:8) ไปใช้ messages จริง; เริ่ม revalidate/polling แบบจำกัด แล้วออกแบบ event interface สำหรับ WebSocket ในอนาคต.
4. ทำ unmatch ที่ปิด conversation ตาม policy โดยไม่ลบ audit trail; block/report จาก chat มีผลกับ feed/matching/conversation visibility.
5. สร้าง notification event ทุก like/comment/follow/match/message, paginated list และ mark-read/mark-all-read.

**เกณฑ์ผ่าน**

- Mutual interest สร้าง match และสนทนาได้เพียงหนึ่งชุดต่อคู่สัตว์.
- ข้อความที่ส่งคงอยู่หลัง refresh และผู้ที่ไม่ใช่สมาชิก conversation เปิดไม่ได้.
- Notification เกิดหนึ่งครั้งต่อ event ที่กำหนด, unread count/mark-read ถูกต้อง และไม่แสดง event จากคนที่ block.

### Phase 7 — Test, hardening, deploy และเปิดใช้งานจริง

**งาน**

1. เพิ่ม unit tests: validation, permission policy, API DTO mapper, matching state machine, pagination cursor และ env config.
2. เพิ่ม API/integration tests ต่อ PostgreSQL test database: migration, auth, ownership, block/report, post interaction, mutual match, messages และ notification.
3. เพิ่ม browser E2E: register/login, onboarding+pet, post flow, follow/block, match-to-chat, notification read state และ unauthorized route.
4. ทำ security review: CSP, CORS/origin list, CSRF, cookie flags, upload validation, rate limit, secrets scan, dependency audit.
5. Build standalone image/deployment artifact, run migrations as deploy step ที่ควบคุมได้, health check, rollback และ backup/restore drill.
6. ติดตั้ง observability: structured logs, error tracking, health check, request ID, dashboard สำหรับ API errors/latency/background-job failures.
7. เปิด staging ก่อน แล้วทำ smoke test จาก release checklist ก่อน promote production.

**เกณฑ์ผ่าน**

- CI ผ่าน `npm ci`, lint, unit, integration, E2E และ production build.
- Staging ทำ user journey ครบโดยไม่มี mock state; restart service หรือ refresh browser แล้วข้อมูลไม่สูญหาย.
- Production มี HTTPS, secret injection, health check, database backup และ rollback procedure ที่ทดสอบแล้ว.

## 5. ตารางการย้ายโค้ดเดิม

| ของเดิม | ปัญหาปัจจุบัน | ปลายทาง |
|---|---|---|
| `src/app/petory/context.jsx` | global state 330 บรรทัด ทำ auth/data/business logic พร้อมกัน | แยก feature actions/hooks; server เป็น source of truth |
| `src/app/petory/constants.jsx` | mock users/pets/posts/matches/notifications | seed สำหรับ dev เท่านั้น; production โหลดจาก API |
| `src/app/petory/helpers.jsx` | map state ใน browser | DTO mapper ที่ test ได้; query/view model แบบ domain-specific |
| `src/app/petory/components/Modals.jsx` | form submit ผ่าน context mock | feature form + action + zod validation + server error state |
| `public/Database/*.sql` | public asset, re-run risk, plaintext test data | private backend migrations/seeds |
| `next.config.mjs` | มีเพียง React Compiler | security headers, CSP, image allowlist, standalone output |

## 6. API contract ระดับแรก

> URL และชื่อ field ปรับได้ตาม backend ที่เลือก แต่ต้อง lock contract ก่อน Phase 4

```text
POST   /auth/register | /auth/login | /auth/refresh | /auth/logout
POST   /auth/password/forgot | /auth/password/reset
GET    /me             PATCH /me       POST /me/avatar
GET    /users/:id      POST /users/:id/follow | /block | /report
GET    /pets           POST /pets      GET/PATCH/DELETE /pets/:id
GET    /posts          POST /posts     GET/PATCH/DELETE /posts/:id
POST   /posts/:id/like | /save | /comments | /report
GET    /matching/candidates   POST /matching/interactions
GET    /matches               POST /matches/:id/unmatch
GET    /conversations         GET /conversations/:id/messages
POST   /conversations/:id/messages
GET    /notifications         POST /notifications/read
```

## 7. ความเสี่ยงและการรับมือ

| ความเสี่ยง | ผลกระทบ | วิธีลดความเสี่ยง |
|---|---|---|
| ย้ายทุกหน้าพร้อมกัน | UI พังและแก้ยาก | ส่งมอบตาม phase, feature flag/staging และคง UI เดิม |
| schema ปัจจุบันไม่ตรง UI | data model บิดและ query ซับซ้อน | ออกแบบ migration ใหม่ก่อนเขียน frontend integration |
| ทำ auth ฝั่ง client | token รั่ว/ข้ามสิทธิ์ | HttpOnly cookie + BFF + server/backend authorization |
| ความลับใน env/example | account/backend ถูกโจมตี | ไม่ commit `.env`, rotate secrets, secret scan ใน CI |
| chat polling มากเกิน | database/API load | cursor, polling เฉพาะห้องเปิด, backoff; scale เป็น realtime เมื่อมี metric รองรับ |
| image upload ไม่จำกัด | malware/cost/data leak | allow type/size, scan if available, private object storage/signed URLs |
| deploy migration ผิด | downtime/data loss | backup, tested migration, backward-compatible rollout, rollback runbook |

## 8. Definition of Done

ถือว่าโปรเจกต์พร้อม production เมื่อครบทั้งหมด:

1. ทุก route ปัจจุบันภายใต้ `/petory` ใช้ข้อมูลจริง ไม่มี `initialState` เป็น source of truth.
2. ข้อมูลสำคัญคงอยู่หลัง refresh, logout/login และ server restart.
3. Authentication, ownership, block, report และ admin/moderation policy ผ่าน integration/E2E tests.
4. `lint`, tests, production build และ security checks ผ่านใน CI โดยไม่มี ignored errors.
5. Production ไม่มี mock seed, plaintext password, hard-coded secret หรือ token ใน client.
6. มี staging, HTTPS, environment separation, log/error tracking, health check, database backup และ rollback ที่ทดสอบแล้ว.
7. ทีม runbook สามารถ deploy, rollback, restore backup และรับมือ backend unavailable ได้.

## 9. จุดตัดสินใจก่อนเริ่มเขียนโค้ด

1. เลือก/ยืนยัน repository และเทคโนโลยี backend ที่จะรับ PostgreSQL/PostGIS และ API contract.
2. กำหนด policy ที่เป็นธุรกิจ: matching เพื่อเพื่อนเล่น/คู่รัก, อายุขั้นต่ำ, ระยะห่างที่เปิดเผย, การลบ account/data retention และ moderator workflow.
3. เลือก object storage และโดเมน production/staging.
4. กำหนด owner สำหรับ database migration, backend API, frontend integration และ deployment.

## 10. การตรวจตามแผน

หลังแต่ละ phase ให้ตรวจหลักฐานตามนี้ก่อนเริ่ม phase ถัดไป:

```text
Phase 0: CI result + API contract review
Phase 1: clean-database migration test + schema review
Phase 2: backend integration/security test report
Phase 3: Next.js build + protected-route + secret exposure check
Phase 4-6: feature E2E videos/results + persistence after restart
Phase 7: staging smoke test + deploy/rollback/backup evidence
```

ไม่มี phase ใดควรข้าม quality gate เพราะจะทำให้ bug เรื่องข้อมูลและสิทธิ์ย้อนกลับไปแก้ยากกว่าเดิม.
