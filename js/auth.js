function getUser(){try{return JSON.parse(localStorage.getItem('unoUser'))||null}catch{return null}}
function saveUser(u){localStorage.setItem('unoUser',JSON.stringify(u))}
function requireAuth(){if(!getUser())window.location.href='login.html'}

function checkStrength(val){
  let s=0;if(val.length>=8)s++;if(/[A-Z]/.test(val))s++;if(/[0-9]/.test(val))s++;if(/[^A-Za-z0-9]/.test(val))s++;
  const b=document.getElementById('strengthFill'),t=document.getElementById('strengthText');
  if(!b) return;
  const lv=[{w:'0%',c:'transparent',l:''},{w:'25%',c:'#ff4444',l:'Fraca'},{w:'50%',c:'#ffaa00',l:'Razoável'},{w:'75%',c:'#4da6ff',l:'Boa'},{w:'100%',c:'var(--green-light)',l:'Forte'}];
  const l=lv[s]||lv[0];
  b.style.width=l.w;b.style.background=l.c;
  if(t) t.textContent=l.l;
}

function togglePassword(id){
  const i=document.getElementById(id);if(!i) return;
  i.type=i.type==='password'?'text':'password';
  const b=i.nextElementSibling;if(b) b.textContent=i.type==='password'?'👁':'🙈';
}

function validateEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}

async function handleRegister(e){
  e.preventDefault();clearErrors();
  const name=document.getElementById('regName').value.trim();
  const email=document.getElementById('regEmail').value.trim();
  const pass=document.getElementById('regPass').value;
  const pass2=document.getElementById('regPass2').value;
  const terms=document.getElementById('regTerms').checked;
  let ok=true;
  if(!name||name.length<3){showErr('nameError','Nome deve ter ao menos 3 caracteres');ok=false}
  if(!validateEmail(email)){showErr('emailError','E-mail inválido');ok=false}
  if(pass.length<6){showErr('passError','Senha deve ter ao menos 6 caracteres');ok=false}
  if(pass!==pass2){showErr('pass2Error','As senhas não coincidem');ok=false}
  if(!terms){showErr('termsError','Aceite os termos para continuar');ok=false}
  if(!ok) return;
  const btn=document.getElementById('btnRegister');
  btn.disabled=true;btn.innerHTML='<span class="spinner"></span>Criando conta...';
  await delay(1100);
  const users=JSON.parse(localStorage.getItem('unoUsers')||'[]');
  if(users.find(u=>u.email===email)){showErr('emailError','E-mail já cadastrado');btn.disabled=false;btn.innerHTML='CRIAR MINHA CONTA';return}
  const user={id:'u_'+Date.now(),name,email,balance:'0.00',level:1,xp:0,wins:0,games:0,createdAt:new Date().toISOString()};
  users.push({...user,pass:btoa(pass)});
  localStorage.setItem('unoUsers',JSON.stringify(users));
  saveUser(user);
  btn.innerHTML='✅ Conta criada!';
  setTimeout(()=>window.location.href='dashboard.html',900);
}

async function handleLogin(e){
  e.preventDefault();clearErrors();
  const email=document.getElementById('loginEmail').value.trim();
  const pass=document.getElementById('loginPass').value;
  let ok=true;
  if(!validateEmail(email)){showErr('loginEmailError','E-mail inválido');ok=false}
  if(!pass){showErr('loginPassError','Digite sua senha');ok=false}
  if(!ok) return;
  const btn=document.getElementById('btnLogin');
  btn.disabled=true;btn.innerHTML='<span class="spinner"></span>Entrando...';
  await delay(800);
  const users=JSON.parse(localStorage.getItem('unoUsers')||'[]');
  const found=users.find(u=>u.email===email&&u.pass===btoa(pass));
  if(!found){showErr('loginPassError','E-mail ou senha incorretos');btn.disabled=false;btn.innerHTML='ENTRAR';return}
  const {pass:_,...user}=found;
  saveUser(user);
  btn.innerHTML='✅ Bem-vindo!';
  setTimeout(()=>window.location.href='dashboard.html',700);
}

function showErr(id,msg){const el=document.getElementById(id);if(el){el.textContent=msg;el.classList.add('show')}}
function clearErrors(){document.querySelectorAll('.form-error').forEach(e=>{e.classList.remove('show');e.textContent=''})}
function delay(ms){return new Promise(r=>setTimeout(r,ms))}
