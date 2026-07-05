/* ==========================================================================
   learning.js
   ========================================================================== */

/* -----------------------------------------------------------------------
   1. HERO PARALLAX — generate swaying blades, swimming fish, rising bubbles
   ----------------------------------------------------------------------- */
function buildHero() {
  const bladeLayer = document.getElementById('hero-blades');
  const bubbleLayer = document.getElementById('hero-bubbles');
  const fishLayer = document.getElementById('hero-fish');
  if (!bladeLayer) return;

  const bladeCount = window.innerWidth < 600 ? 20 : 45;
  for (let i = 0; i < bladeCount; i++) {
    const b = document.createElement('div');
    b.className = 'hero-blade';
    b.style.left = `${(i / bladeCount) * 100}%`;
    b.style.height = `${40 + Math.random() * 90}px`;
    b.style.animationDelay = `${Math.random() * 5}s`;
    b.style.animationDuration = `${3.5 + Math.random() * 3}s`;
    bladeLayer.appendChild(b);
  }

  for (let i = 0; i < 18; i++) {
    const bub = document.createElement('div');
    bub.className = 'hero-bubble';
    const size = 6 + Math.random() * 16;
    bub.style.width = bub.style.height = `${size}px`;
    bub.style.left = `${Math.random() * 100}%`;
    bub.style.animationDuration = `${5 + Math.random() * 6}s`;
    bub.style.animationDelay = `${Math.random() * 6}s`;
    bubbleLayer.appendChild(bub);
  }

  const fishEmojis = ['🐟', '🐠', '🐡'];
  for (let i = 0; i < 5; i++) {
    const fish = document.createElement('div');
    fish.className = 'hero-fish';
    fish.textContent = fishEmojis[i % fishEmojis.length];
    fish.style.top = `${20 + Math.random() * 50}%`;
    fish.style.animationDuration = `${10 + Math.random() * 8}s`;
    fish.style.animationDelay = `${Math.random() * 6}s`;
    fishLayer.appendChild(fish);
  }
}

/* -----------------------------------------------------------------------
   2. INTERACTIVE ECOSYSTEM — hover/tap popups + generated seaweed backdrop
   ----------------------------------------------------------------------- */
const ECOSYSTEM_DATA = [
  { id: 'dugong', icon: '🐋', name: 'พะยูน', top: '55%', left: '18%', info: 'พะยูนกินหญ้าทะเลเป็นอาหารหลัก วันละกว่า 30 กิโลกรัม จึงถูกเรียกว่า "วัวทะเล"' },
  { id: 'turtle', icon: '🐢', name: 'เต่าทะเล', top: '30%', left: '40%', info: 'เต่าทะเลใช้ทุ่งหญ้าทะเลเป็นแหล่งอาหารและที่หลบภัยจากผู้ล่า' },
  { id: 'fish', icon: '🐠', name: 'ปลาทะเล', top: '65%', left: '62%', info: 'ทุ่งหญ้าทะเลเป็นแหล่งอนุบาลตัวอ่อนปลาเศรษฐกิจกว่า 20% ของโลก' },
  { id: 'crab', icon: '🦀', name: 'ปู', top: '80%', left: '30%', info: 'ปูอาศัยหลบซ่อนในทุ่งหญ้าทะเล ช่วยควบคุมสัตว์ขนาดเล็กในระบบนิเวศ' },
  { id: 'shrimp', icon: '🦐', name: 'กุ้ง', top: '45%', left: '78%', info: 'กุ้งวัยอ่อนใช้หญ้าทะเลบังตัวจากนักล่าในช่วงแรกของชีวิต' },
];

function buildEcosystem() {
  const stage = document.getElementById('ecosystem-stage');
  if (!stage) return;

  // Background seaweed
  for (let i = 0; i < 20; i++) {
    const w = document.createElement('div');
    w.className = 'eco-seaweed';
    w.style.left = `${(i / 20) * 100}%`;
    w.style.height = `${30 + Math.random() * 70}px`;
    w.style.animationDelay = `${Math.random() * 4}s`;
    stage.appendChild(w);
  }

  ECOSYSTEM_DATA.forEach(creature => {
    const el = document.createElement('button');
    el.className = 'eco-creature';
    el.style.top = creature.top;
    el.style.left = creature.left;
    el.setAttribute('aria-label', creature.name);
    el.innerHTML = `${creature.icon}
      <span class="eco-popup"><strong>${creature.name}</strong>${creature.info}</span>`;
    stage.appendChild(el);
  });
}

/* -----------------------------------------------------------------------
   3. DRAG & DROP PLANTING EXPERIENCE
   -----------------------------------------------------------------------
   หญ้าทะเลปลูกได้เฉพาะบนพื้นท้องทะเล 3 ประเภทนี้เท่านั้น:
     - ทรายปนโคลน
     - โคลนปนทราย
     - ทรายปนปะการัง
   ส่วนทรายล้วน โคลนล้วน หรือหิน/น้ำลึก ปลูกไม่ได้
   ----------------------------------------------------------------------- */
