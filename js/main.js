// NAVBAR
window.addEventListener('scroll',()=>document.getElementById('navbar')?.classList.toggle('scrolled',window.scrollY>50));
function toggleMenu(){document.getElementById('navLinks')?.classList.toggle('open')}

// COOKIES
window.addEventListener('DOMContentLoaded',()=>{
  const b=document.getElementById('cookieBanner');
  if(b&&localStorage.getItem('unoCookies'))b.style.display='none';
  updateNavAuth();
  applyLangPrefs();
});
function acceptCookies(){localStorage.setItem('unoCookies','1');document.getElementById('cookieBanner').style.display='none'}
function rejectCookies(){document.getElementById('cookieBanner').style.display='none'}
function manageCookies(){localStorage.removeItem('unoCookies');const b=document.getElementById('cookieBanner');if(b)b.style.display='flex'}

// EXTERNAL MODAL
let _extUrl='';
function openExternal(url){_extUrl=url;const m=document.getElementById('externalModal');if(m)m.style.display='flex'}
function closeModal(){_extUrl='';const m=document.getElementById('externalModal');if(m)m.style.display='none'}
function continueExternal(){if(_extUrl)window.open(_extUrl,'_blank');closeModal()}

// =============================================
// LANGUAGE & CURRENCY SYSTEM
// =============================================
const LANGS = {
  'pt-BR':{name:'Português (BR)',flag:'🇧🇷',
    home:'HOME',news:'NOTÍCIAS',play:'JOGAR',shop:'LOJA',support:'SUPORTE',more:'MAIS',
    hero_badge:'🃏 O JOGO DE CARTAS #1 DO MUNDO',
    hero_sub:'Jogue com milhões ao redor do mundo.<br>Deposite via PIX e comece a competir agora!',
    btn_play:'JOGAR GRÁTIS',btn_deposit:'💰 DEPOSITAR',
    stats_players:'Jogadores',stats_rating:'Avaliação',stats_rank:'Jogo de Cartas',
    games_title:'Escolha Seu Jogo',games_sub:'Modos exclusivos com entrada mínima e recompensas reais',
    features_title:'Por Que Jogar UNO!™?',features_sub:'Milhões de jogadores já sabem. Chegou a sua vez.',
    shop_title:'Loja UniCoins',shop_sub:'Compre UniCoins e use em jogos, skins e torneios premium',
    min_deposit:'Depósito mín.',btn_join:'JOGAR',
    cta_title:'Pronto para Jogar?',cta_sub:'Crie sua conta grátis, deposite via PIX e entre na arena!',
    signup_free:'Criar Conta Grátis',deposit_pix:'Depositar via PIX'
  },
  'en-US':{name:'English (US)',flag:'🇺🇸',
    home:'HOME',news:'NEWS',play:'PLAY',shop:'SHOP',support:'SUPPORT',more:'MORE',
    hero_badge:'🃏 THE #1 CARD GAME IN THE WORLD',
    hero_sub:'Play with millions around the world.<br>Deposit and start competing now!',
    btn_play:'PLAY FREE',btn_deposit:'💰 DEPOSIT',
    stats_players:'Players',stats_rating:'Rating',stats_rank:'Card Game',
    games_title:'Choose Your Game',games_sub:'Exclusive modes with minimum bet and real rewards',
    features_title:'Why Play UNO!™?',features_sub:'Millions already know. Now it\'s your turn.',
    shop_title:'UniCoins Shop',shop_sub:'Buy UniCoins and use in games, skins and premium tournaments',
    min_deposit:'Min. deposit',btn_join:'PLAY',
    cta_title:'Ready to Play?',cta_sub:'Create a free account, deposit and enter the arena!',
    signup_free:'Create Free Account',deposit_pix:'Deposit Now'
  },
  'es-ES':{name:'Español',flag:'🇪🇸',
    home:'INICIO',news:'NOTICIAS',play:'JUGAR',shop:'TIENDA',support:'SOPORTE',more:'MÁS',
    hero_badge:'🃏 EL JUEGO DE CARTAS #1 DEL MUNDO',
    hero_sub:'Juega con millones en todo el mundo.<br>¡Deposita y empieza a competir ahora!',
    btn_play:'JUGAR GRATIS',btn_deposit:'💰 DEPOSITAR',
    stats_players:'Jugadores',stats_rating:'Valoración',stats_rank:'Juego de Cartas',
    games_title:'Elige Tu Juego',games_sub:'Modos exclusivos con apuesta mínima y recompensas reales',
    features_title:'¿Por Qué Jugar UNO!™?',features_sub:'Millones ya lo saben. Ahora es tu turno.',
    shop_title:'Tienda UniCoins',shop_sub:'Compra UniCoins y úsalos en juegos y torneos',
    min_deposit:'Depósito mín.',btn_join:'JUGAR',
    cta_title:'¿Listo para Jugar?',cta_sub:'¡Crea tu cuenta gratis y entra en la arena!',
    signup_free:'Crear Cuenta Gratis',deposit_pix:'Depositar Ahora'
  },
  'fr-FR':{name:'Français',flag:'🇫🇷',
    home:'ACCUEIL',news:'ACTUALITÉS',play:'JOUER',shop:'BOUTIQUE',support:'SUPPORT',more:'PLUS',
    hero_badge:'🃏 LE JEU DE CARTES #1 MONDIAL',
    hero_sub:'Jouez avec des millions de joueurs.<br>Déposez et commencez à concourir maintenant!',
    btn_play:'JOUER GRATUITEMENT',btn_deposit:'💰 DÉPOSER',
    stats_players:'Joueurs',stats_rating:'Note',stats_rank:'Jeu de Cartes',
    games_title:'Choisissez Votre Jeu',games_sub:'Modes exclusifs avec mise minimale et vraies récompenses',
    features_title:'Pourquoi Jouer à UNO!™?',features_sub:'Des millions le savent déjà. C\'est votre tour.',
    shop_title:'Boutique UniCoins',shop_sub:'Achetez des UniCoins pour les jeux et tournois premium',
    min_deposit:'Dépôt min.',btn_join:'JOUER',
    cta_title:'Prêt à Jouer?',cta_sub:'Créez votre compte gratuit et entrez dans l\'arène!',
    signup_free:'Créer un Compte',deposit_pix:'Déposer Maintenant'
  },
  'de-DE':{name:'Deutsch',flag:'🇩🇪',
    home:'HOME',news:'NEUIGKEITEN',play:'SPIELEN',shop:'SHOP',support:'SUPPORT',more:'MEHR',
    hero_badge:'🃏 DAS #1 KARTENSPIEL DER WELT',
    hero_sub:'Spielen Sie mit Millionen weltweit.<br>Einzahlen und jetzt mitmachen!',
    btn_play:'KOSTENLOS SPIELEN',btn_deposit:'💰 EINZAHLEN',
    stats_players:'Spieler',stats_rating:'Bewertung',stats_rank:'Kartenspiel',
    games_title:'Wählen Sie Ihr Spiel',games_sub:'Exklusive Modi mit Mindesteinsatz und echten Belohnungen',
    features_title:'Warum UNO!™ Spielen?',features_sub:'Millionen wissen es bereits. Jetzt sind Sie dran.',
    shop_title:'UniCoins-Shop',shop_sub:'Kaufen Sie UniCoins für Spiele und Premium-Turniere',
    min_deposit:'Mindesteinzahlung',btn_join:'SPIELEN',
    cta_title:'Bereit zu Spielen?',cta_sub:'Erstellen Sie ein kostenloses Konto und treten Sie der Arena bei!',
    signup_free:'Konto Erstellen',deposit_pix:'Jetzt Einzahlen'
  },
  'ja-JP':{name:'日本語',flag:'🇯🇵',
    home:'ホーム',news:'ニュース',play:'プレイ',shop:'ショップ',support:'サポート',more:'もっと',
    hero_badge:'🃏 世界No.1カードゲーム',
    hero_sub:'世界中の数百万人のプレイヤーと対戦。<br>今すぐデポジットして競争を始めよう！',
    btn_play:'無料でプレイ',btn_deposit:'💰 デポジット',
    stats_players:'プレイヤー',stats_rating:'評価',stats_rank:'カードゲーム',
    games_title:'ゲームを選ぼう',games_sub:'最小デポジットと実際の報酬付き限定モード',
    features_title:'なぜUNO!™をプレイ？',features_sub:'何百万人もが知っています。あなたの番です。',
    shop_title:'UniCoinsショップ',shop_sub:'UniCoinsを購入してゲームやトーナメントで使用',
    min_deposit:'最低デポジット',btn_join:'プレイ',
    cta_title:'プレイの準備はできた？',cta_sub:'無料アカウントを作成して今すぐアリーナに参加！',
    signup_free:'無料アカウント作成',deposit_pix:'今すぐデポジット'
  },
  'zh-CN':{name:'中文',flag:'🇨🇳',
    home:'首页',news:'新闻',play:'游戏',shop:'商店',support:'支持',more:'更多',
    hero_badge:'🃏 全球#1纸牌游戏',
    hero_sub:'与全球数百万玩家对战。<br>立即存款开始竞技！',
    btn_play:'免费游戏',btn_deposit:'💰 充值',
    stats_players:'玩家',stats_rating:'评分',stats_rank:'纸牌游戏',
    games_title:'选择你的游戏',games_sub:'独家模式，最低存款，真实奖励',
    features_title:'为什么玩UNO!™？',features_sub:'数百万人已经知道了。现在轮到你了。',
    shop_title:'UniCoins商店',shop_sub:'购买UniCoins用于游戏和高级锦标赛',
    min_deposit:'最低存款',btn_join:'游戏',
    cta_title:'准备好游戏了吗？',cta_sub:'创建免费账户，存款，进入竞技场！',
    signup_free:'免费创建账户',deposit_pix:'立即存款'
  }
};

