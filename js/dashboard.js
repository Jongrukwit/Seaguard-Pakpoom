/* ==========================================================================
   dashboard.js
   -----------------------------------------------------------------------
   เวอร์ชันนี้เชื่อมกับ Google Sheet ที่มีเพียง 2 ค่าที่วัดจากเซนเซอร์จริง คือ
   "ระดับน้ำ" (waterLevel, หน่วยเมตร) และ "อุณหภูมิ" (temperature, หน่วย °C)
   โดยชีทจะมีหลายแถวตามเวลาที่บันทึก (time-series) เพื่อนำมาขึ้นกราฟแนวโน้มได้

   วิธีเชื่อมต่อ Google Sheets (ทำครั้งเดียว):
   1. เปิด Google Sheet ที่ต้องการใช้เป็นแหล่งข้อมูล โดยตั้งหัวคอลัมน์เป็น
        time | waterLevel | temperature
      เช่น
        08:00 | 1.2 | 27.5
        10:00 | 1.4 | 28.1
        12:00 | 1.1 | 29.0
   2. ไปที่เมนู Extensions > Apps Script
   3. วางสคริปต์ทำนองนี้ แล้วกด Deploy > New deployment > Web app
        function doGet() {
          const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dashboard");
          const rows = sheet.getDataRange().getValues();
          const headers = rows.shift();
          const data = rows.map(r => Object.fromEntries(headers.map((h,i) => [h, r[i]])));
          return ContentService.createTextOutput(JSON.stringify(data))
                                .setMimeType(ContentService.MimeType.JSON);
        }
   4. ตั้งค่า "Who has access" เป็น "Anyone" แล้วกด Deploy
   5. คัดลอก Web App URL ที่ได้
   6. วาง URL นั้นแทนที่ SHEET_URL ด้านล่าง

   รูปแบบ JSON ที่คาดหวังจาก Google Apps Script (ตัวอย่าง):
   [
     { "time": "08:00", "waterLevel": 1.2, "temperature": 27.5 },
     { "time": "10:00", "waterLevel": 1.4, "temperature": 28.1 },
     { "time": "12:00", "waterLevel": 1.1, "temperature": 29.0 },
     { "time": "14:00", "waterLevel": 1.3, "temperature": 28.6 }
   ]
   ----------------------------------------------------------------------- */

const SHEET_URL = ""; // PUT_YOUR_GOOGLE_APPS_SCRIPT_URL — leave blank to use mock data

// ช่วงค่าที่เหมาะสมต่อการเจริญเติบโตของหญ้าทะเล ใช้ตัดสิน "สถานะ" ของค่าปัจจุบัน
const IDEAL_RANGE = {
  waterLevel: { min: 0.5, max: 2.0, unit: 'm' },
  temperature: { min: 25, max: 30, unit: '°C' },
};

const MOCK_DATA = [
  { time: '08:00', waterLevel: 1.1, temperature: 27.2 },
  { time: '10:00', waterLevel: 1.3, temperature: 27.8 },
  { time: '12:00', waterLevel: 1.6, temperature: 29.4 },
  { time: '14:00', waterLevel: 1.4, temperature: 30.8 },
  { time: '16:00', waterLevel: 1.0, temperature: 28.9 },
  { time: '18:00', waterLevel: 0.8, temperature: 27.1 },
  { time: '20:00', waterLevel: 0.9, temperature: 26.3 },
];

/* -----------------------------------------------------------------------
   FETCH — ดึงข้อมูลจาก Google Sheets ถ้าตั้งค่า SHEET_URL ไว้
   ไม่ตั้งค่าไว้ หรือดึงไม่สำเร็จ จะ fallback ไปใช้ MOCK_DATA แทนอัตโนมัติ
   ----------------------------------------------------------------------- */
async function fetchDashboardData() {
  if (!SHEET_URL) return { rows: MOCK_DATA, live: false };
  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error('Sheet fetch failed');
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('Empty sheet data');
    return { rows, live: true };
  } catch (err) {
    console.warn('Falling back to mock dashboard data:', err);
    return { rows: MOCK_DATA, live: false };
  }
}

/* -----------------------------------------------------------------------
   สถานะค่าปัจจุบัน เทียบกับช่วงที่เหมาะสม (IDEAL_RANGE)
   ----------------------------------------------------------------------- */
function getStatus(metric, value) {
  const range = IDEAL_RANGE[metric];
  if (value < range.min || value > range.max) {
    return { label: 'ผิดปกติ', className: 'down' };
  }
  return { label: 'ปกติ', className: 'up' };
}

