/* Blackpool.gay 3D explore mode: drive a little car around the Rainbow Quarter. Pins use the same real coordinates as the map. */
(function () {
  const box = document.getElementById('xp'); if (!box || !window.THREE) return;
  const T = window.THREE, D = JSON.parse(document.getElementById('xpdata').textContent);
  const card = document.getElementById('xpcard'), hint = document.getElementById('xphint');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- projection: metres from the centre, 1 unit = 2 m
  const C = D.c, KY = 111320 / 2, KX = 111320 * Math.cos(C[0] * Math.PI / 180) / 2;
  const P = p => ({ x: (p[1] - C[1]) * KX, z: -(p[0] - C[0]) * KY });

  // ---- renderer, scene, camera
  const R = new T.WebGLRenderer({ antialias: true }); R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.shadowMap.enabled = true;
  box.appendChild(R.domElement);
  const S = new T.Scene(); S.background = new T.Color('#1b1033'); S.fog = new T.Fog('#1b1033', 160, 420);
  const cam = new T.PerspectiveCamera(45, 1, 1, 1200);
  S.add(new T.HemisphereLight('#c9b6ff', '#2a1a4a', 0.9));
  const sun = new T.DirectionalLight('#fff1d6', 0.8); sun.position.set(-80, 140, 60); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -200, right: 200, top: 200, bottom: -200, far: 500 }); S.add(sun);

  // ---- ground, sea (west of the westmost pin), rainbow road stripes
  const pts = D.pins.map(p => Object.assign(P(p.p), p));
  const minX = Math.min(...pts.map(p => p.x)) - 40;
  const ground = new T.Mesh(new T.PlaneGeometry(900, 900), new T.MeshStandardMaterial({ color: '#3b2a5c', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
  const sea = new T.Mesh(new T.PlaneGeometry(500, 900), new T.MeshStandardMaterial({ color: '#2b4f9e', roughness: .3, metalness: .2 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(minX - 250, .05, 0); S.add(sea);
  const prom = new T.Mesh(new T.PlaneGeometry(14, 900), new T.MeshStandardMaterial({ color: '#d9c7a3' }));
  prom.rotation.x = -Math.PI / 2; prom.position.set(minX + 7, .06, 0); S.add(prom);
  const FLAG = ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'];
  FLAG.forEach((c, i) => { const m = new T.Mesh(new T.PlaneGeometry(1.4, 900), new T.MeshBasicMaterial({ color: c })); m.rotation.x = -Math.PI / 2; m.position.set(minX + 16 + i * 1.4, .07, 0); S.add(m); });

  // ---- venue towers with floating labels
  const label = (txt, col) => {
    const cv = document.createElement('canvas'), x = cv.getContext('2d'); cv.width = 512; cv.height = 96;
    x.fillStyle = 'rgba(20,10,40,.85)'; x.beginPath(); x.roundRect ? x.roundRect(4, 4, 504, 88, 40) : x.rect(4, 4, 504, 88); x.fill();
    x.fillStyle = col; x.fillRect(24, 38, 20, 20); x.fillStyle = '#fff'; x.font = '600 36px system-ui,sans-serif'; x.textBaseline = 'middle';
    x.fillText(txt.length > 24 ? txt.slice(0, 23) + '…' : txt, 60, 50);
    const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), depthWrite: false })); sp.scale.set(16, 3, 1); return sp;
  };
  const items = pts.map((p, i) => {
    const col = p.k === 'stay' ? '#ff5fa2' : '#3fd0ff', h = p.k === 'stay' ? 9 : 6;
    const g = new T.Group(); g.position.set(p.x, 0, p.z);
    const b = new T.Mesh(new T.BoxGeometry(5, h, 5), new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .25, roughness: .5 }));
    b.position.y = h / 2; b.castShadow = true; g.add(b);
    const roof = new T.Mesh(new T.ConeGeometry(3.8, 3, 4), new T.MeshStandardMaterial({ color: FLAG[i % 6] })); roof.position.y = h + 1.5; roof.rotation.y = Math.PI / 4; g.add(roof);
    const l = label(p.n, col); l.position.y = h + 6; g.add(l); S.add(g);
    return { p, g, l, b };
  });
  // scattered low buildings for atmosphere
  const fill = new T.MeshStandardMaterial({ color: '#4b3a72', roughness: 1 });
  for (let i = 0; i < 160; i++) {
    const x = minX + 30 + Math.random() * 360, z = -220 + Math.random() * 440;
    if (pts.some(p => Math.hypot(p.x - x, p.z - z) < 12)) continue;
    const h = 2 + Math.random() * 6, m = new T.Mesh(new T.BoxGeometry(6 + Math.random() * 6, h, 6 + Math.random() * 6), fill);
    m.position.set(x, h / 2, z); m.castShadow = m.receiveShadow = true; S.add(m);
  }

  // ---- the car
  // pink boxy soft-top 4x4 (unbadged) with two original Blackpool characters: Ruby (drag queen, driving) and Barney (bear, waving)
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .55 }, o || {}));
  const add = (par, geo, mat, x, y, z, sh = true) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = sh; par.add(m); return m; };
  const Bx = (w, h, d) => new T.BoxGeometry(w, h, d);
  const car = new T.Group(), body = new T.Group(); car.add(body);
  const pink = M('#ff3fa4', { roughness: .35 }), black = M('#1a1a1a'), white = M('#f4f1ec'), chrome = M('#c9c9d1', { metalness: .6, roughness: .3 });
  add(body, Bx(3.2, 1.3, 5.2), pink, 0, 1.35, 0);              // tub
  add(body, Bx(3.0, .5, 1.6), pink, 0, 2.15, 1.75);            // bonnet
  add(body, Bx(2.6, .7, .12), black, 0, 1.6, 2.62);             // grille
  [-1, 1].forEach(s => { add(body, new T.CylinderGeometry(.28, .28, .1, 16).rotateX(Math.PI / 2), M('#fff6c2', { emissive: '#fff2a0', emissiveIntensity: .8 }), s * .95, 1.65, 2.7); }); // round lamps
  add(body, Bx(3.4, .35, .4), chrome, 0, .85, 2.7);             // bumper
  add(body, Bx(3.4, .35, .4), chrome, 0, .85, -2.7);
  [-1, 1].forEach(s => { add(body, Bx(.35, .5, 1.6), black, s * 1.72, 1.15, 1.7); add(body, Bx(.35, .5, 1.6), black, s * 1.72, 1.15, -1.7); }); // wheel arches
  add(body, Bx(2.9, 1.2, .08), M('#bfe6ff', { transparent: true, opacity: .45 }), 0, 2.9, .85, false); // windscreen
  add(body, Bx(3.0, .12, .12), black, 0, 3.5, .85);
  // folded soft top behind the seats
  add(body, Bx(3.0, .55, .9), M('#2b1d3d'), 0, 2.2, -2.3);
  [-1.45, 1.45].forEach(x => { add(body, Bx(.1, 1.4, .1), black, x, 2.7, -1.6); });
  add(body, Bx(3.0, .1, .1), black, 0, 3.4, -1.6);
  // spare wheel on the back door
  add(body, new T.CylinderGeometry(.7, .7, .45, 18).rotateX(Math.PI / 2), black, 0, 1.6, -2.85);
  add(body, new T.CylinderGeometry(.45, .45, .5, 6).rotateX(Math.PI / 2), pink, 0, 1.6, -2.88);
  // seats
  [-.7, .7].forEach(x => { add(body, Bx(1.1, .3, 1.1), white, x, 2.05, -.3); add(body, Bx(1.1, 1.1, .25), white, x, 2.6, -.85); });
  // steering wheel (driver on the right, UK style)
  add(body, new T.TorusGeometry(.32, .06, 8, 18), black, -.7, 2.75, .45).rotation.x = -.6;
  const skin1 = M('#8d5a3b'), skin2 = M('#f0c4a0');
  // Ruby: purple beehive, sequinned teal gown, gold hoops
  const ruby = new T.Group(); ruby.position.set(-.7, 2.2, -.3); body.add(ruby);
  add(ruby, Bx(.8, 1.0, .6), M('#19b3a6', { metalness: .5, roughness: .25 }), 0, .55, 0);
  add(ruby, new T.SphereGeometry(.38, 16, 12), skin1, 0, 1.4, 0);
  add(ruby, new T.CylinderGeometry(.35, .42, 1.0, 16), M('#8a2be2'), 0, 2.0, -.05);
  add(ruby, new T.SphereGeometry(.36, 16, 12), M('#8a2be2'), 0, 2.5, -.05);
  [-1, 1].forEach(s => add(ruby, new T.TorusGeometry(.1, .03, 6, 12), M('#ffd23f', { metalness: .8, roughness: .2 }), s * .38, 1.3, 0));
  add(ruby, Bx(.22, .07, .05), M('#e0004d'), 0, 1.28, .37);
  // Barney: big ginger beard, white sailor cap, rainbow vest, waving arm
  const barney = new T.Group(); barney.position.set(.7, 2.2, -.3); body.add(barney);
  add(barney, Bx(1.0, 1.05, .7), M('#3a5bd9'), 0, .55, 0);
  FLAG_STRIPES(barney);
  add(barney, new T.SphereGeometry(.42, 16, 12), skin2, 0, 1.45, 0);
  add(barney, new T.SphereGeometry(.34, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M('#c0581f'), 0, 1.38, .1);
  add(barney, new T.CylinderGeometry(.38, .4, .22, 16), white, 0, 1.86, 0);
  add(barney, new T.CylinderGeometry(.42, .42, .06, 16), M('#10204a'), 0, 1.76, 0);
  const arm = new T.Group(); arm.position.set(.55, 1.0, 0); barney.add(arm);
  add(arm, Bx(.22, .9, .22), skin2, 0, .45, 0); add(arm, new T.SphereGeometry(.15, 10, 8), skin2, 0, .95, 0);
  function FLAG_STRIPES(g) { FLAG.forEach((c, i) => add(g, Bx(1.02, .09, .72), new T.MeshBasicMaterial({ color: c }), 0, .85 - i * .1, 0, false)); }
  car.userData.wave = arm;
  const wg = new T.CylinderGeometry(.68, .68, .55, 16), wm = M('#141414'), hub = M('#e9e9ef', { metalness: .4 }), wheels = [];
  [[-1.6, 1.7], [1.6, 1.7], [-1.6, -1.7], [1.6, -1.7]].forEach(([x, z]) => { const w = new T.Group(); w.position.set(x, .68, z); const t = new T.Mesh(wg, wm); t.rotation.z = Math.PI / 2; t.castShadow = true; w.add(t); const h = new T.Mesh(new T.CylinderGeometry(.36, .36, .57, 10), hub); h.rotation.z = Math.PI / 2; w.add(h); car.add(w); wheels.push(w); });
  const start = pts.find(p => p.k === 'bar') || pts[0]; car.position.set(start.x + 10, 0, start.z + 10); S.add(car);

  // ---- controls: keys, on-screen pad, tap-to-drive
  const K = {}, pad = { f: 0, t: 0 }; let target = null;
  addEventListener('keydown', e => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key) && box.matches(':hover,:focus-within')) e.preventDefault(); K[e.key.toLowerCase()] = 1; target = null; });
  addEventListener('keyup', e => { K[e.key.toLowerCase()] = 0; });
  document.querySelectorAll('[data-pad]').forEach(b => {
    const [a, v] = b.dataset.pad.split(':'), on = e => { e.preventDefault(); pad[a] = +v; target = null; }, off = () => { pad[a] = 0; };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off);
  });
  const ray = new T.Raycaster(), mv = new T.Vector2();
  R.domElement.addEventListener('click', e => {
    const r = R.domElement.getBoundingClientRect(); mv.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(mv, cam);
    const hit = ray.intersectObjects(items.map(i => i.b))[0]; if (hit) { const it = items.find(i => i.b === hit.object); show(it.p); target = it.p; return; }
    const g = ray.intersectObject(ground)[0]; if (g) target = { x: g.point.x, z: g.point.z };
  });

  // ---- venue card
  let shown = null;
  function show(p) {
    if (shown === p) return; shown = p;
    card.innerHTML = '<strong></strong><span class="k"></span><span class="a"></span><div class="mapbtns"><a class="go">Read more</a><a target="_blank" rel="noopener" class="g">Google Maps</a><a target="_blank" rel="noopener" class="ap">Apple Maps</a><a target="_blank" rel="noopener" class="w">Waze</a></div>';
    card.querySelector('strong').textContent = p.n; card.querySelector('.k').textContent = p.k === 'stay' ? 'Place to stay' : 'Bar or club'; card.querySelector('.a').textContent = p.a;
    card.querySelector('.go').href = p.u; card.querySelector('.g').href = p.g; card.querySelector('.ap').href = p.ap; card.querySelector('.w').href = p.w;
    card.hidden = false;
  }

  // ---- loop
  let speed = 0, heading = Math.PI, last = performance.now(), t0 = last;
  const camPos = new T.Vector3(), look = new T.Vector3();
  function size() { const w = box.clientWidth, h = box.clientHeight; R.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  new ResizeObserver(size).observe(box); size();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, .05); last = now;
    let f = (K['arrowup'] || K['w'] ? 1 : 0) - (K['arrowdown'] || K['s'] ? 1 : 0) + pad.f;
    let t = (K['arrowleft'] || K['a'] ? 1 : 0) - (K['arrowright'] || K['d'] ? 1 : 0) + pad.t;
    if (target) {
      const dx = target.x - car.position.x, dz = target.z - car.position.z, d = Math.hypot(dx, dz);
      if (d < 7) target = null; else { const want = Math.atan2(dx, dz); let diff = ((want - heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI; t = Math.max(-1, Math.min(1, diff * 2)); f = 1; }
    }
    speed += (f * 40 - speed) * Math.min(1, dt * (f ? 1.6 : 2.5));
    heading += t * dt * 2.2 * Math.min(1, Math.abs(speed) / 8) * Math.sign(speed || 1);
    car.position.x += Math.sin(heading) * speed * dt; car.position.z += Math.cos(heading) * speed * dt;
    car.position.x = Math.max(minX + 2, Math.min(minX + 420, car.position.x)); car.position.z = Math.max(-260, Math.min(260, car.position.z));
    for (const it of items) { const dx = car.position.x - it.p.x, dz = car.position.z - it.p.z, d = Math.hypot(dx, dz); if (d < 4.5) { car.position.x = it.p.x + dx / d * 4.5; car.position.z = it.p.z + dz / d * 4.5; speed *= .3; } }
    car.rotation.y = heading; body.rotation.z = -t * Math.min(1, Math.abs(speed) / 30) * .08;
    wheels.forEach(w => { w.rotation.x += speed * dt / .68; });
    if (!reduce) car.userData.wave.rotation.z = -.4 + Math.sin(now / 180) * .45;
    // nearest venue
    let near = null, nd = 1e9; for (const it of items) { const d = Math.hypot(car.position.x - it.p.x, car.position.z - it.p.z); if (d < nd) { nd = d; near = it; } }
    if (nd < 14) { show(near.p); hint.hidden = true; } else if (shown && nd > 20 && !(target && target.u)) { card.hidden = true; shown = null; }
    if (!reduce) items.forEach((it, i) => { it.l.position.y = (it.p.k === 'stay' ? 15 : 12) + Math.sin(now / 600 + i) * .4; });
    camPos.set(car.position.x - Math.sin(heading) * 34, 30, car.position.z - Math.cos(heading) * 34);
    cam.position.lerp(camPos, reduce ? 1 : Math.min(1, dt * 3)); look.set(car.position.x, 2, car.position.z); cam.lookAt(look);
    sun.position.set(car.position.x - 80, 140, car.position.z + 60); sun.target.position.copy(car.position); sun.target.updateMatrixWorld();
    R.render(S, cam); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  box.classList.add('ready');
})();
