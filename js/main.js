// NAVBAR
window.addEventListener('scroll',()=>{document.getElementById('navbar')?.classList.toggle('scrolled',window.scrollY>50)});
function toggleMenu(){document.getElementById('navLinks')?.classList.toggle('open')}

// COOKIES
window.addEventListener('DOMContentLoaded',()=>{
  const b=document.getElementById('cookieBanner');
  if(b&&localStorage.getItem('unoCookies'))b.style.display='none';
  updateNavAuth();
  loadLangPrefs();
});
function acceptCookies(){localStorage.setItem('unoCookies','1');document.getElementById('cookieBanner').style.display='none'}
function rejectCookies(){document.getElementById('cookieBanner').style.display='none'}
function manageCookies(){localStorage.removeItem('unoCookies');const b=document.getElementById('cookieBanner');if(b)b.style.display='flex'}

// EXTERNAL MODAL
let _extUrl='';
function openExternal(url){_extUrl=url;const m=document.getElementById('externalModal');if(m)m.style.display='flex'}
function closeModal(){_extUrl='';const m=document.getElementById('externalModal');if(m)m.style.display='none'}
function continueExternal(){if(_extUrl)window.open(_extUrl,'_blank');closeModal()}

// AUTH STATE
function getUser(){try{return JSON.parse(localStorage.getItem('unoUser'))||null}catch{return null}}
function saveUser(u){localStorage.setItem('unoUser',JSON.stringify(u))}
function logout(){localStorage.removeItem('unoUser');window.location.href='../index.html'}

function updateNavAuth(){
  const user=getUser();
  const el=document.getElementById('navAuthBtns');
  const balEl=document.getElementById('navBalance');
  if(!el)return;
  if(user){
    el.innerHTML=`<a href="pages/dashboard.html" class="btn-ln">👤 ${user.name.split(' ')[0]}</a><button onclick="logout()" class="btn-rn">Sair</button>`;
    if(balEl){balEl.textContent='💰 R$ '+parseFloat(user.balance||0).toFixed(2).replace('.',',');balEl.classList.add('show')}
  } else {
    el.innerHTML=`<a href="pages/login.html" class="btn-ln">ENTRAR</a><a href="pages/register.html" class="btn-rn">CADASTRAR</a>`;
    if(balEl)balEl.classList.remove('show');
  }
}

// LANG PREFS
function loadLangPrefs(){
  const lang=localStorage.getItem('unoLang')||'pt-BR';
  const country=localStorage.getItem('unoCountry')||'BR';
  const ls=document.getElementById('langSelect');
  const cs=document.getElementById('countrySelect');
  if(ls)ls.value=lang;
  if(cs)cs.value=country;
}
function changeLang(v){localStorage.setItem('unoLang',v)}
function changeCountry(v){localStorage.setItem('unoCountry',v)}

// GALLERY TABS
function switchTab(tab){
  document.querySelectorAll('.gtab2').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.gal-content').forEach(c=>c.classList.add('hidden'));
  event.target.classList.add('active');
  document.getElementById(tab+'Tab')?.classList.remove('hidden');
}

// GAMES TAB
function switchGameTab(type){
  document.querySelectorAll('.gtab').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('.game-card-item').forEach(c=>{
    c.style.display=(type==='all'||c.dataset.type===type)?'block':'none';
  });
}

// SHOP TABS
function switchShopTab(tab){
  document.querySelectorAll('.stab').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('.shop-panel').forEach(p=>p.classList.add('hidden'));
  document.getElementById('shop_'+tab)?.classList.remove('hidden');
}

// NEWS FILTER
function filterNews(type,btn){
  document.querySelectorAll('.ntab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.news-item').forEach(item=>{
    item.classList.toggle('hidden',type!=='all'&&item.dataset.type!==type);
  });
}

// FAQ
function toggleFaq(el){el.closest('.faq-item').classList.toggle('open')}

// VIDEO
function playVideo(el,title){
  el.querySelector('.vid-thumb').innerHTML=`<div style="padding:18px;text-align:center;color:#fff"><p style="font-weight:700">▶ ${title}</p><p style="font-size:.78rem;opacity:.5;margin-top:7px">Disponível no app oficial</p></div>`;
}

// PAGINATION
function goToPage(n){
  document.querySelectorAll('.page-btn').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
}

// REDIRECT TO DEPOSIT ON PLAY
function playGame(gameName){
  sessionStorage.setItem('selectedGame',gameName);
  window.location.href='pages/deposit.html';
}

// BUY COINS MODAL
function buyCoins(pkg){
  const user=getUser();
  if(!user){window.location.href='pages/login.html';return}
  const modal=document.getElementById('buyCoinModal');
  if(modal){
    document.getElementById('bcPkgName').textContent=pkg.coins+' UniCoins';
    document.getElementById('bcPkgPrice').textContent='R$ '+pkg.price;
    document.getElementById('bcPkgBonus').textContent=pkg.bonus||'';
    modal.style.display='flex';
    modal.dataset.pkg=JSON.stringify(pkg);
  }
}
function closeBuyModal(){document.getElementById('buyCoinModal').style.display='none'}
function confirmBuyCoins(){
  const modal=document.getElementById('buyCoinModal');
  const pkg=JSON.parse(modal.dataset.pkg||'{}');
  if(pkg.price){
    sessionStorage.setItem('depositAmount', pkg.price);
    closeBuyModal();
    window.location.href='pages/deposit.html';
  }
}
