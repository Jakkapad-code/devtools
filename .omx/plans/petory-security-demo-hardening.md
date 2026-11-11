# แผนแก้ความปลอดภัยและความพร้อมเดโม Petory

สถานะ: ดำเนินการแก้และทดสอบรอบรวมแล้ว; host integration, migration รูปเดิม และ Linux/amd64 ผ่านการจำลองพร้อม Cloudflare ผ่าน; ส่ง Gmail จริง, GitHub Actions บน remote และ native Linux ยังไม่ได้ทดสอบ; global rate limit ยังมีความเสี่ยงและต้องใช้มาตรการ edge/trusted proxy ก่อน production

## เป้าหมายและขอบเขต

- แก้ข้อบกพร่องความปลอดภัยและ UX ที่พบจากการตรวจ พร้อม regression tests และทดสอบเดโมบน Linux image อาจารย์
- รักษา Next.js/JavaScript, PostgreSQL, Docker Compose, GitHub Actions และ Cloudflare Quick Tunnel; ไม่เพิ่ม Jenkins, RabbitMQ, Kubernetes หรือ Caddy ใน demo
- เพิ่มตัวกรองอายุ/ระยะทางและรูปสัตว์ไม่เกิน 5 รูป พร้อม Gmail SMTP; ไม่ทำ private profile เต็มระบบในรอบนี้ ให้ปิด/แจ้งว่ายังไม่รองรับแทนการทำให้เข้าใจผิด
- ระหว่างพัฒนาใช้การตรวจและทดสอบบน host กับฐานข้อมูลทดสอบแยกก่อน ไม่ build หรือทดสอบ Linux image ทุกขั้น; เมื่อทุกงานเสร็จค่อยตรวจ Linux image และ Cloudflare รวมรอบสุดท้าย
- ไม่แก้/ลบข้อมูลผู้ใช้ ไม่รัน seed ซ้ำในฐานข้อมูลใช้งานจริง ไม่เปิดบริการสาธารณะด้วยข้อมูลจริง ไม่ push/deploy หรือเผยความลับโดยไม่มีคำสั่งแยก

## 1. Dependency และ CI security gate

- เริ่มจาก `npm audit --omit=dev` และตรวจ upstream advisory ปัจจุบัน; ใน `petory/package.json` และ lockfile อัปเดต Next และ eslint-config-next รุ่นที่แก้ช่องโหว่และเข้ากัน, Zod และ transitive dependencies sharp/source-map-js ตามต้นตอ โดยไม่บังคับอัปเดตล่าสุดหากรุ่นที่ปลอดภัยกว่าเหมาะกว่า
- ตรวจเงื่อนไขการโจมตีแยกจากผล advisory; หากยังมีช่องโหว่ที่แก้ไม่ได้ให้บันทึกความเสี่ยงและเหตุผล ไม่ใช้ audit fix --force อัตโนมัติ
- เพิ่มตรวจ dependency ใน `.github/workflows/verify.yml` ตามนโยบาย high/critical พร้อมระบุว่าข่าวสาร advisory อาจทำให้ pipeline ล้มภายหลัง; ไม่มี publish/deploy อัตโนมัติ
- ผ่านเมื่อ `npm ci`, lint, unit, build, integration และ E2E ผ่าน และ `npm audit --omit=dev` ไม่มีรายการ high/critical ที่ไม่มีข้อยกเว้นที่อธิบายชัด

## 2. การบล็อกและสิทธิ์การเข้าถึงโพสต์

- ปรับ `petory/src/server/posts/repository.js` และ routes like/save ให้สิทธิ์เหมือนการอ่าน/คอมเมนต์: ห้ามโต้ตอบเมื่อ A บล็อก B หรือ B บล็อก A รวมผู้เขียน/โพสต์ที่ลบแล้ว; ใช้คำสั่งที่ตรวจและเขียนอย่างสอดคล้องเพื่อจำกัด race
- ทดสอบ API โดยตรงทั้งสองทิศทาง, ผู้ใช้ที่สาม, unblock, โพสต์ลบ, ไม่เปลี่ยน DB เมื่อห้าม รวม UI ปกติ