/* -----------------------------------------------------------------------
   การวิเคราะห์สุขภาพหญ้าทะเล
   -----------------------------------------------------------------------
   วิเคราะห์ข้อมูลทั้งชุด (ไม่ใช่แค่ค่าล่าสุด) เพื่อดูว่าค่าระดับน้ำและอุณหภูมิ
   อยู่ในช่วงที่เหมาะสมกับหญ้าทะเลบ่อยแค่ไหน แล้วสรุปเป็นสถานะสุขภาพโดยรวม
   พร้อมคำอธิบายสาเหตุและวิธีแก้ไขสำหรับแต่ละปัญหาที่ตรวจพบ
   ----------------------------------------------------------------------- */
function analyzeHealth(rows) {
  const waterRange = IDEAL_RANGE.waterLevel;
  const tempRange = IDEAL_RANGE.temperature;

  const waterInRange = rows.filter(r => r.waterLevel >= waterRange.min && r.waterLevel <= waterRange.max).length;
  const tempInRange = rows.filter(r => r.temperature >= tempRange.min && r.temperature <= tempRange.max).length;
  const waterPct = Math.round((waterInRange / rows.length) * 100);
  const tempPct = Math.round((tempInRange / rows.length) * 100);

  const avgWater = rows.reduce((s, r) => s + r.waterLevel, 0) / rows.length;
  const avgTemp = rows.reduce((s, r) => s + r.temperature, 0) / rows.length;

  const issues = [];

  if (waterPct < 80) {
    const direction = avgWater > waterRange.max ? 'high' : avgWater < waterRange.min ? 'low' : 'variable';
    if (direction === 'high') {
      issues.push({
        title: '⚠️ ระดับน้ำสูงกว่าค่าที่เหมาะสมบ่อยครั้ง',
        detail: `ค่าเฉลี่ยระดับน้ำอยู่ที่ ${avgWater.toFixed(2)} ม. สูงกว่าช่วงที่เหมาะสม (${waterRange.min}-${waterRange.max} ม.) ระดับน้ำสูงเกินไปทำให้แสงแดดส่องถึงหญ้าทะเลได้น้อยลง ลดประสิทธิภาพการสังเคราะห์แสง`,
        fix: 'ตรวจสอบตะกอนและความขุ่นของน้ำที่มากับระดับน้ำที่สูงขึ้น พิจารณาลดการปล่อยน้ำเสีย/ตะกอนจากพื้นที่ต้นน้ำ และติดตามรอบน้ำขึ้นน้ำลงอย่างต่อเนื่อง',
      });
    } else if (direction === 'low') {
      issues.push({
        title: '⚠️ ระดับน้ำต่ำกว่าค่าที่เหมาะสมบ่อยครั้ง',
        detail: `ค่าเฉลี่ยระดับน้ำอยู่ที่ ${avgWater.toFixed(2)} ม. ต่ำกว่าช่วงที่เหมาะสม (${waterRange.min}-${waterRange.max} ม.) เสี่ยงทำให้หญ้าทะเลโผล่พ้นน้ำช่วงน้ำลงและแห้งเหี่ยวจากการสัมผัสอากาศ/แสงแดดโดยตรง`,
        fix: 'พิจารณาย้ายจุดปลูกไปยังโซนที่ลึกขึ้นเล็กน้อย ติดตามตารางน้ำขึ้นน้ำลง และตรวจสอบว่ามีตะกอนทับถมจนพื้นทะเลตื้นขึ้นหรือไม่',
      });
    } else {
      issues.push({
        title: '⚠️ ระดับน้ำผันผวนบ่อยครั้ง',
        detail: `ระดับน้ำออกนอกช่วงที่เหมาะสม (${waterRange.min}-${waterRange.max} ม.) ใน ${100 - waterPct}% ของข้อมูลที่บันทึกไว้`,
        fix: 'เก็บข้อมูลต่อเนื่องเพิ่มเติมเพื่อดูรูปแบบ และเปรียบเทียบกับตารางน้ำขึ้นน้ำลงของพื้นที่ เพื่อแยกแยะความผันผวนตามธรรมชาติจากสัญญาณผิดปกติ',
      });
    }
  }

  if (tempPct < 80) {
    const direction = avgTemp > tempRange.max ? 'high' : avgTemp < tempRange.min ? 'low' : 'variable';
    if (direction === 'high') {
      issues.push({
        title: '🌡️ อุณหภูมิน้ำสูงกว่าค่าที่เหมาะสมบ่อยครั้ง',
        detail: `ค่าเฉลี่ยอุณหภูมิอยู่ที่ ${avgTemp.toFixed(1)}°C สูงกว่าช่วงที่เหมาะสม (${tempRange.min}-${tempRange.max}°C) ความร้อนสะสมอาจทำให้หญ้าทะเลเกิดภาวะเครียดจากความร้อน (heat stress) และเสี่ยงตายเป็นหย่อม`,
        fix: 'ตรวจสอบแหล่งความร้อนใกล้เคียง เช่น น้ำทิ้งจากโรงงาน/โรงไฟฟ้า หลีกเลี่ยงรบกวนพื้นที่ในช่วงอากาศร้อนจัด และสังเกตสัญญาณใบเหลืองหรือเน่าของหญ้าทะเล',
      });
    } else if (direction === 'low') {
      issues.push({
        title: '🌡️ อุณหภูมิน้ำต่ำกว่าค่าที่เหมาะสมบ่อยครั้ง',
        detail: `ค่าเฉลี่ยอุณหภูมิอยู่ที่ ${avgTemp.toFixed(1)}°C ต่ำกว่าช่วงที่เหมาะสม (${tempRange.min}-${tempRange.max}°C) อุณหภูมิต่ำทำให้อัตราการสังเคราะห์แสงและการเจริญเติบโตช้าลง`,
        fix: 'ติดตามว่าเป็นผลจากฤดูกาลหรือกระแสน้ำเย็นที่ไหลเข้ามาชั่วคราวหรือไม่ หากเกิดต่อเนื่องเป็นเวลานานควรแจ้งหน่วยงานที่เกี่ยวข้องเพื่อตรวจสอบเพิ่มเติม',
      });
    } else {
      issues.push({
        title: '🌡️ อุณหภูมิผันผวนบ่อยครั้ง',
        detail: `อุณหภูมิออกนอกช่วงที่เหมาะสม (${tempRange.min}-${tempRange.max}°C) ใน ${100 - tempPct}% ของข้อมูลที่บันทึกไว้`,
        fix: 'เพิ่มความถี่ในการเก็บข้อมูลเพื่อดูรูปแบบรายวัน/รายฤดูกาล และเปรียบเทียบกับข้อมูลสภาพอากาศของพื้นที่',
      });
    }
  }

  const overallPct = Math.round((waterPct + tempPct) / 2);
  let verdict, verdictClass, summary;
  if (overallPct >= 80) {
    verdict = 'หญ้าทะเลมีแนวโน้มสุขภาพดี';
    verdictClass = 'good';
    summary = `ค่าระดับน้ำและอุณหภูมิส่วนใหญ่ (${overallPct}%) อยู่ในช่วงที่เหมาะสมต่อการเจริญเติบโตของหญ้าทะเล`;
  } else if (overallPct >= 50) {
    verdict = 'เริ่มมีความเสี่ยง ควรเฝ้าระวัง';
    verdictClass = 'warn';
    summary = `มีบางช่วงเวลา (${100 - overallPct}%) ที่ค่าที่วัดได้ออกนอกช่วงเหมาะสม ควรติดตามใกล้ชิดและพิจารณาแก้ไขตามคำแนะนำด้านล่าง`;
  } else {
    verdict = 'อยู่ในภาวะวิกฤต ควรดำเนินการโดยเร็ว';
    verdictClass = 'critical';
    summary = `ค่าที่วัดได้ส่วนใหญ่ (${100 - overallPct}%) ออกนอกช่วงที่เหมาะสม เสี่ยงต่อการเสื่อมโทรมของแหล่งหญ้าทะเล`;
  }

  if (issues.length === 0) {
    issues.push({
      title: '✅ ไม่พบความผิดปกติ',
      detail: 'ค่าระดับน้ำและอุณหภูมิทั้งหมดอยู่ในช่วงที่เหมาะสมตลอดช่วงเวลาที่บันทึกไว้',
      fix: 'คงการติดตามข้อมูลอย่างต่อเนื่อง เพื่อรักษาสภาพแวดล้อมที่ดีนี้ไว้',
    });
  }

  return { verdict, verdictClass, summary, issues, waterPct, tempPct };
}

