// =============================================
// EXPFY PAY — Integração PIX direta (sem deploy)
// =============================================
// As chamadas server-to-server são feitas via proxy
// CORS público (corsproxy.io) -> https://pro.expfypay.com/api/v1
// Não requer nenhum deploy adicional. Funciona em
// GitHub Pages, Vercel, Netlify, domínio próprio, etc.
// =============================================

const EXPFY_PUBLIC_KEY = 'pk_fae7f1ca7b815e76647903e34dbb3c957ffd7c56dcab4f4d';
const EXPFY_SECRET_KEY = 'sk_044b5000df776aeaab64f911dca163a2e012ea62945472bd3e606631d8f51c8b';
const EXPFY_BASE = 'https://corsproxy.io/?' + encodeURIComponent('https://pro.expfypay.com/api/v1');


async function expfyCall(endpoint, payload){
  const url = EXPFY_BASE + endpoint;
  let lastErr = null;

  console.log('Enviando para:', url);
    console.log('Payload:', JSON.stringify(payload, null, 2)); // ← adiciona isso
  try{
    const r = await fetch(url, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'X-Public-Key': EXPFY_PUBLIC_KEY,
        'X-Secret-Key': EXPFY_SECRET_KEY
      },
      body: JSON.stringify(payload)
      
    });
    const txt = await r.text();
    console.log('Status:', r.status);
console.log('Resposta bruta:', txt);  // ← adiciona essa linha
    let data; try{ data = JSON.parse(txt); }catch{ data = { raw:txt }; }
    if(r.ok) return data;
    lastErr = new Error(data.message || data.error || ('HTTP '+r.status));
  }
  catch(e){ lastErr = e; }
  throw lastErr || new Error('Falha de rede');
}   // ← só esse aqui
  
  

// Exemplo: 'https://uno-pix.joao123.workers.dev'

const DEPOSIT_AMOUNTS = [20, 35, 50, 100, 200, 500, 1000];
const MIN_DEPOSIT = 20;
let selectedAmount = 20;
let pixCheckInterval = null;
let pixCountdownInterval = null;
let currentExternalId = null;

// ---- RENDER AMOUNT BUTTONS ----
function renderAmountButtons(){
  const grid = document.getElementById('amountGrid');
  if(!grid) return;
  grid.innerHTML = DEPOSIT_AMOUNTS.map(v=>{
    let label = 'Popular';
    if(v===20) label = 'Mínimo';
    else if(v===35) label = 'Promoção';
    else if(v>=1000) label = 'VIP';
    return `<button class="amt-btn${v===selectedAmount?' sel':''}" onclick="selectAmount(${v},this)">
      <span class="av">R$ ${v}</span>
      <span class="al">${label}</span>
    </button>`;
  }).join('');
}

function selectAmount(val, btn){
  selectedAmount = val;
  document.querySelectorAll('.amt-btn').forEach(b=>b.classList.remove('sel'));
  if(btn) btn.classList.add('sel');
  const ci = document.getElementById('customAmount');
  if(ci) ci.value = '';
}

// ---- GENERATE PIX ----
async function generatePix(){
  const user = getUser();
  if(!user){ window.location.href='login.html'; return; }

  const customVal = parseFloat(document.getElementById('customAmount')?.value||0);
  const amount = customVal >= MIN_DEPOSIT ? customVal : selectedAmount;

  if(!amount || amount < MIN_DEPOSIT){
    showDepErr('Valor mínimo de depósito é R$ '+MIN_DEPOSIT+',00');
    return;
  }

  const btn = document.getElementById('btnGenPix');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spinner"></span>Gerando PIX...'; }
  hideDepErr();

  currentExternalId = 'uno_' + Date.now() + '_' + Math.random().toString(36).substr(2,8);

  // Documento opcional do usuário (se cadastrado), senão padrão válido
const userDoc = '18219822821'.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  const callbackUrl = (location.origin + location.pathname).replace(/\/[^\/]*$/, '/') + 'webhook';

  

  try {
    const data = await expfyCall('/payments', {
      amount: parseFloat(amount.toFixed(2)),
      description: 'Depósito UNO!™ - ' + user.name,
      customer: {
        name: user.name || 'Usuario UNO',
        document: userDoc,
        email: user.email || 'user@playuno.com.br'
      },
      external_id: currentExternalId,
      callback_url: callbackUrl
    });

    renderPixResult(data, amount);
    savePendingTx(currentExternalId, amount);
    startCountdown(600);
    startStatusCheck(currentExternalId);

  } catch(err){
    console.error('PIX error:', err);
    console.log('Pix error:', err)
    showDepErr('Erro ao gerar PIX: ' + (err.message||'Verifique sua conexão.'));
    if(btn){ btn.disabled=false; btn.innerHTML='💳 Gerar QR Code PIX'; }
  }
}

