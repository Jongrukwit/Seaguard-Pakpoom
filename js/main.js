/* ==========================================================================
   main.js — shared across every page
   Handles: loading screen, mobile nav, dark/light theme, TH/EN language,
   toast notifications, footer blade animation, simple scroll reveal.
   ========================================================================== */

/* -----------------------------------------------------------------------
   1. LOADING SCREEN
   Hides once the window has finished loading (min 500ms so it doesn't flash).
   ----------------------------------------------------------------------- */
window.addEventListener('load', () => {
  const loader = document.getElementById('loading-screen');
  if (!loader) return;
  setTimeout(() => loader.classList.add('hidden'), 500);
});

/* -----------------------------------------------------------------------
   2. MOBILE NAV TOGGLE
   ----------------------------------------------------------------------- */
function initNavToggle() {
  const burger = document.querySelector('.nav-burger');
  const links = document.querySelector('.nav-links');
  if (!burger || !links) return;
  burger.addEventListener('click', () => {
    links.classList.toggle('open');
    burger.setAttribute('aria-expanded', links.classList.contains('open'));
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

/* -----------------------------------------------------------------------
   3. DARK / LIGHT MODE
   Persisted in localStorage under "seagrass_theme".
   ----------------------------------------------------------------------- */
function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('seagrass_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  if (toggle) toggle.textContent = saved === 'dark' ? '☀️' : '🌙';

  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('seagrass_theme', next);
      toggle.textContent = next === 'dark' ? '☀️' : '🌙';
    });
  }
}

/* -----------------------------------------------------------------------
   4. TH / EN LANGUAGE TOGGLE
   Minimal dictionary-based swap. Elements needing translation carry a
   data-th="..." and data-en="..." attribute pair; this function swaps
   their textContent. Extend SEAGRASS_DICT / markup as content grows.
   ----------------------------------------------------------------------- */
function initLanguage() {
  const toggle = document.getElementById('lang-toggle');
  const saved = localStorage.getItem('seagrass_lang') || 'th';
  applyLanguage(saved);
  if (toggle) toggle.textContent = saved.toUpperCase();

  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = localStorage.getItem('seagrass_lang') || 'th';
      const next = current === 'th' ? 'en' : 'th';
      localStorage.setItem('seagrass_lang', next);
      applyLanguage(next);
      toggle.textContent = next.toUpperCase();
    });
  }
}

function applyLanguage(lang) {
  document.documentElement.setAttribute('lang', lang === 'th' ? 'th' : 'en');
  document.querySelectorAll(`[data-${lang}]`).forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });
}

/* -----------------------------------------------------------------------
   5. TOAST NOTIFICATIONS
   Usage: showToast("บันทึกแล้ว", "success")
   ----------------------------------------------------------------------- */
function ensureToastStack() {
  let stack = document.getElementById('toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type = 'info', duration = 3200) {
  const stack = ensureToastStack();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '🌿' : type === 'error' ? '⚠️' : '🌊';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* -----------------------------------------------------------------------
   6. FOOTER SEAGRASS BLADES
   Generates a row of animated blades with randomized height/delay so the
   meadow footer feels organic rather than repeated.
   ----------------------------------------------------------------------- */
function initFooterBlades() {
  const row = document.querySelector('.blade-row');
  if (!row || row.dataset.built) return;
  row.dataset.built = 'true';
  const count = window.innerWidth < 600 ? 28 : 60;
  for (let i = 0; i < count; i++) {
    const blade = document.createElement('div');
    blade.className = 'blade';
    const h = 30 + Math.random() * 55;
    blade.style.height = `${h}px`;
    blade.style.animationDelay = `${Math.random() * 4}s`;
    blade.style.animationDuration = `${3 + Math.random() * 2.5}s`;
    row.appendChild(blade);
  }
}

/* -----------------------------------------------------------------------
   7. SIMPLE SCROLL REVEAL
   Add class "reveal" to any element; it fades/slides in once visible.
   ----------------------------------------------------------------------- */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(el => io.observe(el));
}

/* -----------------------------------------------------------------------
   8. NAV ACTIVE STATE
   Marks the current page's link as active based on filename.
   ----------------------------------------------------------------------- */
function markActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[href]').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
}

/* -----------------------------------------------------------------------
   9. AUTH GUARD HELPER
   Pages like dashboard/learning/game/quiz can call requireAuth() to bounce
   unauthenticated visitors back to login.html.
   NOTE: this is a demo-only guard using localStorage — swap for real
   Firebase Authentication session checks when that's wired up.
   ----------------------------------------------------------------------- */
function requireAuth() {
  const user = localStorage.getItem('seagrass_user');
  if (!user) {
    window.location.href = 'login.html';
  }
  return user ? JSON.parse(user) : null;
}

function getCurrentUser() {
  const user = localStorage.getItem('seagrass_user');
  return user ? JSON.parse(user) : null;
}

function logoutUser() {
  localStorage.removeItem('seagrass_user');
  window.location.href = 'login.html';
}

/* -----------------------------------------------------------------------
   INIT
   ----------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initTheme();
  initLanguage();
  initFooterBlades();
  initScrollReveal();
  markActiveNav();

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logoutUser(); });
});
