/* ==========================================================================
   quiz.js
   ========================================================================== */

/* Question bank — more than 20 so each attempt can be randomized/varied.
   Each question has 4 choices; `answer` is the zero-based correct index. */
const QUESTION_BANK = [
  { q: 'หญ้าทะเลจัดอยู่ในกลุ่มสิ่งมีชีวิตประเภทใด', choices: ['สาหร่ายทะเล', 'พืชดอก', 'ปะการัง', 'เชื้อรา'], answer: 1, explain: 'หญ้าทะเลเป็นพืชดอก (Angiosperm) ชนิดเดียวที่ปรับตัวให้เจริญเติบโตใต้น้ำทะเลได้เต็มวงจรชีวิต' },
  { q: 'สัตว์ชนิดใดกินหญ้าทะเลเป็นอาหารหลัก', choices: ['ปลาฉลาม', 'พะยูน', 'ปลาหมึก', 'ดาวทะเล'], answer: 1, explain: 'พะยูนกินหญ้าทะเลเป็นอาหารหลักวันละกว่า 30 กิโลกรัม จึงได้ฉายาว่า "วัวทะเล"' },
  { q: 'ประเทศไทยพบหญ้าทะเลอย่างน้อยกี่ชนิด', choices: ['3 ชนิด', '7 ชนิด', '13 ชนิด', '25 ชนิด'], answer: 2, explain: 'น่านน้ำไทยพบหญ้าทะเลแล้วอย่างน้อย 13 ชนิด จากทั้งหมดราว 60 ชนิดทั่วโลก' },
  { q: 'หญ้าทะเลมีความสำคัญต่อระบบนิเวศทางทะเลอย่างไร', choices: ['เป็นแหล่งอนุบาลสัตว์น้ำวัยอ่อน', 'ทำให้น้ำทะเลมีสีเข้มขึ้น', 'ลดปริมาณออกซิเจนในน้ำ', 'ไม่มีผลต่อสัตว์น้ำ'], answer: 0, explain: 'ทุ่งหญ้าทะเลเป็นแหล่งอนุบาลตัวอ่อนของปลาและสัตว์น้ำเศรษฐกิจจำนวนมาก' },
  { q: 'หญ้าทะเลช่วยบรรเทาปัญหาโลกร้อนได้อย่างไร', choices: ['ปล่อยก๊าซมีเทน', 'ดักจับและกักเก็บคาร์บอนใต้ตะกอนทะเล', 'สะท้อนแสงอาทิตย์', 'เพิ่มอุณหภูมิผิวน้ำ'], answer: 1, explain: 'หญ้าทะเลกักเก็บคาร์บอนไว้ในตะกอนใต้น้ำได้อย่างมีประสิทธิภาพ เรียกว่า "บลูคาร์บอน" (Blue Carbon)' },
  { q: 'ปัจจัยใดส่งผลต่อการเจริญเติบโตของหญ้าทะเลมากที่สุด', choices: ['ความเค็ม แสง และอุณหภูมิของน้ำ', 'สีของทราย', 'จำนวนนักท่องเที่ยว', 'ระดับเสียงใต้น้ำ'], answer: 0, explain: 'ความเค็ม ปริมาณแสงแดด และอุณหภูมิของน้ำ เป็นปัจจัยหลักที่กำหนดการเจริญเติบโตของหญ้าทะเล' },
  { q: 'หญ้าทะเลมักเจริญเติบโตในบริเวณใด', choices: ['ทะเลลึกกว่า 2,000 เมตร', 'ชายฝั่งทะเลตื้นที่แสงแดดส่องถึง', 'บนภูเขาใกล้ทะเล', 'ในน้ำจืดเท่านั้น'], answer: 1, explain: 'หญ้าทะเลต้องการแสงแดดในการสังเคราะห์แสง จึงเติบโตในทะเลตื้นใกล้ชายฝั่งเป็นหลัก' },
  { q: 'ข้อใดไม่ใช่ภัยคุกคามต่อแหล่งหญ้าทะเล', choices: ['น้ำเสียจากชุมชน', 'การทำประมงแบบทำลายล้าง', 'การปลูกป่าชายเลนเพิ่มเติม', 'ตะกอนดินจากการพัฒนาชายฝั่ง'], answer: 2, explain: 'การปลูกป่าชายเลนช่วยรักษาระบบนิเวศชายฝั่ง ไม่ได้เป็นภัยคุกคามต่อหญ้าทะเล' },
  { q: 'เต่าทะเลใช้ประโยชน์จากทุ่งหญ้าทะเลอย่างไร', choices: ['ใช้วางไข่บนใบหญ้าทะเล', 'ใช้เป็นแหล่งอาหารและที่หลบภัย', 'ใช้สร้างรัง', 'ไม่มีความเกี่ยวข้องกัน'], answer: 1, explain: 'เต่าทะเลหลายชนิดกินหญ้าทะเลเป็นอาหารและใช้เป็นที่หลบซ่อนจากผู้ล่า' },
  { q: '"บลูคาร์บอน" (Blue Carbon) หมายถึงอะไร', choices: ['คาร์บอนที่ถูกกักเก็บในระบบนิเวศชายฝั่งทะเล', 'สีของน้ำทะเลเมื่อมีมลพิษ', 'ก๊าซพิษจากเรือประมง', 'สารเคมีในครีมกันแดด'], answer: 0, explain: 'บลูคาร์บอน คือคาร์บอนที่ถูกกักเก็บในระบบนิเวศชายฝั่งทะเล เช่น หญ้าทะเล ป่าชายเลน และแนวปะการัง' },
  { q: 'กุ้งและปูวัยอ่อนอาศัยหญ้าทะเลเพื่อจุดประสงค์ใดเป็นหลัก', choices: ['เพื่อบังตัวจากผู้ล่า', 'เพื่อผสมพันธุ์เท่านั้น', 'เพื่อสร้างเปลือกใหม่', 'เพื่อลอกคราบทุกวัน'], answer: 0, explain: 'ใบหญ้าทะเลที่หนาแน่นช่วยบังตัวสัตว์น้ำวัยอ่อนจากนักล่า เพิ่มโอกาสรอดชีวิต' },
  { q: 'น้ำเสียและตะกอนดินส่งผลต่อหญ้าทะเลอย่างไร', choices: ['ทำให้หญ้าทะเลโตเร็วขึ้น', 'บดบังแสงแดดทำให้หญ้าทะเลสังเคราะห์แสงได้น้อยลง', 'ไม่มีผลกระทบใดๆ', 'ทำให้หญ้าทะเลเปลี่ยนเป็นปะการัง'], answer: 1, explain: 'ตะกอนดินและน้ำเสียทำให้น้ำขุ่น บดบังแสงแดดที่หญ้าทะเลต้องใช้ในการสังเคราะห์แสง' },
  { q: 'ข้อใดคือวิธีอนุรักษ์หญ้าทะเลที่เหมาะสม', choices: ['ทิ้งขยะลงทะเลให้ห่างฝั่ง', 'ลดการทิ้งน้ำเสียลงสู่ทะเลและงดสมอเรือทับแนวหญ้าทะเล', 'ใช้อวนลากบริเวณแหล่งหญ้าทะเล', 'ถมทะเลเพื่อสร้างท่าเรือ'], answer: 1, explain: 'การลดน้ำเสียและหลีกเลี่ยงการทิ้งสมอเรือทับแนวหญ้าทะเลช่วยรักษาระบบนิเวศนี้ไว้ได้' },
  { q: 'หญ้าทะเลแตกต่างจากสาหร่ายทะเลอย่างไร', choices: ['หญ้าทะเลมีราก ลำต้น ใบ และดอกที่แท้จริง', 'สาหร่ายมีดอกแต่หญ้าทะเลไม่มี', 'ทั้งสองชนิดเหมือนกันทุกประการ', 'หญ้าทะเลไม่สังเคราะห์แสง'], answer: 0, explain: 'หญ้าทะเลเป็นพืชชั้นสูงที่มีราก ลำต้น ใบ และดอกจริง ต่างจากสาหร่ายซึ่งเป็นสิ่งมีชีวิตที่มีโครงสร้างเรียบง่ายกว่า' },
  { q: 'ทุ่งหญ้าทะเลช่วยลดผลกระทบจากคลื่นชายฝั่งได้อย่างไร', choices: ['ทำให้คลื่นแรงขึ้น', 'ช่วยลดความแรงของคลื่นและป้องกันการกัดเซาะชายฝั่ง', 'ดูดซับน้ำทะเลทั้งหมด', 'ไม่มีผลต่อคลื่น'], answer: 1, explain: 'ใบหญ้าทะเลช่วยลดความแรงของกระแสน้ำและคลื่น ทำให้ตะกอนตกจมและลดการกัดเซาะชายฝั่ง' },
  { q: 'ข้อใดคือสาเหตุหลักที่ทำให้พะยูนในประเทศไทยลดจำนวนลง', choices: ['จำนวนพะยูนมากเกินไป', 'การสูญเสียแหล่งหญ้าทะเลและอุบัติเหตุจากเครื่องมือประมง', 'พะยูนอพยพไปต่างประเทศ', 'สภาพอากาศหนาวเย็น'], answer: 1, explain: 'การสูญเสียแหล่งอาหาร (หญ้าทะเล) และการติดเครื่องมือประมงเป็นสาเหตุหลักที่คุกคามประชากรพะยูน' },
  { q: 'หญ้าทะเลสืบพันธุ์ได้ด้วยวิธีใด', choices: ['แบบไม่อาศัยเพศเท่านั้น', 'ทั้งแบบอาศัยเพศ (ออกดอก) และแบบไม่อาศัยเพศ (เหง้า)', 'แบบแบ่งตัวเหมือนแบคทีเรีย', 'ไม่สามารถสืบพันธุ์ได้'], answer: 1, explain: 'หญ้าทะเลสืบพันธุ์ได้ทั้งแบบอาศัยเพศผ่านการออกดอกและผสมเกสร และแบบไม่อาศัยเพศผ่านเหง้าใต้ดิน' },
  { q: 'สีของน้ำทะเลบริเวณที่มีหญ้าทะเลหนาแน่นมักเป็นอย่างไร', choices: ['ขุ่นสีน้ำตาลเข้มเสมอ', 'มักใสและมีสีเขียวอมฟ้าเนื่องจากตะกอนตกตัว', 'เป็นสีแดงจากสาหร่ายพิษ', 'ไม่มีความแตกต่างจากบริเวณอื่น'], answer: 1, explain: 'ทุ่งหญ้าทะเลช่วยกรองตะกอนและทำให้น้ำใสขึ้น จึงมักเห็นน้ำสีเขียวอมฟ้าใสในบริเวณนั้น' },
  { q: 'หน่วยงานใดที่ประชาชนทั่วไปสามารถมีส่วนร่วมในการอนุรักษ์หญ้าทะเลได้', choices: ['ไม่มีใครทำได้นอกจากนักวิทยาศาสตร์', 'สามารถร่วมเก็บขยะชายหาดและลดการใช้พลาสติกได้', 'ต้องเป็นเจ้าหน้าที่รัฐเท่านั้น', 'ต้องมีเรือดำน้ำส่วนตัว'], answer: 1, explain: 'ทุกคนมีส่วนร่วมได้ เช่น การเก็บขยะชายหาด ลดใช้พลาสติก และสนับสนุนกิจกรรมอนุรักษ์ชายฝั่ง' },
  { q: 'อุณหภูมิน้ำทะเลที่เหมาะสมต่อการเจริญเติบโตของหญ้าทะเลส่วนใหญ่อยู่ที่ประมาณเท่าใด', choices: ['0-5 องศาเซลเซียส', 'ประมาณ 25-30 องศาเซลเซียส', '60-70 องศาเซลเซียส', 'ต่ำกว่าจุดเยือกแข็ง'], answer: 1, explain: 'หญ้าทะเลเขตร้อนส่วนใหญ่เจริญเติบโตได้ดีในช่วงอุณหภูมิประมาณ 25-30 องศาเซลเซียส' },
  { q: 'ทุ่งหญ้าทะเลถูกจัดว่าเป็นระบบนิเวศประเภทใด', choices: ['ระบบนิเวศที่ให้ผลผลิตต่ำที่สุดในโลก', 'หนึ่งในระบบนิเวศที่มีผลผลิตทางชีวภาพสูงที่สุดในโลก', 'ระบบนิเวศที่ไม่มีสิ่งมีชีวิตอาศัยอยู่', 'ระบบนิเวศเทียมที่มนุษย์สร้างขึ้น'], answer: 1, explain: 'ทุ่งหญ้าทะเลเป็นหนึ่งในระบบนิเวศที่มีผลผลิตทางชีวภาพสูงที่สุดในโลก เทียบเท่าป่าฝนเขตร้อน' },
  { q: 'ข้อใดคือผลกระทบหากทุ่งหญ้าทะเลหายไปจากพื้นที่หนึ่ง', choices: ['สัตว์น้ำจะมีจำนวนเพิ่มขึ้น', 'แหล่งอาหารและที่อยู่อาศัยของสัตว์น้ำหลายชนิดจะลดลง', 'น้ำทะเลจะใสขึ้นทันที', 'ไม่มีผลกระทบต่อระบบนิเวศ'], answer: 1, explain: 'การสูญเสียหญ้าทะเลทำให้สัตว์น้ำหลายชนิดสูญเสียแหล่งอาหารและที่อยู่อาศัย ส่งผลกระทบเป็นลูกโซ่ต่อระบบนิเวศ' },
  { q: 'พะยูนจัดอยู่ในกลุ่มสัตว์ประเภทใด', choices: ['ปลา', 'สัตว์เลี้ยงลูกด้วยนมทางทะเล', 'สัตว์เลื้อยคลาน', 'สัตว์ครึ่งบกครึ่งน้ำ'], answer: 1, explain: 'พะยูนเป็นสัตว์เลี้ยงลูกด้วยนมทางทะเลที่ต้องขึ้นมาหายใจบนผิวน้ำเป็นระยะ' },
  { q: 'เครื่องมือประมงชนิดใดที่มักสร้างความเสียหายต่อแหล่งหญ้าทะเลมากที่สุด', choices: ['เบ็ดตกปลาแบบมือ', 'อวนลากพื้นทะเล', 'ลอบดักปูขนาดเล็ก', 'แหจับปลาผิวน้ำ'], answer: 1, explain: 'อวนลากที่ลากไปตามพื้นทะเลสามารถถอนรากหญ้าทะเลและทำลายแหล่งที่อยู่อาศัยได้อย่างรุนแรง' },
];