function renderHealthAnalysis(rows) {
  const wrap = document.getElementById('health-analysis');
  if (!wrap) return;
  const result = analyzeHealth(rows);
  const icon = result.verdictClass === 'good' ? '🌿' : result.verdictClass === 'warn' ? '🍂' : '🥀';

  wrap.innerHTML = `
    <div class="health-verdict">
      <span class="icon">${icon}</span>
      <div>
        <span class="health-verdict-badge ${result.verdictClass}">${result.verdict}</span>
        <p style="margin-top:8px;font-size:0.9rem;color:var(--ink-soft)">${result.summary}</p>
      </div>
    </div>
    <div class="health-issues">
      ${result.issues.map(issue => `
        <div class="health-issue">
          <h4>${issue.title}</h4>
          <p>${issue.detail}</p>
          <p class="fix"><strong>วิธีแก้ไข:</strong> ${issue.fix}</p>
        </div>
      `).join('')}
    </div>
  `;
}

/* -----------------------------------------------------------------------
   STAT CARDS — แสดงค่าล่าสุด (แถวสุดท้ายในชีท) ของทั้ง 2 ค่า
   ----------------------------------------------------------------------- */
function renderStatCards(rows) {
  const grid = document.getElementById('stat-grid');
  if (!grid) return;
  const latest = rows[rows.length - 1];

  const waterStatus = getStatus('waterLevel', latest.waterLevel);
  const tempStatus = getStatus('temperature', latest.temperature);

  const cards = [
    {
      ic: '🌊', label: `ระดับน้ำล่าสุด (เวลา ${latest.time})`,
      value: `${latest.waterLevel} ${IDEAL_RANGE.waterLevel.unit}`,
      status: waterStatus,
    },
    {
      ic: '🌡️', label: `อุณหภูมิล่าสุด (เวลา ${latest.time})`,
      value: `${latest.temperature} ${IDEAL_RANGE.temperature.unit}`,
      status: tempStatus,
    },
  ];

  grid.innerHTML = cards.map(c => `
    <div class="stat-card glass reveal">
      <span class="ic">${c.ic}</span>
      <div class="value">${c.value}</div>
      <div class="label">${c.label}</div>
      <span class="delta ${c.status.className}">${c.status.className === 'up' ? '✔' : '⚠'} ${c.status.label}</span>
    </div>
  `).join('');
}

