const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ตั้งค่าให้ Express สามารถเสิร์ฟไฟล์หน้าเว็บ (HTML/CSS) จากโฟลเดอร์เดียวกันได้
app.get('/app.js', (req, res) => res.sendFile(path.join(__dirname, 'app.js')));

// เมื่อเข้าหน้าแรก (http://localhost:3000/) ให้แสดงหน้า index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// จำลอง Database ของผู้ใช้
let users = [
  { id: 1, username: 'somchai', email: 'somchai@email.com', role: 'job_seeker' },
  { id: 2, username: 'suda', email: 'suda@email.com', role: 'employer' }
];

// --- 1. AUTHENTICATION ENDPOINTS ---

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  const newUser = { id: users.length + 1, username, email, role: 'job_seeker' };
  users.push(newUser);
  res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', user: newUser });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  res.json({ message: 'เข้าสู่ระบบสำเร็จ', token: 'fake-jwt-token-12345', username });
});

app.post('/logout', (req, res) => {
  res.json({ message: 'ออกจากระบบสำเร็จ' });
});

app.post('/change-password', (req, res) => {
  const { oldPassword, newPassword } = req.body;
  res.json({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
});


// --- 2. USER MANAGEMENT ENDPOINTS ---

app.get('/me', (req, res) => {
  res.json(users[0]);
});

app.get('/check-username/:name', (req, res) => {
  const name = req.params.name;
  const found = users.find(u => u.username === name);
  if (found) {
    res.json({ available: false, message: 'Username นี้ถูกใช้งานแล้ว' });
  } else {
    res.json({ available: true, message: 'Username นี้สามารถใช้งานได้' });
  }
});

app.get('/users', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const resultUsers = users.slice(startIndex, endIndex);
  res.json({
    page,
    limit,
    total: users.length,
    data: resultUsers
  });
});

app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้งานนี้' });
  res.json(user);
});

app.put('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้งานนี้' });
  
  user.username = req.body.username || user.username;
  user.email = req.body.email || user.email;
  res.json({ message: 'อัปเดตข้อมูลสำเร็จ', user });
});

app.delete('/users/:id', (req, res) => {
  users = users.filter(u => u.id !== parseInt(req.params.id));
  res.json({ message: 'ลบผู้ใช้งานสำเร็จ' });
});

// ================= JobAI Hub : ฟีเจอร์หลัก (เก็บข้อมูลลง data.json) =================
const fs = require('fs');
const DB_FILE = path.join(__dirname, 'data.json');
const H = 36e5;
const ago = h => new Date(Date.now() - h * H).toISOString();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const now = () => new Date().toISOString();

const SKILLS = {
  'UX/UI Design': /\bux\b|\bui\b|ออกแบบ/i, 'Figma': /figma/i, 'User Research': /research|วิจัย/i,
  'HTML/CSS': /html|css/i, 'Wireframing': /wireframe/i, 'Mobile App': /mobile|แอป/i,
  'Design System': /design system/i, 'Tailwind': /tailwind/i, 'Fintech': /fintech/i,
  'Prototyping': /prototype/i, 'JavaScript': /javascript|react/i
};

const rematch = () => db.jobs.forEach(j => {
  const have = db.resume.skills.map(s => s.toLowerCase());
  const r = j.tags.filter(t => have.includes(t.toLowerCase())).length / j.tags.length;
  j.match = Math.round(j.base * 0.6 + r * 40);
});

