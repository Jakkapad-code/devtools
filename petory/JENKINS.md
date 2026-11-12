# Jenkins CI/CD สำหรับ Petory Demo

Jenkins ตรวจ GitHub `main` ทุกประมาณ 2 นาที หลังตั้งค่าและรันครั้งแรก เมื่อพบ commit ใหม่จะตรวจโค้ดและ integration test ก่อน build image ที่ใช้ `tuchsanai/devtools:2569_1` เป็น base และเริ่มเดโมผ่าน Cloudflare Quick Tunnel

## เตรียมเครื่อง Mac สำหรับทดสอบ

ต้องมี Docker Desktop ที่เปิดอยู่, Git, Node.js 22, Google Chrome, Java และ Jenkins LTS ติดตั้งบน Mac เครื่องเดียวกัน Jenkins ต้องรันด้วยผู้ใช้ที่เข้าถึง Docker Desktop ได้ **อย่านำ Jenkins หรือ Docker socket ออกสู่อินเทอร์เน็ต**

ตัวอย่างติดตั้งด้วย Homebrew (เฉพาะแพ็กเกจที่ยังไม่มี):

```bash
brew install jenkins-lts node@22
```

เริ่ม Jenkins ใน Terminal โดยจำกัดหน้า Jenkins ไว้ที่เครื่องตัวเอง และให้ Jenkins เห็น Node 22 กับ Docker:

```bash
export PATH="$(brew --prefix node@22)/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
jenkins-lts --httpListenAddress=127.0.0.1 --httpPort=8080
```

เปิด `http://127.0.0.1:8080` ทำขั้นตอนติดตั้ง Jenkins และติดตั้ง suggested plugins ให้เสร็จ จากนั้น:

1. ไปที่ **Manage Jenkins → Nodes → Built-In Node → Configure** เพิ่ม label `petory-host` แล้วบันทึก ใช้เฉพาะเครื่องทดสอบที่เชื่อถือได้เพราะ job นี้สั่ง Docker ได้
2. สร้าง **New Item → Pipeline** ตั้งชื่อ `petory-demo`
3. ในส่วน Pipeline เลือก **Pipeline script from SCM → Git**
4. Repository URL: `https://github.com/Jakkapad-code/devtools.git` / Branch: `*/main` / Script Path: `Jenkinsfile` แล้วบันทึก
5. กด **Build Now** ครั้งแรก แล้วดูผลที่ Console Output หลังจากนั้น Jenkins จะตรวจ commit ใหม่ตามรอบที่กำหนด

Jenkins จะ deploy เฉพาะ commit ที่ยังตรงกับ `origin/main` และเฉพาะเมื่อทุกขั้นก่อนหน้าผ่าน หากทดสอบไม่ผ่านจะไม่อัปเดตเดโม

## การทำงานและข้อมูลเดโม

- Integration test ใช้ PostgreSQL container ชั่วคราวและข้อมูลทดสอบ ไม่ใช้ฐานข้อมูลเดิม
- Deploy ใช้ container เฉพาะชื่อ `petory-jenkins-instructor` ไม่แตะ `petory-instructor` เดิม
- Docker ภายใน image อาจารย์และสถานะเดโมเก็บแยกใน Docker volumes `petory-jenkins-docker-data` และ `petory-jenkins-demo-state` เพื่อเก็บ database และรหัสเชื่อมต่อข้ามการสร้าง container ใหม่ **ห้ามลบ volumes เหล่านี้หากต้องการเก็บข้อมูล**
- ชุดเดิม `petory-instructor` มีฐานข้อมูลและข้อมูลล็อกอินเดโมแยกจากชุด Jenkins ไม่ได้ย้ายข้อมูลมาให้อัตโนมัติ
- Console Output จะแสดง `READY: https://...trycloudflare.com/petory/login` พร้อมบัญชีเดโม ใช้ลิงก์ล่าสุดหลัง deploy เพราะลิงก์อาจเปลี่ยน
- หาก deploy ล้มเหลว สคริปต์พยายามกลับไปเปิด container ก่อนหน้าและเก็บ container ที่ล้มเหลวไว้ตรวจสอบ การ rollback container ไม่ได้ย้อน migration ของฐานข้อมูล จึงควรสำรองข้อมูลก่อนอัปเดต
- Docker-in-Docker ใช้ `--privileged` และรหัสเดโมเป็นข้อมูลสาธิตเท่านั้น ห้ามใช้กับข้อมูลจริงหรือ production

ตรวจสถานะหรือลิงก์ที่บันทึกไว้:

```bash
docker exec -e PETORY_DEMO_STATE_PATH=/var/lib/petory-jenkins-state/demo-state.json petory-jenkins-instructor sh -c 'cd /workspace/petory && npm run demo:status'
```

สถานะจะแสดงลิงก์ล่าสุดที่เคยบันทึก ซึ่งอาจไม่ออนไลน์หาก tunnel หลุด ให้ตรวจ Console Output และทดสอบลิงก์จริง