/* -----------------------------------------------------------------------
   CHARTS — กราฟเส้นแสดงแนวโน้มระดับน้ำ และอุณหภูมิ ตามเวลา
   ----------------------------------------------------------------------- */
function renderCharts(rows) {
  const labels = rows.map(r => r.time);

  // Line chart — ระดับน้ำ
  const waterCtx = document.getElementById('waterLevelChart');
  if (waterCtx && window.Chart) {
    new Chart(waterCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `ระดับน้ำ (${IDEAL_RANGE.waterLevel.unit})`,
          data: rows.map(r => r.waterLevel),
          borderColor: '#3FBAC2',
          backgroundColor: 'rgba(63,186,194,0.18)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#2E7D5B',
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }

  // Line chart — อุณหภูมิ
  const tempCtx = document.getElementById('temperatureChart');
  if (tempCtx && window.Chart) {
    new Chart(tempCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `อุณหภูมิ (${IDEAL_RANGE.temperature.unit})`,
          data: rows.map(r => r.temperature),
          borderColor: '#FF8B7B',
          backgroundColor: 'rgba(255,139,123,0.18)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#B54332',
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false } } }
    });
  }
}

function renderDataSourceBanner(live) {
  const el = document.getElementById('data-source-banner');
  if (!el) return;
  if (live) {
    el.className = 'data-source-banner live glass';
    el.innerHTML = '🟢 กำลังแสดงข้อมูลสดจาก Google Sheets';
  } else {
    el.className = 'data-source-banner mock glass';
    el.innerHTML = '🟠 ยังไม่ได้เชื่อมต่อ Google Sheets — กำลังแสดงข้อมูลตัวอย่าง (Mock Data). ใส่ SHEET_URL ใน dashboard.js เพื่อดึงข้อมูลจริง';
  }
}

function renderProfile(user) {
  const nameEl = document.getElementById('profile-name');
  const avatarEl = document.getElementById('profile-avatar');
  if (user && nameEl) nameEl.textContent = user.name || user.email;
  if (user && avatarEl) avatarEl.textContent = (user.name || user.email || '?').trim().charAt(0).toUpperCase();
}

function initSidebarToggle() {
  const btn = document.getElementById('sidebar-burger');
  const sidebar = document.querySelector('.sidebar');
  if (!btn || !sidebar) return;
  btn.addEventListener('click', () => sidebar.classList.toggle('open'));
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = typeof requireAuth === 'function' ? requireAuth() : null;
  renderProfile(user);
  initSidebarToggle();
  initAiCameraModal();

  const { rows, live } = await fetchDashboardData();
  renderDataSourceBanner(live);
  renderStatCards(rows);
  renderCharts(rows);
  renderHealthAnalysis(rows);
});