const CURRENCIES = {
  'BRL':{symbol:'R$',name:'Real Brasileiro',flag:'🇧🇷',rate:1},
  'USD':{symbol:'$',name:'US Dollar',flag:'🇺🇸',rate:0.18},
  'EUR':{symbol:'€',name:'Euro',flag:'🇪🇺',rate:0.17},
  'GBP':{symbol:'£',name:'British Pound',flag:'🇬🇧',rate:0.145},
  'JPY':{symbol:'¥',name:'Japanese Yen',flag:'🇯🇵',rate:27.5},
  'MXN':{symbol:'MX$',name:'Peso Mexicano',flag:'🇲🇽',rate:3.1},
  'ARS':{symbol:'AR$',name:'Peso Argentino',flag:'🇦🇷',rate:175},
  'CLP':{symbol:'CL$',name:'Peso Chileno',flag:'🇨🇱',rate:165},
  'COP':{symbol:'COP',name:'Peso Colombiano',flag:'🇨🇴',rate:720},
  'CAD':{symbol:'CA$',name:'Canadian Dollar',flag:'🇨🇦',rate:0.24},
  'AUD':{symbol:'A$',name:'Australian Dollar',flag:'🇦🇺',rate:0.28}
};

function getCurrentLang(){return localStorage.getItem('unoLang')||'pt-BR'}
function getCurrentCurrency(){return localStorage.getItem('unoCurrency')||'BRL'}

