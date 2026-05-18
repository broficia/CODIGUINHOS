// =============================================
// CLOUDFLARE WORKER — PROXY EXPFY PAY
// Deploy GRATUITO: https://workers.cloudflare.com
// =============================================
// 1. Acesse https://workers.cloudflare.com
// 2. Crie conta grátis → "Create a Service"
// 3. Cole este código → "Save and Deploy"
// 4. Copie a URL (ex: https://uno-pix.SEU-USER.workers.dev)
// 5. Atualize WORKER_URL no arquivo js/pix.js
// =============================================

const EXPFY_PUBLIC_KEY = 'pk_fae7f1ca7b815e76647903e34dbb3c957ffd7c56dcab4f4d';
const EXPFY_SECRET_KEY = 'sk_044b5000df776aeaab64f911dca163a2e012ea62945472bd3e606631d8f51c8b';
const EXPFY_BASE       = 'https://pro.expfypay.com/api/v1';
const CORS = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Methods':'POST,GET,OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type',
};

addEventListener('fetch', e => e.respondWith(handle(e.request)));

async function handle(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  const path = new URL(req.url).pathname;
  try {
    if (path === '/create-payment' && req.method === 'POST') {
      const b = await req.json();
      const res = await fetch(EXPFY_BASE + '/payments', {
        method: 'POST',
        headers: { 'Content-Type':'application/json','X-Public-Key':EXPFY_PUBLIC_KEY,'X-Secret-Key':EXPFY_SECRET_KEY },
        body: JSON.stringify({
          amount: parseFloat(b.amount),
          description: b.description || 'Depósito UNO!™',
          customer: { name: b.name||'Usuario', document: b.document||'00000000000', email: b.email||'user@email.com' },
          external_id: b.external_id || ('uno_'+Date.now()),
          callback_url: 'https://playuno.com.br/webhook'
        })
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: res.status, headers: { ...CORS, 'Content-Type':'application/json' } });
    }
    if (path === '/check-payment' && req.method === 'POST') {
      const b = await req.json();
      const res = await fetch(EXPFY_BASE + '/check-transaction', {
        method: 'POST',
        headers: { 'Content-Type':'application/json','X-Public-Key':EXPFY_PUBLIC_KEY,'X-Secret-Key':EXPFY_SECRET_KEY },
        body: JSON.stringify({ external_id: b.external_id })
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: res.status, headers: { ...CORS, 'Content-Type':'application/json' } });
    }
    return new Response(JSON.stringify({ error:'not found' }), { status:404, headers: CORS });
  } catch(err) {
    return new Response(JSON.stringify({ error: err.message }), { status:500, headers: CORS });
  }
}