## 3. Upload และ error handling

- ตรวจ `petory/src/app/api/media/route.js`, `media/avatar/route.js`, `server/media/service.js` และทุกเส้นทางเปิดบริการจริง: ตั้งขีดจำกัดทั้ง request ก่อน parse ให้ครอบคลุม local และ Quick Tunnel; ไม่พึ่ง `Content-Length` ที่ลูกค้าปลอมได้เพียงอย่างเดียว และไม่อ้างว่า Server Actions bodySizeLimit ครอบ route handler
- ประเมินการอ่าน stream แบบ bounded หรือ ingress ที่บังคับจริง โดยรวม multipart overhead รักษาขนาดไฟล์ภาพไม่เกิน 2 MB และไม่รับไฟล์ที่ชนิด/เนื้อหาไม่ตรงตามนโยบาย
- ให้ validation error ที่ปลอดภัยและ status เหมาะสม; ไม่ส่ง error DB/stack กลับ client เก็บ log ที่ไม่เปิดเผยข้อมูลอ่อนไหว
- ผ่านเมื่ออัปโหลดปกติสำเร็จ, ปฏิเสธไฟล์/คำขอใหญ่ด้วย 413 และทดสอบ missing/เท็จ Content-Length, chunked body, multipart หลายส่วน, type ปลอม, quota และ ownership ทั้งสอง endpoints

## 4. Authentication และ rate limiting

- ทบทวน global/per-account limits ใน auth routes, `server/security/rate-limit.js` และ config; ออกแบบจำกัดชั้น account และ client/edge ที่เชื่อถือได้โดยไม่ปล่อย brute force หรือให้ลูกค้าปลอม IP headers เอง
- อย่ายกเลิก global guard เฉย ๆ; ระบุความแตกต่าง local vs Quick Tunnel และผลต่อ NAT/shared IP; หากหา trusted client identity ไม่ได้ต้องมี safe fallback และรายงานข้อจำกัด ไม่อ้างว่าป้องกัน DoS ได้สมบูรณ์
- ทดสอบ brute-force, โควตาของบัญชี/clients ต่างกัน, spoofed headers, 429/Retry-After และ concurrency; ต้องไม่ทำผู้ใช้ปกติทั้งหมดถูกล็อกด้วยการโจมตีบัญชีเดียวภายใต้สมมติฐานที่ระบุ

## 5. หน้าตั้งค่าและ Matching ตามอายุ/ระยะทาง

- `src/app/petory/settings/page.jsx`: ปิดหรือซ่อน Private Profile, Push Notifications, Show My Distance ที่ยังไม่ทำจริง พร้อมข้อความว่าไม่รองรับ; อย่าอ้างว่ามี privacy policy ทำงานจริง
- `components/Modals.jsx`, `matching/page.jsx`, matching API/repository: เพิ่มตัวกรองช่วงอายุและระยะทางให้ query จริงร่วมกับ species/gender/size/personality, block และ matching purpose
- ให้ผู้ใช้เลือกอนุญาตตำแหน่งหรือระบุโดยสมัครใจ; เก็บเฉพาะข้อมูลที่จำเป็น ใช้ PostGIS คำนวณ ไม่เปิดพิกัดละเอียดของผู้อื่นใน API; กรณีไม่อนุญาต/ข้อมูลไม่ครบแสดงสถานะชัดเจนและไม่สร้างระยะปลอม
- กำหนดข้อมูลตำแหน่งจำลองสำหรับทดสอบเท่านั้น; ทดสอบระยะจริง/ขอบเขต, อายุขั้นต่ำ–สูงสุด, ตำแหน่งหรือวันเกิดว่าง, สิทธิ์ geolocation ถูกปฏิเสธ, ผล block และ API ไม่เผยพิกัดผู้อื่น

## 5A. รูปสัตว์สูงสุด 5 รูป