/* ==========================================================================
   AI CAMERA — Teachable Machine image classification
   -----------------------------------------------------------------------
   ใช้ TensorFlow.js + Teachable Machine (@teachablemachine/image) ซึ่งเป็นคนละ
   API/ไลบรารีจาก Google Sheets ที่ใช้ดึงข้อมูลเซนเซอร์ด้านบน — โมเดลนี้ทำงาน
   ทั้งหมดในเบราว์เซอร์ของผู้ใช้ ไม่ต้องส่งภาพขึ้นเซิร์ฟเวอร์ใดๆ

   วิธีใช้โมเดลของคุณเอง:
   1. ไปที่ https://teachablemachine.withgoogle.com/train/image
   2. เทรนโมเดลจำแนกภาพ เช่น 3 คลาส: "สุขภาพดี", "เริ่มเสื่อมโทรม", "เสียหาย"
   3. กด Export Model > Tensorflow.js > Upload (my model) เพื่อได้ Sharable Link
   4. คัดลอกลิงก์ที่ได้ (จะมีรูปแบบ https://teachablemachine.withgoogle.com/models/XXXXXXX/)
      มาวางแทนที่ MODEL_URL ด้านล่าง
   ----------------------------------------------------------------------- */
const MODEL_URL = ""; // PUT_YOUR_TEACHABLE_MACHINE_MODEL_URL — leave blank to use mock predictions

let tmModel = null;
let cameraStream = null;
let lastCapturedSource = null; // <video> or <img> element currently ready to analyze

async function loadTeachableMachineModel() {
  if (!MODEL_URL || !window.tmImage) return null;
  if (tmModel) return tmModel;
  try {
    const modelURL = `${MODEL_URL}model.json`;
    const metadataURL = `${MODEL_URL}metadata.json`;
    tmModel = await window.tmImage.load(modelURL, metadataURL);
    return tmModel;
  } catch (err) {
    console.warn('Failed to load Teachable Machine model, falling back to mock predictions:', err);
    return null;
  }
}

function initAiCameraModal() {
  const backdrop = document.getElementById('ai-modal-backdrop');
  const openBtn = document.getElementById('open-ai-camera-btn');
  const closeBtn = document.getElementById('ai-modal-close');
  const startCameraBtn = document.getElementById('ai-start-camera-btn');
  const captureBtn = document.getElementById('ai-capture-btn');
  const analyzeBtn = document.getElementById('ai-analyze-btn');
  const fileInput = document.getElementById('ai-file-input');
  const video = document.getElementById('ai-video');
  const canvas = document.getElementById('ai-canvas');
  const previewImg = document.getElementById('ai-preview-img');
  const placeholder = document.getElementById('ai-camera-placeholder');
  const resultEl = document.getElementById('ai-result');
  if (!backdrop || !openBtn) return;

  function resetView() {
    video.style.display = 'none';
    canvas.style.display = 'none';
    previewImg.style.display = 'none';
    placeholder.style.display = 'flex';
    captureBtn.style.display = 'none';
    analyzeBtn.style.display = 'none';
    resultEl.classList.remove('show');
    resultEl.innerHTML = '';
    lastCapturedSource = null;
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
  }

  openBtn.addEventListener('click', () => {
    backdrop.classList.add('open');
    resetView();
  });

  closeBtn.addEventListener('click', () => {
    backdrop.classList.remove('open');
    stopCamera();
  });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) { backdrop.classList.remove('open'); stopCamera(); }
  });

  startCameraBtn.addEventListener('click', async () => {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = cameraStream;
      placeholder.style.display = 'none';
      previewImg.style.display = 'none';
      video.style.display = 'block';
      captureBtn.style.display = 'inline-flex';
      analyzeBtn.style.display = 'none';
      resultEl.classList.remove('show');
    } catch (err) {
      showToast('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้กล้อง หรือเลือกไฟล์ภาพแทน', 'error');
    }
  });

  captureBtn.addEventListener('click', () => {
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();
    video.style.display = 'none';
    canvas.style.display = 'block';
    captureBtn.style.display = 'none';
    analyzeBtn.style.display = 'inline-flex';
    lastCapturedSource = canvas;
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewImg.onload = () => URL.revokeObjectURL(url);
    stopCamera();
    placeholder.style.display = 'none';
    video.style.display = 'none';
    canvas.style.display = 'none';
    previewImg.style.display = 'block';
    captureBtn.style.display = 'none';
    analyzeBtn.style.display = 'inline-flex';
    lastCapturedSource = previewImg;
  });

  analyzeBtn.addEventListener('click', () => runAiAnalysis(resultEl));
}

