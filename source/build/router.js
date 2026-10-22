// ============================================================================ runtime (hand-written; build.py prepends data)
const B64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const HDR = { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN', 'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()', 'Cross-Origin-Opener-Policy': 'same-origin' };
const PAGE_SET = new Set(URLS);
const redirect = to => new Response(null, { status: 301, headers: { Location: to, 'Cache-Control': 'public, max-age=86400', ...HDR } });
const page = (p, st = 200) => new Response(st === 404 ? NOTFOUND : PAGES[p], { status: st, headers: { 'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': st === 404 ? 'public, max-age=300' : 'public, max-age=3600', 'Content-Security-Policy': CSP[st === 404 ? '/404/' : p], ...(st === 404 ? { 'X-Robots-Tag': 'noindex' } : {}), ...HDR } });
const notFound = () => page(null, 404);
const text = (b, ct, cc = 'public, max-age=3600') => new Response(b, { headers: { 'Content-Type': ct, 'Cache-Control': cc, ...HDR } });
const J = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', ...HDR } });

// ---------------------------------------------------------------- forum: posts are held for approval (status "pending" in KV); only "approved" posts are shown
const RL = new Map();
const limited = ip => { const n = Date.now(), a = (RL.get(ip) || []).filter(t => n - t < 3600e3); if (a.length >= 5) return true; a.push(n); RL.set(ip, a); return false; };
async function forum(request, env, p) {
  const kv = env && env.FORUM; if (!kv) return J({ error: 'The forum is being set up. Please try again soon.' }, 503);
  const topic = p.split('/')[3]; if (!FORUM_TOPICS.includes(topic)) return J({ error: 'Unknown topic.' }, 404);
  if (request.method === 'GET') {
    const raw = await kv.get('approved:' + topic); return J({ posts: raw ? JSON.parse(raw) : [] });
  }
  if (request.method !== 'POST') return J({ error: 'Method not allowed.' }, 405);
  const o = request.headers.get('Origin'); if (o && o !== SITE) return J({ error: 'Not allowed.' }, 403);
  if (limited(request.headers.get('CF-Connecting-IP') || 'x')) return J({ error: 'You have posted a few times recently. Please try again later.' }, 429);
  let d; try { d = await request.json(); } catch (e) { return J({ error: 'Bad request.' }, 400); }
  const name = String(d.name || '').trim().slice(0, 40), body = String(d.body || '').trim().slice(0, 1500);
  if (!name || body.length < 5) return J({ error: 'Please add your name and a message.' }, 400);
  if (d.website) return J({ ok: true }); // honeypot
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  await kv.put(`pending:${topic}:${id}`, JSON.stringify({ id, topic, name, body, at: new Date().toISOString(), status: 'pending' }), { expirationTtl: 60 * 60 * 24 * 60 });
  return J({ ok: true, message: 'Thanks! Your post will appear once a moderator approves it.' });
}

async function pingIndexNow() {
  if (Date.now() - Date.parse(BUILT) > 3 * 864e5) return;
  const c = caches.default, k = new Request(SITE + '/__indexnow-sent?v=' + BUILT);
  if (await c.match(k)) return;
  const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: 'blackpool.gay', key: INDEXNOW, keyLocation: `${SITE}/${INDEXNOW}.txt`, urlList: URLS.map(u => SITE + u) }) }).catch(() => null);
  if (r && (r.status === 200 || r.status === 202)) await c.put(k, new Response('1', { headers: { 'Cache-Control': 'max-age=604800' } }));
}

// old one-page site paths -> new pages
const LEGACY = { '/index.html': '/', '/about.html': '/about/', '/whats-on.html': '/whats-on/', '/visit.html': '/stays/', '/pride.html': '/pride/' };
async function route(request, env) {
  const url = new URL(request.url);
  if (url.protocol === 'http:' || url.hostname.startsWith('www.') || (url.hostname.endsWith('.workers.dev') && !url.pathname.startsWith('/api/'))) return redirect(SITE + url.pathname + url.search);
  let p; try { p = decodeURIComponent(url.pathname); } catch (e) { return notFound(); }
  if (/[\x00-\x1f\x7f\\]/.test(p) || p.length > 300 || /\/\./.test(p)) return notFound();
  if (p.includes('//')) return redirect(p.replace(/\/{2,}/g, '/') + url.search);
  if (LEGACY[p.toLowerCase()]) return redirect(LEGACY[p.toLowerCase()]);
  if (/[A-Z]/.test(p) && p !== '/BingSiteAuth.xml') return redirect(encodeURI(p.toLowerCase()) + url.search);
  if (p.startsWith('/api/forum/')) return forum(request, env, p);
  switch (p) {
    case '/robots.txt': return text(ROBOTS, 'text/plain; charset=utf-8');
    case '/sitemap.xml': return text(SITEMAP, 'application/xml; charset=utf-8');
    case '/llms.txt': return text(LLMS, 'text/plain; charset=utf-8');
    case '/manifest.webmanifest': return text(JSON.stringify({ name: 'Blackpool.gay', short_name: 'Blackpool.gay', start_url: '/', display: 'standalone', background_color: '#fbf7ff', theme_color: '#750787', icons: [{ src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }] }), 'application/manifest+json');
    case '/BingSiteAuth.xml': return text('<?xml version="1.0"?>\n<users>\n\t<user>B9082B849763ABEE529E1CF4AF93D5E9</user>\n</users>', 'application/xml; charset=utf-8');
    case '/google10c1e17cde9e9c5e.html': return text('google-site-verification: google10c1e17cde9e9c5e.html', 'text/html; charset=utf-8');
    case `/${INDEXNOW}.txt`: return text(INDEXNOW, 'text/plain; charset=utf-8');
    case '/favicon.ico': case '/apple-touch-icon.png': case '/apple-touch-icon-precomposed.png': return new Response(B64(BIN['/apple-touch-icon.png']), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800', ...HDR } });
    case '/og.png': return new Response(B64(BIN['/og.png']), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800', ...HDR } });
  }
  if (ASSETS[p]) return text(ASSETS[p], p.endsWith('.svg') ? 'image/svg+xml' : p.endsWith('.json') ? 'application/json; charset=utf-8' : 'application/javascript; charset=utf-8', url.searchParams.has('v') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
  if (PAGE_SET.has(p)) return page(p);
  if (!p.endsWith('/') && !/\.[a-z0-9]{1,5}$/.test(p) && PAGE_SET.has(p + '/')) return redirect(p + '/' + url.search);
  return notFound();
}
export default {
  async fetch(request, env, ctx) {
    try {
      const u = new URL(request.url), api = u.pathname.startsWith('/api/');
      if (!['GET', 'HEAD'].includes(request.method) && !(api && request.method === 'POST')) return new Response(null, { status: request.method === 'OPTIONS' ? 204 : 405, headers: { Allow: api ? 'GET, HEAD, POST' : 'GET, HEAD', ...HDR } });
      const r = await route(request, env);
      return request.method === 'HEAD' ? new Response(null, r) : r;
    } catch (e) { console.error(e && e.stack || e); return new Response('Sorry, something went wrong.', { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...HDR } }); }
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(pingIndexNow()); }
};