const PLANT_SLOTS = [
  { top: '40%', left: '30%', substrate: 'ทรายปนโคลน', good: true },
  { top: '45%', left: '55%', substrate: 'โคลนปนทราย', good: true },
  { top: '55%', left: '15%', substrate: 'ทรายปนปะการัง', good: true },
  { top: '52%', left: '40%', substrate: 'ทรายล้วน', good: false },
  { top: '32%', left: '75%', substrate: 'หิน / น้ำลึก', good: false },
  { top: '55%', left: '68%', substrate: 'ทรายปนปะการัง', good: true },
  { top: '47%', left: '85%', substrate: 'โคลนล้วน', good: false },
];

let plantScore = 0;

function buildPlantLab() {
  const zone = document.getElementById('plant-zone');
  const tray = document.getElementById('seedling-tray');
  if (!zone || !tray) return;

  PLANT_SLOTS.forEach((slot, i) => {
    const el = document.createElement('div');
    el.className = 'plant-slot' + (slot.good ? ' correct-zone' : '');
    el.style.top = slot.top;
    el.style.left = slot.left;
    el.dataset.correct = slot.good;
    el.dataset.index = i;
    el.innerHTML = `<span class="plant-slot-label">${slot.substrate}</span>`;
    el.addEventListener('dragover', e => e.preventDefault());
    el.addEventListener('drop', onDropSeedling);
    zone.appendChild(el);
  });

  // Seedling supply in the tray (draggable)
  for (let i = 0; i < 4; i++) {
    const seed = document.createElement('div');
    seed.className = 'seedling';
    seed.textContent = '🌱';
    seed.draggable = true;
    seed.id = `seedling-${i}`;
    seed.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', seed.id);
      seed.classList.add('dragging');
    });
    seed.addEventListener('dragend', () => seed.classList.remove('dragging'));
    tray.appendChild(seed);
  }
}

function onDropSeedling(e) {
  e.preventDefault();
  const slotEl = e.currentTarget;
  if (slotEl.classList.contains('filled')) return;
  const seedId = e.dataTransfer.getData('text/plain');
  const seedEl = document.getElementById(seedId);
  const isCorrect = slotEl.dataset.correct === 'true';
  const substrate = PLANT_SLOTS[Number(slotEl.dataset.index)].substrate;
  const label = slotEl.querySelector('.plant-slot-label');

  if (isCorrect) {
    slotEl.classList.add('filled');
    slotEl.innerHTML = '<span class="grown-icon">🌿</span>';
    if (label) slotEl.appendChild(label);
    plantScore += 10;
    spawnFishNear(slotEl);
    showToastSafe(`ปลูกสำเร็จบน "${substrate}"! ได้ +10 คะแนน`, 'success');
  } else {
    slotEl.classList.add('wrong-shake');
    setTimeout(() => slotEl.classList.remove('wrong-shake'), 400);
    showToastSafe(`"${substrate}" ไม่ใช่พื้นที่ที่ปลูกหญ้าทะเลได้ ลองจุดอื่นดูนะ`, 'error');
  }
  if (seedEl) seedEl.style.visibility = isCorrect ? 'hidden' : 'visible';
  updatePlantScoreBadge();
}

function spawnFishNear(slotEl) {
  const zone = document.getElementById('plant-zone');
  const fish = document.createElement('div');
  fish.className = 'plant-fish';
  fish.textContent = '🐟';
  fish.style.top = slotEl.style.top;
  zone.appendChild(fish);
  requestAnimationFrame(() => fish.classList.add('show'));
}

function updatePlantScoreBadge() {
  const badge = document.getElementById('plant-score-badge');
  if (badge) badge.textContent = `🌱 คะแนน: ${plantScore}`;
}

function showToastSafe(msg, type) {
  if (typeof showToast === 'function') showToast(msg, type);
}

/* -----------------------------------------------------------------------
   4. WATER QUALITY SIMULATION
   -----------------------------------------------------------------------
   มาตรฐานคุณภาพน้ำสำหรับปลูกหญ้าทะเล:
     - อุณหภูมิของน้ำ: 27-35 องศาเซลเซียส
     - ค่าความเป็นกรด-เบส (pH): 7.5-8.55
     - ความเค็มของน้ำ: 5-30 ppt (ส่วนต่อพัน)
   ----------------------------------------------------------------------- */
const WATER_STANDARD = {
  temp: { min: 27, max: 35 },
  ph: { min: 7.5, max: 8.55 },
  salinity: { min: 5, max: 30 },
};

