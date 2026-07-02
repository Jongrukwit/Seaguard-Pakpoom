/* ==========================================================================
   game.js — 5 mini-games sharing one HUD pattern
   ========================================================================== */

/* -----------------------------------------------------------------------
   SOUND — tiny WebAudio beeps so the site works with zero audio assets.
   Swap playTone() calls for real <audio> files in assets/audio/ if desired.
   ----------------------------------------------------------------------- */
let soundOn = true;
let audioCtx = null;
function playTone(freq = 440, duration = 0.12, type = 'sine') {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) { /* audio unsupported — fail silently */ }
}
const SFX = {
  correct: () => playTone(660, 0.15, 'triangle'),
  wrong: () => playTone(160, 0.2, 'sawtooth'),
  win: () => { playTone(523, 0.12); setTimeout(() => playTone(659, 0.12), 120); setTimeout(() => playTone(784, 0.2), 240); },
  tick: () => playTone(300, 0.05, 'square'),
};

/* -----------------------------------------------------------------------
   HIGH SCORE STORAGE
   ----------------------------------------------------------------------- */
function getHighScore(gameId) { return Number(localStorage.getItem(`seagrass_hs_${gameId}`) || 0); }
function setHighScore(gameId, score) {
  if (score > getHighScore(gameId)) { localStorage.setItem(`seagrass_hs_${gameId}`, score); return true; }
  return false;
}

/* -----------------------------------------------------------------------
   TAB SWITCHING
   ----------------------------------------------------------------------- */
function initGameTabs() {
  const tabs = document.querySelectorAll('.game-tab');
  const panels = document.querySelectorAll('.game-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.target).classList.add('active');
    });
  });

  const soundToggle = document.getElementById('sound-toggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      soundOn = !soundOn;
      soundToggle.textContent = soundOn ? '🔊' : '🔇';
    });
  }
}

/* generic countdown timer helper: calls onTick(secondsLeft) and onEnd() */
function startTimer(seconds, onTick, onEnd) {
  let left = seconds;
  onTick(left);
  const id = setInterval(() => {
    left -= 1;
    onTick(left);
    if (left <= 3 && left > 0) SFX.tick();
    if (left <= 0) { clearInterval(id); onEnd(); }
  }, 1000);
  return id;
}

/* ==========================================================================
   GAME 1 — PLANT THE SEAGRASS (drag & drop, timed)
   ========================================================================== */
const G1_SLOTS = [
  { top: '15%', left: '20%', good: true }, { top: '55%', left: '15%', good: true },
  { top: '30%', left: '48%', good: true }, { top: '65%', left: '55%', good: true },
  { top: '18%', left: '75%', good: true }, { top: '70%', left: '80%', good: true },
];
let g1State = { score: 0, timerId: null, planted: 0 };

function initGame1() {
  const zone = document.getElementById('g1-zone');
  const tray = document.getElementById('g1-tray');
  zone.innerHTML = ''; tray.innerHTML = '';
  g1State = { score: 0, timerId: null, planted: 0 };
  updateHud('g1', 0, getHighScore('g1'), 0);

  G1_SLOTS.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'g1-slot';
    el.style.top = s.top; el.style.left = s.left;
    el.dataset.good = s.good; el.dataset.i = i;
    el.addEventListener('dragover', e => e.preventDefault());
    el.addEventListener('drop', e => {
      e.preventDefault();
      if (el.classList.contains('filled')) return;
      if (s.good) {
        el.classList.add('filled'); el.textContent = '🌿';
        g1State.score += 10; g1State.planted += 1;
        SFX.correct(); showToast('ปลูกสำเร็จ! +10', 'success');
      } else {
        SFX.wrong(); showToast('จุดนี้ไม่เหมาะสม', 'error');
      }
      updateHud('g1', g1State.score, getHighScore('g1'), Math.round((g1State.planted / G1_SLOTS.filter(s => s.good).length) * 100));
      if (g1State.planted === G1_SLOTS.filter(s => s.good).length) endGame1(true);
    });
    zone.appendChild(el);
  });

  for (let i = 0; i < 4; i++) {
    const seed = document.createElement('div');
    seed.className = 'g1-seed'; seed.textContent = '🌱'; seed.draggable = true;
    seed.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', 'seed'));
    tray.appendChild(seed);
  }

  clearInterval(g1State.timerId);
  g1State.timerId = startTimer(45, (s) => document.getElementById('g1-timer').textContent = s, () => endGame1(false));
  document.getElementById('g1-overlay').style.display = 'none';
}