const seed = () => {
  const t = new Date(Date.now() + 7 * 24 * H); t.setHours(14, 0, 0, 0);
  const d = {
    nextId: 100,
    resume: {
      filename: 'Somchai_Resume_2026.pdf', analyzedAt: now(), score: 85,
      skills: ['UX/UI Design', 'Figma', 'User Research', 'HTML/CSS'], years: '3 ปี 6 เดือน',
      recs: [
        { type: 'warn', title: 'เพิ่มเชิงปริมาณผลงาน (Quantifiable Metrics)', text: 'ส่วนประวัติการทำงานขาดตัวเลขวัดผล เช่น "ออกแบบแอปพลิเคชันใหม่ ช่วยเพิ่มยอดผู้ใช้งานขึ้น 35% ภายใน 3 เดือน"' },
        { type: 'info', title: 'AI ปรับคำโปรไฟล์อัจฉริยะ (Summary Formatting)', text: 'แนะนำให้เพิ่ม Key Action Verbs ในส่วน Summary เพื่อผ่านระบบคัดกรอง ATS อัตโนมัติขององค์กรใหญ่' }
      ]
    },
    jobs: [
      { id: 1, company: 'TechCorp Thailand Ltd.', title: 'Senior UX/UI Designer', location: 'กรุงเทพฯ (BTS อโศก / Hybrid)', salaryMin: 55000, salaryMax: 75000, exp: '3-5 ปี', tags: ['Figma', 'Design System', 'User Research'], base: 98, postedAt: ago(2), desc: 'นำทีมออกแบบผลิตภัณฑ์หลักขององค์กร วาง Design System และทำงานใกล้ชิดกับ Product และ Developer' },
      { id: 2, company: 'InnoFinTech Co., Ltd.', title: 'Product Designer (Mobile)', location: 'สีลม, กรุงเทพฯ (Work from Home 100%)', salaryMin: 60000, salaryMax: 80000, exp: '2-4 ปี', tags: ['Mobile App', 'Wireframing', 'Fintech'], base: 91, postedAt: ago(24), desc: 'ออกแบบประสบการณ์ผู้ใช้แอปการเงินบนมือถือ ตั้งแต่ Wireframe จนถึง Prototype พร้อมทดสอบกับผู้ใช้จริง' },
      { id: 3, company: 'Global Digital Agency', title: 'UI Developer & Designer', location: 'พระราม 9, กรุงเทพฯ', salaryMin: 45000, salaryMax: 55000, exp: '2+ ปี', tags: ['HTML/CSS', 'Figma', 'Tailwind'], base: 82, postedAt: ago(72), desc: 'ออกแบบหน้าเว็บด้วย Figma และลงมือพัฒนาเป็น HTML/CSS ให้ลูกค้าหลายอุตสาหกรรม' },
      { id: 4, company: 'CloudNine Software', title: 'UX Researcher', location: 'รัชดา, กรุงเทพฯ (Hybrid)', salaryMin: 50000, salaryMax: 70000, exp: '2-4 ปี', tags: ['User Research', 'Prototyping', 'Figma'], base: 88, postedAt: ago(10), desc: 'วางแผนและทำ User Research สรุปข้อค้นพบให้ทีมออกแบบและผลิตภัณฑ์นำไปใช้ตัดสินใจ' },
      { id: 5, company: 'PixelWorks Studio', title: 'Frontend Designer', location: 'เชียงใหม่ (Remote ได้)', salaryMin: 40000, salaryMax: 60000, exp: '1-3 ปี', tags: ['HTML/CSS', 'JavaScript', 'Tailwind'], base: 79, postedAt: ago(48), desc: 'สร้างหน้าเว็บที่สวยและใช้งานได้จริงด้วย Tailwind และ JavaScript ร่วมกับทีมออกแบบ' },
      { id: 6, company: 'HealthPlus Digital', title: 'UX/UI Designer (Healthtech)', location: 'สาทร, กรุงเทพฯ', salaryMin: 52000, salaryMax: 68000, exp: '3+ ปี', tags: ['UX/UI Design', 'Design System', 'Mobile App'], base: 86, postedAt: ago(30), desc: 'ออกแบบแอปสุขภาพที่ใช้งานง่ายสำหรับผู้ใช้ทุกช่วงวัย พร้อมดูแล Design System ของแพลตฟอร์ม' }
    ],
    applications: [
      { id: 1, jobId: 3, title: 'UI Developer & Designer', company: 'Global Digital Agency', status: 'applied', appliedAt: ago(48) },
      { id: 2, jobId: 1, title: 'Senior UX/UI Designer', company: 'TechCorp Thailand Ltd.', status: 'interview', appliedAt: ago(120), interviewAt: t.toISOString() }
    ],
    reviews: [
      { id: 1, company: 'TechCorp Thailand Ltd.', position: 'Senior UI Designer', rating: 5, comment: 'กระบวนการสัมภาษณ์ 2 รอบ บรรยากาศเป็นกันเองมาก AI Coach ช่วยเก็งคำถามเกี่ยวกับ Design System ให้ ตรงกับที่ HR ถามเกือบ 90% รู้ผลไวภายใน 3 วันทำการ', type: 'ผู้สมัครที่ได้รับการว่าจ้างจริง', createdAt: ago(24 * 100) },
      { id: 2, company: 'InnoFinTech Co., Ltd.', position: 'Product Designer', rating: 4, comment: 'มี Take-home Design Test ให้ทำ เวลา 3 วัน โจทย์ค่อนข้างท้าทายแต่ทีมงาน Feedback ละเอียดมาก ได้ประโยชน์สุดๆ สวัสดิการและเงินเดือนตรงตามที่แจ้งไว้', type: 'ผู้รับการสัมภาษณ์', createdAt: ago(24 * 130) }
    ],
    notifications: [
      { id: 1, text: 'TechCorp Thailand นัดสัมภาษณ์ตำแหน่ง Senior UX/UI Designer แล้ว เตรียมตัวกับ AI โค้ชได้เลย', read: false, createdAt: ago(3) },
      { id: 2, text: 'HR ของ Global Digital Agency เปิดดูเรซูเม่ของคุณแล้ว', read: false, createdAt: ago(20) }
    ]
  };
  return d;
};