function initWaterSimulation() {
  const temp = document.getElementById('sim-temp');
  const ph = document.getElementById('sim-ph');
  const salinity = document.getElementById('sim-salinity');
  const plant = document.getElementById('sim-plant');
  const status = document.getElementById('sim-status');
  const stage = document.getElementById('sim-stage');
  if (!temp || !ph || !salinity || !plant) return;

  // ให้คะแนน 0-100 ต่อค่าหนึ่งตัว ตามว่าอยู่ในช่วงมาตรฐานหรือไม่ และห่างจากช่วงแค่ไหน
  function scoreAgainstRange(value, range) {
    if (value >= range.min && value <= range.max) return 100;
    const span = range.max - range.min;
    const distance = value < range.min ? range.min - value : value - range.max;
    return Math.max(0, 100 - (distance / span) * 100);
  }

  function update() {
    const t = Number(temp.value);
    const p = Number(ph.value);
    const s = Number(salinity.value);

    document.getElementById('sim-temp-val').textContent = t;
    document.getElementById('sim-ph-val').textContent = p.toFixed(2);
    document.getElementById('sim-salinity-val').textContent = s;

    const tempScore = scoreAgainstRange(t, WATER_STANDARD.temp);
    const phScore = scoreAgainstRange(p, WATER_STANDARD.ph);
    const salinityScore = scoreAgainstRange(s, WATER_STANDARD.salinity);
    const health = (tempScore + phScore + salinityScore) / 3;

    const scale = 0.5 + (health / 100) * 0.9;
    const filterFx = health < 35 ? 'grayscale(0.7) brightness(0.8)' : health < 65 ? 'saturate(0.7)' : 'saturate(1.2)';
    plant.style.transform = `scale(${scale.toFixed(2)})`;
    plant.style.filter = filterFx;
    plant.style.opacity = health < 15 ? 0.35 : 1;
    plant.textContent = health < 15 ? '🥀' : health < 45 ? '🍂' : '🌿';

    stage.style.background = health > 65
      ? 'linear-gradient(180deg, #9FE3E6, #3FBAC2)'
      : health > 35
        ? 'linear-gradient(180deg, #C7D9C4, #8FAE9A)'
        : 'linear-gradient(180deg, #8a8a7a, #5c5c4e)';

    // แจ้งค่าที่ผิดมาตรฐานให้ชัดเจน พร้อมคำแนะนำสั้นๆ
    const problems = [];
    if (t < WATER_STANDARD.temp.min) problems.push('อุณหภูมิต่ำเกินไป — ควรเพิ่มอุณหภูมิให้อยู่ที่ 27-35°C');
    if (t > WATER_STANDARD.temp.max) problems.push('อุณหภูมิสูงเกินไป — ควรลดอุณหภูมิให้อยู่ที่ 27-35°C');
    if (p < WATER_STANDARD.ph.min) problems.push('น้ำมีสภาพเป็นกรดเกินไป — ควรปรับ pH ให้อยู่ที่ 7.5-8.55');
    if (p > WATER_STANDARD.ph.max) problems.push('น้ำมีสภาพเป็นเบสเกินไป — ควรปรับ pH ให้อยู่ที่ 7.5-8.55');
    if (s < WATER_STANDARD.salinity.min) problems.push('ความเค็มต่ำเกินไป — ควรปรับความเค็มให้อยู่ที่ 5-30 ppt');
    if (s > WATER_STANDARD.salinity.max) problems.push('ความเค็มสูงเกินไป — ควรปรับความเค็มให้อยู่ที่ 5-30 ppt');

    if (problems.length === 0) {
      status.textContent = '🌿 คุณภาพน้ำอยู่ในมาตรฐาน หญ้าทะเลเติบโตได้ดี';
    } else {
      status.textContent = `⚠️ ${problems.join(' • ')}`;
    }
  }

  [temp, ph, salinity].forEach(input => input.addEventListener('input', update));
  update();
}

/* -----------------------------------------------------------------------
   5. BEFORE / AFTER COMPARISON SLIDER
   ----------------------------------------------------------------------- */
function initCompareSlider() {
  const wrap = document.getElementById('compare-wrap');
  const after = document.getElementById('compare-after');
  const handle = document.getElementById('compare-handle');
  if (!wrap || !after || !handle) return;

  let dragging = false;

  function setPosition(clientX) {
    const rect = wrap.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    after.style.clipPath = `inset(0 0 0 ${pct}%)`;
    handle.style.left = `${pct}%`;
  }

  handle.addEventListener('pointerdown', () => { dragging = true; });
  window.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('pointermove', (e) => { if (dragging) setPosition(e.clientX); });
  wrap.addEventListener('click', (e) => setPosition(e.clientX));

  // Keyboard accessibility
  handle.setAttribute('tabindex', '0');
  handle.setAttribute('role', 'slider');
  handle.setAttribute('aria-label', 'เปรียบเทียบก่อนและหลังมีหญ้าทะเล');
  handle.addEventListener('keydown', (e) => {
    const rect = wrap.getBoundingClientRect();
    const current = parseFloat(handle.style.left) || 50;
    if (e.key === 'ArrowLeft') setPosition(rect.left + (rect.width * (current - 5) / 100));
    if (e.key === 'ArrowRight') setPosition(rect.left + (rect.width * (current + 5) / 100));
  });
}

/* -----------------------------------------------------------------------
   INIT
   ----------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof requireAuth === 'function') requireAuth();
  buildHero();
  buildEcosystem();
  buildPlantLab();
  initWaterSimulation();
  initCompareSlider();
});