function applyLangPrefs(){
  const lang=getCurrentLang();
  const t=LANGS[lang]||LANGS['pt-BR'];
  // Nav links text
  const navMap={'nav-home':t.home,'nav-news':t.news,'nav-play':t.play,'nav-shop':t.shop,'nav-support':t.support,'nav-more':t.more};
  Object.entries(navMap).forEach(([id,txt])=>{const el=document.getElementById(id);if(el)el.textContent=txt});
  // Hero
  const hb=document.getElementById('heroBadge');if(hb)hb.textContent=t.hero_badge;
  const hs=document.getElementById('heroSub');if(hs)hs.innerHTML=t.hero_sub;
  const hbp=document.getElementById('btnPlay');if(hbp)hbp.textContent=t.btn_play;
  const hbd=document.getElementById('btnDeposit');if(hbd)hbd.textContent=t.btn_deposit;
  document.querySelectorAll('[data-stat-players]').forEach(e=>e.textContent=t.stats_players);
  document.querySelectorAll('[data-stat-rating]').forEach(e=>e.textContent=t.stats_rating);
  document.querySelectorAll('[data-stat-rank]').forEach(e=>e.textContent=t.stats_rank);
  const gt=document.getElementById('gamesTitle');if(gt)gt.textContent=t.games_title;
  const gs=document.getElementById('gamesSub');if(gs)gs.textContent=t.games_sub;
  const ft=document.getElementById('featTitle');if(ft)ft.textContent=t.features_title;
  const fs=document.getElementById('featSub');if(fs)fs.textContent=t.features_sub;
  const st=document.getElementById('shopTitle');if(st)st.textContent=t.shop_title;
  const ss=document.getElementById('shopSub');if(ss)ss.textContent=t.shop_sub;
  const ct=document.getElementById('ctaTitle');if(ct)ct.textContent=t.cta_title;
  const cs=document.getElementById('ctaSub');if(cs)cs.textContent=t.cta_sub;
  document.querySelectorAll('.game-min-label').forEach(e=>e.textContent=t.min_deposit);
  document.querySelectorAll('.btn-play').forEach(e=>e.textContent=t.btn_join);
  const sf=document.getElementById('btnSignupFree');if(sf)sf.textContent=t.signup_free;
  const dp=document.getElementById('btnDepositPix');if(dp)dp.textContent=t.deposit_pix;
  // Lang selector
  const ls=document.getElementById('langSelect');if(ls)ls.value=lang;
  const cs2=document.getElementById('currencySelect');if(cs2)cs2.value=getCurrentCurrency();
  applyCurrency();
}