let db;
try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { db = seed(); rematch(); }
const save = () => fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), () => {});
const notify = text => db.notifications.unshift({ id: db.nextId++, text, read: false, createdAt: now() });

// --- 3. RESUME ---
app.get('/api/resume', (req, res) => res.json(db.resume));

app.post('/api/resume/analyze', express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
  const filename = decodeURIComponent(req.query.filename || 'resume.txt');
  let text = '';
  try {
    if (/\.pdf$/i.test(filename)) text = (await require('pdf-parse/lib/pdf-parse.js')(req.body)).text;
    else if (/\.docx$/i.test(filename)) text = (await require('mammoth').extractRawText({ buffer: req.body })).value;
    else if (/\.(txt|md)$/i.test(filename)) text = req.body.toString('utf8');
    else return res.status(415).json({ message: 'รองรับเฉพาะไฟล์ PDF, DOCX, TXT' });
  } catch (e) { text = ''; }
  if (text.trim().length < 50) return res.status(422).json({ message: 'อ่านข้อความจากไฟล์นี้ไม่ได้ (อาจเป็นไฟล์สแกนรูปภาพ หรือไฟล์เสียหาย)' });

  const skills = Object.keys(SKILLS).filter(k => SKILLS[k].test(text));
  const metrics = (text.match(/\d+(\.\d+)?\s*(%|เปอร์เซ็นต์|users|ผู้ใช้|คน|ล้าน)/gi) || []).length;
  const ys = [...text.matchAll(/(\d+(?:\.\d+)?)\s*\+?\s*(?:ปี|years?|yrs?)/gi)].map(m => +m[1]).filter(n => n <= 40);
  const yrs = ys.length ? Math.max(...ys) : 0;
  const mon = Math.round((yrs % 1) * 12);
  const years = yrs ? `${Math.floor(yrs)} ปี${mon ? ` ${mon} เดือน` : ''}` : 'ไม่ระบุ';
  const has = {
    summary: /summary|profile|objective|สรุป|เกี่ยวกับ/i.test(text), exp: /experience|ประสบการณ์|work history/i.test(text),
    edu: /education|การศึกษา|university|มหาวิทยาลัย/i.test(text), contact: /@|email|อีเมล|tel|โทร/i.test(text)
  };
  const sections = Object.values(has).filter(Boolean).length;
  const score = clamp(35 + skills.length * 4 + Math.min(metrics, 5) * 3 + sections * 4 + (text.length > 1500 ? 6 : text.length > 600 ? 3 : 0), 30, 98);

  const recs = [];
  if (metrics < 3) recs.push({ type: 'warn', title: 'เพิ่มเชิงปริมาณผลงาน (Quantifiable Metrics)', text: 'พบตัวเลขวัดผลน้อยเกินไป ลองเพิ่มเช่น "ออกแบบแอปพลิเคชันใหม่ ช่วยเพิ่มยอดผู้ใช้งานขึ้น 35% ภายใน 3 เดือน"' });
  if (!has.summary) recs.push({ type: 'warn', title: 'เพิ่มส่วนสรุปโปรไฟล์ (Summary)', text: 'ไม่พบส่วนสรุปตัวเอง แนะนำให้เขียน 2-3 บรรทัดที่บอกสายงาน ประสบการณ์ และจุดเด่น' });
  if (skills.length < 4) recs.push({ type: 'warn', title: 'ระบุทักษะให้ครบถ้วน', text: `ตรวจพบทักษะเพียง ${skills.length} รายการ ควรเพิ่มเครื่องมือและทักษะที่ใช้จริง เช่น Figma, User Research, Design System` });
  if (!has.edu) recs.push({ type: 'info', title: 'เพิ่มข้อมูลการศึกษา', text: 'ไม่พบส่วนการศึกษา ควรระบุสถาบัน สาขา และปีที่จบ' });
  if (!has.contact) recs.push({ type: 'warn', title: 'เพิ่มช่องทางติดต่อ', text: 'ไม่พบอีเมลหรือเบอร์โทร HR อาจติดต่อคุณไม่ได้' });
  recs.push({ type: 'info', title: 'ปรับคำโปรไฟล์ให้ผ่านระบบ ATS', text: 'ใช้ Action Verbs ที่ชัดเจน เช่น "ออกแบบ", "นำทีม", "เพิ่ม", "ลด" และใส่คีย์เวิร์ดตามประกาศงาน' });
  if (recs.length === 1) recs.unshift({ type: 'ok', title: 'โครงสร้าง Resume ครบถ้วน', text: 'พบส่วนสำคัญและตัวเลขวัดผลเพียงพอ พร้อมสมัครงานได้เลย' });

  db.resume = { filename, analyzedAt: now(), score, skills, years, recs };
  rematch(); notify(`วิเคราะห์ Resume "${filename}" เสร็จแล้ว ได้คะแนน ${score}/100`); save();
  res.json(db.resume);
});

