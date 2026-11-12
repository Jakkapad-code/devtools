# Petory: วิธีรันสำหรับอาจารย์

ต้องมี Git, Docker Engine หรือ Docker Desktop ที่เปิดอยู่ และอินเทอร์เน็ต
คำสั่งต่อไปนี้ใช้ image อาจารย์ `tuchsanai/devtools:2569_1` เป็น base
โดย source code อยู่ที่ `/workspace/petory` ภายใน Linux container

## 1. Clone และ build (เครื่องที่มี Docker)

```bash
git clone --branch main --single-branch https://github.com/Jakkapad-code/devtools.git
cd devtools/petory
docker build --platform linux/amd64 --build-arg PETORY_SOURCE_REVISION="$(git rev-parse HEAD)" -f Dockerfile.instructor -t petory-instructor:local .
```

## 2. เปิด container และเริ่มเดโม

```bash
docker run -dit --name petory-instructor --platform linux/amd64 --privileged petory-instructor:local
docker exec -it petory-instructor bash
```

คำสั่งต่อไปนี้รัน **ภายใน container** (รอให้ Docker ภายในพร้อมก่อน):

```bash
cd /workspace/petory
until docker info >/dev/null 2>&1; do sleep 2; done
```

หากใช้ Windows ให้รันคำสั่งนี้ **ภายใน container ก่อนเริ่มเดโม** เพื่อแปลง
line endings ของ shell script เป็น LF (ไม่ลบข้อมูล):

```bash
node -e 'const fs=require("node:fs"); for(const p of ["scripts/jenkins-deploy.sh","scripts/jenkins-integration.sh"]) fs.writeFileSync(p,fs.readFileSync(p,"utf8").replace(/\r\n/g,"\n"))'
```

จากนั้นเริ่มเดโม **ภายใน container**:

```bash
npm run demo:start
```

เปิดลิงก์ `READY: https://...trycloudflare.com/petory/login` ที่แสดงใน
Terminal หรือส่งให้ผู้ทดสอบ ระบบเตรียม database, migration และข้อมูลเดโมให้

```text
Email:    aom@petory.local
Password: petory-demo-password-2026

Admin:    admin@petory.local
Password: petory-admin-password-2026
```

เข้าสู่ระบบด้วยบัญชี Admin แล้วเปิด `/petory/admin` ต่อท้ายโดเมน Quick Tunnel
บัญชีเหล่านี้ใช้สำหรับข้อมูลสมมุติในการสาธิตเท่านั้น ห้ามใช้กับ production

บน Mac ARM หาก build ภายใน container มีปัญหากับ Rosetta ให้ลอง
`DOCKER_BUILDKIT=0 npm run demo:start` แทน
หากขึ้น `Public health check failed` ให้ลองรันคำสั่งเริ่มเดโมอีกครั้ง
เพื่อขอ Quick Tunnel ใหม่ และตรวจการเชื่อมต่ออินเทอร์เน็ต

## 3. หยุดและเปิดอีกครั้ง

หยุดเดโม **ภายใน container** แล้วออก:

```bash
npm run demo:stop
exit
docker stop petory-instructor
```

เปิดอีกครั้งจากเครื่องที่มี Docker:

```bash
docker start petory-instructor
docker exec -it petory-instructor bash
cd /workspace/petory
until docker info >/dev/null 2>&1; do sleep 2; done
npm run demo:start
```

Quick Tunnel ใช้สำหรับเดโม ลิงก์เปลี่ยนเมื่อเริ่มใหม่ และเครื่องกับ Docker
ต้องเปิดอยู่ การหยุด container ไม่ลบข้อมูล แต่การลบ container อาจทำให้ข้อมูล
เดโมหาย อย่าใช้ข้อมูลจริงในเดโม `--privileged` ใช้เพื่อรัน Docker ซ้อนใน
image อาจารย์ ควรรันเฉพาะในเครื่องทดสอบที่เชื่อถือได้

ถ้าชื่อ `petory-instructor` ถูกใช้แล้ว ให้เปลี่ยนชื่อในทุกคำสั่งให้ตรงกัน
ดูรายละเอียดเพิ่มเติมได้ใน [INSTRUCTOR.md](petory/INSTRUCTOR.md)
