/* Blackpool.gay: drive the Rainbow Quarter in 3D.
   Streets, buildings, coast and North Pier: © OpenStreetMap contributors (ODbL).
   Venue positions: the same coordinates as the site map. Everything is drawn in code; no external assets.
   Facades are painted from a procedural atlas driven by OpenStreetMap tags. Photo facades are a TODO: this build machine could not reach
   Wikimedia Commons or Mapillary, so no photos are used. Candidates once they can be fetched and credited (CC BY / CC BY-SA, never Google):
   Commons/Geograph photos of Funny Girls (the former Odeon, Dickson Road), the Flying Handbag (Queen Street), Talbot Road and Dickson Road frontages. */
(function () {
  'use strict';
  const box = document.getElementById('xp');
  if (!box || !window.THREE) return;
  const T = window.THREE;
  const CFG = JSON.parse(document.getElementById('xpdata').textContent);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(pointer: coarse)').matches;
  const C0 = CFG.c, KY = 111320, KX = 111320 * Math.cos(C0[0] * Math.PI / 180);
  const proj = p => ({ x: Math.round((p[1] - C0[1]) * KX), z: Math.round(-(p[0] - C0[0]) * KY) });
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const hash = (a, b) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ------------------------------------------------------------------ UI shell
  box.innerHTML = '';
  const ui = {
    start: el('div', 'xp-start', '<div class="xp-start-in"><div class="xp-arch" aria-hidden="true">' + Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}"></i>`).join('') + '</div><p class="xp-kicker">Blackpool.Gay in 3D</p><p class="xp-title">Drive the Rainbow Quarter</p><p class="xp-sub">Real streets, the Tower, North Pier and every gay hotel, bar and club, in a pink soft-top with Jay and Theo.</p><button type="button" class="xp-go" disabled aria-describedby="xpcap"><span>START</span></button><p class="xp-cap" id="xpcap">Loading Blackpool…</p><p class="xp-keys">' + (touch ? 'Drag the pad to drive. Tap a building or the map to go there.' : 'Arrow keys or WASD to drive, Shift for a boost. Click anywhere to drive there.') + '</p></div>'),
    hud: el('div', 'xp-hud'),
    card: el('div', 'xp-card'),
    toast: el('div', 'xp-toast'),
    mini: el('canvas', 'xp-mini'),
    speed: el('div', 'xp-speed', '<svg viewBox="0 0 132 78" aria-hidden="true"><defs><linearGradient id="xpg" x1="0" x2="1"><stop offset="0" stop-color="#0fb5ae"/><stop offset=".55" stop-color="#ffc93c"/><stop offset="1" stop-color="#ff2e88"/></linearGradient></defs><path d="M12 70 A54 54 0 0 1 120 70" fill="none" stroke="rgba(255,246,236,.14)" stroke-width="9" stroke-linecap="round"/><path d="M12 70 A54 54 0 0 1 120 70" fill="none" stroke="url(#xpg)" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 6"/><g class="xp-needle"><path d="M66 70 L66 24" stroke="#fff6ec" stroke-width="3" stroke-linecap="round"/><circle cx="66" cy="70" r="6" fill="#ff2e88"/></g></svg><b>0</b><span>mph</span><i class="xp-road" style="display:block;margin-top:6px;font:700 11px/1.25 Inter,system-ui,sans-serif;font-style:normal;color:#fff6ec;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></i>'),
    pad: el('div', 'xp-pad', '<i></i>')
  };
  ui.hud.innerHTML = '<label class="xp-sel"><span>Drive to</span><select aria-label="Drive to a venue"><option value="">Choose a place…</option></select></label>'
    + '<button type="button" class="xp-b" data-a="night" aria-pressed="false"><i class="xp-bulb" aria-hidden="true"></i><span>Illuminations</span></button>'
    + '<button type="button" class="xp-b" data-a="full">Full screen</button>';
  ui.card.hidden = true; ui.toast.hidden = true; ui.toast.setAttribute('role', 'status');
  if (!box.requestFullscreen && !box.webkitRequestFullscreen) ui.hud.querySelector('[data-a=full]').hidden = true; ui.mini.width = ui.mini.height = 340;
  ui.mini.setAttribute('aria-label', 'Mini map. Click to drive there.');
  if (!touch) ui.pad.hidden = true;
  Object.values(ui).forEach(n => box.appendChild(n));
  const goBtn = ui.start.querySelector('.xp-go'), goCap = ui.start.querySelector('.xp-cap'), needle = ui.speed.querySelector('.xp-needle');

  // ------------------------------------------------------------------ renderer
  const R = new T.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  let dpr = Math.min(devicePixelRatio || 1, 2);
  R.setPixelRatio(dpr);
  R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
  R.domElement.className = 'xp-gl'; R.domElement.tabIndex = 0;
  R.domElement.setAttribute('aria-label', '3D map of the Rainbow Quarter');
  box.insertBefore(R.domElement, box.firstChild);
  const S = new T.Scene();
  const cam = new T.PerspectiveCamera(42, 1, 0.5, 4000);
  // quality tiers: 2 = bloom + shadows + sharp, 1 = shadows, 0 = light (software rendering / weak devices)
  const GPU = (() => { try { const gl = R.getContext(), d = gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : ''; } catch (e) { return ''; } })();
  const SOFT = /swiftshader|basic render|llvmpipe|softpipe|software/i.test(GPU);
  let tier = 2, usePost = false, warned = false, good = 0; const LITE_DPR = +(new URLSearchParams(location.search).get('dpr') || .75);

  // ------------------------------------------------------------------ post-processing: HDR, MSAA, bloom, ACES, vignette, grain
  const post = (function () {
    if (!R.capabilities.isWebGL2 || !(R.extensions.has('EXT_color_buffer_float') || R.extensions.has('EXT_color_buffer_half_float'))) { R.toneMapping = T.ACESFilmicToneMapping; return null; }
    R.toneMapping = T.NoToneMapping;
    const ht = { type: T.HalfFloatType, depthBuffer: false };
    const main = new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: 4 });
    const L = []; for (let i = 0; i < 5; i++) L.push([new T.WebGLRenderTarget(1, 1, ht), new T.WebGLRenderTarget(1, 1, ht)]);
    const qc = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), qs = new T.Scene(), quad = new T.Mesh(new T.PlaneGeometry(2, 2)); quad.frustumCulled = false; qs.add(quad);
    const V = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    const M = (u, f) => new T.ShaderMaterial({ uniforms: u, vertexShader: V, fragmentShader: f, depthTest: false, depthWrite: false });
    const bright = M({ tex: { value: null }, th: { value: 1 } }, 'uniform sampler2D tex; uniform float th; varying vec2 vUv; void main(){ vec3 c = texture2D(tex, vUv).rgb; float l = max(c.r, max(c.g, c.b)); float k = smoothstep(th * 0.55, th * 1.4, l); gl_FragColor = vec4(c * k, 1.0); }');
    const blur = M({ tex: { value: null }, dir: { value: new T.Vector2() } }, 'uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv; void main(){ vec3 c = texture2D(tex, vUv).rgb * 0.227; c += (texture2D(tex, vUv + dir * 1.384).rgb + texture2D(tex, vUv - dir * 1.384).rgb) * 0.316; c += (texture2D(tex, vUv + dir * 3.230).rgb + texture2D(tex, vUv - dir * 3.230).rgb) * 0.070; gl_FragColor = vec4(c, 1.0); }');
    const comp = M({ tex: { value: null }, b0: { value: null }, b1: { value: null }, b2: { value: null }, b3: { value: null }, b4: { value: null }, strength: { value: .6 }, exposure: { value: 1 }, time: { value: 0 }, res: { value: new T.Vector2() }, lift: { value: new T.Color('#1a0f2e') } },
      'uniform sampler2D tex, b0, b1, b2, b3, b4; uniform float strength, exposure, time; uniform vec2 res; uniform vec3 lift; varying vec2 vUv;'
      + 'vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }'
      + 'vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }'
      + 'void main(){ vec2 d = vUv - 0.5; float r = dot(d, d);'
      + ' vec3 c = vec3(texture2D(tex, vUv - d * r * 0.005).r, texture2D(tex, vUv).g, texture2D(tex, vUv + d * r * 0.005).b);'
      + ' vec3 b = texture2D(b0, vUv).rgb * 1.0 + texture2D(b1, vUv).rgb * 0.9 + texture2D(b2, vUv).rgb * 0.8 + texture2D(b3, vUv).rgb * 0.7 + texture2D(b4, vUv).rgb * 0.6;'
      + ' c += b * strength; c = aces(c * exposure); c = c + lift * (1.0 - c) * 0.18; float L = dot(c, vec3(0.2126, 0.7152, 0.0722)); c = mix(vec3(L), c, 1.12); c = srgb(c);'
      + ' c *= 1.0 - smoothstep(0.18, 0.62, r) * 0.38;'
      + ' float g = fract(sin(dot(vUv * res + fract(time) * 91.7, vec2(12.9898, 78.233))) * 43758.5453); c += (g - 0.5) * 0.022;'
      + ' gl_FragColor = vec4(c, 1.0); }');
    function size(w, h) { main.setSize(w, h); let lw = w >> 1, lh = h >> 1; for (const l of L) { l[0].setSize(Math.max(1, lw), Math.max(1, lh)); l[1].setSize(Math.max(1, lw), Math.max(1, lh)); lw >>= 1; lh >>= 1; } comp.uniforms.res.value.set(w, h); }
    function pass(mat, target) { quad.material = mat; R.setRenderTarget(target); R.render(qs, qc); }
    function render(scene, camera, time) {
      R.setRenderTarget(main); R.render(scene, camera);
      bright.uniforms.tex.value = main.texture; pass(bright, L[0][0]);
      for (let i = 0; i < L.length; i++) {
        const src = i ? L[i - 1][0] : L[0][0], a = L[i][0], b = L[i][1];
        blur.uniforms.tex.value = src.texture; blur.uniforms.dir.value.set(1 / b.width, 0); pass(blur, b);
        blur.uniforms.tex.value = b.texture; blur.uniforms.dir.value.set(0, 1 / a.height); pass(blur, a);
      }
      const u = comp.uniforms; u.tex.value = main.texture; for (let i = 0; i < 5; i++) u['b' + i].value = L[i][0].texture; u.time.value = time;
      pass(comp, null);
    }
    return { size, render, comp, bright };
  })();

  // ------------------------------------------------------------------ sky, clouds, fog, lights (two moods: sunset and Illuminations night)
  const MOODS = {
    sunset: { top: '#2b3f8f', mid: '#c96a9a', hor: '#ffb07a', fog: '#e9ab92', hs: '#d6dcff', hg: '#8a7560', hi: 1.35, sun: '#ffc999', si: 2.6, exp: 1.12, bulbs: 1.2, bloom: .5, th: 2.4, sea1: '#3a4aa8', sea2: '#f19c79', cloud: '#ffc2c8', win: .15 },
    night: { top: '#05041a', mid: '#160f45', hor: '#4a2672', fog: '#22183f', hs: '#6f6cc8', hg: '#2a1f30', hi: .75, sun: '#9fb2ff', si: .55, exp: 1.25, bulbs: 4.2, bloom: .85, th: 1.25, sea1: '#0a0f38', sea2: '#5b3590', cloud: '#3a2a66', win: 1 }
  };
  const mood = { t: 0, target: 0 };
  const NIGHT = { value: 0 };
  const skyU = { top: { value: new T.Color() }, mid: { value: new T.Color() }, hor: { value: new T.Color() }, sunDir: { value: new T.Vector3(-0.86, 0.11, 0.3).normalize() }, sunC: { value: new T.Color() }, night: NIGHT };
  const sky = new T.Mesh(new T.SphereGeometry(3000, 32, 16), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top, mid, hor, sunDir, sunC; uniform float night; varying vec3 vP;'
      + 'float h21(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }'
      + 'void main(){ vec3 p = normalize(vP); float h = p.y; vec3 c = h > 0.0 ? mix(mix(hor, mid, smoothstep(0.0, 0.2, h)), top, smoothstep(0.16, 0.75, h)) : hor;'
      + ' float s = max(dot(p, sunDir), 0.0); c += sunC * (pow(s, 900.0) * 6.0 + pow(s, 14.0) * 0.45 + pow(s, 3.0) * 0.08) * (1.0 - night * 0.85);'
      + ' vec2 g = floor(vec2(atan(p.z, p.x) * 220.0, h * 260.0)); float st = step(0.9965, h21(g)) * smoothstep(0.08, 0.4, h) * night; c += vec3(st) * 2.2;'
      + ' gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
  }));
  sky.renderOrder = -2; S.add(sky);
  const cloudTex = canvasTex(256, 128, (x, w, h) => { for (let i = 0; i < 22; i++) { const cx = 40 + Math.random() * 176, cy = 64 + (Math.random() - .5) * 40, r = 18 + Math.random() * 30, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } });
  const clouds = []; for (let i = 0; i < 16; i++) { const m = new T.Sprite(new T.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false, opacity: .85 })); const a = i / 16 * Math.PI * 2 + Math.random() * .3, r = 1100 + Math.random() * 700; m.position.set(Math.cos(a) * r, 180 + Math.random() * 260, Math.sin(a) * r); m.scale.set(520 + Math.random() * 380, 150 + Math.random() * 80, 1); m.renderOrder = -1; S.add(m); clouds.push({ m, a, r }); }
  S.fog = new T.Fog('#d98aa0', 450, 2600);
  const hemi = new T.HemisphereLight('#cdb9ff', '#56405a', 1.1); S.add(hemi);
  const sun = new T.DirectionalLight('#ffbf86', 3);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.5; sun.shadow.radius = 3;
  Object.assign(sun.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, near: 10, far: 900 });
  S.add(sun); S.add(sun.target);

  // ------------------------------------------------------------------ geometry helpers (merged, vertex-coloured)
  // every vertex also carries an atlas tile (-1 = plain colour) and a tile-space uv, so one material textures a whole merged mesh
  const UV0 = [[0, 0], [0, 0], [0, 0]];
  function Builder() { this.p = []; this.n = []; this.c = []; this.uv = []; this.t = []; }
  Builder.prototype.tri = function (a, b, c, col, want, uvs, tile) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    let cols = Array.isArray(col[0]) ? col : [col, col, col], U = uvs || UV0;
    if (want && nx * want[0] + ny * want[1] + nz * want[2] < 0) { const t = b; b = c; c = t; nx = -nx; ny = -ny; nz = -nz; cols = [cols[0], cols[2], cols[1]]; U = [U[0], U[2], U[1]]; }
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; const ti = tile == null ? -1 : tile;
    [a, b, c].forEach((v, k) => { this.p.push(v[0], v[1], v[2]); this.n.push(nx, ny, nz); this.c.push(cols[k][0], cols[k][1], cols[k][2]); this.uv.push(U[k][0], U[k][1]); this.t.push(ti); });
  };
  Builder.prototype.mesh = function (mat) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(this.c, 3));
    g.setAttribute('auv', new T.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('atile', new T.Float32BufferAttribute(this.t, 1));
    g.computeBoundingSphere();
    return new T.Mesh(g, mat);
  };
  // split a merged mesh into 320 m squares so three.js can skip the ones off screen (big win on software rendering)
  Builder.prototype.chunks = function (mat, o) {
    const parts = new Map(), CH = 320, P = this.p;
    for (let i = 0; i < P.length; i += 9) { const k = Math.floor((P[i] + P[i + 3] + P[i + 6]) / 3 / CH) + ',' + Math.floor((P[i + 2] + P[i + 5] + P[i + 8]) / 3 / CH); let L = parts.get(k); if (!L) parts.set(k, L = []); L.push(i / 9); }
    for (const L of parts.values()) {
      const b = new Builder();
      for (const t of L) { b.p.push(...this.p.slice(t * 9, t * 9 + 9)); b.n.push(...this.n.slice(t * 9, t * 9 + 9)); b.c.push(...this.c.slice(t * 9, t * 9 + 9)); b.uv.push(...this.uv.slice(t * 6, t * 6 + 6)); b.t.push(...this.t.slice(t * 3, t * 3 + 3)); }
      const m = b.mesh(mat); m.castShadow = !!(o && o.cast); m.receiveShadow = !!(o && o.receive); S.add(m);
    }
  };
  // textured quad: corners a b c d (counter-clockwise seen from `want`), uv per corner
  function quadT(B, a, b, c, d, col, uv, tile, want) {
    const cs = Array.isArray(col[0]) ? col : [col, col, col, col];
    B.tri(a, b, c, [cs[0], cs[1], cs[2]], want, [uv[0], uv[1], uv[2]], tile);
    B.tri(a, c, d, [cs[0], cs[2], cs[3]], want, [uv[0], uv[2], uv[3]], tile);
  }

  // ------------------------------------------------------------------ facade atlas: 4 x 4 tiles painted once in code, 256 px each
  // alpha encodes how a texel is used: 255 = wall (tinted by the building's own colour from OpenStreetMap), 128 = fixed colour (frames, sills, mortar), 0 = glass (lit at night)
  const TILE = { RENDER: 0, BRICK: 1, RENDER_G: 2, BRICK_G: 3, SHOP: 4, RENDER_PLAIN: 5, BRICK_PLAIN: 6, DOOR: 7, SLATE: 8, FLATROOF: 9, AWNING: 10, MODERN: 11, ASPHALT: 12, SLABS: 13, SETTS: 14, SAND: 15 };
  const ATLAS = (function () {
    const N = 1024, S = 256, cv = document.createElement('canvas'), mk = document.createElement('canvas'); cv.width = cv.height = mk.width = mk.height = N;
    const c = cv.getContext('2d'), m = mk.getContext('2d');
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const WALL = '#fff', FIX = 'rgb(128,128,128)', GLASS = '#000';
    const box = (x, y, w, h, col, mask) => { c.fillStyle = col; c.fillRect(x, y, w, h); m.fillStyle = mask; m.fillRect(x, y, w, h); };
    const render = (ox, oy, tone) => { box(ox, oy, S, S, tone || '#f4f1ec', WALL); for (let i = 0; i < 900; i++) { const v = 225 + rnd() * 30 | 0; c.fillStyle = `rgba(${v},${v},${v - 4},.35)`; c.fillRect(ox + rnd() * S, oy + rnd() * S, 1 + rnd() * 3, 1 + rnd() * 2); } };
    const bricks = (ox, oy, x0 = 0, y0 = 0, w = S, h = S) => {
      box(ox + x0, oy + y0, w, h, 'rgb(188,180,168)', FIX);
      for (let r = 0, y = y0; y < y0 + h; r++, y += 6) for (let x = x0 - (r % 2 ? 9 : 0); x < x0 + w; x += 18) {
        const v = 196 + rnd() * 59 | 0, xx = Math.max(x, x0), ww = Math.min(x + 17, x0 + w) - xx; if (ww <= 0) continue;
        box(ox + xx, oy + y, ww, Math.min(5, y0 + h - y), `rgb(${v},${v * .97 | 0},${v * .95 | 0})`, WALL);
      }
    };
    const glass = (x, y, w, h) => { const g = c.createLinearGradient(x, y, x + w * .6, y + h); g.addColorStop(0, '#8fa6c4'); g.addColorStop(.35, '#4b5d7c'); g.addColorStop(.36, '#3a4864'); g.addColorStop(1, '#262f45'); c.fillStyle = g; c.fillRect(x, y, w, h); m.fillStyle = GLASS; m.fillRect(x, y, w, h); };
    // a Victorian sash window: two sashes, glazing bars, curtains, stone or painted surround
    const sash = (ox, oy, x, y, w, h, brick) => {
      if (brick) box(ox + x - 4, oy + y - 4, w + 8, h + 8, '#5a4440', FIX); else box(ox + x - 9, oy + y - 9, w + 18, h + 18, '#fbf8f1', FIX);
      box(ox + x, oy + y, w, h, '#f7f5ef', FIX);
      const gx = ox + x + 6, gw = w - 12, top = oy + y + 6, mid = oy + y + h / 2;
      glass(gx, top, gw, mid - top - 3); glass(gx, mid + 3, gw, oy + y + h - 6 - mid - 3);
      box(gx + gw / 2 - 2, top, 4, mid - top, '#f7f5ef', FIX);
      const cur = ['#e9d3c0', '#d9c4de', '#f1e4c8', '#c9d8e6'][Math.floor(rnd() * 4)];
      c.fillStyle = cur; m.fillStyle = 'rgb(48,48,48)'; for (const [cx, cw] of [[gx, 13], [gx + gw - 13, 13]]) { c.fillRect(cx, top, cw, oy + y + h - 6 - top); m.fillRect(cx, top, cw, oy + y + h - 6 - top); }
      box(ox + x - 10, oy + y + h + (brick ? 4 : 9), w + 20, 9, '#e8e2d6', FIX);
      if (brick) { box(ox + x - 8, oy + y - 16, w + 16, 12, '#e6dccb', FIX); box(ox + x + w / 2 - 7, oy + y - 18, 14, 16, '#efe7d8', FIX); }
      else box(ox + x - 14, oy + y - 20, w + 28, 9, '#fbf8f1', FIX);
    };
    const T0 = i => [(i % 4) * S, Math.floor(i / 4) * S];
    let o;
    o = T0(TILE.RENDER); render(...o); sash(...o, 84, 50, 88, 150, false); box(o[0], o[1] + 250, S, 6, '#e9e4da', FIX);
    o = T0(TILE.BRICK); bricks(...o); sash(...o, 84, 56, 88, 146, true);
    o = T0(TILE.RENDER_G); render(...o); sash(...o, 70, 54, 116, 150, false); box(o[0], o[1] + 228, S, 28, '#8d8781', FIX);
    o = T0(TILE.BRICK_G); bricks(...o); sash(...o, 70, 58, 116, 146, true); box(o[0], o[1] + 232, S, 24, '#6f625c', FIX);
    // shopfront: fascia, display glass with goods and shelving, mullions, stall riser
    o = T0(TILE.SHOP); box(o[0], o[1], S, S, '#2a2140', FIX); box(o[0], o[1] + 40, S, 4, '#c8a24a', FIX);
    { const gx = o[0] + 10, gy = o[1] + 56, gw = S - 20, gh = 150, g = c.createLinearGradient(0, gy, 0, gy + gh); g.addColorStop(0, '#d9b98f'); g.addColorStop(1, '#6d5040'); c.fillStyle = g; c.fillRect(gx, gy, gw, gh); m.fillStyle = GLASS; m.fillRect(gx, gy, gw, gh);
      for (let k = 0; k < 3; k++) { c.fillStyle = 'rgba(60,40,40,.55)'; c.fillRect(gx, gy + 40 + k * 38, gw, 4); for (let j = 0; j < 9; j++) { c.fillStyle = `hsla(${rnd() * 360},55%,${50 + rnd() * 25}%,.8)`; c.fillRect(gx + 6 + j * 26 + rnd() * 6, gy + 18 + k * 38 + rnd() * 6, 12 + rnd() * 8, 20); } }
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(gx, gy + gh); c.lineTo(gx + 60, gy); c.lineTo(gx + 110, gy); c.lineTo(gx + 50, gy + gh); c.fill();
      for (const x of [0, S / 2 - 3, S - 10]) box(o[0] + x + (x ? 0 : 4), gy - 4, 6, gh + 8, '#1c1630', FIX);
      box(o[0], o[1] + 214, S, 42, '#3b3150', FIX); box(o[0] + 8, o[1] + 222, S - 16, 26, '#4a3e63', FIX); }
    o = T0(TILE.RENDER_PLAIN); render(...o); box(o[0], o[1] + 250, S, 6, '#e9e4da', FIX);
    o = T0(TILE.BRICK_PLAIN); bricks(...o);
    // guest-house front door: panelled door, fanlight, pilasters, step
    o = T0(TILE.DOOR); render(...o); box(o[0] + 72, o[1] + 22, 112, 234, '#fbf8f1', FIX); glass(o[0] + 86, o[1] + 34, 84, 34);
    box(o[0] + 86, o[1] + 72, 84, 160, ['#1f4f5a', '#5a1f3a', '#23305e', '#2f5a35'][Math.floor(rnd() * 4)], FIX);
    for (const [px, py] of [[94, 82], [132, 82], [94, 160], [132, 160]]) box(o[0] + px, o[1] + py, 30, 62, 'rgba(255,255,255,.08)', FIX);
    box(o[0] + 156, o[1] + 150, 6, 6, '#d8b55a', FIX); box(o[0] + 60, o[1] + 236, 136, 20, '#cfc8bb', FIX); box(o[0], o[1] + 236, 60, 20, '#8d8781', FIX); box(o[0] + 196, o[1] + 236, 60, 20, '#8d8781', FIX);
    // Welsh slate: staggered courses
    o = T0(TILE.SLATE); box(...o, S, S, '#9a96a0', WALL);
    for (let r = 0, y = 0; y < S; r++, y += 11) for (let x = -(r % 2) * 9; x < S; x += 18) { const v = 150 + rnd() * 70 | 0; box(o[0] + Math.max(0, x), o[1] + y, Math.min(17, S - Math.max(0, x)), 9, `rgb(${v},${v},${v + 8})`, WALL); }
    o = T0(TILE.FLATROOF); box(...o, S, S, '#b8b4ae', WALL); for (let i = 0; i < 2500; i++) { const v = 140 + rnd() * 110 | 0; c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(o[0] + rnd() * S, o[1] + rnd() * S, 2, 2); } box(o[0], o[1] + 126, S, 3, '#8a8580', WALL);
    o = T0(TILE.AWNING); for (let x = 0; x < S; x += 64) { box(o[0] + x, o[1], 32, S, '#ffffff', WALL); box(o[0] + x + 32, o[1], 32, S, '#fbf6ec', FIX); }
    for (let x = 0; x < S; x += 4) { c.fillStyle = 'rgba(0,0,0,.05)'; c.fillRect(o[0] + x, o[1], 1, S); }
    // modern commercial: ribbon glazing between panels
    o = T0(TILE.MODERN); box(...o, S, S, '#e8e6e2', WALL); glass(o[0], o[1] + 70, S, 120); for (let x = 0; x < S; x += 64) box(o[0] + x, o[1] + 70, 6, 120, '#3c3a44', FIX); box(o[0], o[1] + 66, S, 4, '#9a98a2', FIX); box(o[0], o[1] + 190, S, 4, '#9a98a2', FIX);
    o = T0(TILE.ASPHALT); box(...o, S, S, '#d4d4d8', WALL); for (let i = 0; i < 9000; i++) { const v = 150 + rnd() * 105 | 0; c.fillStyle = `rgb(${v},${v},${v + 4})`; c.fillRect(o[0] + rnd() * S, o[1] + rnd() * S, 1 + rnd() * 2, 1 + rnd() * 2); }
    if (0) for (let i = 0; i < 5; i++) { c.strokeStyle = 'rgba(40,40,48,.35)'; c.lineWidth = 1.5; c.beginPath(); let x = o[0] + rnd() * S, y = o[1] + rnd() * S; c.moveTo(x, y); for (let k = 0; k < 6; k++) { x = clamp(x + (rnd() - .5) * 50, o[0], o[0] + S); y = clamp(y + (rnd() - .5) * 50, o[1], o[1] + S); c.lineTo(x, y); } c.stroke(); }
    o = T0(TILE.SLABS); box(...o, S, S, '#b4afa6', FIX); for (let y = 0; y < S; y += 64) for (let x = 0; x < S; x += 64) { const v = 222 + rnd() * 26 | 0; box(o[0] + x + 2, o[1] + y + 2, 60, 60, `rgb(${v},${v},${v - 3})`, WALL); for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(0,0,0,.06)'; c.fillRect(o[0] + x + 2 + rnd() * 58, o[1] + y + 2 + rnd() * 58, 2, 2); } }
    o = T0(TILE.SETTS); box(...o, S, S, '#9c968c', FIX); for (let r = 0, y = 0; y < S; r++, y += 16) for (let x = -(r % 2) * 16; x < S; x += 32) { const v = 190 + rnd() * 60 | 0; box(o[0] + Math.max(0, x) + 1, o[1] + y + 1, Math.min(30, S - Math.max(0, x) - 1), 14, `rgb(${v},${v * .96 | 0},${v * .92 | 0})`, WALL); }
    o = T0(TILE.SAND); box(...o, S, S, '#f0ebe2', WALL); for (let i = 0; i < 9000; i++) { const v = 200 + rnd() * 55 | 0; c.fillStyle = `rgb(${v},${v},${v - 6})`; c.fillRect(o[0] + rnd() * S, o[1] + rnd() * S, 1, 1); }
    // combine colour and usage mask into one RGBA texture (no premultiplied alpha), rows flipped so tile 0 sits top-left
    const cd = c.getImageData(0, 0, N, N).data, md = m.getImageData(0, 0, N, N).data, out = new Uint8Array(N * N * 4);
    for (let y = 0; y < N; y++) { const sr = y * N * 4, dr = (N - 1 - y) * N * 4; for (let x = 0; x < N * 4; x += 4) { out[dr + x] = cd[sr + x]; out[dr + x + 1] = cd[sr + x + 1]; out[dr + x + 2] = cd[sr + x + 2]; out[dr + x + 3] = md[sr + x]; } }
    const t = new T.DataTexture(out, N, N, T.RGBAFormat); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
    t.generateMipmaps = true; t.minFilter = T.LinearMipmapLinearFilter; t.magFilter = T.LinearFilter; t.anisotropy = 4; t.needsUpdate = true;
    return t;
  })();
  // Lambert (cheap enough for software rendering) plus the atlas: tile lookup, colour tint, glass that lights up at night
  // on software rendering the mip level comes from distance per vertex instead of screen derivatives per pixel (much cheaper)
  const CHEAP = SOFT || /[?&]cheap/.test(location.search), LODK = { value: .1 };
  function atlasMat(opts) {
    const mat = new T.MeshLambertMaterial(Object.assign({ vertexColors: true }, opts || {}));
    const gl2 = R.capabilities.isWebGL2;
    mat.onBeforeCompile = sh => {
      sh.uniforms.uAtlas = { value: ATLAS }; sh.uniforms.uNight = NIGHT;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 auv; attribute float atile; varying vec2 vAuv; varying float vTile; varying float vLod; uniform float uLodK;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAuv = auv; vTile = atile;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvLod = clamp(log2(max(-mvPosition.z, 1.0) * uLodK), 0.0, 5.0);');
      sh.uniforms.uLodK = LODK;
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uAtlas; uniform float uNight; varying vec2 vAuv; varying float vTile; varying float vLod;')
        .replace('#include <map_fragment>', 'float tintM = 1.0, glassM = 0.0; vec3 glassC = vec3(0.0);\n'
          + 'if (vTile > -0.5) { float ti = floor(vTile + 0.5); vec2 cell = vec2(mod(ti, 4.0), 3.0 - floor(ti / 4.0)); vec2 auv = (cell + clamp(fract(vAuv), 0.004, 0.996)) * 0.25;'
          + (gl2 && CHEAP ? ' vec4 tx = textureLod(uAtlas, auv, vLod);' : gl2 ? ' vec2 gx = dFdx(vAuv) * 0.25, gy = dFdy(vAuv) * 0.25; float gm = max(length(gx), length(gy)); float lim = 0.03; if (gm > lim) { gx *= lim / gm; gy *= lim / gm; } vec4 tx = textureGrad(uAtlas, auv, gx, gy);' : ' vec4 tx = texture2D(uAtlas, auv);')
          + ' tintM = clamp((tx.a - 0.5) * 2.0, 0.0, 1.0); glassM = clamp((0.5 - tx.a) * 2.0, 0.0, 1.0); diffuseColor.rgb *= tx.rgb; glassC = tx.rgb; }')
        .replace('#include <color_fragment>', '#ifdef USE_COLOR\ndiffuseColor.rgb *= mix(vec3(1.0), vColor, tintM);\n#endif')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n'
          + 'if (glassM > 0.01) { float shop = step(3.5, vTile) * step(vTile, 4.5); float rnd = fract(sin(dot(floor(vAuv) + floor(vTile + 0.5) * 3.1, vec2(127.1, 311.7))) * 43758.5453);'
          + ' float lit = max(step(0.5, rnd), shop); vec3 wc = mix(vec3(1.0, 0.66, 0.34), vec3(1.0, 0.48, 0.72), step(0.92, rnd) * (1.0 - shop));'
          + ' totalEmissiveRadiance += glassM * lit * mix(wc, wc * glassC * 2.2, shop * 0.6) * (uNight * mix(1.5, 1.7, shop) + shop * 0.1); }');
    };
    mat.customProgramCacheKey = () => 'atlas' + (gl2 ? 2 : 1) + (CHEAP ? 'c' : '');
    return mat;
  }
  const rgb = (hex, k = 1) => { const c = new T.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
  const area = pts => { let s = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) s += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]; return s / 2; };
  const inside = (x, z, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const centroid = pts => { let x = 0, z = 0; for (const p of pts) { x += p[0]; z += p[1]; } return [x / pts.length, z / pts.length]; };
  // horizontal polygon; with a tile, textured in world space at `sc` metres per tile
  function flat(B, pts, y, col, tile, sc) {
    const tris = T.ShapeUtils.triangulateShape(pts.map(p => new T.Vector2(p[0], p[1])), []), k = 1 / (sc || 4);
    for (const t of tris) { const a = pts[t[0]], b = pts[t[1]], c = pts[t[2]]; B.tri([a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], col, [0, 1, 0], tile == null ? null : [[a[0] * k, -a[1] * k], [b[0] * k, -b[1] * k], [c[0] * k, -c[1] * k]], tile); }
  }
  function prism(B, pts, y0, y1, wall, roof) {
    // walls darken towards the ground (cheap ambient occlusion); roofs get a parapet lip
    const ccw = area(pts) > 0, dark = wall.map(v => v * .58);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1];
      let ox = dz, oz = -dx; if (!ccw) { ox = -ox; oz = -oz; }
      const want = [ox, 0, oz];
      B.tri([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [dark, dark, wall], want);
      B.tri([a[0], y0, a[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [dark, wall, wall], want);
    }
    flat(B, pts, y1, roof);
  }
  // a strip along a polyline; with a tile, textured along its length (su metres per tile) and across it (sv metres per tile)
  function ribbon(B, pts, w, y, col, caps, tile, su, sv) {
    const h = w / 2, T1 = tile == null ? null : tile, ku = 1 / (su || 4), kv = 1 / (sv || su || 4); let run = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * h, nz = dx / l * h;
      const u0 = run * ku, u1 = (run + l) * ku; run += l;
      const U = T1 == null ? null : [[u0, h * kv], [u1, h * kv], [u1, -h * kv], [u0, -h * kv]];
      B.tri([a[0] + nx, y, a[1] + nz], [b[0] + nx, y, b[1] + nz], [b[0] - nx, y, b[1] - nz], col, [0, 1, 0], U && [U[0], U[1], U[2]], T1);
      B.tri([a[0] + nx, y, a[1] + nz], [b[0] - nx, y, b[1] - nz], [a[0] - nx, y, a[1] - nz], col, [0, 1, 0], U && [U[0], U[2], U[3]], T1);
    }
    if (caps) for (const p of pts) for (let k = 0; k < 6; k++) {
      const a1 = k / 6 * Math.PI * 2, a2 = (k + 1) / 6 * Math.PI * 2, A = [p[0] + Math.cos(a1) * h, p[1] + Math.sin(a1) * h], Bq = [p[0] + Math.cos(a2) * h, p[1] + Math.sin(a2) * h];
      B.tri([p[0], y, p[1]], [A[0], y, A[1]], [Bq[0], y, Bq[1]], col, [0, 1, 0], T1 == null ? null : [[p[0] * ku, p[1] * ku], [A[0] * ku, A[1] * ku], [Bq[0] * ku, Bq[1] * ku]], T1);
    }
  }
  const dec = (a, i0) => { const o = []; let x = 0, z = 0; for (let i = i0; i < a.length - 1; i += 2) { x += a[i]; z += a[i + 1]; o.push([x, z]); } return o; };
  const ring = pts => { const o = pts.slice(); if (o.length > 2 && o[0][0] === o[o.length - 1][0] && o[0][1] === o[o.length - 1][1]) o.pop(); return o; };
  function canvasTex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }

  // banded walls (a cream cornice band under the eaves) without z-fighting
  function walls(B, pts, y0, y1, cTop, cBot) {
    const ccw = area(pts) > 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1];
      let ox = dz, oz = -dx; if (!ccw) { ox = -ox; oz = -oz; }
      const want = [ox, 0, oz];
      B.tri([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [cBot, cBot, cTop], want);
      B.tri([a[0], y0, a[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [cBot, cTop, cTop], want);
    }
  }
  function obb(pts) {
    let best = 0, ang = 0;
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > best) { best = l; ang = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
    const o = { ux: Math.cos(ang), uz: Math.sin(ang) }; o.vx = -o.uz; o.vz = o.ux;
    o.u0 = o.v0 = 1e9; o.u1 = o.v1 = -1e9;
    for (const p of pts) { const u = p[0] * o.ux + p[1] * o.uz, v = p[0] * o.vx + p[1] * o.vz; o.u0 = Math.min(o.u0, u); o.u1 = Math.max(o.u1, u); o.v0 = Math.min(o.v0, v); o.v1 = Math.max(o.v1, v); }
    return o;
  }
  const OP = (o, u, v, y) => [u * o.ux + v * o.vx, y, u * o.uz + v * o.vz];
  function quad(B, a, b, c, d, col, want) { B.tri(a, b, c, col, want); B.tri(a, c, d, col, want); }
  function obox(B, o, uc, vc, du, dv, y0, y1, col) {
    const pts = [[uc - du, vc - dv], [uc + du, vc - dv], [uc + du, vc + dv], [uc - du, vc + dv]].map(([u, v]) => [u * o.ux + v * o.vx, u * o.uz + v * o.vz]);
    prism(B, pts, y0, y1, col, col.map(x => x * .8));
  }
  function offsetLine(pts, d) {
    return pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [p[0] - dz / l * d, p[1] + dx / l * d]; });
  }
  // nearest road to a point: [distance, class, unit direction]
  function nearRoad(x, z) {
    let best = [1e9, -1, 0, 0]; const cx = Math.floor(x / 20), cz = Math.floor(z / 20);
    for (let i = cx - 1; i <= cx + 1; i++) for (let j = cz - 1; j <= cz + 1; j++) {
      const L = W.rg.get(i + ',' + j); if (!L) continue;
      for (const s of L) { const dx = s[2] - s[0], dz = s[3] - s[1], l2 = dx * dx + dz * dz || 1, t = clamp(((x - s[0]) * dx + (z - s[1]) * dz) / l2, 0, 1), d = Math.hypot(x - s[0] - dx * t, z - s[1] - dz * t); if (d < best[0]) { const l = Math.sqrt(l2); best = [d, s[4], dx / l, dz / l]; } }
    }
    return best;
  }
  // the street-facing walls of a footprint: [{a, b, len, tx, tz, nx, nz, cls}]
  function streetEdges(pts) {
    const ccw = area(pts) > 0, out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 4) continue;
      const tx = dx / len, tz = dz / len; let nx = tz, nz = -tx; if (!ccw) { nx = -nx; nz = -nz; }
      const mx = (a[0] + b[0]) / 2 + nx * 3, mz = (a[1] + b[1]) / 2 + nz * 3, r = nearRoad(mx, mz);
      if (r[0] < 15 && Math.abs(r[2] * tx + r[3] * tz) > .6) out.push({ a, b, len, tx, tz, nx, nz, cls: r[1] });
    }
    return out;
  }
  // lit windows on every wall: drawn in the shader from world position, glowing at night
  function withWindows(mat, strength) {
    mat.extensions = { derivatives: true };
    mat.onBeforeCompile = sh => {
      sh.uniforms.uNight = NIGHT; sh.uniforms.uWin = { value: strength };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN; uniform float uNight, uWin;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n'
          + 'float wall = 1.0 - step(0.45, abs(vWN.y)); vec2 tg = normalize(vec2(-vWN.z, vWN.x) + 1e-5); float wu = dot(vWP.xz, tg) / 2.7; float wv = (vWP.y - 1.2) / 3.3;'
          + 'vec2 cell = floor(vec2(wu, wv)); vec2 f = fract(vec2(wu, wv));'
          + 'vec2 fw = max(fwidth(vec2(wu, wv)), 1e-4) * 1.2; float win = wall * step(0.0, wv) * smoothstep(0.2 - fw.x, 0.2 + fw.x, f.x) * (1.0 - smoothstep(0.8 - fw.x, 0.8 + fw.x, f.x)) * smoothstep(0.28 - fw.y, 0.28 + fw.y, f.y) * (1.0 - smoothstep(0.84 - fw.y, 0.84 + fw.y, f.y)); float far = 1.0 - smoothstep(140.0, 420.0, length(cameraPosition - vWP)); float lod = far * (1.0 - smoothstep(0.25, 0.5, max(fw.x, fw.y)));'
          + 'float rnd = fract(sin(dot(cell + floor(vWP.xz / 37.0) * 7.0, vec2(127.1, 311.7))) * 43758.5453);'
          + 'diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.5, 0.55, 0.72), win * 0.7 * lod);'
          + 'totalEmissiveRadiance += win * step(0.62, rnd) * mix(vec3(1.0, 0.68, 0.34), vec3(1.0, 0.45, 0.7), step(0.9, rnd)) * uNight * 1.25 * uWin * mix(0.4, 1.0, lod);');
    };
    return mat;
  }

  // ------------------------------------------------------------------ pins
  const PINS = CFG.pins.map(p => Object.assign({}, p, proj(p.p), { slug: p.u.split('/')[2] }));

  // ------------------------------------------------------------------ world
  const W = { loose: [], cells: new Map(), rg: new Map(), coast: [], nodes: new Map(), roads: [], bounds: { x0: -560, x1: 600, z0: -690, z1: 880 } };
  let tower = null, bulbs = null, halos = null, gulls = [];
  const beacons = [], labels = [], venueMeshes = [];
  const seaU = { t: { value: 0 }, c1: { value: new T.Color() }, c2: { value: new T.Color() }, sunDir: skyU.sunDir, fogC: { value: new T.Color() }, fogN: { value: 450 }, fogF: { value: 2600 }, night: NIGHT };

  function buildWorld(Wd) {
    const sea = new T.Mesh(new T.PlaneGeometry(8000, 8000, 1, 1), new T.ShaderMaterial({
      uniforms: seaU,
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform float t, fogN, fogF, night; uniform vec3 c1, c2, sunDir, fogC; varying vec3 vW;'
        + 'float wv(vec2 p){ return sin(p.x * 0.09 + t * 0.9) * sin(p.y * 0.07 - t * 0.7) + 0.5 * sin(p.x * 0.23 - p.y * 0.19 + t * 1.6) + 0.25 * sin(p.x * 0.61 + p.y * 0.43 - t * 2.3); }'
        + 'void main(){ vec3 V = normalize(cameraPosition - vW); float e = 0.6; float w0 = wv(vW.xz);'
        + ' vec3 N = normalize(vec3((wv(vW.xz + vec2(e, 0.0)) - w0) * -0.35, 1.0, (wv(vW.xz + vec2(0.0, e)) - w0) * -0.35));'
        + ' vec3 Rr = reflect(-V, N); float s = max(dot(Rr, sunDir), 0.0); float fr = pow(1.0 - max(dot(V, N), 0.0), 4.0);'
        + ' vec3 c = mix(c1, c2, clamp(fr * 1.1 + 0.05 * w0, 0.0, 1.0)) + vec3(1.0, 0.82, 0.55) * pow(s, 120.0) * 5.0 * (1.0 - night * 0.8) + c2 * pow(s, 10.0) * 0.3;'
        + ' float d = length(cameraPosition - vW); c = mix(c, fogC, smoothstep(fogN, fogF, d)); gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
    }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -0.6; S.add(sea); W.sea = sea; W.seaRich = sea.material; W.seaLite = new T.MeshBasicMaterial({ color: '#4a3d8f' });

    const ground = new Builder(), roads = new Builder(), marks = new Builder(), bld = new Builder(), glow = new Builder();
    const coastA = Wd.a.find(a => a[0] === 'coast');
    if (coastA) {
      const cp = dec(coastA, 2);
      W.coast = cp.slice().sort((a, b) => a[1] - b[1]);
      flat(ground, cp.concat([[4000, cp[cp.length - 1][1]], [4000, cp[0][1]]]), 0, rgb('#a49d95'), TILE.ASPHALT, 6);
    } else flat(ground, [[-600, -3000], [4000, -3000], [4000, 3000], [-600, 3000]], 0, rgb('#a49d95'), TILE.ASPHALT, 6);
    for (const a of Wd.a) {
      const pts = ring(dec(a, 2));
      if (a[0] === 'beach' && pts.length > 2) flat(ground, pts, 0.05, rgb('#f2d9ad'), TILE.SAND, 3);
      else if (a[0] === 'park' && pts.length > 2) flat(ground, pts, 0.12, rgb('#86b86f'), TILE.SAND, 2);
      else if (a[0] === 'park0' && pts.length > 2) flat(ground, pts, 0.1, rgb('#d3cdc4'), TILE.SLABS, 2.4);
      else if (a[0] === 'plat' && pts.length > 2) prism(bld, pts, 0, 1.1, rgb('#bdb3c9'), rgb('#e7e1ee'));
      else if (a[0] === 'rail') ribbon(roads, dec(a, 2), 3.2, 0.09, rgb('#7a7068'), true, TILE.SAND, 2);
      else if (a[0] === 'pier') buildPier(pts, a[1]);
    }
    const RW = [5, 7.5, 9, 12, 7], RY = [0.16, 0.2, 0.24, 0.28, 0.18], RC = ['#6f6e76', '#67666f', '#605f69', '#5a5963', '#ddd0bb'];
    const named = new Map();
    for (let ri = 0; ri < Wd.r.length; ri++) {
      const r = Wd.r[ri], cls = r[0], pts = dec(r, 2); if (pts.length < 2) continue;
      const rw = (Wd.rw && Wd.rw[ri]) || RW[cls];
      if (cls !== 4) ribbon(ground, pts, rw + (cls ? 4.6 : 1.6), 0.14, rgb('#d2ccc2'), true, TILE.SLABS, 2.4);
      ribbon(roads, pts, rw, RY[cls], rgb(RC[cls]), true, cls === 4 ? TILE.SETTS : TILE.ASPHALT, cls === 4 ? 3 : 5);
      { const lanes = +((Wd.ln || '')[ri] || 0), owf = (Wd.o && Wd.o[ri]) || '', ow = /^\++$/.test(owf) ? '+' : /^-+$/.test(owf) ? '-' : '';
        if (cls < 4) roadMarks(marks, pts, rw, RY[cls] + .02, cls, lanes, ow); }
      W.roads.push({ cls, name: r[1], pts, ms: (Wd.ms || [])[ri] || '', w: (Wd.rw && Wd.rw[ri]) || RW[cls], sw: (Wd.sw || '')[ri] || (cls >= 1 && cls <= 3 ? 'b' : 'n') });
      for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; for (let x = Math.floor(Math.min(a[0], b[0]) / 20); x <= Math.floor(Math.max(a[0], b[0]) / 20); x++) for (let z = Math.floor(Math.min(a[1], b[1]) / 20); z <= Math.floor(Math.max(a[1], b[1]) / 20); z++) { const k = x + ',' + z; let c = W.rg.get(k); if (!c) W.rg.set(k, c = []); c.push([a[0], a[1], b[0], b[1], cls]); } }
      if (r[1]) { const e = named.get(r[1]) || []; e.push(pts); named.set(r[1], e); }
      // one-way streets from OpenStreetMap: '+' only in drawing order, '-' only against it; cost is travel time
      const ow = (Wd.o && Wd.o[ri]) || '', SPD = [4.5, 8.9, 11.2, 13.4, 4.5];
      if (cls !== 4) for (let i = 0; i < pts.length; i++) {
        const k = Math.round(pts[i][0] * 10) + ',' + Math.round(pts[i][1] * 10); let n = W.nodes.get(k); if (!n) { n = { x: pts[i][0], z: pts[i][1], e: [] }; W.nodes.set(k, n); }
        if (i) { const p = W.nodes.get(Math.round(pts[i - 1][0] * 10) + ',' + Math.round(pts[i - 1][1] * 10)), d = Math.hypot(n.x - p.x, n.z - p.z), cost = d / SPD[cls], f = ow[i - 1] || '0';
          if (f !== '+') n.e.push([p, cost]); if (f !== '-') p.e.push([n, cost]); }
      }
    }
    giveWays(marks, RY);
    pavements(roads);
    W.matStatic = atlasMat(); ground.chunks(W.matStatic, { receive: true }); roads.chunks(W.matStatic, { receive: true });
    marks.chunks(new T.MeshBasicMaterial({ vertexColors: true }));
    buildStreetDetail(Wd);
    streetLabels(named);

    const PAL = ['#f7e6d4', '#f4d3c4', '#ead6f3', '#d8e4fb', '#fbe8b8', '#e3f1da', '#f9d6e6', '#ddd4f6', '#f3efe8', '#e6dccf', '#ffd9c2', '#cfe9f1'];
    const venueOf = new Map();
    for (const pin of PINS) { let best = null; for (let i = 0; i < Wd.b.length; i++) { const pts = ring(dec(Wd.b[i], 2)); if (pts.length > 2 && inside(pin.x, pin.z, pts)) { best = i; break; } } if (best != null && !venueOf.has(best)) venueOf.set(best, pin); else pin.free = true; }
    let towerXZ = null;
    // real businesses from OpenStreetMap: which building each one is in
    const bPOI = new Map(), FP = Wd.b.map(b => ring(dec(b, 2)));
    const BB = FP.map(pts => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); } return [x0, x1, z0, z1]; });
    for (const q of Wd.p || []) {
      const [x, z, k, name] = q; if (k === 't') { tramStop(bld, x, z, name); continue; }
      let hit = -1, bd = 12;
      for (let i = 0; i < FP.length; i++) { const b = BB[i]; if (x < b[0] - 12 || x > b[1] + 12 || z < b[2] - 12 || z > b[3] + 12 || FP[i].length < 3) continue; if (inside(x, z, FP[i])) { hit = i; break; } const c = centroid(FP[i]), d = Math.hypot(c[0] - x, c[1] - z) - Math.sqrt(Math.abs(area(FP[i]))) / 2; if (d < bd) { bd = d; hit = i; } }
      if (hit >= 0) { const L = bPOI.get(hit) || []; L.push({ x, z, k, name }); bPOI.set(hit, L); } else W.loose.push({ x, z, k, name });
    }
    Wd.b.forEach((b, i) => {
      const pts = ring(dec(b, 2)); if (pts.length < 3) return;
      const A = Math.abs(area(pts)), c = centroid(pts), r = hash(c[0], c[1]);
      const meta = (Wd.bm && Wd.bm[i]) || [];
      let h = b[0] > 2.5 ? b[0] : (A > 2500 ? 14 + r * 8 : A > 600 ? 10 + r * 6 : 6.5 + r * 5);
      if (/Tower, Ballroom/.test(b[1])) { h = 24; towerXZ = c; }
      if (/Winter Gardens/.test(b[1])) h = 20;
      addCollider(pts);
      const pin = venueOf.get(i);
      if (pin) { venueBuilding(pin, pts, Math.max(h, 9), bPOI.get(i)); return; }
      blackpoolHouse(bld, glow, pts, h, A, r, bPOI.get(i) || [], meta);
    });
    // businesses with no building footprint nearby (kiosks, stalls, units OpenStreetMap maps as a point): a sign on a post where they are
    for (const q of W.loose) { const r = nearRoad(q.x, q.z); let nx = 0, nz = 1; if (r[1] >= 0) { nx = -r[3]; nz = r[2]; } prism(bld, circ(q.x, q.z, .07, 6), 0, 2.4, rgb('#3a3350'), rgb('#3a3350')); SIGNS.push({ text: q.name, k: q.k, x: q.x, z: q.z, nx, nz, w: 2.6, y: 2.4 }); SIGNS.push({ text: q.name, k: q.k, x: q.x, z: q.z, nx: -nx, nz: -nz, w: 2.6, y: 2.4 }); }
    S.add(glow.mesh(new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
    bld.chunks(W.matStatic, { cast: true, receive: true });
    for (const pin of PINS) if (pin.free) {
      const s = 4.5, pts = [[pin.x - s, pin.z - s], [pin.x + s, pin.z - s], [pin.x + s, pin.z + s], [pin.x - s, pin.z + s]];
      addCollider(pts); venueBuilding(pin, pts, 9);
    }
    // real house numbers from OpenStreetMap addresses: a small plaque by the door on the nearest building face
    for (const [num, x, z] of Wd.ad || []) {
      let best = null, bd = 10;
      for (let i = 0; i < FP.length; i++) { const bb = BB[i]; if (x < bb[0] - 10 || x > bb[1] + 10 || z < bb[2] - 10 || z > bb[3] + 10) continue;
        for (const ed of allEdges(FP[i])) { const t = clamp((x - ed.a[0]) * ed.tx + (z - ed.a[1]) * ed.tz, .4, ed.len - .4), px = ed.a[0] + ed.tx * t, pz = ed.a[1] + ed.tz * t, d = Math.hypot(px - x, pz - z); if (d < bd) { bd = d; best = { x: px + ed.nx * .08, z: pz + ed.nz * .08, nx: ed.nx, nz: ed.nz }; } } }
      if (best) NUMS.push(Object.assign(best, { text: num, k: 'n', w: .5, y: 2.25 }));
    }
    buildSigns(); buildSigns(NUMS, 128, 64, 16, 32);
    pruneGraph();
    if (towerXZ) buildTower(towerXZ[0], towerXZ[1]);
    buildIlluminations(named.get('Promenade') || []);
    const tr = new Builder();
    for (const pl of named.get('Promenade') || []) for (const d of [-2.4, -1, 1, 2.4]) ribbon(tr, offsetLine(pl, d), .14, .31, rgb('#c9c2d6'), false);
    S.add(tr.mesh(new T.MeshStandardMaterial({ vertexColors: true, roughness: .3, metalness: .7 })));
    landmarkLabels(Wd);
    buildGulls();
    buildMinimap();
    applyLite();
  }



  function allEdges(pts) {
    const ccw = area(pts) > 0, out = [];
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 2) continue; const tx = dx / len, tz = dz / len; let nx = tz, nz = -tx; if (!ccw) { nx = -nx; nz = -nz; } out.push({ a, b, len, tx, tz, nx, nz, cls: 0 }); }
    return out;
  }
  // every business name painted onto one of a few shared sign atlases (one draw call per atlas)
  const SIGNS = [];
  const SIGN_STYLE = {
    g: { bg: '#fbf5ea', fg: '#3a1f5c', rim: '#c8a24a', neon: false },
    s: { bg: null, fg: '#ffffff', rim: '#ffffff', neon: false },
    f: { bg: null, fg: '#ffffff', rim: '#ffe7a8', neon: false },
    b: { bg: '#1a1033', fg: null, rim: null, neon: true },
    p: { bg: '#1f5fbf', fg: '#ffffff', rim: '#ffffff', neon: false },
    n: { bg: '#1d2333', fg: '#f4efe4', rim: '#c8a24a', neon: false }
  };
  const NUMS = [];
  const BOARD = ['#c2185b', '#0b7f7a', '#3d2a8a', '#b8461f', '#1f5c99', '#7a1f6e', '#2f6b3a'];
  // signs with the same words and style share one atlas cell
  function buildSigns(LIST, CW, CH, COLS, ROWS) {
    LIST = LIST || SIGNS; CW = CW || 320; CH = CH || 64; COLS = COLS || 6; ROWS = ROWS || 32;
    if (!LIST.length) return;
    const PER = COLS * ROWS, fontF = '"Bricolage Grotesque", "Inter", system-ui, sans-serif', cells = new Map(), uniq = [];
    for (const sg of LIST) { const key = sg.k + '|' + sg.text + '|' + (sg.k === 'b' || !SIGN_STYLE[sg.k].bg ? Math.floor(hash(sg.x * 5, sg.z * 3) * 97) % 4 : 0); if (!cells.has(key)) { cells.set(key, uniq.length); uniq.push([sg]); } else uniq[cells.get(key)].push(sg); }
    for (let a0 = 0; a0 < uniq.length; a0 += PER) {
      const groups = uniq.slice(a0, a0 + PER), part = groups.map(g => g[0]), pos = [], uv = [], rows = Math.min(ROWS, Math.ceil(part.length / COLS)), RH = 1 << Math.ceil(Math.log2(rows * CH)) ;
      const tex = canvasTex(CW * COLS, RH, (x) => {
        part.forEach((sg, i) => {
          const cx = (i % COLS) * CW, cy = Math.floor(i / COLS) * CH, st = SIGN_STYLE[sg.k], hsh = hash(sg.x * 5, sg.z * 3);
          const bg = sg.k === 'b' ? '#1a1033' : st.bg || BOARD[Math.floor(hsh * 97) % BOARD.length];
          x.fillStyle = bg; x.beginPath(); if (x.roundRect) x.roundRect(cx + 3, cy + 3, CW - 6, CH - 6, 10); else x.rect(cx + 3, cy + 3, CW - 6, CH - 6); x.fill();
          if (st.rim) { x.strokeStyle = st.rim; x.lineWidth = 3; x.stroke(); }
          let fs = CH * .53 | 0; x.font = `800 ${fs}px ${fontF}`; while (x.measureText(sg.text).width > CW - 30 && fs > 12) { fs -= 1; x.font = `800 ${fs}px ${fontF}`; }
          x.textAlign = 'center'; x.textBaseline = 'middle';
          if (st.neon) { const nc = ['#ff4fd8', '#33e1ff', '#ffe45e', '#7dff9b'][Math.floor(hsh * 41) % 4]; x.shadowColor = nc; x.shadowBlur = 14; x.fillStyle = nc; x.fillText(sg.text, cx + CW / 2, cy + CH / 2 + 1); x.shadowBlur = 0; x.fillStyle = '#ffffff'; x.globalAlpha = .55; x.fillText(sg.text, cx + CW / 2, cy + CH / 2 + 1); x.globalAlpha = 1; }
          else { x.fillStyle = st.fg; x.fillText(sg.text, cx + CW / 2, cy + CH / 2 + 2); }
        });
      });
      const H = RH, Wt = CW * COLS;
      groups.forEach((grp, i) => grp.forEach(sg => {
        const u0 = (i % COLS) * CW / Wt, u1 = u0 + CW / Wt, vt = 1 - Math.floor(i / COLS) * CH / H, vb = vt - CH / H;
        const rx = sg.nz, rz = -sg.nx, w = sg.w, hh = w * CH / CW, y0 = sg.y, y1 = sg.y + hh;
        const L = [sg.x - rx * w / 2, sg.z - rz * w / 2], R = [sg.x + rx * w / 2, sg.z + rz * w / 2];
        pos.push(L[0], y0, L[1], R[0], y0, R[1], R[0], y1, R[1], L[0], y0, L[1], R[0], y1, R[1], L[0], y1, L[1]);
        uv.push(u0, vb, u1, vb, u1, vt, u0, vb, u1, vt, u0, vt);
      }));
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.computeBoundingSphere();
      const m = new T.Mesh(g, new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide, toneMapped: false, color: new T.Color(1.05, 1.05, 1.05) }));
      S.add(m); W.signMats = (W.signMats || []).concat(m.material);
    }
  }
  // tram shelter on the Promenade
  function tramStop(B, x, z, name) {
    const c = rgb('#2a1d4a'), glass = rgb('#bfe9ff', .9), roof = rgb('#ff2e88');
    prism(B, [[x - 2.6, z - .9], [x + 2.6, z - .9], [x + 2.6, z - .75], [x - 2.6, z - .75]], 0, 2.5, glass, glass);
    for (const dx of [-2.6, 2.6]) prism(B, [[x + dx - .08, z - .9], [x + dx + .08, z - .9], [x + dx + .08, z + .9], [x + dx - .08, z + .9]], 0, 2.6, c, c);
    prism(B, [[x - 2.9, z - 1.1], [x + 2.9, z - 1.1], [x + 2.9, z + 1.1], [x - 2.9, z + 1.1]], 2.6, 2.75, roof, roof);
    SIGNS.push({ text: name, k: 's', x, z: z + 1.12, nx: 0, nz: 1, w: 3.6, y: 2.8 });
  }
  // ------------------------------------------------------------------ Blackpool streetscape, in the house style
  // pastel or brick terraces, cream cornices, slate pitched roofs with chimney stacks, white two-storey bays to the street,
  // and glowing shopfronts with striped awnings on the main roads
  const PAL2 = ['#f3dfe8', '#e2ecf6', '#f3ead2', '#e6def5', '#d9eedf', '#f6d9cc', '#efe7dc', '#fde3c8', '#dcebf0', '#f2d6e4'];
  const SLATE = ['#77748a', '#6d6b80', '#807b8c', '#6a6678'], CREAM = rgb('#fbf5ea'), BRICK = rgb('#a85d4b'), BAY = rgb('#fbf8f2'), LEAD = rgb('#4a4060');
  const SHOP = [rgb('#ffd59a', 1.5), rgb('#ffb3d6', 1.45), rgb('#bfe9ff', 1.4), rgb('#fff0c2', 1.5)], AWN = ['#ff2e88', '#0fb5ae', '#ffc93c', '#8b5cf6', '#e4413f'];
  const colourOf = c => { if (!c) return null; try { const k = new T.Color().setStyle(c.replace(/\s+/g, ''), T.SRGBColorSpace); return [k.r, k.g, k.b]; } catch (e) { return null; } };
  const NONHOUSE = /^(retail|commercial|office|industrial|church|school|college|train_station|warehouse|supermarket|civic|public|hospital|service|shelter|garage|roof)$/;
  const FLOOR = 3.1, BAYW = 3.4;
  // one wall from a to b, 0 to `top` metres: a ground floor of bays and the upper floors, from the facade atlas.
  // Floors come from the building's real height (OpenStreetMap levels/height, or Microsoft's measured height), bays from the wall's real length.
  function facade(B, a, b, top, col, o) {
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < .05 || top <= 0) return;
    const off = o.off || 0, w = o.want, P = (t, y) => [a[0] + dx * t + w[0] * off, y, a[1] + dz * t + w[2] * off];
    const ao = col.map(v => v * .68), mid = col.map(v => v * .9), u0 = Math.floor(hash(a[0] * 7.3, a[1] * 3.1) * 40), plain = o.brick ? TILE.BRICK_PLAIN : TILE.RENDER_PLAIN;
    if (len < (o.minLen || 2.2) || top < 2.6) { quadT(B, P(0, 0), P(1, 0), P(1, top), P(0, top), [ao, ao, col, col], [[u0, 0], [u0 + len / BAYW, 0], [u0 + len / BAYW, top / FLOOR], [u0, top / FLOOR]], plain, w); return; }
    const n = Math.max(1, Math.round(len / BAYW)), floors = Math.max(1, Math.round(top / FLOOR)), fh = top / floors, g = o.ground;
    if (typeof g === 'function') for (let i = 0; i < n; i++) quadT(B, P(i / n, 0), P((i + 1) / n, 0), P((i + 1) / n, fh), P(i / n, fh), [ao, ao, mid, mid], [[u0 + i, 0], [u0 + i + 1, 0], [u0 + i + 1, 1], [u0 + i, 1]], g(i), w);
    else quadT(B, P(0, 0), P(1, 0), P(1, fh), P(0, fh), [ao, ao, mid, mid], [[u0, 0], [u0 + n, 0], [u0 + n, 1], [u0, 1]], g == null ? plain : g, w);
    if (floors > 1) quadT(B, P(0, fh), P(1, fh), P(1, top), P(0, top), [mid, mid, col, col], [[u0, 0], [u0 + n, 0], [u0 + n, floors - 1], [u0, floors - 1]], o.upper == null ? plain : o.upper, w);
    return { n, fh };
  }
  function band(B, a, b, y0, y1, col, want) { quadT(B, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], col, UV0.concat([[0, 0]]), -1, want); }
  function blackpoolHouse(B, G, pts, h, A, r, pois, meta) {
    meta = meta || [];
    const kinds = pois.map(q => q.k), guest = kinds.includes('g');
    const brick = meta[4] === 'brick' || (!meta[4] && r > .8), wall = colourOf(meta[1]) || (brick ? BRICK : rgb(PAL2[Math.floor(r * 97) % PAL2.length]));
    const house = !NONHOUSE.test(meta[0] || '') && ((A < 2400 && h < 16) || (guest && h < 18));
    const shopType = /^(retail|commercial|supermarket)$/.test(meta[0] || ''), modern = !house && (shopType || /^(office|industrial|warehouse)$/.test(meta[0] || '') || A > 2500);
    const top = house ? h - .6 : h - .8, floorsAll = Math.max(1, Math.round(top / FLOOR)), fh = top / floorsAll;
    const WIN = brick ? TILE.BRICK : TILE.RENDER, WIN_G = brick ? TILE.BRICK_G : TILE.RENDER_G;
    // street-facing walls, and each business on the street-facing wall nearest to it
    const edges = streetEdges(pts), onEdge = new Map();
    for (const q of pois) {
      let best = null, bd = 1e9;
      for (const ed of (edges.length ? edges : allEdges(pts))) { const t = clamp((q.x - ed.a[0]) * ed.tx + (q.z - ed.a[1]) * ed.tz, 0, ed.len), d = Math.hypot(ed.a[0] + ed.tx * t - q.x, ed.a[1] + ed.tz * t - q.z); if (d < bd) { bd = d; best = [ed, t]; } }
      if (best) { const L = onEdge.get(best[0]) || []; L.push({ q, t: best[1] }); onEdge.set(best[0], L); }
    }
    const ccw = area(pts) > 0, bayAt = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < .05) continue;
      let nx = dz / len, nz = -dx / len; if (!ccw) { nx = -nx; nz = -nz; }
      const want = [nx, 0, nz], se = edges.find(e => e.a === a), L = se ? (onEdge.get(se) || []).sort((p, q) => p.t - q.t) : [];
      const shopEdge = !!se && (L.some(it => it.q.k === 's' || it.q.k === 'f' || it.q.k === 'b') || shopType);
      let ground, upper = modern ? TILE.MODERN : WIN;
      if (shopEdge) ground = TILE.SHOP;
      else if (modern) ground = se ? TILE.MODERN : null;
      else if (se && house) ground = k => (k % 2 ? WIN_G : TILE.DOOR);
      else if (se) ground = WIN_G;
      else ground = null;
      // a terrace of guest houses: every house painted its own colour, like the real Rainbow Quarter
      const segs = [];
      if (se && L.filter(it => it.q.k === 'g').length > 1 && !brick) L.forEach((it, j) => { const s0 = j ? (L[j - 1].t + it.t) / 2 : 0, s1 = j < L.length - 1 ? (it.t + L[j + 1].t) / 2 : len; segs.push([s0, s1, it.q.k === 'g' ? rgb(PAL2[Math.floor(hash(it.q.x * 13, it.q.z * 7) * 97) % PAL2.length]) : wall]); });
      else segs.push([0, len, wall]);
      for (const [s0, s1, col] of segs) {
        const A0 = [a[0] + dx / len * s0, a[1] + dz / len * s0], A1 = [a[0] + dx / len * s1, a[1] + dz / len * s1];
        const f = facade(B, A0, A1, top, col, { brick, ground, upper, want });
        // white two-storey bay windows over the window bays of house fronts
        if (f && se && house && !shopEdge && top > 5.5) for (let k = 1; k < f.n; k += 2) bayAt.push([A0, A1, (k + .5) / f.n, want, Math.min(6.2, top - .3)]);
      }
      if (house) band(B, a, b, top, h, CREAM, want); else band(B, a, b, top, h, wall.map(v => v * .93), want);
    }
    // bays: textured windows on their three faces, lead roof
    for (const [A0, A1, t, want, bh] of bayAt) {
      const c = [lerp(A0[0], A1[0], t), lerp(A0[1], A1[1], t)], len = Math.hypot(A1[0] - A0[0], A1[1] - A0[1]), tx = (A1[0] - A0[0]) / len, tz = (A1[1] - A0[1]) / len;
      const P = (s, d) => [c[0] + tx * s + want[0] * d, c[1] + tz * s + want[2] * d], Q = [P(-1.5, .02), P(-1, .9), P(1, .9), P(1.5, .02)];
      const inn = P(0, .3);
      for (let k = 0; k < 3; k++) {
        const p = Q[k], q = Q[k + 1], ex = q[0] - p[0], ez = q[1] - p[1], el = Math.hypot(ex, ez) || 1; let nx = ez / el, nz = -ex / el;
        if (nx * ((p[0] + q[0]) / 2 - inn[0]) + nz * ((p[1] + q[1]) / 2 - inn[1]) < 0) { nx = -nx; nz = -nz; }
        facade(B, p, q, bh, BAY, { ground: TILE.RENDER_G, upper: TILE.RENDER, want: [nx, 0, nz], minLen: .8 });
      }
      flat(B, Q, bh, LEAD);
    }
    // roofs: pitched Welsh slate on houses (real shape where OpenStreetMap has one), felt on flat roofs
    const roofC = colourOf(meta[2]);
    flat(B, pts, h, roofC || rgb(house ? '#8b8794' : '#9a96a0'), TILE.FLATROOF, 6);
    if (house) {
      const o = obb(pts); let su = o.u1 - o.u0, sv = o.v1 - o.v0;
      if (su * sv > 0 && A / (su * sv) > .72 && meta[3] !== 'flat') {
        if (sv > su) { [o.ux, o.uz, o.vx, o.vz] = [o.vx, o.vz, -o.ux, -o.uz]; const u0 = o.u0, u1 = o.u1; o.u0 = o.v0; o.u1 = o.v1; o.v0 = -u1; o.v1 = -u0; [su, sv] = [sv, su]; }
        const rh = clamp(sv * .42, 1.6, 5.5), vm = (o.v0 + o.v1) / 2, e = .35, roof = roofC || rgb(r < .18 ? '#b0624c' : SLATE[Math.floor(r * 31) % SLATE.length]);
        const sl = Math.hypot(vm - o.v0 + e, rh + .2) / 5, ul = (su + 2 * e) / 5;
        quadT(B, OP(o, o.u0 - e, o.v0 - e, h - .2), OP(o, o.u1 + e, o.v0 - e, h - .2), OP(o, o.u1 + e, vm, h + rh), OP(o, o.u0 - e, vm, h + rh), roof, [[0, 0], [ul, 0], [ul, sl], [0, sl]], TILE.SLATE, [-o.vx, 1, -o.vz]);
        quadT(B, OP(o, o.u0 - e, o.v1 + e, h - .2), OP(o, o.u0 - e, vm, h + rh), OP(o, o.u1 + e, vm, h + rh), OP(o, o.u1 + e, o.v1 + e, h - .2), roof.map(v => v * .85), [[0, 0], [0, sl], [ul, sl], [ul, 0]], TILE.SLATE, [o.vx, 1, o.vz]);
        const gu = [[o.v0 / BAYW, h / FLOOR], [o.v1 / BAYW, h / FLOOR], [vm / BAYW, (h + rh) / FLOOR]], pl = brick ? TILE.BRICK_PLAIN : TILE.RENDER_PLAIN;
        B.tri(OP(o, o.u0, o.v0, h), OP(o, o.u0, o.v1, h), OP(o, o.u0, vm, h + rh), wall, [-o.ux, 0, -o.uz], gu, pl);
        B.tri(OP(o, o.u1, o.v0, h), OP(o, o.u1, o.v1, h), OP(o, o.u1, vm, h + rh), wall, [o.ux, 0, o.uz], gu, pl);
        const chim = brick ? rgb('#8e4b3c') : rgb('#b8705c');
        for (let u = o.u0 + 1.4; u < o.u1 - .8; u += 6.4) { obox(B, o, u, vm, .55, .85, h + rh - 1.2, h + rh + 1.7, chim); obox(B, o, u, vm, .2, .2, h + rh + 1.7, h + rh + 2.3, rgb('#c97a5a')); }
      }
    }
    // business signs from OpenStreetMap names; cafés and restaurants get a striped awning
    for (const [ed, L] of onEdge) {
      L.forEach((it, j) => {
        const s0 = j ? (L[j - 1].t + it.t) / 2 : 0, s1 = j < L.length - 1 ? (it.t + L[j + 1].t) / 2 : ed.len;
        const big = it.q.k !== 'g', w = clamp((s1 - s0) * .86, 2.6, big ? 7.5 : 4.6), x = ed.a[0] + ed.tx * it.t, z = ed.a[1] + ed.tz * it.t;
        SIGNS.push({ text: it.q.name, k: it.q.k, x: x + ed.nx * .16, z: z + ed.nz * .16, nx: ed.nx, nz: ed.nz, w, y: it.q.k === 'g' ? Math.min(fh + .5, h - 1.6) : fh + .08 });
        if (it.q.k === 'f') {
          const aw = rgb(AWN[Math.floor(hash(x, z) * 97) % AWN.length]), hw = Math.min(w / 2, 3.2), y0 = fh - .15, y1 = fh - .85, d = 1.4;
          const Pp = (s, o2, y) => [x + ed.tx * s + ed.nx * o2, y, z + ed.tz * s + ed.nz * o2], U = hw * 2 / 2;
          quadT(B, Pp(-hw, d, y1), Pp(hw, d, y1), Pp(hw, .05, y0), Pp(-hw, .05, y0), aw, [[0, 0], [U, 0], [U, 1], [0, 1]], TILE.AWNING, [ed.nx, 1, ed.nz]);
          quadT(B, Pp(-hw, d, y1 - .28), Pp(hw, d, y1 - .28), Pp(hw, d, y1), Pp(-hw, d, y1), aw.map(v => v * .9), [[0, 0], [U, 0], [U, .2], [0, .2]], TILE.AWNING, [ed.nx, 0, ed.nz]);
        }
      });
    }
  }


  // ------------------------------------------------------------------ real street detail from OpenStreetMap: crossings, furniture, car parks, grass, walls, tram rails
  const PROGRESS = ['#ffffff', '#f5a9b8', '#5bcefa', '#784f17', '#1a1a1a', '#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'];
  function roadWidthAt(x, z) {
    let best = 1e9, w = 9;
    for (const r of W.roads) { if (r.cls === 4) continue; for (let i = 0; i < r.pts.length - 1; i++) { const a = r.pts[i], b = r.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0, 1), d = Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); if (d < best) { best = d; w = r.w; } } }
    return w;
  }
  // road markings from OpenStreetMap tags: lane lines from `lanes`, a centre line on two-way main roads, arrows on one-way streets
  const PAINT = rgb('#f2efe8');
  function dashed(B, line, y, on, off, w) {
    let s = 0;
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < .01) continue;
      for (; s < l; s += on + off) { const e = Math.min(s + on, l), P = t => [lerp(a[0], b[0], t / l), lerp(a[1], b[1], t / l)]; if (e - s > .3) ribbon(B, [P(s), P(e)], w, y, PAINT, false); }
      s -= l;
    }
  }
  function roadMarks(B, pts, rw, y, cls, lanes, ow) {
    if (ow && lanes >= 2) for (let k = 1; k < lanes; k++) dashed(B, offsetLine(pts, -rw / 2 + k * rw / lanes), y, 3, 6, .12);
    else if (!ow && (cls >= 2 || lanes >= 2)) dashed(B, pts, y, 4, 5, .15);
    if (!ow) return;
    // one-way arrows every 45 m, pointing the legal way
    let run = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 1) continue;
      let tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l; if (ow === '-') { tx = -tx; tz = -tz; }
      const nx = -tz, nz = tx;
      for (let s = (14 - run % 45 + 45) % 45; s < l - 3; s += 45) {
        const c = [lerp(a[0], b[0], s / l), lerp(a[1], b[1], s / l)], Q = (f, g) => [c[0] + tx * f + nx * g, y, c[1] + tz * f + nz * g];
        quadT(B, Q(-2.6, -.09), Q(1, -.09), Q(1, .09), Q(-2.6, .09), PAINT, UV0.concat([[0, 0]]), -1, [0, 1, 0]);
        B.tri(Q(1, -.5), Q(2.6, 0), Q(1, .5), PAINT, [0, 1, 0]);
      }
      run += l;
    }
  }
  // give-way lines where a minor street meets a bigger one (junction geometry and street class from OpenStreetMap)
  function giveWays(B, RY) {
    const at = new Map(), key = p => Math.round(p[0]) + ',' + Math.round(p[1]);
    W.roads.forEach((r, ri) => { if (r.cls < 4) r.pts.forEach(p => { const k = key(p); const L = at.get(k) || []; L.push(ri); at.set(k, L); }); });
    W.roads.forEach((r, ri) => {
      if (r.cls >= 3 || r.cls === 0 || r.pts.length < 2) return;
      for (const end of [0, 1]) {
        const p = end ? r.pts[r.pts.length - 1] : r.pts[0], q = end ? r.pts[r.pts.length - 2] : r.pts[1];
        const major = (at.get(key(p)) || []).map(j => W.roads[j]).filter(o => o !== r && o.cls > r.cls && o.cls < 4);
        if (!major.length) continue;
        const l = Math.hypot(q[0] - p[0], q[1] - p[1]), back = Math.max(...major.map(o => o.w)) / 2 + 1.2; if (l < back + 2) continue;
        const tx = (q[0] - p[0]) / l, tz = (q[1] - p[1]) / l, nx = -tz, nz = tx, y = RY[r.cls] + .025;
        for (const d of [back, back + .55]) { const c = [p[0] + tx * d, p[1] + tz * d]; dashed(B, [[c[0] - nx * r.w / 2 * .92, c[1] - nz * r.w / 2 * .92], [c[0] + nx * r.w / 2 * .92, c[1] + nz * r.w / 2 * .92]], y, .6, .3, .3); }
      }
    });
  }
  // raised pavements with kerb stones, on the sides of each street that OpenStreetMap says have a pavement; cut back where another street crosses
  function pavements(B) {
    const grid = new Map(), KY = .4, PW = 2.2, KERB = rgb('#cfccc6'), FACE = rgb('#a9a59e'), SLAB = rgb('#d6d0c6'), EDGE = rgb('#8f8a83');
    W.roads.forEach((r, ri) => { if (r.cls === 4) return; for (let i = 0; i < r.pts.length - 1; i++) { const a = r.pts[i], b = r.pts[i + 1], sg = [a[0], a[1], b[0], b[1], r.w / 2, ri];
      for (let x = Math.floor((Math.min(a[0], b[0]) - 8) / 20); x <= Math.floor((Math.max(a[0], b[0]) + 8) / 20); x++) for (let z = Math.floor((Math.min(a[1], b[1]) - 8) / 20); z <= Math.floor((Math.max(a[1], b[1]) + 8) / 20); z++) { const k = x + ',' + z; let c = grid.get(k); if (!c) grid.set(k, c = []); c.push(sg); } } });
    const clear = (x, z, ri, pad) => { const c = grid.get(Math.floor(x / 20) + ',' + Math.floor(z / 20)); if (!c) return true; for (const s of c) { if (s[5] === ri) continue; const dx = s[2] - s[0], dz = s[3] - s[1], l2 = dx * dx + dz * dz || 1, t = clamp(((x - s[0]) * dx + (z - s[1]) * dz) / l2, 0, 1); if (Math.hypot(x - s[0] - dx * t, z - s[1] - dz * t) < s[4] + pad) return false; } return true; };
    W.roads.forEach((r, ri) => {
      if (r.cls === 4 || !r.sw || r.sw === 'n') return;
      const d0 = r.w / 2, RYc = [0.16, 0.2, 0.24, 0.28][r.cls];
      for (const side of r.sw === 'b' ? [-1, 1] : r.sw === 'l' ? [-1] : [1]) for (let i = 0; i < r.pts.length - 1; i++) {
        const a = r.pts[i], b = r.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < 1) continue;
        const tx = dx / L, tz = dz / L, nx = -tz * side, nz = tx * side, n = Math.max(1, Math.ceil(L / 1.5)), ok = [];
        for (let k = 0; k <= n; k++) { const s = L * k / n, x = a[0] + tx * s, z = a[1] + tz * s; ok.push(clear(x + nx * (d0 + .2), z + nz * (d0 + .2), ri, .5) && clear(x + nx * (d0 + PW), z + nz * (d0 + PW), ri, .5) && (!W.coast.length || x + nx * (d0 + PW) > coastX(z + nz * (d0 + PW)) + 2)); }
        for (let k = 0; k < n; k++) {
          if (!ok[k] || !ok[k + 1]) continue;
          let k1 = k + 1; while (k1 < n && ok[k1 + 1]) k1++;
          const s0 = L * k / n, s1 = L * k1 / n; k = k1 - 1;
          const P = (s, d, y) => [a[0] + tx * s + nx * d, y, a[1] + tz * s + nz * d], out = [nx, 0, nz], inn = [-nx, 0, -nz];
          quadT(B, P(s0, d0, RYc), P(s1, d0, RYc), P(s1, d0, KY), P(s0, d0, KY), FACE, UV0.concat([[0, 0]]), -1, inn);
          quadT(B, P(s0, d0, KY), P(s1, d0, KY), P(s1, d0 + .3, KY), P(s0, d0 + .3, KY), KERB, UV0.concat([[0, 0]]), -1, [0, 1, 0]);
          const u0 = s0 / 2.4, u1 = s1 / 2.4, v0 = (d0 + .3) / 2.4, v1 = (d0 + PW) / 2.4;
          quadT(B, P(s0, d0 + .3, KY - .02), P(s1, d0 + .3, KY - .02), P(s1, d0 + PW, KY - .02), P(s0, d0 + PW, KY - .02), SLAB, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], TILE.SLABS, [0, 1, 0]);
          quadT(B, P(s0, d0 + PW, 0), P(s1, d0 + PW, 0), P(s1, d0 + PW, KY - .02), P(s0, d0 + PW, KY - .02), EDGE, UV0.concat([[0, 0]]), -1, out);
        }
      }
    });
  }
  // unit direction of the nearest street, so street furniture faces it
  function roadDir(x, z) { const r = nearRoad(x, z); return r[1] >= 0 ? [r[2], r[3]] : [1, 0]; }
  const circ = (x, z, r, n = 8) => Array.from({ length: n }, (_, i) => [x + Math.cos(i / n * Math.PI * 2) * r, z + Math.sin(i / n * Math.PI * 2) * r]);
  function buildStreetDetail(Wd) {
    const M = new Builder(), G = new Builder(), Y = .34, UP = [0, 1, 0];
    // crossings
    for (const [x, z, kind, ang] of Wd.x || []) {
      const ux = Math.cos(ang), uz = Math.sin(ang), vx = -uz, vz = ux, half = roadWidthAt(x, z) / 2;
      const Q = (a, b, y) => [x + ux * a + vx * b, y, z + uz * a + vz * b];
      if (kind === 'rainbowlights') {   // the multicoloured crossings at the Springfield Road traffic lights: colour between the studs, no zebra stripes or beacons
        const n = PROGRESS.length, bw = 2 * half / n;
        PROGRESS.forEach((c, k) => quad(M, Q(-1.6, -half + k * bw, Y - .01), Q(1.6, -half + k * bw, Y - .01), Q(1.6, -half + (k + 1) * bw, Y - .01), Q(-1.6, -half + (k + 1) * bw, Y - .01), rgb(c), UP));
      }
      if (kind === 'signals' || kind === 'rainbowlights' || kind === 'marked') {
        for (const a of [-1.7, 1.7]) for (let b = -half; b < half - .3; b += 1.1) quad(M, Q(a - .08, b, Y), Q(a + .08, b, Y), Q(a + .08, b + .55, Y), Q(a - .08, b + .55, Y), rgb('#fbf3ff'), UP);
        continue;
      }
      if (kind === 'rainbow') {   // Progress Pride colours under the white stripes, as painted on Dickson Road in March 2024
        const n = PROGRESS.length, bw = 2 * half / n;
        PROGRESS.forEach((c, k) => quad(M, Q(-1.6, -half + k * bw, Y - .01), Q(1.6, -half + k * bw, Y - .01), Q(1.6, -half + (k + 1) * bw, Y - .01), Q(-1.6, -half + (k + 1) * bw, Y - .01), rgb(c), UP));
      }
      for (let b = -half + .3; b < half - .3; b += 1) quad(M, Q(-1.5, b, Y + .01), Q(1.5, b, Y + .01), Q(1.5, b + .5, Y + .01), Q(-1.5, b + .5, Y + .01), rgb('#ffffff'), UP);
      for (const side of [-1, 1]) {   // Belisha beacons
        const p = Q(0, side * (half + .9), 0);
        for (let k = 0; k < 5; k++) prism(M, circ(p[0], p[2], .07, 6), k * .55, (k + 1) * .55, rgb(k % 2 ? '#ffffff' : '#1a1a1a'), rgb('#1a1a1a'));
        prism(G, circ(p[0], p[2], .24, 8), 2.75, 3.15, rgb('#ffb21e', 2.4), rgb('#ffcc55', 2.4));
      }
    }
    // furniture
    const RB = ['#ff2d55', '#ff9f1c', '#ffe45e', '#2ee59d', '#2fb8ff', '#b56bff'];
    const lamp = (x, z, glow) => { prism(M, circ(x, z, .09, 6), 0, 7, rgb('#3a3350'), rgb('#3a3350')); prism(M, circ(x, z, .18, 6), 7, 7.25, rgb('#3a3350'), rgb('#3a3350')); prism(G, circ(x, z, .32, 8), 6.55, 7, glow, glow); };
    for (const [k, x, z] of Wd.f || []) {
      // real lamp posts only; those on Dickson Road in Claremont carry the council's rainbow lighting
      if (k === 'lamp') { const nr = nearRoad(x, z), dick = W.roads.some(r => r.name === 'Dickson Road' && r.pts.some(p => Math.hypot(p[0] - x, p[1] - z) < 60)); lamp(x, z, dick && z > -140 && z < 300 ? rgb(RB[Math.floor(hash(x * 3, z * 7) * 6)], 2.2) : rgb('#ffd88a', 2)); }
      else if (k === 'tree') { prism(M, circ(x, z, .18, 6), 0, 2.4, rgb('#6b4a3a'), rgb('#6b4a3a')); prism(M, circ(x, z, 1.8, 7), 2.2, 4.6, rgb('#5e9e63'), rgb('#7cc07f')); prism(M, circ(x, z, 1.2, 7), 4.6, 5.8, rgb('#6db070'), rgb('#8fd191')); }
      else if (k === 'bench') prism(M, [[x - .8, z - .25], [x + .8, z - .25], [x + .8, z + .25], [x - .8, z + .25]], .4, .5, rgb('#8a6a4a'), rgb('#a07c58'));
      else if (k === 'signals') { prism(M, circ(x, z, .08, 6), 0, 3, rgb('#2a2440'), rgb('#2a2440')); prism(M, [[x - .18, z - .14], [x + .18, z - .14], [x + .18, z + .14], [x - .18, z + .14]], 2.2, 3.1, rgb('#1a1a1a'), rgb('#1a1a1a')); prism(G, circ(x, z, .11, 6), 2.85, 3.0, rgb('#ff3030', 2), rgb('#ff3030', 2)); prism(G, circ(x, z, .11, 6), 2.35, 2.5, rgb('#3dff6a', 2), rgb('#3dff6a', 2)); }
      else if (k === 'busstop') {   // bus stop pole and flag, turned to face the street
        const d = roadDir(x, z), F = (u, v) => [x + d[0] * u - d[1] * v, z + d[1] * u + d[0] * v];
        prism(M, circ(x, z, .05, 6), 0, 3.1, rgb('#cfd2d8'), rgb('#cfd2d8'));
        prism(M, [F(-.04, .05), F(.04, .05), F(.04, .55), F(-.04, .55)], 2.45, 3.0, rgb('#f4f4f2'), rgb('#e2e2e2'));
        prism(M, [F(-.05, .2), F(.05, .2), F(.05, .42), F(-.05, .42)], 2.62, 2.84, rgb('#d4202c'), rgb('#d4202c'));
        prism(M, [F(-.06, -.08), F(.06, -.08), F(.06, .08), F(-.06, .08)], 1.3, 1.75, rgb('#ffd23f'), rgb('#ffd23f'));
      }
      else if (k === 'postbox') {   // Royal Mail pillar box
        prism(M, circ(x, z, .3, 12), 0, .12, rgb('#1a1a1a'), rgb('#1a1a1a')); prism(M, circ(x, z, .27, 12), .12, 1.38, rgb('#d6202a'), rgb('#d6202a'));
        prism(M, circ(x, z, .32, 12), 1.38, 1.48, rgb('#c01c25'), rgb('#c01c25')); prism(M, circ(x, z, .2, 12), 1.48, 1.58, rgb('#c01c25'), rgb('#b01a22'));
        const d = roadDir(x, z); prism(M, [[x - d[1] * .27 - d[0] * .1, z + d[0] * .27 - d[1] * .1], [x - d[1] * .27 + d[0] * .1, z + d[0] * .27 + d[1] * .1], [x - d[1] * .29 + d[0] * .1, z + d[0] * .29 + d[1] * .1], [x - d[1] * .29 - d[0] * .1, z + d[0] * .29 - d[1] * .1]], 1.12, 1.16, rgb('#111'), rgb('#111'));
      }
      else if (k === 'phone') {   // red K6-style kiosk: frame, glazing bars, illuminated TELEPHONE fascia, domed roof
        const d = roadDir(x, z), F = (u, v) => [x + d[0] * u - d[1] * v, z + d[1] * u + d[0] * v], sq = (h, y0, y1, c, c2) => prism(M, [F(-h, -h), F(h, -h), F(h, h), F(-h, h)], y0, y1, c, c2 || c);
        const RED = rgb('#c8102e');
        sq(.5, 0, .14, rgb('#8c8c8c')); sq(.46, .14, 2.25, RED); sq(.5, 2.25, 2.42, RED); sq(.42, 2.42, 2.55, rgb('#b00d27'));
        for (let k2 = 0; k2 < 4; k2++) { const r = k2 * Math.PI / 2, c = Math.cos(r), sn = Math.sin(r), Q = (u, y) => { const p = F(u * c - .465 * sn, u * sn + .465 * c); return [p[0], y, p[1]]; }, out = (() => { const p = F(-sn, c), q = F(0, 0); return [p[0] - q[0], 0, p[1] - q[1]]; })();
          for (let r2 = 0; r2 < 6; r2++) for (let c2 = 0; c2 < 3; c2++) quad(M, Q(-.33 + c2 * .23, .62 + r2 * .22), Q(-.33 + c2 * .23 + .19, .62 + r2 * .22), Q(-.33 + c2 * .23 + .19, .8 + r2 * .22), Q(-.33 + c2 * .23, .8 + r2 * .22), rgb('#9db8c8', .9), out);
          quad(G, Q(-.3, 2.06), Q(.3, 2.06), Q(.3, 2.2), Q(-.3, 2.2), rgb('#fff6dc', 1.6), out); }
        prism(M, circ(x, z, .36, 8).map(p => p), 2.55, 2.7, RED, rgb('#b00d27'));
      }
      else if (k === 'bollard') { prism(M, circ(x, z, .1, 8), 0, .95, rgb('#1d1d22'), rgb('#1d1d22')); prism(M, circ(x, z, .105, 8), .78, .86, rgb('#e8e3d8'), rgb('#e8e3d8')); }
      else if (k === 'bike') {   // Sheffield cycle stands, square to the street
        const d = roadDir(x, z), F = (u, v) => [x + d[0] * u - d[1] * v, z + d[1] * u + d[0] * v], col = rgb('#3b3d45');
        for (const u of [-1, 0, 1]) { for (const v of [-.35, .35]) prism(M, circ(...F(u, v), .03, 6), 0, .82, col, col); prism(M, [F(u - .03, -.38), F(u + .03, -.38), F(u + .03, .38), F(u - .03, .38)], .78, .84, col, col); }
      }
      else if (k === 'parkent') { prism(M, circ(x, z, .05, 6), 0, 2.4, rgb('#cfd2d8'), rgb('#cfd2d8')); const d = roadDir(x, z); SIGNS.push({ text: 'P', k: 'p', x: x - d[1] * .03, z: z + d[0] * .03, nx: -d[1], nz: d[0], w: 1.2, y: 1.95 }); SIGNS.push({ text: 'P', k: 'p', x: x + d[1] * .03, z: z - d[0] * .03, nx: d[1], nz: -d[0], w: 1.2, y: 1.95 }); }
      else if (k === 'tramstop') {   // Promenade tram platform along the tracks; a shelter unless the named stop already has one
        const d = roadDir(x, z), F = (u, v) => [x + d[0] * u - d[1] * v, z + d[1] * u + d[0] * v];
        prism(M, [F(-14, -1.3), F(14, -1.3), F(14, 1.3), F(-14, 1.3)], 0, .35, rgb('#bdb8b0'), rgb('#d8d3ca'));
        const F3 = (u, v) => { const p = F(u, v); return [p[0], .36, p[1]]; };
        for (const v of [-1.22, 1.22]) quad(M, F3(-14, v - .08), F3(14, v - .08), F3(14, v + .08), F3(-14, v + .08), rgb('#ffd23f'), [0, 1, 0]);
        if (!(Wd.p || []).some(q => q[2] === 't' && Math.hypot(q[0] - x, q[1] - z) < 25)) {
          const glass = rgb('#bfe9ff', .9), frame = rgb('#2a1d4a'), roof = rgb('#ff2e88');
          prism(M, [F(-3, .55), F(3, .55), F(3, .65), F(-3, .65)], .35, 2.8, glass, glass);
          for (const u of [-3, 3]) prism(M, [F(u - .06, -.2), F(u + .06, -.2), F(u + .06, .65), F(u - .06, .65)], .35, 2.9, frame, frame);
          prism(M, [F(-3.3, -.4), F(3.3, -.4), F(3.3, .9), F(-3.3, .9)], 2.9, 3.05, roof, roof);
        }
      }
    }
    // areas
    for (const a of Wd.a) {
      const kind = a[0], line = dec(a, 2), pts = ring(line);
      if (kind === 'parking' && pts.length > 2) flat(M, pts, .1, rgb('#7a7880'), TILE.ASPHALT, 5);
      else if (kind === 'grass' && pts.length > 2) flat(M, pts, .13, rgb('#7fb86a'), TILE.SAND, 2);
      else if (kind === 'wall') for (let i = 0; i < line.length - 1; i++) { const p = line[i], q = line[i + 1], dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz) || 1, nx = -dz / L * .15, nz = dx / L * .15; prism(M, [[p[0] + nx, p[1] + nz], [q[0] + nx, q[1] + nz], [q[0] - nx, q[1] - nz], [p[0] - nx, p[1] - nz]], 0, 1.4, rgb('#a8705c'), rgb('#c4907a')); }
      else if (kind === 'tram') for (const d of [-.72, .72]) ribbon(M, offsetLine(line, d), .12, .32, rgb('#cfc8dc'), false);
    }
    M.chunks(W.matStatic, { receive: true });
    S.add(G.mesh(new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
  }
  // ------------------------------------------------------------------ no gaps: terraces along every street frontage OpenStreetMap leaves empty
  function fillGaps(Wd, RW) {
    const G = 2, X0 = W.bounds.x0, Z0 = W.bounds.z0, NX = Math.ceil((W.bounds.x1 - X0) / G), NZ = Math.ceil((W.bounds.z1 - Z0) / G), occ = new Uint8Array(NX * NZ);
    const cell = (x, z) => { const i = Math.floor((x - X0) / G), j = Math.floor((z - Z0) / G); return (i < 0 || j < 0 || i >= NX || j >= NZ) ? -1 : j * NX + i; };
    function markPoly(pts, pad) {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      for (let x = x0 - pad; x <= x1 + pad; x += G) for (let z = z0 - pad; z <= z1 + pad; z += G) { const k = cell(x, z); if (k >= 0 && inside(x, z, pts)) occ[k] = 1; }
    }
    function markLine(pts, half) {
      for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
        for (let x = Math.min(a[0], b[0]) - half; x <= Math.max(a[0], b[0]) + half; x += G) for (let z = Math.min(a[1], b[1]) - half; z <= Math.max(a[1], b[1]) + half; z += G) {
          const t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0, 1); if (Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t) <= half) { const k = cell(x, z); if (k >= 0) occ[k] = 1; } } }
    }
    for (const b of Wd.b) { const pts = ring(dec(b, 2)); if (pts.length > 2) markPoly(pts, 1); }
    for (const a of Wd.a) { const pts = ring(dec(a, 2)); if (a[0] === 'rail') markLine(dec(a, 2), 6); else if (a[0] !== 'coast' && pts.length > 2) markPoly(pts, 1); }
    for (const r of W.roads) markLine(r.pts, RW[r.cls] / 2 + 2);
    const free = (x, z) => { const k = cell(x, z); return k >= 0 && !occ[k] && (!W.coast.length || x > coastX(z) + 16); };
    const out = [], P = 6, DEPTH = 10.5;
    for (const r of W.roads) {
      if (r.cls < 1 || r.cls > 3) continue;
      const off = RW[r.cls] / 2 + 2.6;
      for (const side of [-1, 1]) for (let i = 0; i < r.pts.length - 1; i++) {
        const a = r.pts[i], b = r.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < P + 2) continue;
        const tx = dx / L, tz = dz / L, nx = -tz * side, nz = tx * side; let run = [];
        const flush = () => {
          if (run.length) {
            const s0 = run[0] - P / 2, s1 = run[run.length - 1] + P / 2, F = s => [a[0] + tx * s + nx * off, a[1] + tz * s + nz * off], Bk = s => [a[0] + tx * s + nx * (off + DEPTH), a[1] + tz * s + nz * (off + DEPTH)];
            const pts = [F(s0), F(s1), Bk(s1), Bk(s0)], h = 8.5 + hash(Math.round(pts[0][0]), Math.round(pts[0][1])) * 3.5;
            const enc = [Math.round(h * 10) / 10, '', Math.round(pts[0][0] * 10) / 10, Math.round(pts[0][1] * 10) / 10]; for (let k = 1; k < 4; k++) enc.push(Math.round((pts[k][0] - pts[k - 1][0]) * 10) / 10, Math.round((pts[k][1] - pts[k - 1][1]) * 10) / 10);
            out.push(enc);
          }
          run = [];
        };
        for (let s = P / 2 + 1; s < L - P / 2 - 1; s += P) {
          let ok = true;
          for (let u = -P / 2 + .5; u <= P / 2 - .5 && ok; u += 2.5) for (let v = .6; v <= DEPTH; v += 2.4) { const x = a[0] + tx * (s + u) + nx * (off + v), z = a[1] + tz * (s + u) + nz * (off + v); if (!free(x, z)) { ok = false; break; } }
          if (ok) { run.push(s); for (let u = -P / 2; u <= P / 2; u += G) for (let v = 0; v <= DEPTH + 1; v += G) { const k = cell(a[0] + tx * (s + u) + nx * (off + v), a[1] + tz * (s + u) + nz * (off + v)); if (k >= 0) occ[k] = 1; } if (run.length >= 8) flush(); }
          else flush();
        }
        flush();
      }
    }
    return out;
  }
  // the street the car is on, for the HUD: real name and speed limit from OpenStreetMap
  function roadAt(x, z) {
    let best = null, bd = 9;
    for (const r of W.roads) { if (r.cls === 4) continue; const p0 = r.pts[0]; if (Math.abs(p0[0] - x) > 900 && Math.abs(p0[1] - z) > 900) continue;
      for (let i = 0; i < r.pts.length - 1; i++) { const a = r.pts[i], b = r.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0, 1), d = Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t) - r.w / 2; if (d < bd && (r.name || !best)) { bd = d; best = r; } } }
    return best;
  }
  function addCollider(pts) { for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], s = [a[0], a[1], b[0], b[1]]; const x0 = Math.floor(Math.min(a[0], b[0]) / 20), x1 = Math.floor(Math.max(a[0], b[0]) / 20), z0 = Math.floor(Math.min(a[1], b[1]) / 20), z1 = Math.floor(Math.max(a[1], b[1]) / 20); for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const k = x + ',' + z; let c = W.cells.get(k); if (!c) W.cells.set(k, c = []); c.push(s); } } }

  // --- venues: glowing building, light beam, spinning gem, label
  const STAY = new T.Color('#ff4fa3'), BAR = new T.Color('#33d1ff');
  const beamTex = canvasTex(4, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.7, 'rgba(255,255,255,.3)'); g.addColorStop(1, 'rgba(255,255,255,.85)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  function venueBuilding(pin, pts, h, pois) {
    // our venues look like real Blackpool buildings too, with their name in neon; the beam and gem still mark them
    const col = pin.k === 'stay' ? STAY : BAR, B = new Builder(), G2 = new Builder();
    const own = (pois && pois.length) ? pois.map(q => Object.assign({}, q, { k: pin.k === 'stay' ? 'g' : 'b' })) : [{ x: pin.x, z: pin.z, k: pin.k === 'stay' ? 'g' : 'b', name: pin.n }];
    if (pin.k !== 'stay') own.forEach(q => q.k = 'b');
    blackpoolHouse(B, G2, pts, h, Math.abs(area(pts)), hash(pin.x * 7, pin.z * 11), own);
    if (G2.p.length) S.add(G2.mesh(new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
    const m = B.mesh(atlasMat({ emissive: col, emissiveIntensity: .05 }));
    m.castShadow = m.receiveShadow = true; m.userData.pin = pin; S.add(m); venueMeshes.push(m);
    const c = centroid(pts); pin.cx = c[0]; pin.cz = c[1]; pin.h = h;
    const beam = new T.Mesh(new T.CylinderGeometry(1.4, 1.4, 90, 14, 1, true), new T.MeshBasicMaterial({ map: beamTex, color: col.clone().multiplyScalar(1.6), transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false }));
    beam.position.set(c[0], h + 45, c[1]); S.add(beam);
    const gem = new T.Mesh(new T.OctahedronGeometry(2.2, 0), new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 2.2, roughness: .15, metalness: .4, flatShading: true }));
    gem.position.set(c[0], h + 17, c[1]); gem.castShadow = true; gem.userData.pin = pin; S.add(gem); venueMeshes.push(gem);
    const ban = makeBanner(pin.n, pin.k === 'stay'); ban.position.set(c[0], h + 3.5, c[1]); S.add(ban); banners.push(ban);
    beacons.push({ beam, gem, lab: ban, pin, base: h });
  }

  // every venue gets a festival banner above it with its name: always shown, never hidden by other labels
  const banners = [];
  function makeBanner(text, stay) {
    const cvs = document.createElement('canvas'), x = cvs.getContext('2d'), F = s => `800 ${s}px "Bricolage Grotesque", system-ui, sans-serif`;
    let fs = 64; x.font = F(fs); while (x.measureText(text).width > 760 && fs > 30) { fs -= 2; x.font = F(fs); }
    const tw = Math.ceil(x.measureText(text).width), W2 = Math.max(420, tw + 200), H2 = 150; cvs.width = W2; cvs.height = H2 + 40;
    const col = stay ? '#ff2e88' : '#19c3e6';
    // bunting string and flags along the top
    x.strokeStyle = '#fff6ec'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 10); x.quadraticCurveTo(W2 / 2, 26, W2, 10); x.stroke();
    const RB = ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'];
    for (let i = 0, n = Math.floor(W2 / 34); i < n; i++) { const fx = 12 + i * 34, fy = 10 + 16 * Math.sin(Math.PI * fx / W2) * .9; x.fillStyle = RB[i % 6]; x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + 24, fy); x.lineTo(fx + 12, fy + 22); x.fill(); }
    // the board
    const y0 = 36, r = 26; x.fillStyle = '#1a1033'; x.beginPath(); x.moveTo(r, y0); x.arcTo(W2, y0, W2, y0 + H2, r); x.arcTo(W2, y0 + H2, 0, y0 + H2, r); x.arcTo(0, y0 + H2, 0, y0, r); x.arcTo(0, y0, W2, y0, r); x.fill();
    x.lineWidth = 6; x.strokeStyle = col; x.stroke();
    const g = x.createLinearGradient(0, 0, W2, 0); RB.forEach((c, i) => g.addColorStop(i / 5, c)); x.fillStyle = g; x.fillRect(18, y0 + H2 - 18, W2 - 36, 7);
    x.font = `800 26px Inter, system-ui, sans-serif`; x.fillStyle = col; x.textAlign = 'center'; x.fillText(stay ? 'STAY' : 'BAR', W2 / 2, y0 + 38);
    x.font = F(fs); x.fillStyle = '#ffffff'; x.shadowColor = col; x.shadowBlur = 18; x.textBaseline = 'middle'; x.fillText(text, W2 / 2, y0 + 90); x.shadowBlur = 0;
    const t = new T.CanvasTexture(cvs); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
    const hgt = 5.6; sp.scale.set(hgt * cvs.width / cvs.height, hgt, 1); sp.center.set(.5, 0); sp.renderOrder = 9; sp.userData.base = [sp.scale.x, sp.scale.y];
    return sp;
  }
  // keep far banners readable: grow gently with distance
  function sizeBanners() {
    for (const b of banners) { const d = b.position.distanceTo(cam.position), k = clamp(d / 140, 1, 3.2); b.scale.set(b.userData.base[0] * k, b.userData.base[1] * k, 1); }
  }
  function makeLabel(text, dot, tag, big) {
    const fs = big ? 40 : 34, pad = 22, F = s => `700 ${s}px system-ui,-apple-system,"Segoe UI",sans-serif`;
    const cvs = document.createElement('canvas'), x = cvs.getContext('2d');
    x.font = F(fs); const tw = Math.ceil(x.measureText(text).width);
    x.font = `800 ${Math.round(fs * .55)}px system-ui,sans-serif`; const tagw = tag ? Math.ceil(x.measureText(tag.toUpperCase()).width) + 16 : 0;
    cvs.width = tw + pad * 2 + (dot ? 34 : 0) + tagw; cvs.height = fs + 34;
    const r = cvs.height / 2; x.fillStyle = 'rgba(22,12,44,.84)'; x.beginPath(); x.moveTo(r, 0); x.arcTo(cvs.width, 0, cvs.width, cvs.height, r); x.arcTo(cvs.width, cvs.height, 0, cvs.height, r); x.arcTo(0, cvs.height, 0, 0, r); x.arcTo(0, 0, cvs.width, 0, r); x.fill();
    let cx = pad; if (dot) { x.fillStyle = dot; x.beginPath(); x.arc(cx + 10, r, 10, 0, 7); x.fill(); cx += 34; }
    x.font = F(fs); x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText(text, cx, r + 2); cx += tw + 14;
    if (tag) { x.font = `800 ${Math.round(fs * .55)}px system-ui,sans-serif`; x.fillStyle = dot; x.fillText(tag.toUpperCase(), cx, r + 2); }
    const t = new T.CanvasTexture(cvs); t.colorSpace = T.SRGBColorSpace;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: t, depthWrite: false, depthTest: false, sizeAttenuation: false, transparent: true, fog: false }));
    const H = big ? .05 : .042; sp.scale.set(H * cvs.width / cvs.height, H, 1); sp.center.set(.5, 0); sp.renderOrder = 10;
    labels.push(sp); return sp;
  }
  function landmarkLabels(Wd) {
    const want = { 'Blackpool Tower, Ballroom and Circus': 'Blackpool Tower', 'Winter Gardens': 'Winter Gardens', 'Blackpool North': 'Blackpool North station', 'Grand Theatre': 'Grand Theatre' };
    for (const b of Wd.b) if (want[b[1]]) { const pts = ring(dec(b, 2)), c = centroid(pts), lab = makeLabel(want[b[1]], '#ffd23f', '', true); lab.position.set(c[0], b[1].includes('Tower') ? 172 : 30, c[1]); S.add(lab); beacons.push({ lab, far: true }); delete want[b[1]]; }
  }
  function streetLabels(named) {
    const KEEP = /^(Queen Street|Talbot Road|Dickson Road|Promenade|Abingdon Street|Church Street|Topping Street|Lord Street|Springfield Road|Corporation Street|Market Street|Clifton Street|Cookson Street|Banks Street|Deansgate|High Street|Pleasant Street|Charles Street|Buchanan Street|Albert Road|King Street|Birley Street|Talbot Square)$/;
    for (const [name, ways] of named) {
      if (!KEEP.test(name)) continue;
      let best = null, bl = 0;
      for (const pts of ways) for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); if (l > bl) { bl = l; best = [pts[i], pts[i + 1]]; } }
      if (!best || bl < 30) continue;
      const [a, b] = best; let ang = Math.atan2(b[1] - a[1], b[0] - a[0]); if (Math.cos(ang) < 0) ang += Math.PI;
      const tex = canvasTex(512, 64, (x, w, h) => { x.font = '800 38px system-ui,"Segoe UI",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(255,255,255,.9)'; x.fillText(name.toUpperCase(), w / 2, h / 2 + 2); });
      const wlen = Math.min(bl * .8, 40), m = new T.Mesh(new T.PlaneGeometry(wlen, wlen / 8), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.rotation.z = -ang; m.position.set((a[0] + b[0]) / 2, .45, (a[1] + b[1]) / 2); m.renderOrder = 2; S.add(m);
    }
  }

  // --- Blackpool Tower: procedural iron lattice, 158 m to the flag
  function buildTower(x, z) {
    const g = new T.Group(); g.position.set(x, 24, z); S.add(g);
    const mat = new T.MeshStandardMaterial({ color: '#b3333f', roughness: .5, metalness: .4 }), segs = [];
    const half = y => lerp(13, 3.2, Math.pow(y / 112, .78)), H = 112, N = 18;
    const C4 = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    for (let i = 0; i < N; i++) {
      const y0 = H * i / N, y1 = H * (i + 1) / N, h0 = half(y0), h1 = half(y1);
      for (let k = 0; k < 4; k++) {
        const a = C4[k], b = C4[(k + 1) % 4];
        segs.push([[a[0] * h0, y0, a[1] * h0], [a[0] * h1, y1, a[1] * h1], .95]);
        segs.push([[a[0] * h1, y1, a[1] * h1], [b[0] * h1, y1, b[1] * h1], .38]);
        segs.push([[a[0] * h0, y0, a[1] * h0], [b[0] * h1, y1, b[1] * h1], .22]);
        segs.push([[b[0] * h0, y0, b[1] * h0], [a[0] * h1, y1, a[1] * h1], .22]);
      }
    }
    for (let k = 0; k < 4; k++) { const a = C4[k], b = C4[(k + 1) % 4]; for (let s = 0; s < 6; s++) { const t0 = s / 6, t1 = (s + 1) / 6, h0 = 13; segs.push([[lerp(a[0], b[0], t0) * h0, 0, lerp(a[1], b[1], t0) * h0], [lerp(a[0], b[0], (t0 + t1) / 2) * h0 * .96, 9 - Math.abs(t0 + t1 - 1) * 9, lerp(a[1], b[1], (t0 + t1) / 2) * h0 * .96], .3]); } }
    const im = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), mat, segs.length), M = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
    segs.forEach(([a, b, t], i) => { const A = new T.Vector3(...a), Bv = new T.Vector3(...b), d = Bv.clone().sub(A), l = d.length(); q.setFromUnitVectors(up, d.normalize()); M.compose(A.clone().add(Bv).multiplyScalar(.5), q, new T.Vector3(t, l, t)); im.setMatrixAt(i, M); });
    im.castShadow = true; g.add(im);
    const cream = new T.MeshStandardMaterial({ color: '#f4efe6', roughness: .5 });
    const deck = new T.Mesh(new T.BoxGeometry(8.6, 7, 8.6), withWindows(cream.clone(), 1.5)); deck.position.y = 115.5; deck.castShadow = true; g.add(deck);
    const roof = new T.Mesh(new T.CylinderGeometry(2.2, 5.6, 10, 8), mat); roof.position.y = 124; roof.rotation.y = Math.PI / 8; g.add(roof);
    const nest = new T.Mesh(new T.CylinderGeometry(1.4, 1.9, 4.2, 8), cream); nest.position.y = 131; g.add(nest);
    const cap = new T.Mesh(new T.ConeGeometry(1.6, 3.5, 8), mat); cap.position.y = 134.8; g.add(cap);
    const mast = new T.Mesh(new T.CylinderGeometry(.2, .3, 16, 6), mat); mast.position.y = 143; g.add(mast);
    const flagTex = canvasTex(1, 6, (c) => ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'].forEach((col, i) => { c.fillStyle = col; c.fillRect(0, i, 1, 1); })); flagTex.magFilter = T.NearestFilter;
    const flagG = new T.PlaneGeometry(4.6, 2.8, 12, 1); flagG.translate(2.3, 0, 0);
    const flag = new T.Mesh(flagG, new T.MeshBasicMaterial({ map: flagTex, side: T.DoubleSide })); flag.position.set(0, 149.2, 0); g.add(flag);
    tower = { g, flag, x, z, lights: [], base: flagG.attributes.position.array.slice() };
    // LED strips: dense points up each corner leg (colours flow upward), rings round the deck and crown
    for (let i = 0; i < 4; i++) for (let y = 1; y < 112; y += .9) { const h = half(y) + .45, a = C4[i]; tower.lights.push([x + a[0] * h, 24 + y, z + a[1] * h, y]); }
    for (const [yy, r] of [[112.2, 4.5], [119.2, 4.5], [127, 2.5]]) for (let k = 0; k < 40; k++) { const t = k / 40 * Math.PI * 2; tower.lights.push([x + Math.cos(t) * r * 1.2, 24 + yy, z + Math.sin(t) * r * 1.2, yy]); }
    const heart = new T.Sprite(new T.SpriteMaterial({ map: canvasTex(128, 128, (c) => { c.shadowColor = '#ff4fd8'; c.shadowBlur = 18; c.lineWidth = 9; c.strokeStyle = '#ffb3ec'; c.fillStyle = '#7a1fa8'; c.beginPath(); c.moveTo(64, 104); c.bezierCurveTo(8, 70, 22, 22, 64, 46); c.bezierCurveTo(106, 22, 120, 70, 64, 104); c.closePath(); c.fill(); c.stroke(); }), transparent: true, depthWrite: false, color: new T.Color(2.2, 2.2, 2.2) }));
    heart.scale.set(13, 13, 1); heart.position.set(x, 24 + 15, z); S.add(heart); tower.heart = heart;
  }

  // --- North Pier on its legs
  function buildPier(pts, name) {
    if (pts.length < 3) return;
    const B = new Builder(); prism(B, pts, 4.2, 5, rgb('#c79a6c'), rgb('#e0b98c'));
    const deck = B.mesh(new T.MeshStandardMaterial({ vertexColors: true, roughness: .8, flatShading: true })); deck.castShadow = deck.receiveShadow = true; S.add(deck);
    const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]), legs = [];
    for (let x = Math.min(...xs); x < Math.max(...xs); x += 8) for (let z = Math.min(...zs); z < Math.max(...zs); z += 8) if (inside(x, z, pts)) legs.push([x, z]);
    const im = new T.InstancedMesh(new T.CylinderGeometry(.35, .35, 5.2, 6), new T.MeshStandardMaterial({ color: '#4c3d52', roughness: .9 }), legs.length), M = new T.Matrix4();
    legs.forEach(([x, z], i) => { M.makeTranslation(x, 1.6, z); im.setMatrixAt(i, M); }); im.castShadow = true; S.add(im);
    const c = centroid(pts), lab = makeLabel(name || 'North Pier', '#ffd23f', '', true); lab.position.set(c[0], 16, c[1]); S.add(lab); beacons.push({ lab, far: true });
    W.pier = pts;
  }

  // --- Promenade Illuminations: festoons between lamp posts on both sides, plus lights up the Tower
  const BULB = ['#ff2e63', '#ff9f1c', '#ffe45e', '#2ec4b6', '#3a86ff', '#c77dff', '#ffffff'].map(c => new T.Color(c));
  function buildIlluminations(ways) {
    const posts = [], pts = [];
    for (const w of ways) for (const side of [-1, 1]) {
      { const a0 = w[0], b0 = w[w.length - 1], dz0 = b0[1] - a0[1]; if (-dz0 * side > 0) continue; }
      let carry = 0, run = [];
      for (let i = 0; i < w.length - 1; i++) {
        const a = w[i], b = w[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 1) continue;
        const nx = -dz / l * 10 * side, nz = dx / l * 10 * side;
        for (let s = carry; s < l; s += 22) run.push([a[0] + dx * s / l + nx, a[1] + dz * s / l + nz]);
        carry = ((carry - l) % 22 + 22) % 22;
      }
      for (let i = 0; i < run.length; i++) {
        posts.push(run[i]);
        if (i && Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1]) < 30) for (let k = 0; k < 9; k++) { const t = k / 9, sag = Math.sin(t * Math.PI) * 1.9; pts.push([lerp(run[i - 1][0], run[i][0], t), 7.3 - sag, lerp(run[i - 1][1], run[i][1], t)]); }
      }
    }
    const postM = new T.InstancedMesh(new T.CylinderGeometry(.13, .2, 7.8, 6), new T.MeshStandardMaterial({ color: '#2f2a3d', roughness: .5, metalness: .4 }), posts.length), M = new T.Matrix4();
    posts.forEach(([x, z], i) => { M.makeTranslation(x, 3.9, z); postM.setMatrixAt(i, M); }); postM.castShadow = true; S.add(postM);
    const crowns = new T.InstancedMesh(new T.SphereGeometry(.42, 6, 4), new T.MeshBasicMaterial({ color: new T.Color('#fff2c8').multiplyScalar(3) }), posts.length);
    posts.forEach(([x, z], i) => { M.makeTranslation(x, 8, z); crowns.setMatrixAt(i, M); }); S.add(crowns);
    const all = pts.concat(tower ? tower.lights : []);
    bulbs = new T.InstancedMesh(new T.OctahedronGeometry(.22, 0), new T.MeshBasicMaterial(), all.length);
    all.forEach(([x, y, z, ty], i) => { if (ty) M.makeScale(1.7, 1.7, 1.7).setPosition(x, y, z); else M.makeTranslation(x, y, z); bulbs.setMatrixAt(i, M); bulbs.setColorAt(i, new T.Color('#fff')); });
    bulbs.userData.prom = pts.length; bulbs.userData.ty = all.map(p => p[3] || 0);
    S.add(bulbs);
    const hg = new T.BufferGeometry(); hg.setAttribute('color', new T.Float32BufferAttribute(new Float32Array(all.length * 3), 3));
    const glow = canvasTex(64, 64, (x, w, h) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.2, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    hg.setAttribute('position', new T.Float32BufferAttribute(all.flatMap(p => [p[0], p[1], p[2]]), 3));
    halos = new T.Points(hg, new T.PointsMaterial({ size: 2.6, map: glow, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    S.add(halos); bulbs.userData.n = all.length;
  }

  // --- seagulls circling over the Promenade
  function buildGulls() {
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute([0, 0, .5, -1.4, .15, -.2, 0, 0, -.4, 0, 0, .5, 1.4, .15, -.2, 0, 0, -.4], 3)); geo.computeVertexNormals();
    const mat = new T.MeshStandardMaterial({ color: '#fbfbff', side: T.DoubleSide, roughness: .8 });
    const cx = tower ? tower.x + 40 : 0, cz = tower ? tower.z - 200 : 0;
    for (let i = 0; i < 14; i++) { const m = new T.Mesh(geo.clone(), mat); m.scale.setScalar(1.3); S.add(m); gulls.push({ m, r: 60 + Math.random() * 160, h: 34 + Math.random() * 40, s: (.12 + Math.random() * .1) * (i % 2 ? 1 : -1), o: Math.random() * 7, cx: cx + (Math.random() - .5) * 120, cz: cz + (Math.random() - .5) * 500 }); }
  }

  // ------------------------------------------------------------------ the car: pink soft-top 4x4 (unbadged) with Jay and Theo
  const car = new T.Group(), chassis = new T.Group(); car.add(chassis);
  const PINK = new T.MeshPhysicalMaterial({ color: '#ff3d9a', roughness: .26, metalness: .12, clearcoat: 1, clearcoatRoughness: .08, sheen: .4, sheenColor: new T.Color('#ffd0ea') });
  const BLACK = new T.MeshStandardMaterial({ color: '#1d1b22', roughness: .65 }), WHITE = new T.MeshStandardMaterial({ color: '#f5f1ec', roughness: .55 });
  const CHROME = new T.MeshStandardMaterial({ color: '#e6e6f0', roughness: .12, metalness: 1 });
  const mk = (geo, mat, x, y, z, par = chassis) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; par.add(m); return m; };
  const RB = (w, h, d) => new T.BoxGeometry(w, h, d);
  (function buildCar() {
    const sh = new T.Shape(); sh.moveTo(-2.0, .48); sh.lineTo(-1.82, .48); sh.absarc(-1.25, .44, .57, Math.PI, 0, true); sh.lineTo(.68, .48); sh.absarc(1.25, .44, .57, Math.PI, 0, true);
    sh.lineTo(2.02, .48); sh.lineTo(2.06, 1.18); sh.lineTo(1.92, 1.34); sh.lineTo(.55, 1.38); sh.lineTo(.38, 1.28); sh.lineTo(-1.94, 1.28); sh.lineTo(-2.02, 1.18); sh.closePath();
    const side = new T.ExtrudeGeometry(sh, { depth: .1, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 3, curveSegments: 12 });
    side.rotateY(-Math.PI / 2);
    mk(side, PINK, .9, 0, 0); mk(side, PINK, -.8, 0, 0);
    mk(RB(1.72, .7, 1.45), PINK, 0, 1.0, 1.28);
    mk(RB(1.66, .12, 1.1), PINK, 0, 1.4, 1.36);
    mk(RB(1.0, .07, .5), PINK, 0, 1.47, 1.3);
    mk(RB(1.72, .78, .5), PINK, 0, .9, -1.72);
    mk(RB(1.72, .22, 3.2), BLACK, 0, .58, -.12);
    mk(RB(1.15, .52, .06), new T.MeshStandardMaterial({ color: '#2a2732', roughness: .4, metalness: .5 }), 0, 1.0, 2.03);
    for (let i = -2; i <= 2; i++) mk(RB(.07, .44, .04), CHROME, i * .2, 1.0, 2.07);
    const lampM = new T.MeshStandardMaterial({ color: '#fff7d6', emissive: '#ffe9a8', emissiveIntensity: 3 });
    [-1, 1].forEach(s => { mk(new T.CylinderGeometry(.16, .16, .08, 20).rotateX(Math.PI / 2), CHROME, s * .7, 1.02, 2.04); mk(new T.CylinderGeometry(.12, .12, .1, 20).rotateX(Math.PI / 2), lampM, s * .7, 1.02, 2.07); });
    [-1, 1].forEach(s => mk(RB(.12, .2, .06), new T.MeshStandardMaterial({ color: '#ff2a2a', emissive: '#ff1a1a', emissiveIntensity: 2.4 }), s * .78, 1.05, -1.99));
    mk(RB(1.95, .24, .3), BLACK, 0, .62, 2.12); mk(RB(1.95, .24, .3), BLACK, 0, .62, -2.08);
    [-1, 1].forEach(s => [-1.25, 1.25].forEach(z => { const fl = mk(new T.TorusGeometry(.6, .07, 6, 16, Math.PI), BLACK, s * .98, .45, z); fl.rotation.y = Math.PI / 2; }));
    mk(RB(1.66, .07, .07), BLACK, 0, 2.18, .5); [-1, 1].forEach(s => mk(RB(.07, .82, .07), BLACK, s * .82, 1.78, .45));
    const glass = mk(RB(1.6, .76, .03), new T.MeshPhysicalMaterial({ color: '#cfe8ff', transparent: true, opacity: .3, roughness: .02, metalness: .1 }), 0, 1.78, .46); glass.castShadow = false;
    [-1, 1].forEach(s => mk(RB(.09, 1.0, .09), BLACK, s * .8, 1.78, -1.1)); mk(RB(1.68, .09, .09), BLACK, 0, 2.27, -1.1);
    const top = mk(new T.CapsuleGeometry(.24, 1.3, 4, 10).rotateZ(Math.PI / 2), new T.MeshStandardMaterial({ color: '#2b2036', roughness: .9 }), 0, 1.48, -1.62); top.scale.set(1, .9, 1.25);
    mk(new T.CylinderGeometry(.42, .42, .26, 24).rotateX(Math.PI / 2), BLACK, 0, 1.12, -2.18); mk(new T.CylinderGeometry(.26, .26, .28, 6).rotateX(Math.PI / 2), PINK, 0, 1.12, -2.19);
    [-1, 1].forEach(s => mk(RB(.22, .14, .06), BLACK, s * 1.02, 1.52, .58));
    [-.42, .42].forEach(x => { mk(RB(.6, .16, .62), WHITE, x, .9, -.42); mk(RB(.6, .72, .16), WHITE, x, 1.28, -.76); mk(RB(.46, .2, .12), WHITE, x, 1.72, -.78); });
    mk(RB(1.66, .28, .3), new T.MeshStandardMaterial({ color: '#f4eef7' }), 0, 1.28, .36);
    const sw = mk(new T.TorusGeometry(.19, .035, 8, 20), BLACK, -.42, 1.46, .16); sw.rotation.x = -.95;
  })();
  function person(o) {
    const g = new T.Group(); g.position.set(o.x, .98, -.42); chassis.add(g);
    const skin = new T.MeshStandardMaterial({ color: o.skin, roughness: .6 });
    const torso = mk(new T.CapsuleGeometry(.2, .32, 4, 12), new T.MeshStandardMaterial({ color: o.top, roughness: .7 }), 0, .42, 0, g); torso.scale.set(1.15, 1, .78);
    if (o.stripes) o.stripes.forEach((c, i) => { const s = mk(new T.CylinderGeometry(.235, .235, .045, 18, 1, true), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide }), 0, .5 - i * .05, 0, g); s.scale.set(1.0, 1, .7); });
    mk(new T.CylinderGeometry(.07, .08, .1, 10), skin, 0, .7, 0, g);
    const head = new T.Group(); head.position.set(0, .87, .01); g.add(head);
    const hm = mk(new T.SphereGeometry(.16, 24, 16), skin, 0, 0, 0, head); hm.scale.set(1, 1.08, 1);
    [-1, 1].forEach(s => mk(new T.SphereGeometry(.018, 8, 8), new T.MeshBasicMaterial({ color: '#1b1420' }), s * .055, .02, .145, head));
    mk(new T.TorusGeometry(.045, .01, 6, 12, Math.PI), new T.MeshBasicMaterial({ color: '#7a2a3a' }), 0, -.05, .145, head).rotation.z = Math.PI;
    o.hair(head);
    const armL = new T.Group(), armR = new T.Group(); armL.position.set(-.27, .58, 0); armR.position.set(.27, .58, 0); g.add(armL, armR);
    [armL, armR].forEach(a => { mk(new T.CapsuleGeometry(.055, .36, 3, 8), skin, 0, -.2, 0, a); mk(new T.SphereGeometry(.06, 10, 8), skin, 0, -.42, 0, a); });
    return { g, armL, armR, head };
  }
  const jay = person({ x: -.42, skin: '#9b6440', top: '#f7f7f2', hair: (h) => { const hm = new T.MeshStandardMaterial({ color: '#1e1612', roughness: .9 }); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? .1 : .125; mk(new T.SphereGeometry(.072, 10, 8), hm, Math.cos(a) * r, .12 + (i % 3) * .018, Math.sin(a) * r - .02, h); } mk(new T.SphereGeometry(.1, 10, 8), hm, 0, .17, -.02, h); const sh = mk(RB(.25, .05, .05), new T.MeshStandardMaterial({ color: '#111', roughness: .1, metalness: .7 }), 0, .13, .1, h); sh.rotation.x = -.5; } });
  const theo = person({ x: .42, skin: '#f1c7a3', top: '#232029', stripes: ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'], hair: (h) => { const cap = mk(new T.SphereGeometry(.166, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2.3), new T.MeshStandardMaterial({ color: '#f3e3a0', roughness: .95 }), 0, .015, 0, h); cap.scale.set(1, 1.08, 1); mk(RB(.26, .055, .04), new T.MeshStandardMaterial({ color: '#ff3d9a', roughness: .1, metalness: .6 }), 0, .03, .15, h); } });
  jay.armL.rotation.set(-1.1, 0, -.15); jay.armR.rotation.set(-1.1, 0, .15);
  theo.armL.rotation.set(-.5, 0, -.1);
  const wheels = [];
  [[-.86, 1.25, 1], [.86, 1.25, 1], [-.86, -1.25, 0], [.86, -1.25, 0]].forEach(([x, z, front]) => {
    const pivot = new T.Group(); pivot.position.set(x, .44, z); car.add(pivot);
    const spin = new T.Group(); pivot.add(spin);
    mk(new T.CylinderGeometry(.44, .44, .32, 28).rotateZ(Math.PI / 2), BLACK, 0, 0, 0, spin);
    mk(new T.CylinderGeometry(.27, .27, .34, 18).rotateZ(Math.PI / 2), new T.MeshStandardMaterial({ color: '#efe9f3', roughness: .25, metalness: .5 }), 0, 0, 0, spin);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; mk(new T.CylinderGeometry(.03, .03, .36, 6).rotateZ(Math.PI / 2), CHROME, 0, Math.cos(a) * .15, Math.sin(a) * .15, spin); }
    wheels.push({ pivot, spin, front });
  });
  const head = new T.SpotLight('#fff1c9', 0, 70, .55, .6, 1.2); head.position.set(0, 1.1, 2.1); head.target.position.set(0, 0, 16); car.add(head, head.target);
  // soft contact shadow under the car (always there, even far from the sun's shadow map)
  const blob = new T.Mesh(new T.PlaneGeometry(3.4, 5.4), new T.MeshBasicMaterial({ map: canvasTex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 4, 32, 32, 32); g.addColorStop(0, 'rgba(20,10,30,.55)'); g.addColorStop(1, 'rgba(20,10,30,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }), transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = .36; car.add(blob);
  car.traverse(o => { if (o.isMesh && o !== blob) o.castShadow = true; });
  S.add(car);

  // ------------------------------------------------------------------ driving model
  const st = { x: 0, z: 0, h: Math.PI, v: 0, steer: 0, pitch: 0, roll: 0, auto: null, arrived: null, last: null };
  const keys = {}, pad = { x: 0, y: 0, on: false };
  let started = false, intro = 0;
  function startPos() {
    const q = new URLSearchParams(location.search).get('to');
    const near = PINS.find(p => p.slug === 'the-flying-handbag') || PINS[0];
    const n = nearestNode(near.x, near.z); st.x = n.x; st.z = n.z;
    if (n.e[0]) st.h = Math.atan2(n.e[0][0].x - n.x, n.e[0][0].z - n.z);
    return q ? PINS.find(p => p.slug === q) : null;
  }
  function collide() {
    const r = 1.9, cx = Math.floor(st.x / 20), cz = Math.floor(st.z / 20);
    let hit = false;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const cell = W.cells.get((cx + i) + ',' + (cz + j)); if (!cell) continue;
      for (const s of cell) {
        const dx = s[2] - s[0], dz = s[3] - s[1], l2 = dx * dx + dz * dz || 1;
        const t = clamp(((st.x - s[0]) * dx + (st.z - s[1]) * dz) / l2, 0, 1), px = s[0] + dx * t, pz = s[1] + dz * t;
        const ex = st.x - px, ez = st.z - pz, d = Math.hypot(ex, ez);
        if (d < r && d > 1e-4) { st.x = px + ex / d * r; st.z = pz + ez / d * r; hit = true; }
      }
    }
    if (hit) st.v *= .9;
    if (W.coast.length) { const cxv = coastX(st.z); if (st.x < cxv + 1) { st.x = cxv + 1; st.v *= .9; } }
    const b = W.bounds; if (st.x < b.x0 || st.x > b.x1 || st.z < b.z0 || st.z > b.z1) { st.x = clamp(st.x, b.x0, b.x1); st.z = clamp(st.z, b.z0, b.z1); st.v *= .5; }
  }
  function coastX(z) { const c = W.coast; let lo = 0, hi = c.length - 1; if (z <= c[0][1]) return c[0][0]; if (z >= c[hi][1]) return c[hi][0]; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m][1] < z) lo = m; else hi = m; } const a = c[lo], b = c[hi]; return lerp(a[0], b[0], (z - a[1]) / ((b[1] - a[1]) || 1)); }

  // --- routing on the real street graph, then a smooth autopilot
  function clearance(x, z) {
    const cx = Math.floor(x / 20), cz = Math.floor(z / 20); let best = 1e9;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const cell = W.cells.get((cx + i) + ',' + (cz + j)); if (!cell) continue;
      for (const s of cell) { const dx = s[2] - s[0], dz = s[3] - s[1], l2 = dx * dx + dz * dz || 1, t = clamp(((x - s[0]) * dx + (z - s[1]) * dz) / l2, 0, 1); best = Math.min(best, Math.hypot(x - s[0] - dx * t, z - s[1] - dz * t)); } }
    return best;
  }
  // drop street-graph edges too tight for the car, then keep the largest connected network
  function pruneGraph() {
    for (const n of W.nodes.values()) n.e = n.e.filter(([m]) => { const l = Math.hypot(m.x - n.x, m.z - n.z), k = Math.max(1, Math.ceil(l / 2)); for (let i = 0; i <= k; i++) { const t = i / k; if (clearance(lerp(n.x, m.x, t), lerp(n.z, m.z, t)) < 2.2) return false; } return true; });
    // keep the largest strongly connected network, so with one-way streets you can always get there AND back
    const N = [...W.nodes.values()], rev = new Map(N.map(n => [n, []]));
    for (const n of N) for (const [m] of n.e) rev.get(m).push(n);
    const order = [], seen = new Set();
    for (const s0 of N) { if (seen.has(s0)) continue; const st2 = [[s0, 0]]; seen.add(s0); while (st2.length) { const top = st2[st2.length - 1], [n, i] = top; if (i < n.e.length) { top[1]++; const m = n.e[i][0]; if (!seen.has(m)) { seen.add(m); st2.push([m, 0]); } } else { order.push(n); st2.pop(); } } }
    let id = 0, best = -1, bestN = 0; for (const n of N) n.comp = null;
    for (let k = order.length - 1; k >= 0; k--) { const r0 = order[k]; if (r0.comp != null) continue; let c = 0; const q = [r0]; r0.comp = id; while (q.length) { const a = q.pop(); c++; for (const m of rev.get(a)) if (m.comp == null) { m.comp = id; q.push(m); } } if (c > bestN) { bestN = c; best = id; } id++; }
    W.main = best;
  }
  function nearestNode(x, z) { let best = null, bd = 1e18; for (const n of W.nodes.values()) { if (!n.e.length || n.comp !== W.main) continue; const d = (n.x - x) ** 2 + (n.z - z) ** 2; if (d < bd) { bd = d; best = n; } } return best; }
  function route(from, to) {
    const dist = new Map([[from, 0]]), prev = new Map(), heap = [[0, from]], done = new Set();
    const push = (d, n) => { heap.push([d, n]); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    while (heap.length) {
      const [d, n] = pop(); if (done.has(n)) continue; done.add(n); if (n === to) break;
      for (const [m, c] of n.e) { const nd = d + c; if (nd < (dist.get(m) ?? 1e18)) { dist.set(m, nd); prev.set(m, n); push(nd, m); } }
    }
    if (!done.has(to)) return null;
    const path = []; for (let n = to; n; n = prev.get(n)) path.unshift([n.x, n.z]); return path;
  }
  let drawRoute = null;
  function driveTo(x, z, pin) {
    const a = nearestNode(st.x, st.z), b = nearestNode(x, z); if (!a || !b) return;
    const path = route(a, b); if (!path) { toast('No road route from here. Try driving a little closer.'); return; }
    path.unshift([st.x, st.z]); if (Math.hypot(x - b.x, z - b.z) <= 5) path.push([x, z]);
    st.auto = { path, i: 1, pin, target: [x, z], tries: (st.auto && st.auto.pin === pin ? st.auto.tries : 0) }; st.arrived = null; drawRoute = path;
    if (pin) toast('Driving to ' + pin.n + '…');
  }
  function autopilot(dt) {
    const A = st.auto, P = A.path;
    // stuck against a wall? back off, then re-plan from where we are
    if (A.rev > 0) { A.rev -= dt; if (A.rev <= 0) { if (++A.tries > 3) { st.auto = null; drawRoute = null; toast('Can\'t get any closer by road. Try another way in.'); return { f: 0, t: 0, brake: true }; } const tr = A.tries; driveTo(A.target[0], A.target[1], A.pin); if (st.auto) st.auto.tries = tr; } return { f: -1, t: A.revT || 0 }; }
    A.slow = Math.abs(st.v) < 1 ? (A.slow || 0) + dt : 0;
    if (A.slow > 1.6) { A.slow = 0; A.rev = .9; const nx = P[Math.min(A.i, P.length - 1)]; A.revT = Math.sign(Math.atan2(Math.sin(Math.atan2(nx[0] - st.x, nx[1] - st.z) - st.h), Math.cos(Math.atan2(nx[0] - st.x, nx[1] - st.z) - st.h))) * -1; return { f: -1, t: A.revT }; }
    while (A.i < P.length - 1 && Math.hypot(P[A.i][0] - st.x, P[A.i][1] - st.z) < 7) A.i++;
    let la = 10, k = A.i, px = st.x, pz = st.z, tx = P[k][0], tz = P[k][1], rem = Math.hypot(tx - px, tz - pz);
    while (rem < la && k < P.length - 1) { la -= rem; px = tx; pz = tz; k++; tx = P[k][0]; tz = P[k][1]; rem = Math.hypot(tx - px, tz - pz); }
    if (rem > la && rem > 0) { tx = px + (tx - px) * la / rem; tz = pz + (tz - pz) * la / rem; }
    let diff = Math.atan2(tx - st.x, tz - st.z) - st.h; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const end = P[P.length - 1], toEnd = Math.hypot(end[0] - st.x, end[1] - st.z);
    if (toEnd < 6 && A.i >= P.length - 2) { const pin = A.pin; st.auto = null; drawRoute = null; if (pin) arrive(pin); return { f: 0, t: 0, brake: true }; }
    const sp = Math.min(14, 4 + toEnd * .5) * (1 - Math.min(.6, Math.abs(diff)));
    return { f: clamp((sp - st.v) / 4, -1, 1), t: clamp(diff * 2.2, -1, 1) };
  }

  // ------------------------------------------------------------------ input
  const KEYMAP = { arrowup: 'f', w: 'f', arrowdown: 'b', s: 'b', arrowleft: 'l', a: 'l', arrowright: 'r', d: 'r', shift: 'boost', ' ': 'brake' };
  addEventListener('keydown', e => {
    if (!started) return; const k = KEYMAP[(e.key || '').toLowerCase()]; if (!k) return;
    const a = document.activeElement;
    if (a === R.domElement) { e.preventDefault(); keys[k] = 1; if (k !== 'boost') { st.auto = null; drawRoute = null; } }
  });
  addEventListener('keyup', e => { const k = KEYMAP[(e.key || '').toLowerCase()]; if (k) keys[k] = 0; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = 0; });
  const padIn = ui.pad.querySelector('i');
  ui.pad.addEventListener('pointerdown', e => { if (!started) begin(); pad.on = true; ui.pad.setPointerCapture(e.pointerId); movePad(e); st.auto = null; drawRoute = null; e.preventDefault(); });
  ui.pad.addEventListener('pointermove', e => { if (pad.on) movePad(e); });
  const endPad = () => { pad.on = false; pad.x = pad.y = 0; padIn.style.transform = ''; };
  ui.pad.addEventListener('pointerup', endPad); ui.pad.addEventListener('pointercancel', endPad);
  function movePad(e) { const r = ui.pad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2); const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } pad.x = dx; pad.y = dy; padIn.style.transform = `translate(${dx * 34}px,${dy * 34}px)`; }
  const camS = { yaw: 0, pitch: .56, dist: 17, userYaw: 0, userT: 0 }, ptr = new Map();
  let downAt = null;
  R.domElement.addEventListener('pointerdown', e => { if (!started) return; R.domElement.focus({ preventScroll: true }); ptr.set(e.pointerId, [e.clientX, e.clientY]); downAt = [e.clientX, e.clientY, performance.now()]; R.domElement.setPointerCapture(e.pointerId); });
  R.domElement.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) return; const p = ptr.get(e.pointerId), dx = e.clientX - p[0], dy = e.clientY - p[1];
    if (ptr.size === 1) { camS.userYaw -= dx * .006; camS.pitch = clamp(camS.pitch + dy * .004, .16, 1.35); camS.userT = 2.5; }
    else if (ptr.size === 2) { const o = [...ptr.entries()].find(([k]) => k !== e.pointerId)[1]; const d0 = Math.hypot(p[0] - o[0], p[1] - o[1]), d1 = Math.hypot(e.clientX - o[0], e.clientY - o[1]); camS.dist = clamp(camS.dist * d0 / (d1 || 1), 9, 160); }
    ptr.set(e.pointerId, [e.clientX, e.clientY]);
  });
  R.domElement.addEventListener('pointerup', e => { ptr.delete(e.pointerId); if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 6 && performance.now() - downAt[2] < 400) pick(e); downAt = null; });
  R.domElement.addEventListener('pointercancel', e => ptr.delete(e.pointerId));
  R.domElement.addEventListener('wheel', e => { if (!started || !(document.activeElement === R.domElement || document.fullscreenElement)) return; e.preventDefault(); camS.dist = clamp(camS.dist * Math.exp(e.deltaY * .0012), 9, 160); }, { passive: false });
  const ray = new T.Raycaster(), ndc = new T.Vector2(), plane = new T.Plane(new T.Vector3(0, 1, 0), 0), hitP = new T.Vector3();
  function pick(e) {
    const r = R.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, cam);
    const hit = ray.intersectObjects(venueMeshes, false)[0];
    if (hit) { showCard(hit.object.userData.pin); return; }
    if (ray.ray.intersectPlane(plane, hitP)) { driveTo(hitP.x, hitP.z, null); hideCard(); }
  }

  // ------------------------------------------------------------------ HUD
  const sel = ui.hud.querySelector('select');
  [['stay', 'Places to stay'], ['bar', 'Bars and clubs']].forEach(([k, lab]) => { const og = document.createElement('optgroup'); og.label = lab; PINS.filter(p => p.k === k).sort((a, b) => a.n.localeCompare(b.n)).forEach(p => { const o = document.createElement('option'); o.value = p.slug; o.textContent = p.n; og.appendChild(o); }); sel.appendChild(og); });
  sel.addEventListener('change', () => { const p = PINS.find(q => q.slug === sel.value); if (p && W.nodes.size) { if (!started) { pendingTo = p; begin(); } else goPin(p); } sel.value = ''; R.domElement.focus({ preventScroll: true }); });
  function goPin(p) { const tx = p.cx ?? p.x, tz = p.cz ?? p.z; const n = nearestNode(tx, tz); driveTo(n ? n.x : tx, n ? n.z : tz, p); showCard(p, true); }
  ui.hud.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'night') { mood.target = mood.target ? 0 : 1; b.setAttribute('aria-pressed', mood.target ? 'true' : 'false'); b.querySelector('span').textContent = mood.target ? 'Sunset' : 'Illuminations'; }
    if (b.dataset.a === 'full') { if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else (box.requestFullscreen || box.webkitRequestFullscreen || (() => {})).call(box); }
  });
  let cardPin = null;
  function showCard(p, driving) {
    if (cardPin === p && !ui.card.hidden) return; cardPin = p;
    ui.card.innerHTML = `<button type="button" class="xp-x" aria-label="Close">×</button><span class="xp-kind ${p.k}">${p.k === 'stay' ? 'Place to stay' : 'Bar or club'}</span><strong>${esc(p.n)}</strong><span class="xp-addr">${esc(p.a)}</span>`
      + `<div class="xp-acts">${driving ? '' : '<button type="button" class="xp-drive">Drive here</button>'}<a class="xp-more" href="${esc(p.u)}">Read more</a><a href="${esc(p.g)}" target="_blank" rel="noopener">Google Maps</a><a href="${esc(p.ap)}" target="_blank" rel="noopener">Apple Maps</a><a href="${esc(p.w)}" target="_blank" rel="noopener">Waze</a></div>`;
    ui.card.hidden = false; ui.card.classList.remove('in'); void ui.card.offsetWidth; ui.card.classList.add('in');
    ui.card.querySelector('.xp-x').onclick = hideCard;
    const d = ui.card.querySelector('.xp-drive'); if (d) d.onclick = () => { goPin(p); d.remove(); };
  }
  let dismissed = null;
  function hideCard() { dismissed = cardPin; ui.card.hidden = true; cardPin = null; }
  let toastT = 0; function toast(msg) { ui.toast.textContent = msg; ui.toast.hidden = false; ui.toast.classList.remove('in'); void ui.toast.offsetWidth; ui.toast.classList.add('in'); toastT = 3.2; }
  function arrive(pin) { toast('You have arrived at ' + pin.n); confetti(pin.cx ?? pin.x, (pin.h || 9) + 4, pin.cz ?? pin.z); showCard(pin, true); st.arrived = pin; }

  let miniBase = null; const MS = .5, MINI_ZOOM = 1.15;
  function buildMinimap() {
    const b = W.bounds, w = Math.ceil((b.x1 - b.x0) * MS), h = Math.ceil((b.z1 - b.z0) * MS);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    x.fillStyle = '#2c4aa0'; x.fillRect(0, 0, w, h);
    const P = ([px, pz]) => [(px - b.x0) * MS, (pz - b.z0) * MS];
    if (W.coast.length) { x.fillStyle = '#e7dcef'; x.beginPath(); W.coast.forEach((p, i) => x[i ? 'lineTo' : 'moveTo'](...P(p))); x.lineTo(w + 10, P(W.coast[W.coast.length - 1])[1]); x.lineTo(w + 10, P(W.coast[0])[1]); x.fill(); }
    if (W.pier) { x.fillStyle = '#c79a6c'; x.beginPath(); W.pier.forEach((p, i) => x[i ? 'lineTo' : 'moveTo'](...P(p))); x.fill(); }
    x.lineCap = x.lineJoin = 'round';
    for (const r of W.roads) { x.strokeStyle = r.cls >= 2 ? '#ffffff' : '#c3b4d3'; x.lineWidth = [2, 3, 4, 6, 3][r.cls]; x.beginPath(); r.pts.forEach((p, i) => x[i ? 'lineTo' : 'moveTo'](...P(p))); x.stroke(); }
    miniBase = c;
  }
  ui.mini.addEventListener('click', e => {
    if (!W.nodes.size) return; if (!started) begin();
    const r = ui.mini.getBoundingClientRect(), s = ui.mini.width / r.width;
    const mx = (e.clientX - r.left) * s - ui.mini.width / 2, mz = (e.clientY - r.top) * s - ui.mini.height / 2, k = 1 / (MINI_ZOOM * MS);
    const tx = st.x + mx * k, tz = st.z + mz * k;
    let best = null, bd = 30; for (const p of PINS) { const d = Math.hypot((p.cx ?? p.x) - tx, (p.cz ?? p.z) - tz); if (d < bd) { bd = d; best = p; } }
    if (best) goPin(best); else driveTo(tx, tz, null);
  });
  function drawMini() {
    if (!miniBase) return; const c = ui.mini, x = c.getContext('2d'), b = W.bounds, s = MINI_ZOOM, w = c.width, h = c.height;
    x.save(); x.clearRect(0, 0, w, h); x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 3, 0, 7); x.clip();
    x.fillStyle = '#2c4aa0'; x.fillRect(0, 0, w, h);
    x.translate(w / 2, h / 2); x.scale(s, s); x.translate(-(st.x - b.x0) * MS, -(st.z - b.z0) * MS); x.drawImage(miniBase, 0, 0);
    if (drawRoute) { x.strokeStyle = '#ffe45e'; x.lineWidth = 5 / s; x.setLineDash([7 / s, 5 / s]); x.beginPath(); drawRoute.forEach(([px, pz], i) => x[i ? 'lineTo' : 'moveTo']((px - b.x0) * MS, (pz - b.z0) * MS)); x.stroke(); x.setLineDash([]); }
    for (const p of PINS) { x.fillStyle = p.k === 'stay' ? '#ff4fa3' : '#33d1ff'; x.beginPath(); x.arc(((p.cx ?? p.x) - b.x0) * MS, ((p.cz ?? p.z) - b.z0) * MS, 6 / s, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 2 / s; x.stroke(); }
    x.restore();
    x.save(); x.translate(w / 2, h / 2); x.rotate(-st.h + Math.PI); x.fillStyle = '#ff3d9a'; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, -14); x.lineTo(10, 11); x.lineTo(0, 5); x.lineTo(-10, 11); x.closePath(); x.fill(); x.stroke(); x.restore();
    x.fillStyle = '#ffc93c'; x.beginPath(); x.moveTo(w / 2, 4); x.lineTo(w / 2 + 12, 30); x.lineTo(w / 2 - 12, 30); x.closePath(); x.fill(); x.fillStyle = '#1a1033'; x.font = '800 16px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText('N', w / 2, 27);
  }

  let conf = null;
  function confetti(x, y, z) {
    if (reduce) return; const n = 300, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { pos.set([x, y, z], i * 3); const c = BULB[i % 6]; col.set([c.r * 2, c.g * 2, c.b * 2], i * 3); const a = Math.random() * 7, s = 6 + Math.random() * 10; vel.push([Math.cos(a) * s * .5, 10 + Math.random() * 12, Math.sin(a) * s * .5]); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
    if (conf) { S.remove(conf.p); conf.p.geometry.dispose(); conf.p.material.dispose(); } conf = { p: new T.Points(g, new T.PointsMaterial({ size: .7, vertexColors: true, transparent: true })), vel, t: 0 }; S.add(conf.p);
  }

  // labels never overlap: nearest first, each claims its screen rectangle
  const lv = new T.Vector3(), boxes = [];
  function declutter() {
    const W2 = R.domElement.clientWidth, H2 = R.domElement.clientHeight; boxes.length = 0;
    const list = labels.filter(l => l.visible).map(l => ({ l, d: l.position.distanceToSquared(cam.position) })).sort((a, b) => a.d - b.d);
    for (const { l } of list) {
      lv.copy(l.position).project(cam);
      if (lv.z > 1) { l.visible = false; continue; }
      const k = cam.projectionMatrix.elements[5] * H2 / 2, h = l.scale.y * k, w = l.scale.x * k, x = (lv.x + 1) / 2 * W2 - w / 2, y = (1 - lv.y) / 2 * H2 - h;
      if (boxes.some(b => x < b[2] && x + w > b[0] && y < b[3] && y + h > b[1])) { l.visible = false; continue; }
      boxes.push([x - 4, y - 4, x + w + 4, y + h + 4]);
    }
  }

  // ------------------------------------------------------------------ mood
  const cA = new T.Color(), cB = new T.Color();
  function applyMood(t) {
    const a = MOODS.sunset, b = MOODS.night, mix = (k, target) => target.copy(cA.set(a[k])).lerp(cB.set(b[k]), t);
    mix('top', skyU.top.value); mix('mid', skyU.mid.value); mix('hor', skyU.hor.value); mix('sun', skyU.sunC.value);
    mix('fog', S.fog.color); seaU.fogC.value.copy(S.fog.color);
    mix('hs', hemi.color); mix('hg', hemi.groundColor); hemi.intensity = lerp(a.hi, b.hi, t);
    mix('sun', sun.color); sun.intensity = lerp(a.si, b.si, t);
    mix('sea1', seaU.c1.value); mix('sea2', seaU.c2.value);
    NIGHT.value = lerp(a.win, b.win, t);
    head.intensity = lerp(0, 80, t);
    for (const c of clouds) mix('cloud', c.m.material.color);
    R.toneMappingExposure = lerp(a.exp, b.exp, t) * .9; if (post) { post.comp.uniforms.exposure.value = lerp(a.exp, b.exp, t); post.comp.uniforms.strength.value = lerp(a.bloom, b.bloom, t); post.bright.uniforms.th.value = lerp(a.th, b.th, t); }
  }

  // ------------------------------------------------------------------ loop
  const tmp = new T.Vector3(), camTarget = new T.Vector3(), camPos = new T.Vector3();
  let lastT = performance.now(), visible = true, frames = 0, fpsT = 0, raf = 0;
  function setTier(n) {
    tier = n; usePost = !!post && n === 2;
    R.toneMapping = usePost ? T.NoToneMapping : T.ACESFilmicToneMapping;
    sun.castShadow = n >= 1;
    dpr = n === 2 ? Math.min(devicePixelRatio || 1, 2) : n === 1 ? Math.min(devicePixelRatio || 1, 1.5) : Math.min(devicePixelRatio || 1, 1) * .75;
    R.setPixelRatio(dpr); resize(); applyLite();
  }
  // the lightest tier also drops the shader sky/sea, glow sprites and far scenery
  function applyLite() {
    const lite = tier === 0; box.classList.toggle('lite', lite);
    sky.visible = true; sky.scale.setScalar(lite ? .4 : 1); S.background = null; cam.far = lite ? 1300 : 4000; cam.updateProjectionMatrix();
    S.fog.near = lite ? 260 : 450; S.fog.far = lite ? 1250 : 2600; seaU.fogN.value = S.fog.near; seaU.fogF.value = S.fog.far;
    if (W.sea) W.sea.material = lite ? W.seaLite : W.seaRich; if (halos) halos.visible = !lite; clouds.forEach(c => { c.m.visible = !lite; });
    if (lite) dpr = Math.min(dpr, SOFT ? LITE_DPR : .85), R.setPixelRatio(dpr), resize();
  }
  function resize() { const w = box.clientWidth, h = box.clientHeight; LODK.value = 75 * 2 * Math.tan(cam.fov * Math.PI / 360) / Math.max(1, h * dpr) * 1.4; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); if (post) post.size(Math.round(w * dpr), Math.round(h * dpr)); }
  new ResizeObserver(resize).observe(box); resize();
  setTier(SOFT ? 0 : 2);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) { lastT = performance.now(); frame.prev = 0; frames = 0; fpsT = 0; raf = requestAnimationFrame(frame); } }, { threshold: 0 }).observe(box);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf) { lastT = performance.now(); frame.prev = 0; frames = 0; fpsT = 0; raf = requestAnimationFrame(frame); } });

  // fixed-step vehicle physics (120 Hz) so driving feels identical at any frame rate
  const STEP = 1 / 120; let acc = 0;
  function physics(dt) {
    let f = 0, t = 0, brake = false;
    if (started && intro >= 1) {
      f = (keys.f ? 1 : 0) - (keys.b ? 1 : 0) - pad.y; t = (keys.l ? 1 : 0) - (keys.r ? 1 : 0) - pad.x; brake = !!keys.brake;
      if (st.auto && !f && !t) { const a = autopilot(dt); f = a.f; t = a.t; brake = !!a.brake; }
    }
    const maxV = keys.boost ? 26 : 16, accel = f > 0 ? 9 : 14;
    if (brake) st.v *= Math.pow(.02, dt);
    else if (f) st.v += clamp(f, -1, 1) * accel * dt * (Math.sign(f) !== Math.sign(st.v) && Math.abs(st.v) > .5 ? 2 : 1);
    else st.v *= Math.pow(.35, dt);
    st.v = clamp(st.v, -7, maxV);
    st.steer += (clamp(t, -1, 1) - st.steer) * Math.min(1, dt * 7);
    const grip = Math.min(1, Math.abs(st.v) / 5); st.grip = grip;
    st.h += st.steer * dt * 1.9 * grip * Math.sign(st.v || 1) * (1 - Math.min(.45, Math.abs(st.v) / 60));
    st.x += Math.sin(st.h) * st.v * dt; st.z += Math.cos(st.h) * st.v * dt;
    if (W.cells.size) collide();
    const prevV = st.last == null ? st.v : st.last; st.last = st.v;
    st.pitch += ((prevV - st.v) / Math.max(dt, 1e-3) * .004 - st.pitch) * Math.min(1, dt * 6);
    st.roll += (-st.steer * grip * Math.min(1, Math.abs(st.v) / 14) * .07 - st.roll) * Math.min(1, dt * 6);
  }
  function frame(now) {
    raf = 0; if (!visible || document.hidden) return;
    const dt = Math.min((now - lastT) / 1000, window.__xpDt || 1 / 20); lastT = now; const time = now / 1000;
    const fdt = (now - (frame.prev || now)) / 1000; frame.prev = now;
    if (started && intro >= 1 && fdt < .1) { frames++; fpsT += fdt; }
    if (fpsT > 3) { const fps = frames / fpsT; good = fps > 55 ? good + 1 : 0; if (fps < 27 && tier > 0) setTier(tier - 1); else if (good >= 3 && tier < 2 && !SOFT) { good = 0; setTier(tier + 1); } else if (fps < 12 && tier === 0 && started && !warned) { warned = true; toast('Your browser is drawing 3D without a graphics card, so it may feel slow. The flat map is below.'); } frames = 0; fpsT = 0; }
    mood.t += (mood.target - mood.t) * Math.min(1, dt * 1.4); applyMood(mood.t);

    acc = Math.min(acc + dt, .25); while (acc >= STEP) { physics(STEP); acc -= STEP; }
    car.position.set(st.x, 0, st.z); car.rotation.y = st.h;
    chassis.rotation.x = clamp(st.pitch, -.06, .06); chassis.rotation.z = st.roll; chassis.position.y = Math.sin(time * 18) * .012 * Math.min(1, Math.abs(st.v) / 6);
    wheels.forEach(w => { w.spin.rotation.x += st.v * dt / .44; if (w.front) w.pivot.rotation.y = st.steer * .45; });
    const wave = reduce ? 0 : Math.sin(time * 7);
    theo.armR.rotation.set(-2.7 + wave * .35, 0, .25 + wave * .2);
    jay.head.rotation.y = st.steer * .3; theo.head.rotation.y = reduce ? .2 : Math.sin(time * .7) * .5;

    camS.userT = Math.max(0, camS.userT - dt); if (!camS.userT) camS.userYaw *= Math.pow(.15, dt);
    const wantYaw = st.h + Math.PI + camS.userYaw; camS.yaw += Math.atan2(Math.sin(wantYaw - camS.yaw), Math.cos(wantYaw - camS.yaw)) * Math.min(1, dt * 2.6);
    const ahead = clamp(st.v, -4, 26) * .35;
    camTarget.set(st.x + Math.sin(st.h) * ahead, 1.6, st.z + Math.cos(st.h) * ahead);
    const cd = camS.dist * (1 + Math.abs(st.v) / 70) * (cam.aspect < 1 ? 1.5 : 1);
    camPos.set(camTarget.x + Math.sin(camS.yaw) * Math.cos(camS.pitch) * cd, camTarget.y + Math.sin(camS.pitch) * cd, camTarget.z + Math.cos(camS.yaw) * Math.cos(camS.pitch) * cd);
    const fovT = 42 + Math.max(0, st.v - 14) * .5; if (Math.abs(cam.fov - fovT) > .05) { cam.fov += (fovT - cam.fov) * Math.min(1, dt * 3); cam.updateProjectionMatrix(); }
    if (!started || intro < 1) {
      const tx = tower ? tower.x : st.x, tz = tower ? tower.z : st.z;
      const ang = (reduce ? 0 : time * .045) + 2.25, from = tmp.set(tx + Math.cos(ang) * 340, 175, tz + Math.sin(ang) * 340);
      const lx0 = lerp(tx, st.x, .3), lz0 = lerp(tz, st.z, .3);
      if (!started) { cam.position.copy(from); cam.lookAt(lx0, 70, lz0); }
      else { intro = Math.min(1, intro + dt / (reduce ? .01 : 3.2)); const e = ease(intro); cam.position.lerpVectors(from, camPos, e); cam.position.y += Math.sin(e * Math.PI) * 40; cam.lookAt(lerp(lx0, camTarget.x, e), lerp(70, camTarget.y, e), lerp(lz0, camTarget.z, e)); }
    } else { if (snap) { cam.position.copy(camPos); camS.yaw = wantYaw; snap = 0; } else cam.position.lerp(camPos, 1 - Math.pow(.0009, dt)); cam.lookAt(camTarget); }
    sky.position.copy(cam.position);
    for (const c of clouds) { c.a += dt * .004; c.m.position.set(cam.position.x + Math.cos(c.a) * c.r, c.m.position.y, cam.position.z + Math.sin(c.a) * c.r); }
    sun.position.set(st.x - 380, 230, st.z + 130); sun.target.position.set(st.x, 0, st.z);

    seaU.t.value = time;
    if (bulbs) {
      const glow = lerp(MOODS.sunset.bulbs, MOODS.night.bulbs, mood.t), n = bulbs.userData.n, hc = halos.geometry.attributes.color, chase = Math.floor(time * 5);
      const prom = bulbs.userData.prom, ty = bulbs.userData.ty, ledK = lerp(1.6, 3.6, mood.t);
      for (let i = 0; i < n; i++) {
        let k, c;
        if (i < prom) { c = BULB[((reduce ? i : i + chase) >> 1) % BULB.length]; k = glow * (reduce ? 1 : .8 + .2 * Math.sin(time * 4 + i * 1.7)); }
        else { c = cB.setHSL(((ty[i] / 70 - (reduce ? 0 : time * .22)) % 1 + 1) % 1, 1, .55); k = ty[i] > 111 ? ledK * .9 : ledK; if (ty[i] > 126) c = cB.set('#ffe45e'); else if (ty[i] > 118) c = cB.set('#5dff9b'); }
        cA.setRGB(c.r * k + .1, c.g * k + .1, c.b * k + .1); bulbs.setColorAt(i, cA);
        hc.setXYZ(i, c.r * k * .3, c.g * k * .3, c.b * k * .3);
      }
      if (tower && tower.heart) { const b = reduce ? 1 : 1 + Math.max(0, Math.sin(time * 4)) * .12; tower.heart.scale.set(13 * b, 13 * b, 1); }
      bulbs.instanceColor.needsUpdate = true; hc.needsUpdate = true;
    }
    for (const bc of beacons) {
      if (bc.far) { const d = Math.hypot(bc.lab.position.x - st.x, bc.lab.position.z - st.z); bc.lab.material.opacity = clamp(1.4 - d / 900, 0, 1); bc.lab.visible = bc.lab.material.opacity > .02; continue; }
      const d = Math.hypot(bc.gem.position.x - st.x, bc.gem.position.z - st.z);
      bc.gem.rotation.y = time * 1.2; bc.gem.position.y = bc.base + 17 + (reduce ? 0 : Math.sin(time * 2 + bc.base) * .6);
      bc.beam.visible = d > 35; bc.beam.material.opacity = lerp(.5, 1, mood.t);
      bc.lab.material.opacity = 1; bc.lab.visible = started;
    }
    declutter(); sizeBanners();
    if (tower) { const p = tower.flag.geometry.attributes.position, base = tower.base; for (let i = 0; i < p.count; i++) { const x = base[i * 3]; p.setZ(i, reduce ? 0 : Math.sin(x * 1.4 - time * 6) * x * .12); } p.needsUpdate = true; }
    for (const g of gulls) { const a = time * g.s + g.o; g.m.position.set(g.cx + Math.cos(a) * g.r, g.h + Math.sin(time * .6 + g.o) * 3, g.cz + Math.sin(a) * g.r); g.m.rotation.y = -a + (g.s > 0 ? 0 : Math.PI); const f = reduce ? .2 : Math.sin(time * 7 + g.o * 3) * .5; const p = g.m.geometry.attributes.position; p.setY(1, .15 + f); p.setY(4, .15 + f); p.needsUpdate = true; }
    if (conf) { conf.t += dt; const p = conf.p.geometry.attributes.position; for (let i = 0; i < conf.vel.length; i++) { const v = conf.vel[i]; v[1] -= 22 * dt; v[0] *= .99; v[2] *= .99; p.setXYZ(i, p.getX(i) + v[0] * dt, Math.max(.3, p.getY(i) + v[1] * dt), p.getZ(i) + v[2] * dt); } p.needsUpdate = true; conf.p.material.opacity = clamp(3 - conf.t, 0, 1); if (conf.t > 3) { S.remove(conf.p); conf.p.geometry.dispose(); conf.p.material.dispose(); conf = null; } }

    if (started && !st.auto) { let near = null, nd = 22; for (const p of PINS) { const d = Math.hypot((p.cx ?? p.x) - st.x, (p.cz ?? p.z) - st.z); if (d < nd) { nd = d; near = p; } } if (dismissed && Math.hypot((dismissed.cx ?? dismissed.x) - st.x, (dismissed.cz ?? dismissed.z) - st.z) > 30) dismissed = null; if (near && near !== dismissed && (!cardPin || cardPin === near || ui.card.hidden)) showCard(near, true); else if (cardPin && Math.hypot((cardPin.cx ?? cardPin.x) - st.x, (cardPin.cz ?? cardPin.z) - st.z) > 60 && st.arrived !== cardPin) hideCard(); }
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) ui.toast.hidden = true; }
    if (W.roads.length && Math.hypot(st.x - (frame.rx ?? 1e9), st.z - (frame.rz ?? 1e9)) > 3) { frame.rx = st.x; frame.rz = st.z; const r = roadAt(st.x, st.z), t = r ? (r.name || '') + (r.ms ? ' · ' + r.ms + ' mph' : '') : ''; if (t !== ui.speed.road) { ui.speed.road = t; ui.speed.querySelector('.xp-road').textContent = t; } }
    { const mph = Math.round(Math.abs(st.v) * 2.237); if (mph !== ui.speed.mph) { ui.speed.mph = mph; ui.speed.querySelector('b').textContent = mph; needle.style.transform = `rotate(${-90 + Math.min(mph, 60) / 60 * 180}deg)`; } }
    if (started) drawMini();
    if (usePost) post.render(S, cam, time); else R.render(S, cam);
    raf = requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------------ boot
  let pendingTo = null, snap = 0;
  function begin() {
    if (started || !W.nodes.size) return; started = true; intro = 0; ui.start.classList.add('gone'); box.classList.add('live');
    setTimeout(() => { ui.start.hidden = true; }, 800); R.domElement.focus({ preventScroll: true });
    const r = box.getBoundingClientRect(); if (Math.abs(r.top - 64) > 40 && !document.fullscreenElement) scrollTo({ top: scrollY + r.top - 64, behavior: reduce ? 'auto' : 'smooth' });
    if (pendingTo) { const p = pendingTo; setTimeout(() => goPin(p), reduce ? 50 : 3300); }
  }
  goBtn.addEventListener('click', begin);
  applyMood(0);
  raf = requestAnimationFrame(frame);
  fetch(CFG.world).then(r => r.json()).then(Wd => {
    buildWorld(Wd);
    pendingTo = startPos();
    goBtn.disabled = false; goCap.textContent = pendingTo ? 'Drive to ' + pendingTo.n : 'Start the engine';
    box.classList.add('ready');
    if (new URLSearchParams(location.search).has('go')) begin();
  }).catch(e => { console.error(e); goCap.textContent = 'Could not load the map. Please refresh.'; });
  window.__xp = { st, cam, R, S, begin, signs: () => SIGNS.length, nums: () => NUMS.length, loose: () => W.loose.length, tier: n => setTier(n), gpu: GPU, sim: secs => { for (let i = 0; i < secs * 120; i++) physics(STEP); }, skip: () => { intro = 1; snap = 1; }, settle: () => { mood.t = mood.target; snap = 1; }, view: (d, p) => { camS.dist = d; camS.pitch = p; snap = 1; }, goPin: s => goPin(PINS.find(p => p.slug === s)), night: v => { mood.target = v ? 1 : 0; } };
})();
