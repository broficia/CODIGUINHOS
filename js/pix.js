// =============================================
// EXPFY PAY — INTEGRAÇÃO PIX
// Substitua as chaves abaixo pelas suas reais
// =============================================
const EXPFY_PUBLIC_KEY = 'pk_SUA_PUBLIC_KEY_AQUI';
const EXPFY_SECRET_KEY = 'sk_SUA_SECRET_KEY_AQUI';
const EXPFY_BASE_URL   = 'https://pro.expfypay.com/api/v1';
const CALLBACK_URL     = 'https://playuno.com.br/webhook';

// Valores disponíveis para depósito (R$)
const DEPOSIT_AMOUNTS = [35, 50, 100, 200, 500, 1000];

let selectedAmount = 35;
let pixCheckInterval = null;
let pixCountdownInterval = null;

// ---- RENDER AMOUNT BUTTONS ----
function renderAmountButtons() {
  const grid = document.getElementById('amountGrid');
  if (!grid) return;
  grid.innerHTML = DEPOSIT_AMOUNTS.map(v => `
    <button class="amount-btn${v === selectedAmount ? ' selected' : ''}"
            onclick="selectAmount(${v}, this)">
      <span class="amount-val">R$ ${v}</span>
      <span class="amount-label">${v <= 35 ? 'Mínimo' : v >= 1000 ? 'VIP' : 'Popular'}</span>
    </button>
  `).join('');
}

function selectAmount(val, btn) {
  selectedAmount = val;
  document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
  if (btn) btn.classList.add('selected');
  const customInput = document.getElementById('customAmount');
  if (customInput) customInput.value = '';
  document.getElementById('customAmount') && (document.getElementById('customAmount').value = '');
}

// ---- GENERATE PIX ----
async function generatePix() {
  const user = getUser();
  if (!user) { window.location.href = 'login.html'; return; }

  // Get amount
  const customVal = parseFloat(document.getElementById('customAmount')?.value || 0);
  const amount = customVal >= 35 ? customVal : selectedAmount;
  if (!amount || amount < 35) {
    showDepositError('Valor mínimo de depósito é R$ 35,00');
    return;
  }

  // Get customer data
  const name = document.getElementById('depositName')?.value || user.name;
  const doc  = document.getElementById('depositCPF')?.value || '';
  const email = document.getElementById('depositEmail')?.value || user.email;

  if (!doc || doc.replace(/\D/g,'').length < 11) {
    showDepositError('Informe um CPF válido');
    return;
  }

  const btn = document.getElementById('btnGeneratePix');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loading-spinner"></span>Gerando PIX...'; }

  hideDepositError();

  const externalId = 'uno_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);

  const payload = {
    amount: parseFloat(amount.toFixed(2)),
    description: `Depósito UNO!™ - ${user.name}`,
    customer: {
      name: name,
      document: doc.replace(/\D/g,''),
      email: email
    },
    external_id: externalId,
    callback_url: CALLBACK_URL
  };

  try {
    const response = await fetch(`${EXPFY_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Public-Key': EXPFY_PUBLIC_KEY,
        'X-Secret-Key': EXPFY_SECRET_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Erro ao gerar PIX. Tente novamente.');
    }

    // Success: render QR
    renderPixResult(data, amount, externalId);
    savePendingTransaction(externalId, amount, data);
    startPixCountdown(600); // 10 min
    startPixStatusCheck(externalId, data.transaction_id);

  } catch (err) {
    console.error('PIX error:', err);
    showDepositError(err.message || 'Erro ao conectar com o gateway. Tente novamente.');
    if (btn) { btn.disabled = false; btn.innerHTML = '💳 Gerar QR Code PIX'; }
  }
}

// ---- RENDER QR RESULT ----
function renderPixResult(data, amount, externalId) {
  const result = document.getElementById('pixResult');
  const form   = document.getElementById('pixForm');
  if (!result || !form) return;

  form.style.display = 'none';
  result.classList.add('show');

  // QR Code image
  const qrContainer = document.getElementById('qrCodeContainer');
  if (qrContainer) {
    if (data.qr_code_url || data.qr_code_image || data.qrcode_url) {
      qrContainer.innerHTML = `<img src="${data.qr_code_url || data.qr_code_image || data.qrcode_url}" alt="QR Code PIX" style="width:200px;height:200px;border-radius:12px">`;
    } else {
      // Fallback: show QR via API pública
      const pixKey = data.pix_key || data.qr_code || '';
      if (pixKey) {
        qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixKey)}" alt="QR Code PIX" style="width:200px;height:200px;border-radius:12px">`;
      } else {
        qrContainer.innerHTML = `<div style="font-size:3rem">📱</div>`;
      }
    }
  }

  // PIX copy-paste code
  const pixCode = data.pix_code || data.qr_code || data.copy_paste || data.brcode || '';
  document.getElementById('pixCodeText').textContent = pixCode || 'Código PIX gerado com sucesso';

  // Amount
  document.getElementById('pixAmount').textContent = `R$ ${parseFloat(amount).toFixed(2).replace('.',',')}`;

  // Status
  setPixStatus('pending');
}