async function runAiAnalysis(resultEl) {
  resultEl.classList.add('show');
  resultEl.innerHTML = '<p>🔄 กำลังวิเคราะห์ภาพ...</p>';

  const model = await loadTeachableMachineModel();
  let predictions;

  if (model && lastCapturedSource) {
    // ---- ผลจากโมเดล Teachable Machine จริง ----
    try {
      predictions = await model.predict(lastCapturedSource);
      predictions = predictions
        .map(p => ({ label: p.className, prob: p.probability }))
        .sort((a, b) => b.prob - a.prob);
    } catch (err) {
      console.warn('Prediction failed, falling back to mock:', err);
      predictions = mockPredictions();
    }
  } else {
    // ---- ยังไม่ได้ตั้งค่า MODEL_URL หรือโมเดลโหลดไม่สำเร็จ: ใช้ผลตัวอย่าง ----
    await new Promise(r => setTimeout(r, 700)); // จำลองเวลาประมวลผล
    predictions = mockPredictions();
  }

  renderAiResult(resultEl, predictions, !!model);
}

function mockPredictions() {
  // สุ่มผลตัวอย่างแบบให้น้ำหนักไปทาง "สุขภาพดี" เล็กน้อย เพื่อจำลองการใช้งานจริง
  const base = [
    { label: 'สุขภาพดี', prob: 0.55 + Math.random() * 0.3 },
    { label: 'เริ่มเสื่อมโทรม', prob: Math.random() * 0.3 },
    { label: 'เสียหาย/ตาย', prob: Math.random() * 0.15 },
  ];
  const total = base.reduce((s, p) => s + p.prob, 0);
  return base.map(p => ({ label: p.label, prob: p.prob / total })).sort((a, b) => b.prob - a.prob);
}

const AI_FIX_SUGGESTIONS = {
  'สุขภาพดี': 'หญ้าทะเลในภาพดูมีสีเขียวสดและใบสมบูรณ์ ควรรักษาคุณภาพน้ำให้อยู่ในมาตรฐานต่อไป (อุณหภูมิ 27-35°C, pH 7.5-8.55, ความเค็ม 5-30 ppt)',
  'เริ่มเสื่อมโทรม': 'ใบเริ่มมีสีซีดหรือมีคราบตะกอนเกาะ ควรตรวจสอบคุณภาพน้ำโดยเร็ว และลดตะกอน/น้ำเสียที่ไหลลงบริเวณนี้',
  'เสียหาย/ตาย': 'พบลักษณะใบเหี่ยว เน่า หรือหลุดร่วง ควรตรวจสอบคุณภาพน้ำอย่างเร่งด่วน พิจารณาย้ายจุดปลูกหรือฟื้นฟูพื้นที่ใหม่',
};

function renderAiResult(resultEl, predictions, isLiveModel) {
  const top = predictions[0];
  const fix = AI_FIX_SUGGESTIONS[top.label] || 'ควรเปรียบเทียบผลนี้กับข้อมูลเซนเซอร์ด้านบนประกอบการตัดสินใจ';

  resultEl.innerHTML = `
    <p style="margin-bottom:10px"><strong>ผลวิเคราะห์: ${top.label}</strong> (${Math.round(top.prob * 100)}%)</p>
    ${predictions.map(p => `
      <div class="pred-row"><span>${p.label}</span><span>${Math.round(p.prob * 100)}%</span></div>
      <div class="pred-bar-track"><div class="pred-bar-fill" style="width:${Math.round(p.prob * 100)}%"></div></div>
    `).join('')}
    <p style="margin-top:10px"><strong>คำแนะนำ:</strong> ${fix}</p>
    <p class="ai-source-note" style="margin-top:10px">
      ${isLiveModel ? '✅ วิเคราะห์ด้วยโมเดล Teachable Machine ที่ตั้งค่าไว้' : '🟠 ยังไม่ได้ตั้งค่า MODEL_URL — นี่คือผลตัวอย่าง (Mock) ใส่ลิงก์โมเดลจริงใน dashboard.js เพื่อวิเคราะห์จริง'}
    </p>
  `;
}
