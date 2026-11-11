# Petory ใน image ที่อาจารย์กำหนด

ชุดนี้สร้าง image ใหม่จาก `tuchsanai/devtools:2569_1` และบรรจุ source ของ
Petory ที่ `/workspace/petory` โดยคงคำสั่งเริ่มต้นของ image อาจารย์ไว้
เมื่อเปิด demo ภายใน container จะมี Docker อีกชั้นสำหรับ Next.js,
PostgreSQL/PostGIS และ Cloudflare Quick Tunnel

## Build image

เปิด Docker Desktop หรือ Docker Engine แล้วรันในโฟลเดอร์ `petory`:

```bash
docker build --platform linux/amd64 \
  -f Dockerfile.instructor -t petory-instructor:local .
```

เมื่อต้องการระบุ commit สำหรับส่งอาจารย์ ให้ commit source และไฟล์เหล่านี้
ก่อน จากนั้น build พร้อม label:

```bash
docker build --platform linux/amd64 \
  --build-arg PETORY_SOURCE_REVISION="$(git rev-parse HEAD)" \
  -f Dockerfile.instructor -t petory-instructor:local .
```

label บอก commit ที่ผู้ build ระบุ ไม่ได้พิสูจน์ว่าไฟล์ใน worktree ไม่มีการแก้ไข
จึงควรตรวจ `git status` ก่อน build เพื่อให้ image ตรงกับ commit บน GitHub

## เปิด container และ demo

คำสั่งนี้ตั้งชื่อ container ว่า `petory-instructor` และเปิด SSH ให้เข้าได้เฉพาะ
จากเครื่องที่รัน Docker:

```bash
docker run -dit --platform linux/amd64 --name petory-instructor \
  --privileged -p 127.0.0.1:2223:22 petory-instructor:local
docker exec -it petory-instructor bash
```

ภายใน container รอให้ `docker info` เชื่อมต่อ daemon ได้ แล้วรัน:

```bash
cd /workspace/petory
docker info
npm run demo:start
```

บน Mac ARM ที่เจอปัญหา BuildKit กับ Rosetta ให้ใช้
`DOCKER_BUILDKIT=0 npm run demo:start` ภายใน container แทน
ลิงก์จะอยู่หลัง `READY:` และเปลี่ยนทุกครั้งที่เริ่ม demo ใหม่
บัญชีผู้ใช้คือ `aom@petory.local` รหัสผ่าน `petory-demo-password-2026`
บัญชีผู้ดูแลคือ `admin@petory.local` รหัสผ่าน `petory-admin-password-2026`
เข้าสู่ระบบด้วยบัญชีผู้ดูแลแล้วเปิด `/petory/admin` ต่อท้ายโดเมน Quick Tunnel
หากมีฐานข้อมูลเดโมเดิม `npm run demo:start` จะเพิ่ม admin โดยไม่ล้างข้อมูล
บัญชีรหัสผ่านคงที่นี้สำหรับเดโมข้อมูลสมมุติเท่านั้น ห้ามใช้กับ production

หรือเข้า container ผ่าน SSH ด้วย `ssh root@localhost -p 2223` และรหัสผ่าน
ที่อาจารย์กำหนด คำสั่ง `docker run` ข้างต้นใช้พอร์ต 2223 เพื่อไม่ชนกับ
container `devtools` เดิมที่ใช้ 2222 หากพอร์ตหรือชื่อ
container ถูกใช้แล้วให้เลือกชื่อและพอร์ตอื่น

## ตรวจสอบและหยุด

บนเครื่องที่รัน Docker ตรวจ base และ commit label ของ image ได้ด้วย:

```bash
docker history petory-instructor:local
docker image inspect petory-instructor:local \
  --format '{{.Os}}/{{.Architecture}} revision={{index .Config.Labels "org.opencontainers.image.revision"}}'
```

`Dockerfile.instructor` คือหลักฐานการระบุ base image ส่วน `docker history`
และ label ช่วยตรวจ image ที่ build แล้ว ภายใน container ใช้ `docker ps`
ตรวจบริการที่รัน และตรวจ `https://<url>/api/health` ผ่าน Cloudflare ได้

หยุด demo จากภายใน container ด้วย `npm run demo:stop` แล้วออกด้วย `exit`
จากนั้นบนเครื่องที่รัน Docker ใช้ `docker stop petory-instructor` การหยุด
container ไม่ลบข้อมูล แต่การลบ container อาจทำให้ source ที่แก้ใน container,
database และ inner images หายไป เพราะไม่ได้ตั้ง external volume

Quick Tunnel ใช้เพื่อทดลองเท่านั้น URL เปลี่ยนเมื่อสร้าง tunnel ใหม่
และควรใช้ข้อมูลตัวอย่าง ห้ามใส่ `.env` จริงหรือข้อมูลส่วนตัวลงใน image