// --- 4. JOBS ---
app.get('/api/jobs', (req, res) => res.json(db.jobs));

// --- 5. APPLICATIONS ---
const STAGES = ['applied', 'interview', 'offer', 'hired'];
app.get('/api/applications', (req, res) => res.json(db.applications));

app.post('/api/applications', (req, res) => {
  const { jobId, name, email, portfolio, coverLetter, resumeName } = req.body;
  const job = db.jobs.find(j => j.id === +jobId);
  if (!job) return res.status(404).json({ message: 'ไม่พบตำแหน่งงานนี้' });
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '')) return res.status(400).json({ message: 'กรุณากรอกชื่อและอีเมลให้ถูกต้อง' });
  if (!coverLetter || !coverLetter.trim()) return res.status(400).json({ message: 'กรุณากรอกข้อความถึง HR' });
  if (db.applications.some(a => a.jobId === job.id)) return res.status(409).json({ message: 'คุณสมัครตำแหน่งนี้ไปแล้ว' });
  const a = { id: db.nextId++, jobId: job.id, title: job.title, company: job.company, status: 'applied', appliedAt: now(), name, email, portfolio, coverLetter, resumeName, match: job.match };
  db.applications.push(a);
  notify(`ส่งใบสมัครตำแหน่ง ${job.title} ไปยัง ${job.company} เรียบร้อยแล้ว`); save();
  res.status(201).json(a);
});

app.patch('/api/applications/:id/advance', (req, res) => {
  const a = db.applications.find(x => x.id === +req.params.id);
  if (!a) return res.status(404).json({ message: 'ไม่พบใบสมัครนี้' });
  const i = STAGES.indexOf(a.status);
  if (i >= STAGES.length - 1) return res.status(400).json({ message: 'ใบสมัครนี้อยู่ในขั้นตอนสุดท้ายแล้ว' });
  a.status = STAGES[i + 1];
  if (a.status === 'interview') { const t = new Date(Date.now() + 5 * 24 * H); t.setHours(10, 0, 0, 0); a.interviewAt = t.toISOString(); notify(`${a.company} นัดสัมภาษณ์ตำแหน่ง ${a.title} แล้ว`); }
  if (a.status === 'offer') notify(`ยินดีด้วย! ${a.company} ส่งข้อเสนองานตำแหน่ง ${a.title} ถึงคุณ`);
  if (a.status === 'hired') notify(`คุณผ่านการคัดเลือกตำแหน่ง ${a.title} ที่ ${a.company}`);
  save(); res.json(a);
});

