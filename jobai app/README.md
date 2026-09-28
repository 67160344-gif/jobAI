# JobAI Hub

แพลตฟอร์มหางานและสมัครงานออนไลน์ด้วย AI ตาม Customer Journey Map (Frontend + REST API)

## วิธีรัน
```bash
npm install
npm start          # เปิด http://localhost:3000
```
หรือใช้ Docker: `docker compose up --build -V` (ต้องมี `-V` เมื่อ package.json เปลี่ยน เพื่อรีเฟรช node_modules ใน volume)

> ต้องเปิดผ่าน http://localhost:3000 เท่านั้น เพราะหน้าเว็บเรียก API จากเซิร์ฟเวอร์ (เปิดไฟล์ index.html ตรงๆ จะใช้งานไม่ได้)

## ฟีเจอร์
1. **AI วิเคราะห์ Resume** อัปโหลด PDF / DOCX / TXT แล้วระบบอ่านข้อความ ให้คะแนน ตรวจทักษะ ประสบการณ์ และข้อเสนอแนะ (ดาวน์โหลดรายงานเป็น PDF ได้)
2. **AI จับคู่งาน** ค้นหา เรียงลำดับ ดูรายละเอียด และคำนวณ % Match ใหม่ตามทักษะจาก Resume
3. **สมัครงานออนไลน์** ฟอร์มพร้อม AI เขียน Cover Letter ตามตำแหน่ง ตรวจสอบข้อมูลและกันสมัครซ้ำ
4. **AI โค้ชสัมภาษณ์** 5 คำถาม พิมพ์หรือพูดตอบ (Chrome/Edge) รับคะแนนและคำแนะนำทันที
5. **ติดตามผล & รีวิว** Kanban สถานะใบสมัคร, เขียนรีวิวบริษัท, การแจ้งเตือน

ข้อมูลถูกเก็บในไฟล์ `data.json` (สร้างอัตโนมัติ ลบไฟล์นี้เพื่อรีเซ็ตข้อมูลตัวอย่าง)

## API หลัก
`GET /api/resume` · `POST /api/resume/analyze?filename=` · `GET /api/jobs` · `GET|POST /api/applications` · `PATCH /api/applications/:id/advance` · `DELETE /api/applications/:id` · `POST /api/interview/evaluate` · `GET|POST /api/reviews` · `GET /api/notifications` · `POST /api/notifications/read`

รวมถึง endpoint เดิม: `/register` `/login` `/logout` `/change-password` `/me` `/users` ฯลฯ
