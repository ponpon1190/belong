/* ==========================================================================
   拾光記帳 SageExpense - Editorial Morandi Core Logic (UX Enhanced)
   ========================================================================== */

const DEFAULT_BUDGETS = {
  '餐飲': 8000,
  '交通': 3000,
  '娛樂購物': 4000,
  '日常用品': 3000,
  '影音訂閱': 1500,
  '水電費': 3000,
  '電信費': 1000,
  '保險費': 20000,
  '醫療健康': 2000,
  '旅遊': 5000,
  '其他支出': 2000
};

const CATEGORY_ICONS = {
  '餐飲': 'fa-utensils',
  '交通': 'fa-bus',
  '娛樂購物': 'fa-bag-shopping',
  '日常用品': 'fa-basket-shopping',
  '影音訂閱': 'fa-tv',
  '水電費': 'fa-bolt',
  '電信費': 'fa-mobile-screen',
  '保險費': 'fa-user-shield',
  '醫療健康': 'fa-stethoscope',
  '旅遊': 'fa-plane',
  '薪資收入': 'fa-money-bill-wave',
  '獎金收入': 'fa-gift',
  '其他收入': 'fa-wallet',
  '其他支出': 'fa-receipt'
};

// 精簡初始 4 筆極簡範例資料
const INITIAL_TRANSACTIONS = [
  { id: 'tx-1', date: '2026-07-05', type: 'income', nature: 'income', category: '薪資收入', amount: 60000, payment: '銀行轉帳', description: '七月份薪資收入' },
  { id: 'tx-2', date: '2026-07-08', type: 'expense', nature: 'fixed-monthly', category: '影音訂閱', amount: 390, payment: '信用卡', description: 'Netflix 高級版月費' },
  { id: 'tx-3', date: '2026-07-12', type: 'expense', nature: 'variable', category: '餐飲', amount: 150, payment: 'LINE Pay', description: '午餐池上便當' },
  { id: 'tx-4', date: '2026-07-20', type: 'expense', nature: 'variable', category: '交通', amount: 220, payment: 'LINE Pay', description: '搭乘 Uber 計程車' }
];

// App State
let transactions = [];
let budgets = {};
let selectedTxIds = new Set();
let activeTab = 'tab-dashboard';
let dailyTrendChart = null;
let fixedVsVarChart = null;
let categoryPieChart = null;
let currentScannedData = null;

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
  loadDataFromStorage();
  initCategoryDropdowns();
  setupTabNavigation();
  setupEventListeners();
  renderApp();
});

function loadDataFromStorage() {
  const savedTx = localStorage.getItem('smart_expense_transactions');
  const savedBudgets = localStorage.getItem('smart_expense_budgets');

  transactions = savedTx ? JSON.parse(savedTx) : INITIAL_TRANSACTIONS;
  budgets = savedBudgets ? JSON.parse(savedBudgets) : DEFAULT_BUDGETS;
}

function saveDataToStorage() {
  localStorage.setItem('smart_expense_transactions', JSON.stringify(transactions));
  localStorage.setItem('smart_expense_budgets', JSON.stringify(budgets));
}

function initCategoryDropdowns() {
  const txCategorySelect = document.getElementById('tx-category');
  const filterCategorySelect = document.getElementById('filter-category');
  const ocrCategorySelect = document.getElementById('ocr-category-select');

  const categories = Object.keys(DEFAULT_BUDGETS).concat(['薪資收入', '獎金收入', '其他收入']);

  let optionsHtml = '';
  categories.forEach(cat => optionsHtml += `<option value="${cat}">${cat}</option>`);
  txCategorySelect.innerHTML = optionsHtml;
  if (ocrCategorySelect) ocrCategorySelect.innerHTML = optionsHtml;

  let filterOptionsHtml = '<option value="all">所有類別</option>';
  categories.forEach(cat => filterOptionsHtml += `<option value="${cat}">${cat}</option>`);
  filterCategorySelect.innerHTML = filterOptionsHtml;
}