function applyCurrency(){
  const code=getCurrentCurrency();
  const c=CURRENCIES[code]||CURRENCIES['BRL'];
  document.querySelectorAll('.price-brl').forEach(el=>{
    const brl=parseFloat(el.dataset.brl||0);
    const conv=brl*c.rate;
    el.textContent=c.symbol+' '+(conv<100?conv.toFixed(2):Math.round(conv).toLocaleString());
  });
  document.querySelectorAll('.currency-symbol').forEach(el=>el.textContent=c.symbol);
  document.querySelectorAll('.currency-name').forEach(el=>el.textContent=c.name);
  const cd=document.getElementById('currencyDisplay');
  if(cd)cd.textContent=c.flag+' '+c.symbol+' — '+c.name;
}

function changeLang(v){
  localStorage.setItem('unoLang',v);
  applyLangPrefs();
}
function changeCurrency(v){
  localStorage.setItem('unoCurrency',v);
  applyCurrency();
  const cd=document.getElementById('currencyDisplay');
  const c=CURRENCIES[v]||CURRENCIES['BRL'];
  if(cd)cd.textContent=c.flag+' '+c.symbol+' — '+c.name;
}

// AUTH
function getUser(){try{return JSON.parse(localStorage.getItem('unoUser'))||null}catch{return null}}
function saveUser(u){localStorage.setItem('unoUser',JSON.stringify(u))}
function logout(){localStorage.removeItem('unoUser');window.location.href='../index.html'}
function logoutHome(){localStorage.removeItem('unoUser');window.location.href='index.html'}