// ---- RENDER PIX RESULT ----
function renderPixResult(data, amount){
  const form   = document.getElementById('pixForm');
  const result = document.getElementById('pixResult');
  if(!form || !result) return;

  form.style.display = 'none';
  result.classList.add('show');

  // EXPFY pode aninhar campos em pix_data / transaction / data
  const root = data.data || data.transaction || data;
  const px   = root.pix_data || root.pix || data.pix_data || {};

  const pixCode = px.pix_code || px.qr_code || px.copy_paste || px.brcode || px.emv
    || root.pix_code || root.qr_code || root.copy_paste || root.brcode
    || root.emv || root.qrcode || root.pix_copia_e_cola || root.payload
    || data.pix_code || data.qr_code || '';

  const qrImageUrl = px.qr_code_url || px.qr_code_image || px.qrcode_url || px.qr_image
    || root.qr_code_url || root.qr_code_image || root.qrcode_url
    || root.qr_image || root.image
    || data.qr_code_url || null;

  const qrBox = document.getElementById('qrCodeImg');
  if(qrBox){
    if(qrImageUrl){
      // API retornou URL de imagem diretamente
      qrBox.innerHTML = `<img src="${qrImageUrl}" alt="QR Code PIX" style="width:172px;height:172px;border-radius:5px">`;
    } else if(pixCode){
      // Gera QR a partir do código PIX usando serviço público
      const safeCode = encodeURIComponent(pixCode);
      qrBox.innerHTML = `<img
        src="https://api.qrserver.com/v1/create-qr-code/?size=172x172&margin=4&data=${safeCode}"
        alt="QR Code PIX"
        style="width:172px;height:172px;border-radius:5px"
        onerror="this.parentElement.innerHTML='<div style=\\'font-size:3rem;text-align:center\\'>📱<br><small style=\\'font-size:.6rem;color:#555\\'>Use o código abaixo</small></div>'"
      >`;
    } else {
      qrBox.innerHTML = '<div style="font-size:2.5rem;text-align:center">📱<br><small style="font-size:.65rem;color:#555">Use o código Copia e Cola</small></div>';
    }
  }

  // Código copia e cola
  const codeEl = document.getElementById('pixCodeText');
  if(codeEl) codeEl.textContent = pixCode || JSON.stringify(data);

  // Valor
  const amtEl = document.getElementById('pixAmountDisplay');
  if(amtEl) amtEl.textContent = 'R$ ' + parseFloat(amount).toFixed(2).replace('.',',');

  setPixStatus('pending');
}

// (Worker setup notice removido — integração direta via corsproxy)

// ---- COPY PIX ----
function copyPixCode(){
  const code = document.getElementById('pixCodeText')?.textContent||'';
  if(!code) return;
  navigator.clipboard.writeText(code).then(()=>{
    const btn = document.querySelector('.btn-copy');
    if(btn){ btn.textContent='✓ Copiado!'; setTimeout(()=>btn.textContent='Copiar',2000); }
  }).catch(()=>{
    const ta=document.createElement('textarea');
    ta.value=code; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    const btn=document.querySelector('.btn-copy');
    if(btn){ btn.textContent='✓ Copiado!'; setTimeout(()=>btn.textContent='Copiar',2000); }
  });
}

