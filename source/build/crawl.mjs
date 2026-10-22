import w from '../../src/index.js';
globalThis.caches = { default: { match: async () => null, put: async () => {} } };
const env = { AI: { run: async (m, i) => ({ response: 'Score: 72/100\nTop 3 fixes:\n- Add numbers\n- Cut photo\n- Tailor profile' }) } };
const get = (p, o = {}) => w.fetch(new Request('https://blackpool.gay' + p, o), env, { waitUntil() {} });
const sm = await (await get('/sitemap.xml')).text(); const urls = [...sm.matchAll(/<loc>https:\/\/blackpool\.gay([^<]+)<\/loc>/g)].map(m => m[1]);
let bad = 0, badLD = 0; const titles = {}, links = new Set(); const t0 = Date.now();
for (const u of urls) {
  const r = await get(u); const h = await r.text();
  if (r.status !== 200) { bad++; console.log('STATUS', r.status, u); }
  const t = (h.match(/<title>(.*?)<\/title>/) || [])[1]; (titles[t] = titles[t] || []).push(u);
  if ((h.match(/<h1/g) || []).length !== 1) console.log('H1 count', u);
  if (!h.includes(`<link rel="canonical" href="https://blackpool.gay${u}">`)) console.log('canonical', u);
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) try { JSON.parse(m[1]) } catch (e) { badLD++; console.log('LD', u) }
  for (const m of h.matchAll(/href="(\/[^"#]*)/g)) links.add(m[1]);
  if (!r.headers.get('content-security-policy').includes('sha256')) console.log('csp', u);
  if (/lorem ipsum/i.test(h.replace(/<script[\s\S]*?<\/script>/g, ''))) console.log('WORDING', u, (h.replace(/<script[\s\S]*?<\/script>/g,'').match(/.{0,50}(\bAI\b|artificial intelligence|\bconcept\b).{0,40}/i)||[])[0]);
}
for (const l of links) { const r = await get(l); if (r.status !== 200) { bad++; console.log('LINK', r.status, l); } }
const dup = Object.entries(titles).filter(([, v]) => v.length > 1);
console.log('urls', urls.length, 'links', links.size, 'bad', bad, 'badLD', badLD, 'dupTitles', dup.length, 'ms', Date.now() - t0);
for (const [p, exp] of [['/about.html', '/about/'], ['/index.html', '/'], ['/About/', '/about/'], ['//tools//', '/tools/'], ['/tools', '/tools/']]) { const r = await get(p); console.log('redirect', p, r.status, r.headers.get('location')); }
let r = await w.fetch(new Request('http://www.acing.co.uk/guides/'), env, {}); console.log('www/http', r.status, r.headers.get('location'));
r = await get('/nope/'); console.log('404', r.status, r.headers.get('x-robots-tag'));
r = await get('/', { method: 'POST' }); console.log('POST /', r.status);
r = await get('/api/forum/x', { method: 'POST', body: JSON.stringify({ cv: 'John Smith CV text' }), headers: { Origin: 'https://blackpool.gay' } }); console.log('tool', r.status, (await r.text()).slice(0, 80));
r = await get('/api/forum/x', { method: 'POST', body: JSON.stringify({}) }); console.log('tool empty', r.status, await r.text());
for (const p of ['/robots.txt', '/llms.txt', '/favicon.ico', '/assets/og.png', '/BingSiteAuth.xml', '/manifest.webmanifest']) { r = await get(p); console.log(p, r.status, r.headers.get('content-type')); }