// ---- COPY PIX CODE ----
function copyPixCode() {
  const code = document.getElementById('pixCodeText')?.textContent;
  if (!code) return;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.querySelector('.btn-copy');
    if (btn) { btn.textContent = '✓ Copiado!'; setTimeout(() => btn.textContent = 'Copiar', 2000); }
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = code; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    const btn = document.querySelector('.btn-copy');
    if (btn) { btn.textContent = '✓ Copiado!'; setTimeout(() => btn.textContent = 'Copiar', 2000); }
  });
}

// ---- COUNTDOWN ----
function startPixCountdown(seconds) {
  const el = document.getElementById('pixCountdown');
  if (!el) return;
  clearInterval(pixCountdownInterval);
  let remaining = seconds;
  function tick() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    if (remaining <= 0) {
      clearInterval(pixCountdownInterval);
      el.textContent = '00:00';
      setPixStatus('expired');
    }
    remaining--;
  }
  tick();
  pixCountdownInterval = setInterval(tick, 1000);
}

// ---- STATUS CHECK ----
function startPixStatusCheck(externalId, transactionId) {
  clearInterval(pixCheckInterval);
  let attempts = 0;
  pixCheckInterval = setInterval(async () => {
    attempts++;
    if (attempts > 120) { clearInterval(pixCheckInterval); return; } // stop after 10min
    try {
      const res = await fetch(`${EXPFY_BASE_URL}/check-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Public-Key': EXPFY_PUBLIC_KEY,
          'X-Secret-Key': EXPFY_SECRET_KEY
        },
        body: JSON.stringify({ external_id: externalId })
      });
      const data = await res.json();
      if (data.status === 'completed' || data.status === 'paid' || data.status === 'confirmed') {
        clearInterval(pixCheckInterval);
        clearInterval(pixCountdownInterval);
        setPixStatus('confirmed');
        updateUserBalance(data.amount || selectedAmount);
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 3000);
      }
    } catch(e) { /* silent */ }
  }, 5000); // check every 5s
}

// ---- STATUS UI ----
function setPixStatus(status) {
  const el = document.getElementById('pixStatusMsg');
  if (!el) return;
  const msgs = {
    pending:  { cls: 'pending',   text: '⏳ Aguardando pagamento...' },
    confirmed:{ cls: 'confirmed', text: '✅ Pagamento confirmado! Redirecionando...' },
    expired:  { cls: 'error',     text: '❌ PIX expirado. Gere um novo.' },
    error:    { cls: 'error',     text: '❌ Erro no pagamento. Tente novamente.' }
  };
  const m = msgs[status] || msgs.pending;
  el.className = `pix-status ${m.cls}`;
  el.textContent = m.text;
  el.style.display = 'block';
}

// ---- SAVE TRANSACTION ----
function savePendingTransaction(externalId, amount, apiData) {
  const txs = JSON.parse(localStorage.getItem('unoTransactions') || '[]');
  txs.unshift({
    id: externalId,
    type: 'deposit',
    amount: amount,
    status: 'pending',
    date: new Date().toISOString(),
    method: 'PIX'
  });
  localStorage.setItem('unoTransactions', JSON.stringify(txs.slice(0, 50)));
}

function updateUserBalance(amount) {
  const user = getUser();
  if (!user) return;
  user.balance = (parseFloat(user.balance || 0) + parseFloat(amount)).toFixed(2);
  // Update last transaction
  const txs = JSON.parse(localStorage.getItem('unoTransactions') || '[]');
  if (txs[0]) txs[0].status = 'confirmed';
  localStorage.setItem('unoTransactions', JSON.stringify(txs));
  localStorage.setItem('unoUser', JSON.stringify(user));
}

// ---- ERROR HELPERS ----
function showDepositError(msg) {
  const el = document.getElementById('depositError');
  if (el) { el.textContent = msg; el.className = 'pix-status error'; el.style.display = 'block'; }
}
function hideDepositError() {
  const el = document.getElementById('depositError');
  if (el) el.style.display = 'none';
}

// ---- CPF MASK ----
function maskCPF(input) {
  let v = input.value.replace(/\D/g,'');
  v = v.replace(/(\d{3})(\d)/,'$1.$2');
  v = v.replace(/(\d{3})(\d)/,'$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/,'$1-$2');
  input.value = v;
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  renderAmountButtons();
  const customInput = document.getElementById('customAmount');
  if (customInput) {
    customInput.addEventListener('input', () => {
      document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
      selectedAmount = parseFloat(customInput.value) || 0;
    });
  }
  const cpfInput = document.getElementById('depositCPF');
  if (cpfInput) cpfInput.addEventListener('input', () => maskCPF(cpfInput));

  // Pre-fill from user
  const user = getUser();
  if (user) {
    const nameInput = document.getElementById('depositName');
    const emailInput = document.getElementById('depositEmail');
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
  }
});