- เพิ่ม schema/migration เก็บความสัมพันธ์รูปสัตว์สูงสุด 5 รูป แสดง/จัดลำดับ/เลือกรูปหลัก/เพิ่ม/ลบ; ตรวจ ownership และ limit ฝั่ง server ไม่ใช่เฉพาะ UI
- ย้ายหรือรองรับรูปหลักเดิมอย่างปลอดภัยโดยไม่ลบรูป/ข้อมูลเดิม; รองรับ API หรือหน้าจอเดิมที่ใช้รูปหลัก พร้อมกำหนดวิธี rollback
- ทดสอบสัตว์เดิมที่มี/ไม่มีรูป, อัปโหลด 1–5 รูป, ปฏิเสธรูปที่ 6, เปลี่ยนรูปหลัก/ลบ/บันทึกซ้ำ, ไฟล์ผิด/ใหญ่, สิทธิ์รูปคนอื่น และผลหลัง reload

## 5B. Gmail SMTP สำหรับรีเซ็ตรหัสผ่าน

- เพิ่มตัวเลือก Gmail SMTP แยกจาก Resend เดิม พร้อม config/env example, TLS, error handling ปลอดภัย และคู่มือ; ค่าเริ่มต้นปิดการส่งอีเมลจนตั้งค่าครบ
- เจ้าของบัญชีต้องเพิกถอน App Password ที่เคยส่งในแชตและสร้างใหม่เองเมื่อพร้อม; ไม่บันทึกค่าดังกล่าวใน source, Git, image, log, terminal output หรือแชต และไม่ใช้รหัสบัญชี Google ปกติ
- รองรับ 2-Step Verification และข้อจำกัดบัญชีมหาวิทยาลัย; ห้ามปิด guard ที่จำกัด Quick Tunnel เป็นข้อมูล mock เพื่อทดลองอีเมลจริง ให้ใช้สภาพแวดล้อมแยก
- ระหว่างพัฒนาทดสอบ SMTP ด้วย local fake server โดยไม่ส่งอีเมลจริง; ทดลองส่งอีเมลจริงเมื่อผู้ใช้ตั้ง credentials ใหม่ใน secret env อย่างปลอดภัยและอนุญาต โดยถ้าไม่มี credentials ให้รายงานว่าไม่ได้ทดสอบส่งจริง
- ผ่านเมื่อ reset token ใช้ครั้งเดียว/หมดอายุ, URL ตรง origin, config ผิดไม่รั่ว secret, SMTP ล้มเหลวจัดการเหมาะสม และ provider Resend เดิมไม่เสีย

## 6. Chat และ Notifications

- แก้ `server/conversations/repository.js`: โหลดข้อความล่าสุด 100 ข้อความ พร้อมโหลดเก่าย้อนหลังแบบ cursor/keyset ที่เรียง `(created_at,id)` คงที่ รวมเวลาซ้ำกัน และตรวจสิทธิ์ทุกหน้า; คงการบล็อกและ unmatch ปิดห้อง
- อัปเดตหน้าห้องแชทให้ผู้รับเห็นข้อความโดย polling เฉพาะห้องเปิดอยู่ (cleanup เมื่อออก, หยุด/ลดเมื่อแท็บซ่อน, จัดการ error/backoff, ป้องกันข้อความซ้ำและผลตอบกลับย้อนหลังทับข้อความใหม่); ไม่เรียก WebSocket/realtime จริง
- Notifications: เพิ่มทางเข้าหน้า, แสดงอ่าน/ยังไม่อ่านตาม DB จริง, ไม่แปะ 'ใหม่' ให้ทุกแถว; จัดลำดับอ่าน/mark read ให้ไม่เผลอ mark รายการใหม่ที่ยังไม่เห็น โดยเปลี่ยน API เท่าที่จำเป็น
- ทดสอบข้อความ 101+ รายการ, เวลาเท่ากัน, pagination ไม่มีขาด/ซ้ำ, การส่งสองบัญชี, polling/cleanup, race, block/unmatch และสถานะอ่านเมื่อ refresh

## 7. เดโม image อาจารย์และเอกสาร

