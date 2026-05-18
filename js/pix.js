// =============================================
// EXPFY PAY — PIX via Cloudflare Worker Proxy
// =============================================
// IMPORTANTE: O GitHub Pages não permite chamadas
// diretas à API por restrição CORS do servidor.
// Use o Cloudflare Worker gratuito como proxy.
//
// COMO CONFIGURAR (1 vez, 5 minutos):
// 1. Acesse https://workers.cloudflare.com
// 2. Crie conta grátis
// 3. "Create Application" → "Create Worker"
// 4. Cole o conteúdo de /worker/cloudflare-worker.js
// 5. "Save and Deploy"
// 6. Copie a URL gerada (ex: https://uno-pix.SEU.workers.dev)
// 7. Substitua WORKER_URL abaixo pela sua URL
// =============================================

const WORKER_URL = 'https://uno-pix.SEU-USUARIO.workers.dev';
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

  // Verificar se Worker foi configurado
  if(WORKER_URL.includes('SEU-USUARIO')){
    showWorkerSetupMsg();
    return;
  }

  const btn = document.getElementById('btnGenPix');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spinner"></span>Gerando PIX...'; }
  hideDepErr();

  currentExternalId = 'uno_' + Date.now() + '_' + Math.random().toString(36).substr(2,8);

  try {
    const resp = await fetch(WORKER_URL + '/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(amount.toFixed(2)),
        description: 'Depósito UNO!™ - ' + user.name,
        name: user.name,
        document: '00000000000',
        email: user.email,
        external_id: currentExternalId
      })
    });

    const data = await resp.json();

    if(!resp.ok){
      throw new Error(data.message || data.error || 'Erro ao gerar PIX. Tente novamente.');
    }

    renderPixResult(data, amount);
    savePendingTx(currentExternalId, amount);
    startCountdown(600);
    startStatusCheck(currentExternalId);

  } catch(err){
    console.error('PIX error:', err);
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

  // Extrair código PIX de todos os campos possíveis da API
  const pixCode = data.pix_code
    || data.qr_code
    || data.copy_paste
    || data.brcode
    || data.emv
    || data.qrcode
    || data.pix_copia_e_cola
    || data.payload
    || '';

  // Extrair URL da imagem QR
  const qrImageUrl = data.qr_code_url
    || data.qr_code_image
    || data.qrcode_url
    || data.qr_image
    || data.image
    || null;

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

// ---- SHOW WORKER SETUP MESSAGE ----
function showWorkerSetupMsg(){
  const form = document.getElementById('pixForm');
  const notice = document.getElementById('pixNotice');
  if(form) form.style.display = 'none';
  if(notice){ notice.style.display='block'; return; }

  // Cria aviso inline
  const div = document.createElement('div');
  div.id = 'pixNotice';
  div.className = 'pix-notice-box';
  div.innerHTML = `
    <h4>⚙️ Configure o Worker para ativar o PIX</h4>
    <p>O GitHub Pages não permite chamadas diretas à API de pagamento. É necessário configurar um <strong>Cloudflare Worker gratuito</strong> como proxy.</p>
    <p><strong>Passos (5 minutos):</strong></p>
    <p>1. Acesse <a href="https://workers.cloudflare.com" target="_blank" style="color:var(--yellow)">workers.cloudflare.com</a> → crie conta grátis</p>
    <p>2. "Create Application" → "Create Worker"</p>
    <p>3. Cole o código do arquivo <code>worker/cloudflare-worker.js</code></p>
    <p>4. "Save and Deploy" → copie a URL gerada</p>
    <p>5. Abra <code>js/pix.js</code> e substitua <code>WORKER_URL</code> pela sua URL</p>
    <p>6. Faça novo push para o GitHub → PIX funcionando! ✅</p>
    <p style="margin-top:14px"><button onclick="document.getElementById('pixNotice').style.display='none';document.getElementById('pixForm').style.display='block';" style="background:var(--red);color:#fff;border:none;padding:8px 18px;border-radius:7px;cursor:pointer;font-weight:700;font-family:'Nunito',sans-serif;font-size:.84rem">← Voltar</button></p>
  `;
  document.querySelector('.deposit-wrap')?.appendChild(div);
}

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
      const res = await fetch(WORKER_URL + '/check-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ external_id: externalId })
      });
      const data = await res.json();
      const st = (data.status||'').toLowerCase();
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