// ---- COUNTDOWN ----
function startCountdown(seconds){
  const el = document.getElementById('pixCountdown');
  if(!el) return;
  clearInterval(pixCountdownInterval);
  let rem = seconds;
  function tick(){
    el.textContent = String(Math.floor(rem/60)).padStart(2,'0')+':'+String(rem%60).padStart(2,'0');
    if(rem <= 0){ clearInterval(pixCountdownInterval); setPixStatus('expired'); }
    rem--;
  }
  tick();
  pixCountdownInterval = setInterval(tick, 1000);
}

// ---- STATUS CHECK ----
function startStatusCheck(externalId){
  clearInterval(pixCheckInterval);
  let attempts = 0;
  pixCheckInterval = setInterval(async()=>{
    attempts++;
    if(attempts > 120){ clearInterval(pixCheckInterval); return; }
    try{
      const data = await expfyCall('/check-transaction', { external_id: externalId });
      const root = data.data || data.transaction || data;
      const st = (root.status || data.status || '').toLowerCase();
      if(st==='completed'||st==='paid'||st==='confirmed'||st==='approved'){
        clearInterval(pixCheckInterval);
        clearInterval(pixCountdownInterval);
        setPixStatus('confirmed');
        confirmTxLocally(externalId, selectedAmount);
        setTimeout(()=> window.location.href='dashboard.html', 2500);
      }
    } catch(e){ /* silent */ }
  }, 5000);
}

// ---- STATUS UI ----
function setPixStatus(status){
  const el = document.getElementById('pixStatusMsg');
  if(!el) return;
  const m = {
    pending:  { cls:'ps-pending', txt:'⏳ Aguardando pagamento PIX...' },
    confirmed:{ cls:'ps-ok',      txt:'✅ Pagamento confirmado! Redirecionando...' },
    expired:  { cls:'ps-err',     txt:'❌ PIX expirado. Clique em "Gerar Novo PIX".' },
    error:    { cls:'ps-err',     txt:'❌ Erro no pagamento. Tente novamente.' }
  };
  const s = m[status]||m.pending;
  el.className = 'pix-status-msg '+s.cls;
  el.textContent = s.txt;
  el.style.display = 'block';
}

// ---- LOCAL TX ----
function savePendingTx(externalId, amount){
  const txs = JSON.parse(localStorage.getItem('unoTransactions')||'[]');
  txs.unshift({ id:externalId, type:'deposit', amount, status:'pending', date:new Date().toISOString(), method:'PIX' });
  localStorage.setItem('unoTransactions', JSON.stringify(txs.slice(0,50)));
}
function confirmTxLocally(externalId, amount){
  const user = getUser();
  if(user){
    user.balance = (parseFloat(user.balance||0)+parseFloat(amount)).toFixed(2);
    saveUser(user);
  }
  const txs = JSON.parse(localStorage.getItem('unoTransactions')||'[]');
  const tx = txs.find(t=>t.id===externalId);
  if(tx) tx.status = 'confirmed';
  localStorage.setItem('unoTransactions', JSON.stringify(txs));
}

// ---- ERROR ----
function showDepErr(msg){ const el=document.getElementById('depErr'); if(el){ el.textContent=msg; el.style.display='block'; } }
function hideDepErr(){ const el=document.getElementById('depErr'); if(el) el.style.display='none'; }

// ---- INIT ----
document.addEventListener('DOMContentLoaded', ()=>{
  renderAmountButtons();

  const preAmt = parseFloat(sessionStorage.getItem('depositAmount')||0);
  if(preAmt >= MIN_DEPOSIT){
    selectedAmount = preAmt;
    sessionStorage.removeItem('depositAmount');
    renderAmountButtons();
  }

  const ci = document.getElementById('customAmount');
  if(ci){
    ci.addEventListener('input', ()=>{
      document.querySelectorAll('.amt-btn').forEach(b=>b.classList.remove('sel'));
      selectedAmount = parseFloat(ci.value)||0;
    });
  }

  const user = getUser();
  if(user){
    const ni = document.getElementById('depositName');
    const ei = document.getElementById('depositEmail');
    if(ni) ni.value = user.name||'';
    if(ei) ei.value = user.email||'';
  }
});
