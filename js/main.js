// NAVBAR SCROLL
window.addEventListener('scroll',()=>{
  const n=document.getElementById('navbar');
  if(n)n.classList.toggle('scrolled',window.scrollY>50);
});

// MOBILE MENU
function toggleMenu(){
  document.getElementById('navLinks')?.classList.toggle('open');
}

// COOKIES
window.addEventListener('DOMContentLoaded',()=>{
  const b=document.getElementById('cookieBanner');
  if(b&&localStorage.getItem('unoCookies'))b.style.display='none';
  updateNavAuth();
});
function acceptCookies(){localStorage.setItem('unoCookies','1');document.getElementById('cookieBanner').style.display='none';}
function rejectCookies(){document.getElementById('cookieBanner').style.display='none';}
function manageCookies(){localStorage.removeItem('unoCookies');const b=document.getElementById('cookieBanner');if(b)b.style.display='flex';}

// EXTERNAL MODAL
let _pendingUrl='';
function openExternal(url){_pendingUrl=url;const m=document.getElementById('externalModal');if(m)m.style.display='flex';}
function closeModal(){_pendingUrl='';document.getElementById('externalModal').style.display='none';}
function continueExternal(){if(_pendingUrl)window.open(_pendingUrl,'_blank');closeModal();}

// AUTH STATE
function getUser(){try{return JSON.parse(localStorage.getItem('unoUser'));}catch{return null;}}
function updateNavAuth(){
  const user=getUser();
  const authEl=document.getElementById('navAuthBtns');
  if(!authEl)return;
  if(user){
    authEl.innerHTML=`
      <span style="color:#888;font-size:.85rem">Olá, <strong style="color:var(--yellow)">${user.name.split(' ')[0]}</strong></span>
      <a href="pages/dashboard.html" class="btn-login">Minha Conta</a>
      <button onclick="logout()" class="btn-register">Sair</button>`;
  }else{
    authEl.innerHTML=`
      <a href="pages/login.html" class="btn-login">ENTRAR</a>
      <a href="pages/register.html" class="btn-register">CADASTRAR</a>`;
  }
}
function logout(){localStorage.removeItem('unoUser');window.location.href='/index.html';}

// GALLERY TABS
function switchTab(tab){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.gallery-content').forEach(c=>c.classList.add('hidden'));
  event.target.classList.add('active');
  document.getElementById(tab+'Tab')?.classList.remove('hidden');
}

// NEWS FILTER
function filterNews(type,btn){
  document.querySelectorAll('.news-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.news-item').forEach(item=>{
    item.classList.toggle('hidden',type!=='all'&&item.dataset.type!==type);
  });
}

// FAQ
function toggleFaq(el){el.closest('.faq-item').classList.toggle('open');}

// VIDEO
function playVideo(el,title){
  el.querySelector('.video-thumb').innerHTML=`<div style="padding:20px;text-align:center;color:#fff"><p style="font-weight:700">▶ ${title}</p><p style="font-size:.8rem;opacity:.6;margin-top:8px">Disponível no app oficial</p></div>`;
}

// PAGINATION
function goToPage(n){
  document.querySelectorAll('.page-btn').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
}