- รักษาไฟล์ `Dockerfile.instructor`, ignore, `INSTRUCTOR.md`, `README-INSTRUCTOR.md` และการแก้ README ที่มีอยู่; ตรวจ image ไม่รวม `.env` จริง, node_modules หรือความลับ
- หลังงานและการตรวจบน host เสร็จทั้งหมดเท่านั้น ค่อยตรวจ clone/repro และ Linux/amd64 image อาจารย์, Docker-in-Docker, migration, seed ฐานข้อมูลว่าง, demo health + login, Cloudflare Quick Tunnel, stop/start โดยใช้เฉพาะข้อมูล mock และ container/volume แยก; ชี้แจง Rosetta/การ retry Quick Tunnel, limit network และ --privileged
- ยังไม่ยืนยัน native Linux AMD64 หากทดสอบได้แค่ emulation; Quick Tunnel ยังไม่ใช่ production และ seed ไม่ใช่ข้อมูลจริง
- เก็บคู่มือ host vs image แยกกัน, บทอัดคลิปและบัญชีเดโม, อธิบายปุ่มที่ยังไม่รองรับ, การแชท/notifications, admin, ความปลอดภัย และการสำรองข้อมูล
- GitHub Actions workflow ถูกตรวจในเครื่อง; สถานะจริงบน GitHub และ fresh clone จาก branch จะยืนยันได้หลัง user สั่ง commit/push เท่านั้น

## Verification / เกณฑ์จบ

1. ระหว่างพัฒนา: regression tests ใหม่ครอบคลุม security, SMTP fake server, settings, age/distance, 5 รูป, chat และ notifications โดยตรวจบน host และฐานข้อมูลทดสอบแยก
2. เมื่อทุกงานเสร็จ: npm ci → lint → unit → build → integration PostgreSQL → E2E browser ในฐานข้อมูลที่สร้างเฉพาะทดสอบ → audit; ไม่ลบ/seed ฐานข้อมูลจริง
3. ท้ายสุดเพียงรอบรวม: Docker build instructor linux/amd64 → ตรวจ image → demo cloudflared health + login + feed/pet/post/follow/block/match/chat/unmatch; หาก public service ล้มให้บันทึกหลักฐานและรายงาน ไม่อ้างว่าผ่าน
4. รายงานผลจริง, รายการที่เหลือ/ข้อจำกัด, security advisories ที่แก้ไม่หมด, ไฟล์ที่แก้ และคู่มืออัดคลิป; ไม่อ้าง production-ready จากผลเดโมอย่างเดียว

## ความเสี่ยงและเงื่อนไข

- การอัปเกรด dependency อาจเปลี่ยนพฤติกรรม; ใช้เวอร์ชัน patched ที่ตรวจแล้วและรันชุด regression ทั้งหมด
- Client IP หลัง tunnel อาจพิสูจน์ไม่ได้โดยไม่ตั้ง trusted proxy; การตั้งค่าหลวมอาจปลอม header ได้ ต้องไม่รับปาก per-IP ปลอดภัยโดยไม่มีหลักฐาน
- ทดสอบ upload chunked/length ปลอมและขีดจำกัด memory ใน container แยก; 2 MB file กับ multipart overhead ไม่ใช่ขนาด request เดียวกัน
- การเพิ่ม cursor หรือ notification read อาจต้องแก้ API แบบ compatible และอาจต้อง migration: ตรวจข้อมูลเก่าและ rollback; ไม่เปลี่ยน schema จริงโดยไม่ทดสอบ
- npm registry/Docker Hub/Cloudflare ต้องใช้อินเทอร์เน็ต และ Quick Tunnel ไม่รับประกัน uptime; รายงานแยกการล่มภายนอกจากโค้ด
- การพัฒนา private profile จริง, production deployment/backup automation และ RabbitMQ อยู่นอกขอบเขต; ส่ง Gmail จริงต้องอาศัย credentials ใหม่จากผู้ใช้และการอนุญาต ไม่ใช้ค่าที่เคยส่งในแชต
