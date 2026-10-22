/* Blackpool.gay: drive the Rainbow Quarter in 3D.
   Streets, buildings, coast and North Pier: © OpenStreetMap contributors (ODbL).
   Venue positions: the same coordinates as the site map. Everything is drawn in code; no external assets. */
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
    start: el('div', 'xp-start', '<div class="xp-start-in"><p class="xp-kicker">Blackpool.Gay in 3D</p><p class="xp-title">Drive the Rainbow Quarter</p><p class="xp-sub">Real streets, the Tower, North Pier and every gay hotel, bar and club, in a pink soft-top with Jay and Theo.</p><button type="button" class="xp-go" disabled>Loading Blackpool…</button><p class="xp-keys">' + (touch ? 'Drag the pad to drive. Tap a building or the map to go there.' : 'Arrow keys or WASD to drive, Shift for a boost. Click anywhere to drive there.') + '</p></div>'),
    hud: el('div', 'xp-hud'),
    card: el('div', 'xp-card'),
    toast: el('div', 'xp-toast'),
    mini: el('canvas', 'xp-mini'),
    speed: el('div', 'xp-speed', '<b>0</b><span>mph</span>'),
    pad: el('div', 'xp-pad', '<i></i>')
  };
  ui.hud.innerHTML = '<label class="xp-sel"><span>Drive to</span><select aria-label="Drive to a venue"><option value="">Choose a place…</option></select></label>'
    + '<button type="button" class="xp-b" data-a="night" aria-pressed="false">Illuminations</button>'
    + '<button type="button" class="xp-b" data-a="full">Full screen</button>';
  ui.card.hidden = true; ui.toast.hidden = true; ui.toast.setAttribute('role', 'status');
  if (!box.requestFullscreen && !box.webkitRequestFullscreen) ui.hud.querySelector('[data-a=full]').hidden = true; ui.mini.width = ui.mini.height = 340;
  ui.mini.setAttribute('aria-label', 'Mini map. Click to drive there.');
  if (!touch) ui.pad.hidden = true;
  Object.values(ui).forEach(n => box.appendChild(n));
  const goBtn = ui.start.querySelector('.xp-go');

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
  let tier = 2, usePost = false, warned = false, good = 0;

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
    sunset: { top: '#2a1f6b', mid: '#c8508f', hor: '#ffa06e', fog: '#d98aa0', hs: '#b9a6ff', hg: '#4a3550', hi: .75, sun: '#ffb27a', si: 2.1, exp: .95, bulbs: 1.2, bloom: .5, th: 2.4, sea1: '#3a4aa8', sea2: '#f19c79', cloud: '#ffc2c8', win: .15 },
    night: { top: '#05041a', mid: '#160f45', hor: '#4a2672', fog: '#22183f', hs: '#6a5fc4', hg: '#160f24', hi: .6, sun: '#9fb2ff', si: .6, exp: 1.25, bulbs: 4.2, bloom: .85, th: 1.25, sea1: '#0a0f38', sea2: '#5b3590', cloud: '#3a2a66', win: 1 }
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
  function Builder() { this.p = []; this.n = []; this.c = []; }
  Builder.prototype.tri = function (a, b, c, col, want) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    let cols = Array.isArray(col[0]) ? col : [col, col, col];
    if (want && nx * want[0] + ny * want[1] + nz * want[2] < 0) { const t = b; b = c; c = t; nx = -nx; ny = -ny; nz = -nz; cols = [cols[0], cols[2], cols[1]]; }
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    [a, b, c].forEach((v, k) => { this.p.push(v[0], v[1], v[2]); this.n.push(nx, ny, nz); this.c.push(cols[k][0], cols[k][1], cols[k][2]); });
  };
  Builder.prototype.mesh = function (mat) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere();
    return new T.Mesh(g, mat);
  };
  const rgb = (hex, k = 1) => { const c = new T.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
  const area = pts => { let s = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) s += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]; return s / 2; };
  const inside = (x, z, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const centroid = pts => { let x = 0, z = 0; for (const p of pts) { x += p[0]; z += p[1]; } return [x / pts.length, z / pts.length]; };
  function flat(B, pts, y, col) {
    const tris = T.ShapeUtils.triangulateShape(pts.map(p => new T.Vector2(p[0], p[1])), []);
    for (const t of tris) B.tri([pts[t[0]][0], y, pts[t[0]][1]], [pts[t[1]][0], y, pts[t[1]][1]], [pts[t[2]][0], y, pts[t[2]][1]], col, [0, 1, 0]);
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
  function ribbon(B, pts, w, y, col, caps) {
    const h = w / 2;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * h, nz = dx / l * h;
      B.tri([a[0] + nx, y, a[1] + nz], [b[0] + nx, y, b[1] + nz], [b[0] - nx, y, b[1] - nz], col, [0, 1, 0]);
      B.tri([a[0] + nx, y, a[1] + nz], [b[0] - nx, y, b[1] - nz], [a[0] - nx, y, a[1] - nz], col, [0, 1, 0]);
    }
    if (caps) for (const p of pts) for (let k = 0; k < 10; k++) {
      const a1 = k / 10 * Math.PI * 2, a2 = (k + 1) / 10 * Math.PI * 2;
      B.tri([p[0], y, p[1]], [p[0] + Math.cos(a1) * h, y, p[1] + Math.sin(a1) * h], [p[0] + Math.cos(a2) * h, y, p[1] + Math.sin(a2) * h], col, [0, 1, 0]);
    }
  }
  const dec = (a, i0) => { const o = []; let x = 0, z = 0; for (let i = i0; i < a.length - 1; i += 2) { x += a[i]; z += a[i + 1]; o.push([x, z]); } return o; };
  const ring = pts => { const o = pts.slice(); if (o.length > 2 && o[0][0] === o[o.length - 1][0] && o[0][1] === o[o.length - 1][1]) o.pop(); return o; };
  function canvasTex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
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
  const W = { cells: new Map(), coast: [], nodes: new Map(), roads: [], bounds: { x0: -560, x1: 600, z0: -690, z1: 880 } };
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

    const ground = new Builder(), roads = new Builder(), marks = new Builder(), bld = new Builder();
    const coastA = Wd.a.find(a => a[0] === 'coast');
    if (coastA) {
      const cp = dec(coastA, 2);
      W.coast = cp.slice().sort((a, b) => a[1] - b[1]);
      flat(ground, cp.concat([[4000, cp[cp.length - 1][1]], [4000, cp[0][1]]]), 0, rgb('#d8c8de'));
    } else flat(ground, [[-600, -3000], [4000, -3000], [4000, 3000], [-600, 3000]], 0, rgb('#d8c8de'));
    for (const a of Wd.a) {
      const pts = ring(dec(a, 2));
      if (a[0] === 'beach' && pts.length > 2) flat(ground, pts, 0.05, rgb('#f2d6a2'));
      else if (a[0] === 'park' && pts.length > 2) flat(ground, pts, 0.12, rgb('#9ed493'));
      else if (a[0] === 'park0' && pts.length > 2) flat(ground, pts, 0.1, rgb('#c9bccf'));
      else if (a[0] === 'plat' && pts.length > 2) prism(bld, pts, 0, 1.1, rgb('#bdb3c9'), rgb('#e7e1ee'));
      else if (a[0] === 'rail') ribbon(roads, dec(a, 2), 3.2, 0.09, rgb('#8d8299'), true);
      else if (a[0] === 'pier') buildPier(pts, a[1]);
    }
    const RW = [5, 7.5, 9, 12, 7], RY = [0.16, 0.2, 0.24, 0.28, 0.18], RC = ['#8c84a0', '#837a99', '#7b7292', '#746a8b', '#e4d6c6'];
    const named = new Map();
    for (const r of Wd.r) {
      const cls = r[0], pts = dec(r, 2); if (pts.length < 2) continue;
      if (cls !== 4) ribbon(ground, pts, RW[cls] + 4.5, 0.14, rgb('#e2d7ea'), true);
      ribbon(roads, pts, RW[cls], RY[cls], rgb(RC[cls]), true);
      if (cls >= 2) for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        for (let s = 2; s < l - 3; s += 9) { const t0 = s / l, t1 = Math.min((s + 4) / l, 1); ribbon(marks, [[lerp(a[0], b[0], t0), lerp(a[1], b[1], t0)], [lerp(a[0], b[0], t1), lerp(a[1], b[1], t1)]], .35, RY[cls] + .02, rgb('#fbf3ff'), false); }
      }
      W.roads.push({ cls, name: r[1], pts });
      if (r[1]) { const e = named.get(r[1]) || []; e.push(pts); named.set(r[1], e); }
      for (let i = 0; i < pts.length; i++) {
        const k = pts[i][0] + ',' + pts[i][1]; let n = W.nodes.get(k); if (!n) { n = { x: pts[i][0], z: pts[i][1], e: [] }; W.nodes.set(k, n); }
        if (i) { const p = W.nodes.get(pts[i - 1][0] + ',' + pts[i - 1][1]), d = Math.hypot(n.x - p.x, n.z - p.z), cost = d * (cls === 0 ? 1.4 : 1); n.e.push([p, cost]); p.e.push([n, cost]); }
      }
    }
    const gMesh = ground.mesh(new T.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); gMesh.receiveShadow = true; S.add(gMesh);
    const rMesh = roads.mesh(new T.MeshStandardMaterial({ vertexColors: true, roughness: .8, metalness: .05 })); rMesh.receiveShadow = true; S.add(rMesh);
    S.add(marks.mesh(new T.MeshBasicMaterial({ vertexColors: true })));
    streetLabels(named);

    const PAL = ['#f7e6d4', '#f4d3c4', '#ead6f3', '#d8e4fb', '#fbe8b8', '#e3f1da', '#f9d6e6', '#ddd4f6', '#f3efe8', '#e6dccf', '#ffd9c2', '#cfe9f1'];
    const venueOf = new Map();
    for (const pin of PINS) { let best = null; for (let i = 0; i < Wd.b.length; i++) { const pts = ring(dec(Wd.b[i], 2)); if (pts.length > 2 && inside(pin.x, pin.z, pts)) { best = i; break; } } if (best != null && !venueOf.has(best)) venueOf.set(best, pin); else pin.free = true; }
    let towerXZ = null;
    Wd.b.forEach((b, i) => {
      const pts = ring(dec(b, 2)); if (pts.length < 3) return;
      const A = Math.abs(area(pts)), c = centroid(pts), r = hash(c[0], c[1]);
      let h = b[0] || (A > 2500 ? 14 + r * 8 : A > 600 ? 10 + r * 6 : 6.5 + r * 5);
      if (/Tower, Ballroom/.test(b[1])) { h = 24; towerXZ = c; }
      if (/Winter Gardens/.test(b[1])) h = 20;
      addCollider(pts);
      const pin = venueOf.get(i);
      if (pin) { venueBuilding(pin, pts, Math.max(h, 9)); return; }
      const col = rgb(PAL[Math.floor(r * PAL.length)]);
      prism(bld, pts, 0, h, col, col.map(v => v * .8));
    });
    const bm = bld.mesh(withWindows(new T.MeshStandardMaterial({ vertexColors: true, roughness: .78, flatShading: true }), 1));
    bm.castShadow = bm.receiveShadow = true; S.add(bm);
    for (const pin of PINS) if (pin.free) {
      const s = 4.5, pts = [[pin.x - s, pin.z - s], [pin.x + s, pin.z - s], [pin.x + s, pin.z + s], [pin.x - s, pin.z + s]];
      addCollider(pts); venueBuilding(pin, pts, 9);
    }
    pruneGraph();
    if (towerXZ) buildTower(towerXZ[0], towerXZ[1]);
    buildIlluminations(named.get('Promenade') || []);
    landmarkLabels(Wd);
    buildGulls();
    buildMinimap();
    applyLite();
  }

  function addCollider(pts) { for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], s = [a[0], a[1], b[0], b[1]]; const x0 = Math.floor(Math.min(a[0], b[0]) / 20), x1 = Math.floor(Math.max(a[0], b[0]) / 20), z0 = Math.floor(Math.min(a[1], b[1]) / 20), z1 = Math.floor(Math.max(a[1], b[1]) / 20); for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const k = x + ',' + z; let c = W.cells.get(k); if (!c) W.cells.set(k, c = []); c.push(s); } } }

  // --- venues: glowing building, light beam, spinning gem, label
  const STAY = new T.Color('#ff4fa3'), BAR = new T.Color('#33d1ff');
  const beamTex = canvasTex(4, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.7, 'rgba(255,255,255,.3)'); g.addColorStop(1, 'rgba(255,255,255,.85)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  function venueBuilding(pin, pts, h) {
    const col = pin.k === 'stay' ? STAY : BAR, B = new Builder(), base = rgb('#' + col.getHexString());
    prism(B, pts, 0, h, base, base.map(v => Math.min(1, v * 1.15)));
    const m = B.mesh(withWindows(new T.MeshStandardMaterial({ vertexColors: true, roughness: .4, metalness: .05, emissive: col, emissiveIntensity: .22, flatShading: true }), .8));
    m.castShadow = m.receiveShadow = true; m.userData.pin = pin; S.add(m); venueMeshes.push(m);
    const c = centroid(pts); pin.cx = c[0]; pin.cz = c[1]; pin.h = h;
    const beam = new T.Mesh(new T.CylinderGeometry(1.4, 1.4, 90, 14, 1, true), new T.MeshBasicMaterial({ map: beamTex, color: col.clone().multiplyScalar(1.6), transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false }));
    beam.position.set(c[0], h + 45, c[1]); S.add(beam);
    const gem = new T.Mesh(new T.OctahedronGeometry(2.2, 0), new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 2.2, roughness: .15, metalness: .4, flatShading: true }));
    gem.position.set(c[0], h + 7, c[1]); gem.castShadow = true; gem.userData.pin = pin; S.add(gem); venueMeshes.push(gem);
    const lab = makeLabel(pin.n, pin.k === 'stay' ? '#ff4fa3' : '#33d1ff', pin.k === 'stay' ? 'Stay' : 'Bar'); lab.position.set(c[0], h + 12, c[1]); S.add(lab);
    beacons.push({ beam, gem, lab, pin, base: h });
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
    const crowns = new T.InstancedMesh(new T.SphereGeometry(.42, 10, 8), new T.MeshBasicMaterial({ color: new T.Color('#fff2c8').multiplyScalar(3) }), posts.length);
    posts.forEach(([x, z], i) => { M.makeTranslation(x, 8, z); crowns.setMatrixAt(i, M); }); S.add(crowns);
    const all = pts.concat(tower ? tower.lights : []);
    bulbs = new T.InstancedMesh(new T.SphereGeometry(.2, 6, 4), new T.MeshBasicMaterial(), all.length);
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
    let id = 0, best = -1, bestN = 0;
    for (const n of W.nodes.values()) { if (n.comp != null || !n.e.length) continue; let c = 0; const q = [n]; n.comp = id; while (q.length) { const a = q.pop(); c++; for (const [m] of a.e) if (m.comp == null) { m.comp = id; q.push(m); } } if (c > bestN) { bestN = c; best = id; } id++; }
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
    if (b.dataset.a === 'night') { mood.target = mood.target ? 0 : 1; b.setAttribute('aria-pressed', mood.target ? 'true' : 'false'); b.textContent = mood.target ? 'Sunset' : 'Illuminations'; }
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
    x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 5; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 3, 0, 7); x.stroke();
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
    sky.visible = !lite; S.background = lite ? S.fog.color : null; cam.far = lite ? 900 : 4000; cam.updateProjectionMatrix();
    S.fog.near = lite ? 160 : 450; S.fog.far = lite ? 850 : 2600;
    if (W.sea) W.sea.material = lite ? W.seaLite : W.seaRich; if (halos) halos.visible = !lite; clouds.forEach(c => { c.m.visible = !lite; });
    if (lite) dpr = Math.min(dpr, SOFT ? .5 : .75), R.setPixelRatio(dpr), resize();
  }
  function resize() { const w = box.clientWidth, h = box.clientHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); if (post) post.size(Math.round(w * dpr), Math.round(h * dpr)); }
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
      bc.gem.rotation.y = time * 1.2; bc.gem.position.y = bc.base + 7 + (reduce ? 0 : Math.sin(time * 2 + bc.base) * .6);
      bc.beam.visible = d > 35; bc.beam.material.opacity = lerp(.5, 1, mood.t);
      bc.lab.material.opacity = clamp(1.3 - d / 300, 0, 1); bc.lab.visible = bc.lab.material.opacity > .02 && started;
    }
    declutter();
    if (tower) { const p = tower.flag.geometry.attributes.position, base = tower.base; for (let i = 0; i < p.count; i++) { const x = base[i * 3]; p.setZ(i, reduce ? 0 : Math.sin(x * 1.4 - time * 6) * x * .12); } p.needsUpdate = true; }
    for (const g of gulls) { const a = time * g.s + g.o; g.m.position.set(g.cx + Math.cos(a) * g.r, g.h + Math.sin(time * .6 + g.o) * 3, g.cz + Math.sin(a) * g.r); g.m.rotation.y = -a + (g.s > 0 ? 0 : Math.PI); const f = reduce ? .2 : Math.sin(time * 7 + g.o * 3) * .5; const p = g.m.geometry.attributes.position; p.setY(1, .15 + f); p.setY(4, .15 + f); p.needsUpdate = true; }
    if (conf) { conf.t += dt; const p = conf.p.geometry.attributes.position; for (let i = 0; i < conf.vel.length; i++) { const v = conf.vel[i]; v[1] -= 22 * dt; v[0] *= .99; v[2] *= .99; p.setXYZ(i, p.getX(i) + v[0] * dt, Math.max(.3, p.getY(i) + v[1] * dt), p.getZ(i) + v[2] * dt); } p.needsUpdate = true; conf.p.material.opacity = clamp(3 - conf.t, 0, 1); if (conf.t > 3) { S.remove(conf.p); conf.p.geometry.dispose(); conf.p.material.dispose(); conf = null; } }

    if (started && !st.auto) { let near = null, nd = 22; for (const p of PINS) { const d = Math.hypot((p.cx ?? p.x) - st.x, (p.cz ?? p.z) - st.z); if (d < nd) { nd = d; near = p; } } if (dismissed && Math.hypot((dismissed.cx ?? dismissed.x) - st.x, (dismissed.cz ?? dismissed.z) - st.z) > 30) dismissed = null; if (near && near !== dismissed && (!cardPin || cardPin === near || ui.card.hidden)) showCard(near, true); else if (cardPin && Math.hypot((cardPin.cx ?? cardPin.x) - st.x, (cardPin.cz ?? cardPin.z) - st.z) > 60 && st.arrived !== cardPin) hideCard(); }
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) ui.toast.hidden = true; }
    ui.speed.firstChild.textContent = Math.round(Math.abs(st.v) * 2.237);
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
    goBtn.disabled = false; goBtn.textContent = pendingTo ? 'Drive to ' + pendingTo.n : 'Start the engine';
    box.classList.add('ready');
    if (new URLSearchParams(location.search).has('go')) begin();
  }).catch(e => { console.error(e); goBtn.textContent = 'Could not load the map. Please refresh.'; });
  window.__xp = { st, cam, R, S, begin, tier: n => setTier(n), gpu: GPU, sim: secs => { for (let i = 0; i < secs * 120; i++) physics(STEP); }, skip: () => { intro = 1; snap = 1; }, settle: () => { mood.t = mood.target; snap = 1; }, view: (d, p) => { camS.dist = d; camS.pitch = p; snap = 1; }, goPin: s => goPin(PINS.find(p => p.slug === s)), night: v => { mood.target = v ? 1 : 0; } };
})();