const TOTAL_QUESTIONS = 20;
let quizState = { questions: [], index: 0, score: 0, startTime: 0, answered: false, timerId: null };

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startQuiz() {
  const pool = shuffle(QUESTION_BANK).slice(0, Math.min(TOTAL_QUESTIONS, QUESTION_BANK.length));
  quizState = {
    questions: pool.map(q => {
      // shuffle each question's choice order too, remapping the answer index
      const order = shuffle(q.choices.map((c, i) => i));
      return {
        q: q.q,
        explain: q.explain,
        choices: order.map(i => q.choices[i]),
        answer: order.indexOf(q.answer),
      };
    }),
    index: 0,
    score: 0,
    startTime: Date.now(),
    answered: false,
  };
  document.getElementById('quiz-result').style.display = 'none';
  document.getElementById('quiz-card').style.display = 'block';
  document.getElementById('quiz-progress-wrap').style.display = 'flex';
  renderQuestion();
}

function renderQuestion() {
  const { questions, index } = quizState;
  const q = questions[index];
  quizState.answered = false;

  document.getElementById('quiz-progress-fill').style.width = `${(index / questions.length) * 100}%`;
  document.getElementById('quiz-progress-label').textContent = `ข้อ ${index + 1} / ${questions.length}`;
  document.getElementById('quiz-question').textContent = q.q;

  const optWrap = document.getElementById('quiz-options');
  optWrap.innerHTML = '';
  const letters = ['ก', 'ข', 'ค', 'ง'];
  q.choices.forEach((choice, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.innerHTML = `<span class="letter">${letters[i]}</span><span>${choice}</span>`;
    btn.addEventListener('click', () => selectAnswer(i, btn));
    optWrap.appendChild(btn);
  });

  document.getElementById('quiz-explain').classList.remove('show');
  document.getElementById('quiz-next-btn').style.display = 'none';
}

