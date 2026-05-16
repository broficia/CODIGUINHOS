// =============================================
// EXPFY PAY — INTEGRAÇÃO PIX COMPLETA
// =============================================
const EXPFY_PUBLIC_KEY = 'pk_fae7f1ca7b815e76647903e34dbb3c957ffd7c56dcab4f4d';
const EXPFY_SECRET_KEY = 'sk_044b5000df776aeaab64f911dca163a2e012ea62945472bd3e606631d8f51c8b';
const EXPFY_BASE_URL   = 'https://pro.expfypay.com/api/v1';
const CALLBACK_URL     = 'https://playuno.com.br/webhook';

const DEPOSIT_AMOUNTS  = [35, 50, 100, 200, 500, 1000];

let selectedAmount = 35;
let pixCheckInterval = null;
let pixCountdownInterval = null;
let currentExternalId = null;

// ---- RENDER AMOUNT BUTTONS ----
function renderAmountButtons(){
  const grid = document.getElementById('amountGrid');
  if(!grid) return;
  grid.innerHTML = DEPOSIT_AMOUNTS.map(v=>`
    <button class="amt-btn${v===selectedAmount?' sel':''}" onclick="selectAmount(${v},this)">
      <span class="av">R$ ${v}</span>
      <span class="al">${v<=35?'Mínimo':v>=1000?'VIP':'Popular'}</span>
    </button>`).join('');
}

function selectAmount(val,btn){
  selectedAmount = val;
  document.querySelectorAll('.amt-btn').forEach(b=>b.classList.remove('sel'));
  if(btn) btn.classList.add('sel');
  const ci = document.getElementById('customAmount');
  if(ci) ci.value='';
}

// ---- GENERATE PIX ----
async function generatePix(){
  const user = getUser();
  if(!user){window.location.href='login.html';return}

  const customVal = parseFloat(document.getElementById('customAmount')?.value||0);
  const amount    = customVal>=35 ? customVal : selectedAmount;

  if(!amount||amount<35){showDepErr('Valor mínimo de depósito é R$ 35,00');return}

  const btn = document.getElementById('btnGenPix');
  if(btn){btn.disabled=true;btn.innerHTML='<span class="spinner"></span>Gerando PIX...'}
  hideDepErr();

  currentExternalId = 'uno_'+Date.now()+'_'+Math.random().toString(36).substr(2,8);

  const payload = {
    amount: parseFloat(amount.toFixed(2)),
    description: 'Depósito UNO!™ - '+user.name,
    customer: {
      name: user.name,
      document: user.doc||'00000000000',
      email: user.email
    },
    external_id: currentExternalId,
    callback_url: CALLBACK_URL
  };

  try {
    const resp = await fetch(EXPFY_BASE_URL+'/payments',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'X-Public-Key': EXPFY_PUBLIC_KEY,
        'X-Secret-Key': EXPFY_SECRET_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();

    if(!resp.ok){
      throw new Error(data.message||data.error||'Erro ao gerar PIX. Tente novamente.');
    }

    renderPixResult(data, amount);
    savePendingTx(currentExternalId, amount);
    startCountdown(600);
    startStatusCheck(currentExternalId);

  } catch(err){
    console.error('PIX error:',err);
    showDepErr(err.message||'Erro ao conectar com o gateway. Verifique sua conexão.');
    if(btn){btn.disabled=false;btn.innerHTML='💳 Gerar QR Code PIX'}
  }
}

// ---- RENDER PIX RESULT ----
function renderPixResult(data, amount){
  const form   = document.getElementById('pixForm');
  const result = document.getElementById('pixResult');
  if(!form||!result) return;

  form.style.display='none';
  result.classList.add('show');

  // QR CODE IMAGE
  // Tenta todos os campos possíveis da API
  const qrImageUrl = data.qr_code_url||data.qr_code_image||data.qrcode_url||data.qr_image||null;
  const pixCopyPaste = data.pix_code||data.qr_code||data.copy_paste||data.brcode||data.emv||data.qrcode||'';

  const qrBox = document.getElementById('qrCodeImg');
  if(qrBox){
    if(qrImageUrl){
      // API retornou URL da imagem direto
      qrBox.innerHTML=`<img src="${qrImageUrl}" alt="QR Code PIX" style="width:174px;height:174px;border-radius:5px">`;
    } else if(pixCopyPaste){
      // Gera QR Code via serviço público a partir do código PIX
      const qrUrl='https://api.qrserver.com/v1/create-qr-code/?size=174x174&data='+encodeURIComponent(pixCopyPaste);
      qrBox.innerHTML=`<img src="${qrUrl}" alt="QR Code PIX" style="width:174px;height:174px;border-radius:5px" onerror="this.parentElement.innerHTML='<span style=\\'font-size:2.5rem\\'>📱</span>'">`;
    } else {
      qrBox.innerHTML='<span style="font-size:2.5rem">📱</span>';
    }
  }

  // PIX CODE
  const codeEl = document.getElementById('pixCodeText');
  if(codeEl) codeEl.textContent = pixCopyPaste||'Código PIX gerado com sucesso';

  // AMOUNT
  const amtEl = document.getElementById('pixAmountDisplay');
  if(amtEl) amtEl.textContent='R$ '+parseFloat(amount).toFixed(2).replace('.',',');

  // STATUS
  setPixStatus('pending');
}

// ---- COPY PIX ----
function copyPixCode(){
  const code = document.getElementById('pixCodeText')?.textContent||'';
  if(!code) return;
  navigator.clipboard.writeText(code).then(()=>{
    const btn=document.querySelector('.btn-copy');
    if(btn){btn.textContent='✓ Copiado!';setTimeout(()=>btn.textContent='Copiar',2000)}
  }).catch(()=>{
    const ta=document.createElement('textarea');
    ta.value=code;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
    const btn=document.querySelector('.btn-copy');
    if(btn){btn.textContent='✓ Copiado!';setTimeout(()=>btn.textContent='Copiar',2000)}
  });
}

// ---- COUNTDOWN ----
function startCountdown(seconds){
  const el=document.getElementById('pixCountdown');
  if(!el) return;
  clearInterval(pixCountdownInterval);
  let rem=seconds;
  function tick(){
    el.textContent=String(Math.floor(rem/60)).padStart(2,'0')+':'+String(rem%60).padStart(2,'0');
    if(rem<=0){clearInterval(pixCountdownInterval);setPixStatus('expired')}
    rem--;
  }
  tick();
  pixCountdownInterval=setInterval(tick,1000);
}

// ---- STATUS CHECK ----
function startStatusCheck(externalId){
  clearInterval(pixCheckInterval);
  let attempts=0;
  pixCheckInterval=setInterval(async()=>{
    attempts++;
    if(attempts>120){clearInterval(pixCheckInterval);return}
    try{
      const res=await fetch(EXPFY_BASE_URL+'/check-transaction',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Public-Key':EXPFY_PUBLIC_KEY,'X-Secret-Key':EXPFY_SECRET_KEY},
        body:JSON.stringify({external_id:externalId})
      });
      const data=await res.json();
      const st=data.status?.toLowerCase()||'';
      if(st==='completed'||st==='paid'||st==='confirmed'||st==='approved'){
        clearInterval(pixCheckInterval);
        clearInterval(pixCountdownInterval);
        setPixStatus('confirmed');
        confirmTxLocally(externalId, data.amount||selectedAmount);
        setTimeout(()=>window.location.href='dashboard.html',2800);
      }
    } catch(e){/* silent */}
  },5000);
}