function endGame1(won) {
  clearInterval(g1State.timerId);
  const isHigh = setHighScore('g1', g1State.score);
  const overlay = document.getElementById('g1-overlay');
  overlay.style.display = 'flex';
  overlay.querySelector('h3').textContent = won ? '🌿 ปลูกครบแล้ว!' : '⏱️ หมดเวลา';
  overlay.querySelector('p').textContent = `คะแนน: ${g1State.score}${isHigh ? ' — สถิติใหม่! 🎉' : ''}`;
  if (won) SFX.win();
}

/* ==========================================================================
   GAME 2 — MEMORY MATCH
   ========================================================================== */
const G2_ICONS = ['🌿', '🐢', '🐋', '🐠', '🦀', '🦐', '🐡', '🌊'];
let g2State = { first: null, second: null, matched: 0, moves: 0, locked: false };

function initGame2() {
  const grid = document.getElementById('g2-grid');
  grid.innerHTML = '';
  g2State = { first: null, second: null, matched: 0, moves: 0, locked: false };
  updateHud('g2', 0, getHighScore('g2'), 0);
  document.getElementById('g2-overlay').style.display = 'none';

  const deck = [...G2_ICONS, ...G2_ICONS].sort(() => Math.random() - 0.5);
  deck.forEach((icon, i) => {
    const card = document.createElement('div');
    card.className = 'g2-card';
    card.dataset.icon = icon;
    card.dataset.i = i;
    card.textContent = '🌊';
    card.addEventListener('click', () => flipCard(card));
    grid.appendChild(card);
  });
}