app.delete('/api/applications/:id', (req, res) => {
  const n = db.applications.length;
  db.applications = db.applications.filter(x => x.id !== +req.params.id);
  if (db.applications.length === n) return res.status(404).json({ message: 'ไม่พบใบสมัครนี้' });
  save(); res.json({ message: 'ถอนใบสมัครเรียบร้อย' });
});

// --- 6. INTERVIEW COACH ---
app.post('/api/interview/evaluate', (req, res) => {
  const a = String(req.body.answer || '').trim();
  if (!a) return res.status(400).json({ message: 'กรุณากรอกคำตอบ' });
  const n = a.length, nums = (a.match(/\d+/g) || []).length, has = re => re.test(a);
  const r5 = x => Math.round(clamp(x, 1, 10) * 2) / 2;
  const result = has(/ผลลัพธ์|ส่งผล|ลดลง|เพิ่มขึ้น|result/i);
  const clarity = r5(4 + Math.min(n, 400) / 100 + (n > 80 ? 1 : 0) + (has(/เพราะ|ดังนั้น|เนื่องจาก|จึง/) ? 1 : 0));
  const problem = r5(4 + (has(/ปัญหา|อุปสรรค|ข้อจำกัด|challenge/i) ? 1.5 : 0) + (has(/แก้|ปรับ|วิเคราะห์|ทดสอบ|solution/i) ? 1.5 : 0) + (result ? 1.5 : 0) + Math.min(nums, 2) * 0.5);
  const teamwork = r5(4 + (has(/ทีม|ร่วมกัน|ประชุม|dev|developer|ลูกค้า|stakeholder/i) ? 2 : 0) + (has(/ฟัง|ประนีประนอม|alignment|feedback|ข้อเสนอแนะ/i) ? 2 : 0) + (n > 150 ? 1 : 0));
  const total = Math.round((clarity + problem + teamwork) / 30 * 100);
  const summary = total >= 85 ? 'การสื่อสารตรงประเด็น มั่นใจ มีโครงสร้าง STAR' : total >= 70 ? 'คำตอบดี แต่ควรเพิ่มรายละเอียดอีกเล็กน้อย' : 'ควรเพิ่มรายละเอียดและเรียบเรียงตามโครงสร้าง STAR';
  const tip = nums === 0 ? 'พยายามเน้น "ผลลัพธ์เชิงตัวเลข" เพิ่มเติม เช่น ระยะเวลาพัฒนาที่ลดลง หรือคะแนน User Satisfaction ที่เพิ่มขึ้น จะทำให้คำตอบสมบูรณ์ยิ่งขึ้น'
    : !result ? 'อย่าลืมปิดท้ายด้วยผลลัพธ์ที่เกิดขึ้น และบอกว่าคุณเรียนรู้อะไรจากเหตุการณ์นั้น'
    : n < 120 ? 'คำตอบค่อนข้างสั้น ลองเล่าตามลำดับ สถานการณ์ → ภารกิจ → สิ่งที่ลงมือทำ → ผลลัพธ์ (STAR)'
    : 'ยอดเยี่ยม! ลองฝึกให้กระชับภายใน 2 นาที เพื่อให้ผู้สัมภาษณ์จับประเด็นได้ง่ายขึ้น';
  res.json({ clarity, problem, teamwork, total, summary, tip });
});

// --- 7. REVIEWS ---
app.get('/api/reviews', (req, res) => res.json([...db.reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))));

app.post('/api/reviews', (req, res) => {
  const { company, position, rating, comment, type } = req.body;
  if (!company || !company.trim() || !position || !position.trim()) return res.status(400).json({ message: 'กรุณากรอกชื่อบริษัทและตำแหน่ง' });
  if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ message: 'กรุณาให้คะแนน 1-5 ดาว' });
  if (!comment || comment.trim().length < 10) return res.status(400).json({ message: 'กรุณาเขียนรีวิวอย่างน้อย 10 ตัวอักษร' });
  const r = { id: db.nextId++, company: company.trim(), position: position.trim(), rating: +rating, comment: comment.trim(), type: type || 'ผู้สมัคร', createdAt: now() };
  db.reviews.push(r); save(); res.status(201).json(r);
});

// --- 8. NOTIFICATIONS ---
app.get('/api/notifications', (req, res) => res.json(db.notifications));
app.post('/api/notifications/read', (req, res) => { db.notifications.forEach(n => n.read = true); save(); res.json({ message: 'ok' }); });

// เริ่มรัน Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});