// ---- STATUS UI ----
function setPixStatus(status){
  const el=document.getElementById('pixStatusMsg');
  if(!el) return;
  const m={
    pending:{cls:'ps-pending',txt:'⏳ Aguardando pagamento PIX...'},
    confirmed:{cls:'ps-ok',txt:'✅ Pagamento confirmado! Redirecionando...'},
    expired:{cls:'ps-err',txt:'❌ PIX expirado. Gere um novo.'},
    error:{cls:'ps-err',txt:'❌ Erro. Tente novamente.'}
  };
  const s=m[status]||m.pending;
  el.className='pix-status-msg '+s.cls;
  el.textContent=s.txt;
  el.style.display='block';
}

// ---- LOCAL TX ----
function savePendingTx(externalId, amount){
  const txs=JSON.parse(localStorage.getItem('unoTransactions')||'[]');
  txs.unshift({id:externalId,type:'deposit',amount,status:'pending',date:new Date().toISOString(),method:'PIX'});
  localStorage.setItem('unoTransactions',JSON.stringify(txs.slice(0,50)));
}
function confirmTxLocally(externalId, amount){
  const user=getUser();
  if(user){
    user.balance=(parseFloat(user.balance||0)+parseFloat(amount)).toFixed(2);
    saveUser(user);
  }
  const txs=JSON.parse(localStorage.getItem('unoTransactions')||'[]');
  const tx=txs.find(t=>t.id===externalId);
  if(tx) tx.status='confirmed';
  localStorage.setItem('unoTransactions',JSON.stringify(txs));
}

// ---- ERROR ----
function showDepErr(msg){const el=document.getElementById('depErr');if(el){el.textContent=msg;el.style.display='block'}}
function hideDepErr(){const el=document.getElementById('depErr');if(el)el.style.display='none'}

// ---- INIT ----
document.addEventListener('DOMContentLoaded',()=>{
  renderAmountButtons();

  // Pre-fill amount from sessionStorage (if coming from game or shop)
  const preAmt=parseFloat(sessionStorage.getItem('depositAmount')||0);
  if(preAmt>=35){
    selectedAmount=preAmt;
    sessionStorage.removeItem('depositAmount');
    renderAmountButtons();
  }

  const ci=document.getElementById('customAmount');
  if(ci){
    ci.addEventListener('input',()=>{
      document.querySelectorAll('.amt-btn').forEach(b=>b.classList.remove('sel'));
      selectedAmount=parseFloat(ci.value)||0;
    });
  }

  // Pre-fill user data
  const user=getUser();
  if(user){
    const ni=document.getElementById('depositName');
    const ei=document.getElementById('depositEmail');
    if(ni) ni.value=user.name||'';
    if(ei) ei.value=user.email||'';
  }
});