// --- Tab Navigation Setup ---
function setupTabNavigation() {
  const desktopBtns = document.querySelectorAll('.desktop-tabs .tab-btn');
  const mobileNavBtns = document.querySelectorAll('.mobile-nav .mobile-nav-btn');

  function switchTab(targetTabId) {
    activeTab = targetTabId;

    desktopBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === targetTabId));
    mobileNavBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === targetTabId));

    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === targetTabId);
    });

    if (targetTabId === 'tab-charts') renderCharts();
  }

  desktopBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  mobileNavBtns.forEach(btn => {
    if (btn.dataset.tab) btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  const mobileFab = document.getElementById('mobile-fab-add');
  if (mobileFab) mobileFab.addEventListener('click', () => openManualModal());
}

// --- Main Render Controller ---
function renderApp() {
  renderMetrics();
  renderCategoryAnalysisTab();
  renderTransactionsTable();
  if (activeTab === 'tab-charts') renderCharts();
  saveDataToStorage();
}

// --- 1. Dashboard Metrics ---
function renderMetrics() {
  let totalIncome = 0;
  let totalExpense = 0;
  let fixedExpense = 0;
  let varExpense = 0;

  transactions.forEach(tx => {
    const amt = Number(tx.amount);
    if (tx.type === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
      if (tx.nature && tx.nature.startsWith('fixed')) {
        fixedExpense += amt;
      } else {
        varExpense += amt;
      }
    }
  });

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0;

  let totalBudget = 0;
  Object.values(budgets).forEach(b => totalBudget += Number(b));
  const budgetUsagePercent = totalBudget > 0 ? Math.round((totalExpense / totalBudget) * 100) : 0;

  document.getElementById('metric-total-income').textContent = `NT$ ${totalIncome.toLocaleString()}`;
  document.getElementById('metric-total-expense').textContent = `NT$ ${totalExpense.toLocaleString()}`;
  document.getElementById('metric-fixed-expense').textContent = `固定: $${fixedExpense.toLocaleString()}`;
  document.getElementById('metric-var-expense').textContent = `變動: $${varExpense.toLocaleString()}`;

  const balanceEl = document.getElementById('metric-net-balance');
  balanceEl.textContent = `NT$ ${netBalance.toLocaleString()}`;
  balanceEl.style.color = netBalance >= 0 ? '#4a6b5d' : '#bc5a45';

  document.getElementById('metric-savings-rate').textContent = `儲蓄率 ${savingsRate}% (${netBalance >= 0 ? '正向累積' : '超支'})`;
  document.getElementById('metric-budget-percent').textContent = `${budgetUsagePercent}%`;
  document.getElementById('metric-budget-amount').textContent = `已花費 $${totalExpense.toLocaleString()} / 總預算 $${totalBudget.toLocaleString()}`;

  const progressBar = document.getElementById('metric-budget-bar');
  const statusBadge = document.getElementById('budget-status-badge');

  progressBar.style.width = `${Math.min(budgetUsagePercent, 100)}%`;

  if (budgetUsagePercent >= 100) {
    progressBar.className = 'progress-bar-fill danger';
    statusBadge.className = 'badge badge-danger';
    statusBadge.textContent = '❌ 超出總預算';
  } else if (budgetUsagePercent >= 80) {
    progressBar.className = 'progress-bar-fill warning';
    statusBadge.className = 'badge badge-warning';
    statusBadge.textContent = '⚠️ 接近上限 (80%+)';
  } else {
    progressBar.className = 'progress-bar-fill';
    statusBadge.className = 'badge badge-success';
    statusBadge.textContent = '✅ 正常';
  }
}

// --- 2. Category Analysis Tab ---
function renderCategoryAnalysisTab() {
  const summaryContainer = document.getElementById('category-summary-cards');
  const cardsContainer = document.getElementById('budget-cards-container');

  const categoryTotals = {};
  let totalExpense = 0;

  transactions.forEach(tx => {
    if (tx.type === 'expense') {
      const amt = Number(tx.amount);
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amt;
      totalExpense += amt;
    }
  });

  let topCategory = '無';
  let topAmount = 0;
  Object.keys(categoryTotals).forEach(cat => {
    if (categoryTotals[cat] > topAmount) {
      topAmount = categoryTotals[cat];
      topCategory = cat;
    }
  });

  summaryContainer.innerHTML = `
    <div class="cat-stat-card">
      <h4>本月最高花費類別</h4>
      <h3>${topCategory} ($${topAmount.toLocaleString()})</h3>
    </div>
    <div class="cat-stat-card">
      <h4>最高類別支出佔比</h4>
      <h3>${totalExpense > 0 ? Math.round((topAmount / totalExpense) * 100) : 0}%</h3>
    </div>
    <div class="cat-stat-card">
      <h4>總消費類別數</h4>
      <h3>${Object.keys(categoryTotals).length} 個分類</h3>
    </div>
  `;

  let html = '';
  Object.keys(DEFAULT_BUDGETS).forEach(cat => {
    const budget = budgets[cat] || DEFAULT_BUDGETS[cat];
    const spent = categoryTotals[cat] || 0;
    const percent = Math.round((spent / budget) * 100);
    const icon = CATEGORY_ICONS[cat] || 'fa-tag';

    let cardClass = 'budget-item-card';
    let statusTagHtml = '<span class="badge badge-success">✅ 正常</span>';
    let barClass = 'progress-bar-fill';

    if (percent >= 100) {
      cardClass += ' exceeded';
      statusTagHtml = `<span class="badge badge-danger">❌ 超額 $${(spent - budget).toLocaleString()}</span>`;
      barClass += ' danger';
    } else if (percent >= 80) {
      cardClass += ' warn';
      statusTagHtml = `<span class="badge badge-warning">⚠️ 已達 ${percent}%</span>`;
      barClass += ' warning';
    }

    html += `
      <div class="${cardClass}">
        <div class="budget-item-top">
          <span class="category-title">
            <i class="fa-solid ${icon}"></i> ${cat}
          </span>
          ${statusTagHtml}
        </div>
        <div class="budget-values">
          <span>已花費 <strong>$${spent.toLocaleString()}</strong></span>
          <span>預算上限 <strong>$${budget.toLocaleString()}</strong></span>
        </div>
        <div class="progress-bar-bg">
          <div class="${barClass}" style="width: ${Math.min(percent, 100)}%;"></div>
        </div>
      </div>
    `;
  });

  cardsContainer.innerHTML = html;
}

// --- 3. Transactions Table Rendering ---
function renderTransactionsTable() {
  const tbody = document.getElementById('transactions-table-body');
  const countBadge = document.getElementById('transaction-count-badge');

  const filterSearch = document.getElementById('filter-search').value.toLowerCase();
  const filterType = document.getElementById('filter-type').value;
  const filterCategory = document.getElementById('filter-category').value;

  const filtered = transactions.filter(tx => {
    const searchMatch = !filterSearch || 
      tx.description.toLowerCase().includes(filterSearch) || 
      tx.category.toLowerCase().includes(filterSearch);

    let typeMatch = true;
    if (filterType === 'income') typeMatch = tx.type === 'income';
    else if (filterType === 'expense-fixed') typeMatch = tx.type === 'expense' && tx.nature && tx.nature.startsWith('fixed');
    else if (filterType === 'expense-variable') typeMatch = tx.type === 'expense' && (!tx.nature || tx.nature === 'variable');

    const categoryMatch = filterCategory === 'all' || tx.category === filterCategory;

    return searchMatch && typeMatch && categoryMatch;
  });

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  countBadge.textContent = `共 ${filtered.length} 筆紀錄`;

  updateBatchActionBar();

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: #9ab0a5; padding: 30px;">
          尚無符合條件的交易明細
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  filtered.forEach(tx => {
    const isIncome = tx.type === 'income';
    const amountStr = `${isIncome ? '+' : '-'} NT$ ${Number(tx.amount).toLocaleString()}`;
    const amountColor = isIncome ? '#4a6b5d' : '#bc5a45';

    let natureLabel = '收入';
    let natureTagClass = 'tag-income';

    if (!isIncome) {
      if (tx.nature === 'fixed-monthly') { natureLabel = '固定 (月繳)'; natureTagClass = 'tag-fixed'; }
      else if (tx.nature === 'fixed-bimonthly') { natureLabel = '固定 (雙月繳)'; natureTagClass = 'tag-fixed'; }
      else if (tx.nature === 'fixed-yearly') { natureLabel = '固定 (年繳)'; natureTagClass = 'tag-fixed'; }
      else { natureLabel = '變動支出'; natureTagClass = 'tag-var'; }
    }

    const typeBadge = isIncome ? 
      '<span class="tag tag-income">收入</span>' : 
      '<span class="tag tag-expense">支出</span>';

    const isChecked = selectedTxIds.has(tx.id) ? 'checked' : '';

    html += `
      <tr>
        <td style="text-align: center;">
          <input type="checkbox" class="chk-select-tx" data-id="${tx.id}" ${isChecked}>
        </td>
        <td style="font-weight: 500;">${tx.date}</td>
        <td>${typeBadge}</td>
        <td><span class="tag ${natureTagClass}">${natureLabel}</span></td>
        <td style="font-weight: 600;">${tx.category}</td>
        <td>${tx.description}</td>
        <td style="font-weight: 700; color: ${amountColor};">${amountStr}</td>
        <td><span style="font-size: 0.85rem; color: #5c6b64;">${tx.payment}</span></td>
        <td style="text-align: center;">
          <div class="actions-cell">
            <button class="btn-action-pill edit" onclick="editTransaction('${tx.id}')" title="編輯這筆帳目">
              <i class="fa-solid fa-pen"></i> 編輯
            </button>
            <button class="btn-action-pill delete" onclick="deleteTransaction('${tx.id}')" title="刪除這筆帳目">
              <i class="fa-solid fa-trash-can"></i> 刪除
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  document.querySelectorAll('.chk-select-tx').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      if (e.target.checked) selectedTxIds.add(id);
      else selectedTxIds.delete(id);
      updateBatchActionBar();
    });
  });
}

function updateBatchActionBar() {
  const batchBar = document.getElementById('batch-action-bar');
  const countEl = document.getElementById('batch-selected-count');

  if (selectedTxIds.size > 0) {
    batchBar.style.display = 'inline-flex';
    countEl.textContent = `已選擇 ${selectedTxIds.size} 筆`;
  } else {
    batchBar.style.display = 'none';
  }
}

// --- 4. Chart.js Visualization ---
function renderCharts() {
  renderDailyTrendChart();
  renderFixedVsVarChart();
  renderCategoryPieChart();
}

function renderDailyTrendChart() {
  const canvas = document.getElementById('chart-daily-trend');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const dailyMap = {};
  transactions.forEach(tx => {
    if (tx.type === 'expense') {
      const day = tx.date.split('-')[2] + '日';
      dailyMap[day] = (dailyMap[day] || 0) + Number(tx.amount);
    }
  });

  const labels = Object.keys(dailyMap).sort((a, b) => parseInt(a) - parseInt(b));
  const data = labels.map(day => dailyMap[day]);

  if (dailyTrendChart) dailyTrendChart.destroy();

  dailyTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ['1日', '5日', '10日', '15日', '20日', '25日', '30日'],
      datasets: [{
        label: '每日支出 (NT$)',
        data: data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#4a6b5d',
        backgroundColor: 'rgba(74, 107, 93, 0.12)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#375146',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f0ebe3' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderFixedVsVarChart() {
  const canvas = document.getElementById('chart-fixed-vs-var');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let fixedTotal = 0;
  let varTotal = 0;

  transactions.forEach(tx => {
    if (tx.type === 'expense') {
      if (tx.nature && tx.nature.startsWith('fixed')) {
        fixedTotal += Number(tx.amount);
      } else {
        varTotal += Number(tx.amount);
      }
    }
  });

  if (fixedVsVarChart) fixedVsVarChart.destroy();

  fixedVsVarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['固定支出 (常態扣繳)', '變動支出 (日常開銷)'],
      datasets: [{
        label: '金額 (NT$)',
        data: [fixedTotal, varTotal],
        backgroundColor: ['#48697b', '#bc5a45'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f0ebe3' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderCategoryPieChart() {
  const canvas = document.getElementById('chart-category-pie');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const catMap = {};
  transactions.forEach(tx => {
    if (tx.type === 'expense') {
      catMap[tx.category] = (catMap[tx.category] || 0) + Number(tx.amount);
    }
  });

  const labels = Object.keys(catMap);
  const data = Object.values(catMap);
  const colors = ['#4a6b5d', '#bc5a45', '#48697b', '#c88a48', '#867494', '#9eb0a2', '#d99f8f', '#6c7a72'];

  if (categoryPieChart) categoryPieChart.destroy();

  categoryPieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.length > 0 ? labels : ['無資料'],
      datasets: [{
        data: data.length > 0 ? data : [1],
        backgroundColor: labels.length > 0 ? colors.slice(0, labels.length) : ['#cad8d0'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 12, font: { size: 12 } } }
      },
      cutout: '65%'
    }
  });
}

// --- 5. AI Natural Language Parser ---
function handleAiParse() {
  const inputEl = document.getElementById('ai-text-input');
  const text = inputEl.value.trim();

  if (!text) {
    alert('請輸入自然語言記帳文字！');
    return;
  }

  const parsedItems = parseNaturalLanguageText(text);

  if (parsedItems.length === 0) {
    alert('無法解析金額與項目，請試試看如「午餐 150，搭計程車 220」');
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  parsedItems.forEach(item => {
    transactions.push({
      id: 'tx-' + Date.now() + Math.random().toString(36).substr(2, 4),
      date: today,
      type: item.type,
      nature: item.nature,
      category: item.category,
      amount: item.amount,
      payment: item.payment,
      description: item.description
    });
  });

  inputEl.value = '';
  renderApp();
  alert(`✨ 成功自動解析並匯入 ${parsedItems.length} 筆帳目！`);
}

function parseNaturalLanguageText(text) {
  const segments = text.split(/[,;，；\n、]+/);
  const results = [];

  segments.forEach(seg => {
    seg = seg.trim();
    if (!seg) return;

    const amtMatch = seg.match(/(\d+)/);
    if (!amtMatch) return;

    const amount = parseInt(amtMatch[1]);
    let type = 'expense';
    let nature = 'variable';
    let category = '其他支出';
    let payment = '現金';

    let description = seg.replace(/\d+/g, '').replace(/(元|塊|塊錢|NT\$)/gi, '').trim();

    if (/刷卡|信用卡/i.test(seg)) payment = '信用卡';
    else if (/line\s*pay|linepay/i.test(seg)) payment = 'LINE Pay';
    else if (/轉帳|匯款|銀行/i.test(seg)) payment = '銀行轉帳';

    if (/薪資|薪水|收入|獎金|兼職|副業/i.test(seg)) {
      type = 'income';
      nature = 'income';
      category = '薪資收入';
    } else {
      if (/訂閱|netflix|spotify|apple|電信|保險|水電|房租/i.test(seg)) {
        nature = 'fixed-monthly';
        if (/netflix|spotify|apple|影音|訂閱/i.test(seg)) category = '影音訂閱';
        else if (/水電/i.test(seg)) { category = '水電費'; nature = 'fixed-bimonthly'; }
        else if (/電信/i.test(seg)) category = '電信費';
        else if (/保險/i.test(seg)) { category = '保險費'; nature = 'fixed-yearly'; }
      } else {
        if (/餐|午餐|晚餐|早餐|便當|飯|麵|咖啡|飲料|聚餐/i.test(seg)) category = '餐飲';
        else if (/計程車|uber|捷運|公車|高鐵|加油|停車/i.test(seg)) category = '交通';
        else if (/全聯|採買|日用品|衛生紙|超市/i.test(seg)) category = '日常用品';
        else if (/服飾|衣服|電影|遊戲|3c|購物/i.test(seg)) category = '娛樂購物';
        else if (/看診|藥|醫院|診所|健檢/i.test(seg)) category = '醫療健康';
      }
    }

    if (!description) description = category;

    results.push({ type, nature, category, amount, payment, description });
  });

  return results;
}

// --- 6. Invoice & Receipt Real Scanner (QR Code + OCR) ---
function setupInvoiceScanner() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-invoice');

  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      processInvoiceFile(e.target.files[0]);
    }
  });

  const btnConfirm = document.getElementById('btn-confirm-ocr');
  if (btnConfirm) {
    btnConfirm.addEventListener('click', () => {
      const merchantInput = document.getElementById('ocr-merchant-input');
      const dateInput = document.getElementById('ocr-date-input');
      const amountInput = document.getElementById('ocr-amount-input');
      const categorySelect = document.getElementById('ocr-category-select');
      const paymentSelect = document.getElementById('ocr-payment-select');

      const merchant = merchantInput ? merchantInput.value.trim() : '發票消費';
      const date = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0];
      const amount = amountInput ? Number(amountInput.value) : 0;
      const category = categorySelect ? categorySelect.value : '日常用品';
      const payment = paymentSelect ? paymentSelect.value : '現金';

      if (amount <= 0) {
        alert('請輸入有效的發票金額！');
        return;
      }

      transactions.push({
        id: 'tx-ocr-' + Date.now(),
        date: date,
        type: 'expense',
        nature: 'variable',
        category: category,
        amount: amount,
        payment: payment,
        description: merchant || '電子發票消費'
      });

      renderApp();
      closeModals();
      alert('✅ 發票辨識資料已成功匯入！');
    });
  }
}

async function processInvoiceFile(file) {
  const dropZone = document.getElementById('drop-zone');
  const scanContainer = document.getElementById('scan-preview-container');
  const previewImg = document.getElementById('scanned-image-preview');
  const ocrBox = document.getElementById('ocr-result-box');
  const btnConfirm = document.getElementById('btn-confirm-ocr');
  const statusText = document.getElementById('scan-status-text');
  const methodBadge = document.getElementById('ocr-method-badge');

  dropZone.style.display = 'none';
  scanContainer.style.display = 'flex';
  ocrBox.style.display = 'none';
  btnConfirm.style.display = 'none';
  if (statusText) statusText.textContent = '🔍 正在分析圖片條碼與文字...';

  // Read file as Data URL for preview and canvas analysis
  const imageUrl = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      resolve(e.target.result);
    };
    reader.readAsDataURL(file);
  });

  const img = new Image();
  img.src = imageUrl;
  await new Promise((resolve) => { img.onload = resolve; });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let scannedMerchant = '發票消費';
  let scannedDate = new Date().toISOString().split('T')[0];
  let scannedAmount = 0;
  let scannedCategory = '日常用品';
  let scannedPayment = '現金';
  let isQrSuccess = false;

  // 1. Try jsQR for Taiwan Electronic Invoice 2D QR Code
  if (window.jsQR) {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data && code.data.length >= 30) {
        const rawData = code.data;
        // Taiwan E-Invoice Left QR Code standard layout:
        // Chars 0-9: Invoice No
        // Chars 10-16: ROC Date YYYMMDD
        // Chars 17-20: Random Code
        // Chars 21-28: Sales Amount (Hex)
        // Chars 29-36: Total Amount (Hex)
        const invNo = rawData.substring(0, 10);
        const rocDateStr = rawData.substring(10, 17);
        const hexTotal = rawData.substring(29, 37);

        const rocYear = parseInt(rocDateStr.substring(0, 3));
        const month = rocDateStr.substring(3, 5);
        const day = rocDateStr.substring(5, 7);

        if (!isNaN(rocYear) && rocYear > 80 && rocYear < 150) {
          const adYear = rocYear + 1911;
          scannedDate = `${adYear}-${month}-${day}`;
        }

        const totalAmt = parseInt(hexTotal, 16);
        if (!isNaN(totalAmt) && totalAmt > 0) {
          scannedAmount = totalAmt;
        }

        scannedMerchant = `電子發票 (${invNo})`;
        isQrSuccess = true;
      }
    } catch (qrErr) {
      console.warn('QR scan error:', qrErr);
    }
  }

  // 2. OCR Text Analysis using Tesseract.js if QR code missing or amount not parsed
  if (!isQrSuccess || scannedAmount <= 0) {
    if (statusText) statusText.textContent = '📄 使用 AI OCR 辨識內文中...';
    try {
      if (window.Tesseract) {
        const result = await Tesseract.recognize(file, 'chi_tra+eng', {
          logger: m => {
            if (m.status === 'recognizing text' && statusText) {
              statusText.textContent = `📄 AI OCR 辨識中 (${Math.round((m.progress || 0) * 100)}%)...`;
            }
          }
        });
        const text = result.data ? result.data.text : '';

        // Extract Amounts
        const amountMatches = text.match(/(?:NT\$|\$|金額|總計|小計|合計|總額)\s*[:：]?\s*(\d+)/gi);
        let foundAmounts = [];
        if (amountMatches) {
          amountMatches.forEach(m => {
            const num = parseInt(m.replace(/[^\d]/g, ''));
            if (!isNaN(num) && num > 0) foundAmounts.push(num);
          });
        }
        if (foundAmounts.length > 0) {
          scannedAmount = Math.max(...foundAmounts);
        } else {
          const allNums = text.match(/\b\d{2,5}\b/g);
          if (allNums) {
            const validNums = allNums.map(n => parseInt(n)).filter(n => n >= 10 && n <= 99999);
            if (validNums.length > 0) scannedAmount = Math.max(...validNums);
          }
        }

        // Extract Date
        const dateMatch = text.match(/(20\d{2}|11\d)[-/.年](\d{1,2})[-/.月](\d{1,2})/);
        if (dateMatch) {
          let y = parseInt(dateMatch[1]);
          if (y < 1000) y += 1911;
          const m = dateMatch[2].padStart(2, '0');
          const d = dateMatch[3].padStart(2, '0');
          scannedDate = `${y}-${m}-${d}`;
        }

        // Merchant and category prediction
        if (/7-eleven|統一超商|全家|family|萊爾富|ok超商/i.test(text)) {
          if (/7-eleven|統一超商/i.test(text)) scannedMerchant = '7-ELEVEN 統一超商';
          else if (/全家|family/i.test(text)) scannedMerchant = '全家便利商店';
          else if (/萊爾富/i.test(text)) scannedMerchant = '萊爾富 Hi-Life';
          else scannedMerchant = '超商消費';
          scannedCategory = '餐飲';
          scannedPayment = 'LINE Pay';
        } else if (/全聯|大潤發|家樂福|愛買|pxmart|carrefour/i.test(text)) {
          scannedMerchant = '全聯福利中心 / 超市';
          scannedCategory = '日常用品';
          scannedPayment = '信用卡';
        } else if (/捷運|高鐵|臺鐵|uber|計程車|加油/i.test(text)) {
          scannedMerchant = '交通票證 / 移動費';
          scannedCategory = '交通';
        } else {
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
          if (lines.length > 0) scannedMerchant = lines[0].substring(0, 20);
        }
      }
    } catch (ocrErr) {
      console.warn('OCR error:', ocrErr);
    }
  }

  // Hide scanner preview and show editable results box
  scanContainer.style.display = 'none';
  ocrBox.style.display = 'block';
  btnConfirm.style.display = 'inline-flex';

  if (methodBadge) {
    methodBadge.textContent = isQrSuccess ? '✅ QR Code 辨識成功' : '📄 AI OCR 辨識';
    methodBadge.className = isQrSuccess ? 'badge badge-success' : 'badge badge-warning';
  }

  const mInput = document.getElementById('ocr-merchant-input');
  const dInput = document.getElementById('ocr-date-input');
  const aInput = document.getElementById('ocr-amount-input');
  const cSelect = document.getElementById('ocr-category-select');
  const pSelect = document.getElementById('ocr-payment-select');

  if (mInput) mInput.value = scannedMerchant;
  if (dInput) dInput.value = scannedDate;
  if (aInput) aInput.value = scannedAmount > 0 ? scannedAmount : '';
  if (cSelect) cSelect.value = scannedCategory;
  if (pSelect) pSelect.value = scannedPayment;
}

// --- 7. CSV Export & Import ---
function exportCSV() {
  if (transactions.length === 0) {
    alert('目前尚無帳目資料可匯出！');
    return;
  }

  let csvContent = '\uFEFF';
  csvContent += '日期,收支類型,支出屬性,分類項目,描述,金額,支付管道\n';

  transactions.forEach(tx => {
    const row = [
      tx.date,
      tx.type === 'income' ? '收入' : '支出',
      tx.nature || 'variable',
      tx.category,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount,
      tx.payment
    ].join(',');
    csvContent += row + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SageExpense_Backup_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function importCSV(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.split('\n');

    if (lines.length <= 1) {
      alert('CSV 檔案內容為空！');
      return;
    }

    const newTxList = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',');
      if (cols.length >= 6) {
        newTxList.push({
          id: 'tx-imp-' + Date.now() + Math.random().toString(36).substr(2, 4),
          date: cols[0].trim(),
          type: cols[1].trim() === '收入' ? 'income' : 'expense',
          nature: cols[2] ? cols[2].trim() : 'variable',
          category: cols[3].trim(),
          description: cols[4].replace(/^"|"$/g, '').trim(),
          amount: Number(cols[5].trim()) || 0,
          payment: cols[6] ? cols[6].trim() : '現金'
        });
      }
    }

    if (newTxList.length > 0) {
      transactions = newTxList;
      renderApp();
      alert(`✅ 成功匯入 ${newTxList.length} 筆帳目紀錄！`);
    }
  };
  reader.readAsText(file);
}

// --- 8. Event Listeners ---
function setupEventListeners() {
  document.getElementById('btn-ai-parse').addEventListener('click', handleAiParse);
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('ai-text-input').value = chip.dataset.text;
      handleAiParse();
    });
  });

  document.getElementById('filter-search').addEventListener('input', renderTransactionsTable);
  document.getElementById('filter-type').addEventListener('change', renderTransactionsTable);
  document.getElementById('filter-category').addEventListener('change', renderTransactionsTable);

  const chkSelectAll = document.getElementById('chk-select-all');
  if (chkSelectAll) {
    chkSelectAll.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      selectedTxIds.clear();
      if (isChecked) transactions.forEach(t => selectedTxIds.add(t.id));
      renderTransactionsTable();
    });
  }

  const btnBatchDelete = document.getElementById('btn-batch-delete');
  if (btnBatchDelete) {
    btnBatchDelete.addEventListener('click', () => {
      if (selectedTxIds.size === 0) return;
      if (confirm(`確定要刪除已選擇的 ${selectedTxIds.size} 筆紀錄嗎？`)) {
        transactions = transactions.filter(t => !selectedTxIds.has(t.id));
        selectedTxIds.clear();
        if (chkSelectAll) chkSelectAll.checked = false;
        renderApp();
      }
    });
  }

  // Clear All Data Button at Bottom Danger Zone
  const btnClearAll = document.getElementById('btn-clear-all');
  if (btnClearAll) {
    btnClearAll.addEventListener('click', () => {
      if (confirm('⚠️ 確定要清空所有記帳紀錄嗎？此動作無法復原。')) {
        transactions = [];
        selectedTxIds.clear();
        if (chkSelectAll) chkSelectAll.checked = false;
        renderApp();
        alert('✅ 已清空所有記帳紀錄！');
      }
    });
  }

  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
  document.getElementById('input-import-csv').addEventListener('change', (e) => {
    if (e.target.files.length > 0) importCSV(e.target.files[0]);
  });

  document.getElementById('btn-add-manual').addEventListener('click', () => openManualModal());
  document.getElementById('btn-scan-invoice').addEventListener('click', () => {
    openModal('modal-scanner');
    resetScannerModal();
  });

  document.getElementById('btn-edit-budgets-tab2').addEventListener('click', () => {
    document.querySelector('.tab-btn[data-tab="tab-settings"]').click();
  });

  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', closeModals);
  });

  document.getElementById('form-transaction').addEventListener('submit', (e) => {
    e.preventDefault();
    saveManualTransaction();
  });

  document.getElementById('form-settings-budgets').addEventListener('submit', (e) => {
    e.preventDefault();
    saveBudgetsFromSettings();
  });

  renderSettingsBudgetInputs();
  setupInvoiceScanner();
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModals() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); }

function openManualModal(editId = null) {
  const form = document.getElementById('form-transaction');
  form.reset();

  document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];

  if (editId) {
    const tx = transactions.find(t => t.id === editId);
    if (tx) {
      document.getElementById('tx-id').value = tx.id;
      document.getElementById('tx-type').value = tx.type;
      document.getElementById('tx-nature').value = tx.nature || 'variable';
      document.getElementById('tx-category').value = tx.category;
      document.getElementById('tx-amount').value = tx.amount;
      document.getElementById('tx-date').value = tx.date;
      document.getElementById('tx-payment').value = tx.payment;
      document.getElementById('tx-description').value = tx.description;
    }
  } else {
    document.getElementById('tx-id').value = '';
  }

  openModal('modal-transaction');
}

function saveManualTransaction() {
  const id = document.getElementById('tx-id').value;
  const type = document.getElementById('tx-type').value;
  const nature = document.getElementById('tx-nature').value;
  const category = document.getElementById('tx-category').value;
  const amount = Number(document.getElementById('tx-amount').value);
  const date = document.getElementById('tx-date').value;
  const payment = document.getElementById('tx-payment').value;
  const description = document.getElementById('tx-description').value.trim();

  if (id) {
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { id, type, nature, category, amount, date, payment, description };
    }
  } else {
    transactions.push({
      id: 'tx-' + Date.now(),
      type, nature, category, amount, date, payment, description
    });
  }

  renderApp();
  closeModals();
}

function deleteTransaction(id) {
  if (confirm('確定要刪除這筆紀錄嗎？')) {
    transactions = transactions.filter(t => t.id !== id);
    selectedTxIds.delete(id);
    renderApp();
  }
}

function editTransaction(id) {
  openManualModal(id);
}

function renderSettingsBudgetInputs() {
  const container = document.getElementById('settings-budget-list');
  let html = '';

  Object.keys(DEFAULT_BUDGETS).forEach(cat => {
    const budget = budgets[cat] || DEFAULT_BUDGETS[cat];
    html += `
      <div class="form-group">
        <label for="setting-budget-${cat}">${cat} 月度預算 (NT$)</label>
        <input type="number" id="setting-budget-${cat}" data-category="${cat}" value="${budget}" min="0" step="500">
      </div>
    `;
  });

  container.innerHTML = html;
}

function saveBudgetsFromSettings() {
  document.querySelectorAll('#settings-budget-list input').forEach(input => {
    const cat = input.dataset.category;
    budgets[cat] = Number(input.value) || 0;
  });

  renderApp();
  alert('✅ 預算設定已順利儲存！');
}

function resetScannerModal() {
  document.getElementById('drop-zone').style.display = 'block';
  document.getElementById('scan-preview-container').style.display = 'none';
  document.getElementById('ocr-result-box').style.display = 'none';
  document.getElementById('btn-confirm-ocr').style.display = 'none';
  currentScannedData = null;
}
