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

const SHEET_URL = "https://docs.google.com/spreadsheets/d/170ElS1ghO1MNj5YsVPBqdBpsoCJGUI8GSr7opwFiPnk/edit?pli=1&gid=0#gid=0"; // PUT_YOUR_GOOGLE_APPS_SCRIPT_URL — leave blank to use mock data

// ช่วงค่าที่เหมาะสมต่อการเจริญเติบโตของหญ้าทะเล ใช้ตัดสิน "สถานะ" ของค่าปัจจุบัน
const IDEAL_RANGE = {
  waterLevel: { min: 0.5, max: 2.0, unit: 'm' },
  temperature: { min: 20, max: 60, unit: '°C' },
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

  const { rows, live } = await fetchDashboardData();
  renderDataSourceBanner(live);
  renderStatCards(rows);
  renderCharts(rows);
});