function updateNavAuth(){
  const user=getUser();
  const el=document.getElementById('navAuthBtns');
  const balEl=document.getElementById('navBalance');
  if(!el)return;
  // Detect if we're inside /pages/ so links resolve correctly
  const inPages = /\/pages\//.test(window.location.pathname);
  const prefix = inPages ? '' : 'pages/';
  const logoutFn = inPages ? 'logout()' : 'logoutHome()';
  if(user){
    // Click on the user's name goes to PROFILE (not dashboard)
    el.innerHTML=`<a href="${prefix}profile.html" class="btn-ln" title="Ir para o perfil">👤 ${user.name.split(' ')[0]}</a><button onclick="${logoutFn}" class="btn-rn">Sair</button>`;
    if(balEl){
      const c=CURRENCIES[getCurrentCurrency()]||CURRENCIES['BRL'];
      const bal=parseFloat(user.balance||0)*c.rate;
      balEl.textContent='💰 '+c.symbol+' '+(bal<100?bal.toFixed(2):Math.round(bal).toLocaleString());
      balEl.classList.add('show');
    }
  }else{
    el.innerHTML=`<a href="${prefix}login.html" class="btn-ln">ENTRAR</a><a href="${prefix}register.html" class="btn-rn">CADASTRAR</a>`;
    if(balEl)balEl.classList.remove('show');
  }
}

// GALLERY TABS
function switchTab(tab){
  document.querySelectorAll('.gtab2').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.gal-content').forEach(c=>c.classList.add('hidden'));
  event.target.classList.add('active');
  document.getElementById(tab+'Tab')?.classList.remove('hidden');
}

// GAME TABS
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
  document.querySelectorAll('.news-item').forEach(i=>i.classList.toggle('hidden',type!=='all'&&i.dataset.type!==type));
}

// FAQ
function toggleFaq(el){el.closest('.faq-item').classList.toggle('open')}

// VIDEO
function playVideo(el,title){
  el.querySelector('.vid-thumb').innerHTML=`<div style="padding:16px;text-align:center;color:#fff"><p style="font-weight:700">▶ ${title}</p><p style="font-size:.76rem;opacity:.4;margin-top:6px">Disponível no app</p></div>`;
}

// PAGINATION
function goToPage(n){
  document.querySelectorAll('.page-btn').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
}

// REDIRECT TO DEPOSIT ON PLAY
function playGame(gameName){
  const user=getUser();
  if(!user){window.location.href='pages/login.html';return}
  sessionStorage.setItem('selectedGame',gameName);
  window.location.href='pages/deposit.html';
}

// BUY COINS MODAL
function buyCoins(pkg){
  const user=getUser();
  if(!user){window.location.href='pages/login.html';return}
  const modal=document.getElementById('buyCoinModal');
  if(modal){
    const c=CURRENCIES[getCurrentCurrency()]||CURRENCIES['BRL'];
    const conv=(parseFloat(pkg.price)*c.rate);
    const priceStr=c.symbol+' '+(conv<100?conv.toFixed(2):Math.round(conv).toLocaleString());
    document.getElementById('bcPkgName').textContent=pkg.label||pkg.coins+' UniCoins';
    document.getElementById('bcPkgPrice').textContent=priceStr;
    document.getElementById('bcPkgBonus').textContent=pkg.bonus||'';
    modal.style.display='flex';
    modal.dataset.pkg=JSON.stringify(pkg);
  }
}
function closeBuyModal(){document.getElementById('buyCoinModal').style.display='none'}
function confirmBuyCoins(){
  const pkg=JSON.parse(document.getElementById('buyCoinModal').dataset.pkg||'{}');
  if(pkg.price){sessionStorage.setItem('depositAmount',pkg.price);closeBuyModal();window.location.href='pages/deposit.html'}
}
