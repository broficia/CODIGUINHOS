// AUTH — login, register, validation

function getUser(){try{return JSON.parse(localStorage.getItem('unoUser'));}catch{return null;}}
function saveUser(u){localStorage.setItem('unoUser',JSON.stringify(u));}

// ---- PASSWORD STRENGTH ----
function checkStrength(val){
  let score=0;
  if(val.length>=8)score++;
  if(/[A-Z]/.test(val))score++;
  if(/[0-9]/.test(val))score++;
  if(/[^A-Za-z0-9]/.test(val))score++;
  const bar=document.getElementById('strengthFill');
  const txt=document.getElementById('strengthText');
  if(!bar)return;
  const levels=[
    {w:'0%',color:'transparent',label:''},
    {w:'25%',color:'#ff4d4d',label:'Fraca'},
    {w:'50%',color:'#ffaa00',label:'Razoável'},
    {w:'75%',color:'#4da6ff',label:'Boa'},
    {w:'100%',color:'var(--green-light)',label:'Forte'},
  ];
  const l=levels[score]||levels[0];
  bar.style.width=l.w;bar.style.background=l.color;
  if(txt)txt.textContent=l.label;
}

// ---- TOGGLE PASSWORD ----
function togglePassword(inputId){
  const inp=document.getElementById(inputId);
  if(!inp)return;
  inp.type=inp.type==='password'?'text':'password';
  const btn=inp.nextElementSibling;
  if(btn)btn.textContent=inp.type==='password'?'👁':'🙈';
}

// ---- VALIDATE EMAIL ----
function validateEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}

// ---- REGISTER ----
async function handleRegister(e){
  e.preventDefault();
  clearErrors();
  const name  =document.getElementById('regName').value.trim();
  const email =document.getElementById('regEmail').value.trim();
  const pass  =document.getElementById('regPass').value;
  const pass2 =document.getElementById('regPass2').value;
  const terms =document.getElementById('regTerms').checked;
  let ok=true;

  if(!name||name.length<3){showError('nameError','Nome deve ter ao menos 3 caracteres');ok=false;}
  if(!validateEmail(email)){showError('emailError','E-mail inválido');ok=false;}
  if(pass.length<6){showError('passError','Senha deve ter ao menos 6 caracteres');ok=false;}
  if(pass!==pass2){showError('pass2Error','As senhas não coincidem');ok=false;}
  if(!terms){showError('termsError','Aceite os termos para continuar');ok=false;}
  if(!ok)return;

  const btn=document.getElementById('btnRegister');
  btn.disabled=true;btn.innerHTML='<span class="loading-spinner"></span>Criando conta...';

  // Simulate async (real backend would validate here)
  await delay(1200);

  const users=JSON.parse(localStorage.getItem('unoUsers')||'[]');
  if(users.find(u=>u.email===email)){
    showError('emailError','Este e-mail já está cadastrado');
    btn.disabled=false;btn.innerHTML='CRIAR MINHA CONTA';
    return;
  }

  const user={
    id:'u_'+Date.now(),
    name,email,
    balance:'0.00',
    level:1,xp:0,
    wins:0,games:0,
    createdAt:new Date().toISOString()
  };
  users.push({...user,pass:btoa(pass)});
  localStorage.setItem('unoUsers',JSON.stringify(users));
  saveUser(user);

  btn.innerHTML='✅ Conta criada!';
  setTimeout(()=>window.location.href='dashboard.html',1000);
}

// ---- LOGIN ----
async function handleLogin(e){
  e.preventDefault();
  clearErrors();
  const email=document.getElementById('loginEmail').value.trim();
  const pass =document.getElementById('loginPass').value;
  let ok=true;

  if(!validateEmail(email)){showError('loginEmailError','E-mail inválido');ok=false;}
  if(!pass){showError('loginPassError','Digite sua senha');ok=false;}
  if(!ok)return;

  const btn=document.getElementById('btnLogin');
  btn.disabled=true;btn.innerHTML='<span class="loading-spinner"></span>Entrando...';

  await delay(900);

  const users=JSON.parse(localStorage.getItem('unoUsers')||'[]');
  const found=users.find(u=>u.email===email&&u.pass===btoa(pass));

  if(!found){
    showError('loginPassError','E-mail ou senha incorretos');
    btn.disabled=false;btn.innerHTML='ENTRAR';
    return;
  }

  const {pass:_,...user}=found;
  saveUser(user);
  btn.innerHTML='✅ Bem-vindo!';
  setTimeout(()=>window.location.href='dashboard.html',800);
}

// ---- HELPERS ----
function showError(id,msg){const el=document.getElementById(id);if(el){el.textContent=msg;el.classList.add('show');}}
function clearErrors(){document.querySelectorAll('.form-error').forEach(e=>{e.classList.remove('show');e.textContent='';});}
function delay(ms){return new Promise(r=>setTimeout(r,ms));}

// Auth guard
function requireAuth(){
  if(!getUser()){window.location.href='login.html';}
}
