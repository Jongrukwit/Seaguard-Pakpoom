/* ==========================================================================
   auth.js — demo authentication for login.html & signup.html
   -----------------------------------------------------------------------
   This is a MOCK auth layer that stores a fake "user" in localStorage
   under the key "seagrass_user" so the rest of the site (dashboard,
   learning, game, quiz) can gate pages behind requireAuth() in main.js.

   สามารถเชื่อม Firebase Authentication ได้ตรงนี้:
   1. เพิ่ม Firebase SDK ใน <head> ของ login.html / signup.html
        <script type="module">
          import { initializeApp } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-app.js";
          import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
                    GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-auth.js";
        </script>
   2. เรียก initializeApp(firebaseConfig) แล้วเก็บ auth object ไว้ใช้งาน
   3. แทนที่ฟังก์ชัน mockLogin() / mockSignup() / mockGoogleLogin() ด้านล่าง
      ด้วย signInWithEmailAndPassword(auth, email, password) และเทียบเคียงกัน
   4. เก็บ session ด้วย onAuthStateChanged(auth, user => {...}) แทนการอ่าน
      localStorage.getItem("seagrass_user") ตรงๆ
   ----------------------------------------------------------------------- */

const USERS_KEY = 'seagrass_users';     // mock "database" of registered users
const SESSION_KEY = 'seagrass_user';    // current logged-in session

function readUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}
function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/* -----------------------------------------------------------------------
   LOGIN FORM
   ----------------------------------------------------------------------- */
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;
    const remember = form.remember.checked;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';

    if (!email || !password) {
      errorEl.textContent = 'กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน';
      return;
    }

    // ---- Replace this block with Firebase signInWithEmailAndPassword() ----
    const users = readUsers();
    let user = users.find(u => u.email === email);
    if (!user) {
      // Demo convenience: auto-register on first login attempt so the
      // reviewer can try the flow without a separate signup step.
      user = { name: email.split('@')[0], email };
      users.push(user);
      writeUsers(users);
    }
    // -------------------------------------------------------------------

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    if (!remember) {
      // In a real app, a non-"remembered" session would use sessionStorage
      // or a short-lived Firebase token instead of persistent localStorage.
    }
    window.location.href = 'dashboard.html';
  });

  const googleBtn = document.getElementById('google-login-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      // ---- Replace with signInWithPopup(auth, new GoogleAuthProvider()) ----
      const demoUser = { name: 'ผู้ใช้ Google', email: 'demo.google@seagrass.app' };
      localStorage.setItem(SESSION_KEY, JSON.stringify(demoUser));
      window.location.href = 'dashboard.html';
    });
  }

  const forgotLink = document.getElementById('forgot-link');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      // ---- Replace with Firebase sendPasswordResetEmail(auth, email) ----
      alert('ระบบสาธิต: ในเวอร์ชันจริงจะส่งอีเมลรีเซ็ตรหัสผ่านให้คุณที่นี่');
    });
  }
}

/* -----------------------------------------------------------------------
   SIGN UP FORM
   ----------------------------------------------------------------------- */
function initSignupForm() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirm = form.confirm.value;
    const errorEl = document.getElementById('signup-error');
    errorEl.textContent = '';

    if (!name || !email || !password || !confirm) {
      errorEl.textContent = 'กรุณากรอกข้อมูลให้ครบทุกช่อง';
      return;
    }
    if (password.length < 6) {
      errorEl.textContent = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      return;
    }
    if (password !== confirm) {
      errorEl.textContent = 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน';
      return;
    }

    // ---- Replace this block with Firebase createUserWithEmailAndPassword() ----
    const users = readUsers();
    if (users.some(u => u.email === email)) {
      errorEl.textContent = 'อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว';
      return;
    }
    const newUser = { name, email };
    users.push(newUser);
    writeUsers(users);
    // -----------------------------------------------------------------------

    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    showToastSafe('สมัครสมาชิกสำเร็จ กำลังพาไปยังแดชบอร์ด...', 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 900);
  });
}

function showToastSafe(msg, type) {
  if (typeof showToast === 'function') showToast(msg, type);
}

document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initSignupForm();
});
