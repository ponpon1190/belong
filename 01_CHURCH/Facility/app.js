/**
 * 台北場地 停車位申請與轉盤系統 - 前端控制邏輯
 */

// 請在此處貼上您部署的 Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxIUBdw6muumibzhCWNKHELllxOCWsaeTDhF7AgvmnIwU3B-2tb0uDJTXCl-OS8xG4h/exec';

// 轉盤 5 個特定趣味題目與解答
const WHEEL_SECTORS = [
  { 
    shortLabel: '1. 最誠實的食物？',
    question: '1. 世界上最誠實的食物是什麼？',
    answer: '披薩，因為披薩有8片10片，沒有7片（欺騙）',
    color: '#c68a2c', 
    textColor: '#ffffff' 
  },
  { 
    shortLabel: '2. A和C誰比較高？',
    question: '2. A和C誰比較高？',
    answer: 'C，因為 A比C低（ABCD)',
    color: '#7a6c5d', 
    textColor: '#ffffff' 
  },
  { 
    shortLabel: '3. 誰不喝冰啤酒？',
    question: '3. 孔雀、蜻蜓、老虎去吃燒烤，誰不喝冰啤酒？',
    answer: '蜻蜓，因為蜻蜓點水',
    color: '#5b7b9a', 
    textColor: '#ffffff' 
  },
  { 
    shortLabel: '4. 柯南不換衣服？',
    question: '4. 為什麼柯南不換衣服？',
    answer: '因為怕被別人說是新衣',
    color: '#529471', 
    textColor: '#ffffff' 
  },
  { 
    shortLabel: '5. 噴髮膠會怎樣？',
    question: '5. 小明噴髮膠噴太多了會怎麼樣？',
    answer: '他只好硬著頭皮出門',
    color: '#94657b', 
    textColor: '#ffffff' 
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initFormHandler();
  initWheelCanvas();
});

// ==========================================
// 1. 表單提交驗證與連動處理
// ==========================================
function initFormHandler() {
  const form = document.getElementById('parkingForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnText = document.getElementById('btnText');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      plateNumber: document.getElementById('plateNumber').value.trim(),
      parkingType: document.querySelector('input[name="parkingType"]:checked')?.value || ''
    };

    if (!formData.name || !formData.email || !formData.phone || !formData.plateNumber || !formData.parkingType) {
      showToast('請完整填寫所有必填欄位！');
      return;
    }

    if (!validateEmail(formData.email)) {
      showToast('請填寫有效的 Email 格式！');
      return;
    }

    submitBtn.disabled = true;
    btnSpinner.style.display = 'inline-block';
    btnText.textContent = '資料傳送中...';

    try {
      if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await new Promise(res => setTimeout(res, 800));
        console.log('【測試模式】提交資料:', formData);
      }

      openWheelModal();

    } catch (err) {
      console.error('提交失敗:', err);
      showToast('提交失敗，請檢查網路連線後重試！');
    } finally {
      submitBtn.disabled = false;
      btnSpinner.style.display = 'none';
      btnText.textContent = '送出申請';
    }
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==========================================
// 2. 轉盤繪製與物理旋轉動畫 (5 個扇區)
// ==========================================
let canvas, ctx;
let currentAngle = 0;
let isSpinning = false;

function initWheelCanvas() {
  canvas = document.getElementById('wheelCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  
  drawWheel(0);

  document.getElementById('spinBtn').addEventListener('click', startSpinWheel);
  document.getElementById('closeModalBtn').addEventListener('click', closeWheelModal);
}

function drawWheel(angleOffset) {
  const numSectors = WHEEL_SECTORS.length;
  const arcSize = (2 * Math.PI) / numSectors;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = centerX - 10;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < numSectors; i++) {
    const angle = angleOffset + i * arcSize;
    const sector = WHEEL_SECTORS[i];

    // 繪製扇形
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
    ctx.closePath();
    ctx.fillStyle = sector.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // 繪製大字體標籤文字
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle + arcSize / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = sector.textColor;
    ctx.font = 'bold 23px "Plus Jakarta Sans", "Noto Sans TC", sans-serif';
    ctx.fillText(sector.shortLabel, radius - 24, 8);
    ctx.restore();
  }

  // 圓心
  ctx.beginPath();
  ctx.arc(centerX, centerY, 34, 0, 2 * Math.PI);
  ctx.fillStyle = '#f5f0eb';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#c68a2c';
  ctx.stroke();

  ctx.fillStyle = '#2b2621';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GO', centerX, centerY);
}

function startSpinWheel() {
  if (isSpinning) return;
  isSpinning = true;

  const spinBtn = document.getElementById('spinBtn');
  spinBtn.disabled = true;

  const winningIndex = Math.floor(Math.random() * WHEEL_SECTORS.length);
  const sectorArc = (2 * Math.PI) / WHEEL_SECTORS.length;

  const baseRounds = 5 + Math.floor(Math.random() * 2);
  const targetAngleInSector = (Math.random() * 0.6 + 0.2) * sectorArc;
  const sectorStartAngle = winningIndex * sectorArc;
  
  // 指針停留於下方 0.5 * Math.PI 處
  const targetAngle = (baseRounds * 2 * Math.PI) + (0.5 * Math.PI - sectorStartAngle - targetAngleInSector);
  
  const startTime = performance.now();
  const duration = 4000;
  const startAngle = currentAngle;

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeProgress = 1 - Math.pow(1 - progress, 4);

    currentAngle = startAngle + (targetAngle - startAngle) * easeProgress;
    drawWheel(currentAngle);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isSpinning = false;
      onSpinComplete(WHEEL_SECTORS[winningIndex]);
    }
  }

  requestAnimationFrame(animate);
}

function onSpinComplete(winningSector) {
  const gameStepArea = document.getElementById('gameStepArea');
  const resultDisplayBox = document.getElementById('resultDisplayBox');
  const resultQuestion = document.getElementById('resultQuestion');
  const resultAnswer = document.getElementById('resultAnswer');

  gameStepArea.style.display = 'none';
  resultDisplayBox.style.display = 'block';

  resultQuestion.textContent = winningSector.question;
  resultAnswer.textContent = '解答：' + winningSector.answer;
}

// ==========================================
// 3. Modal 視窗與 Toast
// ==========================================
function openWheelModal() {
  const modal = document.getElementById('wheelModal');
  const gameStepArea = document.getElementById('gameStepArea');
  const resultDisplayBox = document.getElementById('resultDisplayBox');
  const spinBtn = document.getElementById('spinBtn');

  gameStepArea.style.display = 'block';
  resultDisplayBox.style.display = 'none';
  spinBtn.disabled = false;

  modal.classList.add('active');
}

function closeWheelModal() {
  const modal = document.getElementById('wheelModal');
  modal.classList.remove('active');
  document.getElementById('parkingForm').reset();
}

function showToast(message) {
  const toastBox = document.getElementById('toastBox');
  const toastMsg = document.getElementById('toastMsg');

  toastMsg.textContent = message;
  toastBox.classList.add('active');

  setTimeout(() => {
    toastBox.classList.remove('active');
  }, 3000);
}