function selectAnswer(i, btnEl) {
  if (quizState.answered) return;
  quizState.answered = true;
  const q = quizState.questions[quizState.index];
  const isCorrect = i === q.answer;
  if (isCorrect) quizState.score += 1;

  document.querySelectorAll('.quiz-option').forEach((el, idx) => {
    el.classList.add('locked');
    if (idx === q.answer) el.classList.add('correct');
    else if (idx === i) el.classList.add('incorrect');
  });

  const explainEl = document.getElementById('quiz-explain');
  explainEl.textContent = `💡 ${q.explain}`;
  explainEl.classList.add('show');

  showToastSafe(isCorrect ? 'ถูกต้อง!' : 'ยังไม่ถูก ลองดูคำอธิบายด้านล่าง', isCorrect ? 'success' : 'error');
  document.getElementById('quiz-next-btn').style.display = 'inline-flex';
}

function nextQuestion() {
  quizState.index += 1;
  if (quizState.index >= quizState.questions.length) {
    finishQuiz();
  } else {
    renderQuestion();
  }
}

function finishQuiz() {
  const totalSec = Math.round((Date.now() - quizState.startTime) / 1000);
  const pct = Math.round((quizState.score / quizState.questions.length) * 100);

  document.getElementById('quiz-card').style.display = 'none';
  document.getElementById('quiz-progress-wrap').style.display = 'none';
  const resultEl = document.getElementById('quiz-result');
  resultEl.style.display = 'block';
  document.getElementById('quiz-result-score').textContent = `${quizState.score}/${quizState.questions.length}`;
  document.getElementById('quiz-result-pct').textContent = `${pct}%`;
  document.getElementById('quiz-result-time').textContent = `${totalSec}s`;

  saveQuizResult({ score: quizState.score, total: quizState.questions.length, pct, time: totalSec, date: new Date().toISOString() });
}

/* -----------------------------------------------------------------------
   LOCAL STORAGE HISTORY + GOOGLE SHEET STUB
   ----------------------------------------------------------------------- */
function saveQuizResult(result) {
  const key = 'seagrass_quiz_history';
  const history = JSON.parse(localStorage.getItem(key) || '[]');
  history.push(result);
  localStorage.setItem(key, JSON.stringify(history.slice(-50))); // keep last 50 attempts

  // สามารถส่งคะแนนเข้า Google Sheet ได้ตรงนี้
  // ตัวอย่าง:
  // fetch(SHEET_SUBMIT_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ user: getCurrentUser()?.email, ...result }),
  // });
}

function showToastSafe(msg, type) { if (typeof showToast === 'function') showToast(msg, type); }

document.addEventListener('DOMContentLoaded', () => {
  if (typeof requireAuth === 'function') requireAuth();
  document.getElementById('quiz-next-btn').addEventListener('click', nextQuestion);
  document.getElementById('quiz-restart-btn').addEventListener('click', startQuiz);
  startQuiz();
});