function flipCard(card) {
  if (g2State.locked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
  card.classList.add('flipped');
  card.textContent = card.dataset.icon;

  if (!g2State.first) { g2State.first = card; return; }
  g2State.second = card;
  g2State.locked = true;
  g2State.moves += 1;

  const isMatch = g2State.first.dataset.icon === g2State.second.dataset.icon;
  setTimeout(() => {
    if (isMatch) {
      g2State.first.classList.add('matched');
      g2State.second.classList.add('matched');
      g2State.matched += 1;
      SFX.correct();
      const score = Math.max(0, 100 - g2State.moves * 3) + g2State.matched * 10;
      const pct = Math.round((g2State.matched / G2_ICONS.length) * 100);
      updateHud('g2', score, getHighScore('g2'), pct);
      if (g2State.matched === G2_ICONS.length) endGame2(score);
    } else {
      SFX.wrong();
      g2State.first.classList.remove('flipped'); g2State.first.textContent = '🌊';
      g2State.second.classList.remove('flipped'); g2State.second.textContent = '🌊';
    }
    g2State.first = null; g2State.second = null; g2State.locked = false;
  }, 700);
}

function endGame2(score) {
  const isHigh = setHighScore('g2', score);
  const overlay = document.getElementById('g2-overlay');
  overlay.style.display = 'flex';
  overlay.querySelector('h3').textContent = '🎉 จับคู่ครบแล้ว!';
  overlay.querySelector('p').textContent = `ใช้ ${g2State.moves} ครั้ง — คะแนน: ${score}${isHigh ? ' — สถิติใหม่! 🎉' : ''}`;
  SFX.win();
}

/* ==========================================================================
   GAME 3 — OCEAN CLEANUP (drag falling trash into the bin, combo + timer)
   ========================================================================== */
const TRASH_ICONS = ['🛍️', '🥤', '🧴', '🥫'];
const GOOD_ICONS = ['🐚', '🌿'];
let g3State = { score: 0, combo: 0, timerId: null, spawnId: null };

function initGame3() {
  const stage = document.getElementById('g3-stage');
  stage.querySelectorAll('.g3-item').forEach(el => el.remove());
  g3State = { score: 0, combo: 0, timerId: null, spawnId: null };
  updateHud('g3', 0, getHighScore('g3'), 0);
  document.getElementById('g3-overlay').style.display = 'none';

  clearInterval(g3State.spawnId);
  g3State.spawnId = setInterval(spawnG3Item, 750);
  clearInterval(g3State.timerId);
  g3State.timerId = startTimer(40, (s) => document.getElementById('g3-timer').textContent = s, () => endGame3());
}

function spawnG3Item() {
  const stage = document.getElementById('g3-stage');
  const isTrash = Math.random() < 0.75;
  const icon = isTrash ? TRASH_ICONS[Math.floor(Math.random() * TRASH_ICONS.length)] : GOOD_ICONS[Math.floor(Math.random() * GOOD_ICONS.length)];
  const el = document.createElement('div');
  el.className = 'g3-item';
  el.textContent = icon;
  el.dataset.trash = isTrash;
  el.style.left = `${10 + Math.random() * 75}%`;
  el.style.animationDuration = `${3 + Math.random() * 2}s`;
  el.draggable = true;
  el.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', 'g3'));
  el.addEventListener('animationend', () => el.remove());
  el._isTrash = isTrash;
  el.addEventListener('click', () => collectG3Item(el)); // tap support for touch devices
  stage.appendChild(el);
}

function collectG3Item(el) {
  const isTrash = el._isTrash;
  if (isTrash) {
    g3State.score += 10 + g3State.combo * 2;
    g3State.combo += 1;
    SFX.correct();
  } else {
    g3State.score = Math.max(0, g3State.score - 15);
    g3State.combo = 0;
    SFX.wrong();
    showToast('อุ๊ย นั่นไม่ใช่ขยะ!', 'error');
  }
  document.getElementById('g3-combo').textContent = `🔥 คอมโบ x${g3State.combo}`;
  updateHud('g3', g3State.score, getHighScore('g3'), Math.min(100, g3State.score / 3));
  el.remove();
}

function initGame3Bin() {
  const bin = document.getElementById('g3-bin');
  bin.addEventListener('dragover', e => e.preventDefault());
  bin.addEventListener('drop', (e) => {
    e.preventDefault();
    const stage = document.getElementById('g3-stage');
    const items = stage.querySelectorAll('.g3-item');
    if (items.length) collectG3Item(items[items.length - 1]);
  });
}

function endGame3() {
  clearInterval(g3State.spawnId);
  const isHigh = setHighScore('g3', g3State.score);
  const overlay = document.getElementById('g3-overlay');
  overlay.style.display = 'flex';
  overlay.querySelector('h3').textContent = '⏱️ หมดเวลา!';
  overlay.querySelector('p').textContent = `คะแนน: ${g3State.score}${isHigh ? ' — สถิติใหม่! 🎉' : ''}`;
  SFX.win();
}

/* ==========================================================================
   GAME 4 — HELP THE DUGONG FIND FOOD (arrow keys, avoid trash, eat seagrass)
   ========================================================================== */
let g4State = { x: 50, y: 50, score: 0, timerId: null, spawnId: null, keys: {} };

function initGame4() {
  const stage = document.getElementById('g4-stage');
  stage.querySelectorAll('.g4-item').forEach(el => el.remove());
  g4State = { x: 50, y: 50, score: 0, lives: 3, timerId: null, spawnId: null, keys: {} };
  updateHud('g4', 0, getHighScore('g4'), 0);
  document.getElementById('g4-overlay').style.display = 'none';
  const dugong = document.getElementById('g4-dugong');
  dugong.style.left = '50%'; dugong.style.top = '50%';

  clearInterval(g4State.spawnId);
  g4State.spawnId = setInterval(spawnG4Item, 900);
  clearInterval(g4State.timerId);
  g4State.timerId = startTimer(40, (s) => document.getElementById('g4-timer').textContent = s, () => endGame4());
  stage.focus();
}

function spawnG4Item() {
  const stage = document.getElementById('g4-stage');
  const isFood = Math.random() < 0.7;
  const el = document.createElement('div');
  el.className = 'g4-item';
  el.textContent = isFood ? '🌿' : '🥤';
  el.dataset.food = isFood;
  el.style.left = `${5 + Math.random() * 85}%`;
  el.style.top = `${5 + Math.random() * 80}%`;
  stage.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function initGame4Controls() {
  const stage = document.getElementById('g4-stage');
  stage.setAttribute('tabindex', '0');
  stage.addEventListener('keydown', (e) => {
    const step = 6;
    if (e.key === 'ArrowUp') g4State.y = Math.max(0, g4State.y - step);
    if (e.key === 'ArrowDown') g4State.y = Math.min(94, g4State.y + step);
    if (e.key === 'ArrowLeft') g4State.x = Math.max(0, g4State.x - step);
    if (e.key === 'ArrowRight') g4State.x = Math.min(94, g4State.x + step);
    const dugong = document.getElementById('g4-dugong');
    dugong.style.left = `${g4State.x}%`; dugong.style.top = `${g4State.y}%`;
    checkG4Collisions();
  });
  // simple touch/click-to-move fallback
  stage.addEventListener('click', (e) => {
    const rect = stage.getBoundingClientRect();
    g4State.x = ((e.clientX - rect.left) / rect.width) * 100;
    g4State.y = ((e.clientY - rect.top) / rect.height) * 100;
    const dugong = document.getElementById('g4-dugong');
    dugong.style.left = `${g4State.x}%`; dugong.style.top = `${g4State.y}%`;
    checkG4Collisions();
  });
}

function checkG4Collisions() {
  const stage = document.getElementById('g4-stage');
  const dugongRect = document.getElementById('g4-dugong').getBoundingClientRect();
  stage.querySelectorAll('.g4-item').forEach(item => {
    const r = item.getBoundingClientRect();
    const overlap = !(r.right < dugongRect.left || r.left > dugongRect.right || r.bottom < dugongRect.top || r.top > dugongRect.bottom);
    if (overlap) {
      const isFood = item.dataset.food === 'true';
      if (isFood) { g4State.score += 15; SFX.correct(); }
      else { g4State.score = Math.max(0, g4State.score - 20); SFX.wrong(); showToast('ระวังขยะ!', 'error'); }
      updateHud('g4', g4State.score, getHighScore('g4'), Math.min(100, g4State.score / 3));
      item.remove();
    }
  });
}

function endGame4() {
  clearInterval(g4State.spawnId);
  const isHigh = setHighScore('g4', g4State.score);
  const overlay = document.getElementById('g4-overlay');
  overlay.style.display = 'flex';
  overlay.querySelector('h3').textContent = '🐋 พะยูนอิ่มแล้ว!';
  overlay.querySelector('p').textContent = `คะแนน: ${g4State.score}${isHigh ? ' — สถิติใหม่! 🎉' : ''}`;
  SFX.win();
}

/* ==========================================================================
   GAME 5 — SEAGRASS PUZZLE (3x3 sliding tile puzzle)
   ========================================================================== */
let g5State = { tiles: [], moves: 0, startTime: 0 };

function initGame5() {
  const grid = document.getElementById('g5-grid');
  grid.innerHTML = '';
  document.getElementById('g5-overlay').style.display = 'none';

  // tiles 1-8 + blank(0), shuffled to a solvable state via random valid moves
  let tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  let blankIndex = 8;
  for (let i = 0; i < 120; i++) {
    const neighbors = getG5Neighbors(blankIndex);
    const swapWith = neighbors[Math.floor(Math.random() * neighbors.length)];
    [tiles[blankIndex], tiles[swapWith]] = [tiles[swapWith], tiles[blankIndex]];
    blankIndex = swapWith;
  }
  g5State = { tiles, moves: 0, startTime: Date.now() };
  updateHud('g5', 0, getHighScore('g5'), 0);
  renderG5();

  clearInterval(g5State.timerId);
  g5State.timerId = setInterval(() => {
    const secs = Math.floor((Date.now() - g5State.startTime) / 1000);
    document.getElementById('g5-timer').textContent = secs;
  }, 1000);
}

function getG5Neighbors(i) {
  const row = Math.floor(i / 3), col = i % 3;
  const n = [];
  if (row > 0) n.push(i - 3);
  if (row < 2) n.push(i + 3);
  if (col > 0) n.push(i - 1);
  if (col < 2) n.push(i + 1);
  return n;
}

function renderG5() {
  const grid = document.getElementById('g5-grid');
  grid.innerHTML = '';
  g5State.tiles.forEach((val, i) => {
    const tile = document.createElement('div');
    tile.className = 'g5-tile' + (val === 0 ? ' blank' : '');
    tile.textContent = val === 0 ? '' : val;
    tile.addEventListener('click', () => moveG5Tile(i));
    grid.appendChild(tile);
  });
}

function moveG5Tile(i) {
  const blankIndex = g5State.tiles.indexOf(0);
  if (!getG5Neighbors(blankIndex).includes(i)) return;
  [g5State.tiles[blankIndex], g5State.tiles[i]] = [g5State.tiles[i], g5State.tiles[blankIndex]];
  g5State.moves += 1;
  SFX.tick();
  renderG5();
  const solved = g5State.tiles.every((v, idx) => v === (idx === 8 ? 0 : idx + 1));
  const pct = Math.max(0, 100 - g5State.moves);
  updateHud('g5', Math.max(0, 300 - g5State.moves * 5), getHighScore('g5'), Math.min(100, pct));
  if (solved) endGame5();
}

function endGame5() {
  clearInterval(g5State.timerId);
  const secs = Math.floor((Date.now() - g5State.startTime) / 1000);
  const score = Math.max(50, 500 - g5State.moves * 5 - secs * 2);
  const isHigh = setHighScore('g5', score);
  const overlay = document.getElementById('g5-overlay');
  overlay.style.display = 'flex';
  overlay.querySelector('h3').textContent = '🧩 ต่อสำเร็จ!';
  overlay.querySelector('p').textContent = `${g5State.moves} ครั้ง / ${secs} วินาที — คะแนน: ${score}${isHigh ? ' — สถิติใหม่! 🎉' : ''}`;
  SFX.win();
}

/* -----------------------------------------------------------------------
   SHARED HUD UPDATE
   ----------------------------------------------------------------------- */
function updateHud(prefix, score, high, progressPct) {
  const scoreEl = document.getElementById(`${prefix}-score`);
  const highEl = document.getElementById(`${prefix}-high`);
  const barEl = document.getElementById(`${prefix}-bar`);
  if (scoreEl) scoreEl.textContent = Math.round(score);
  if (highEl) highEl.textContent = Math.max(high, Math.round(score));
  if (barEl) barEl.style.width = `${Math.max(0, Math.min(100, progressPct))}%`;
}

/* NOTE: showToast() itself is defined globally in main.js and is used
   directly throughout this file — no local wrapper needed. */

/* -----------------------------------------------------------------------
   INIT ALL
   ----------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof requireAuth === 'function') requireAuth();
  initGameTabs();

  document.getElementById('g1-replay')?.addEventListener('click', initGame1);
  document.getElementById('g2-replay')?.addEventListener('click', initGame2);
  document.getElementById('g3-replay')?.addEventListener('click', initGame3);
  document.getElementById('g4-replay')?.addEventListener('click', initGame4);
  document.getElementById('g5-replay')?.addEventListener('click', initGame5);

  initGame3Bin();
  initGame4Controls();

  initGame1();
  initGame2();
  initGame3();
  initGame4();
  initGame5();
});
