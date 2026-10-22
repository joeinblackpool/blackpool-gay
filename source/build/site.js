/* Blackpool.gay: small progressive enhancements. Everything works without this file. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // header gains a shadow once the page scrolls
  var top = document.querySelector('.top');
  if (top) { var onS = function () { top.classList.toggle('scrolled', scrollY > 8); }; addEventListener('scroll', onS, { passive: true }); onS(); }
  // cards: soft light follows the pointer
  if (!reduce && matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.card'); if (!c) return;
      var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  // a little rainbow glitter follows the pointer (mouse only, never on touch, off for reduced motion)
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) (function () {
    var cv = document.createElement('canvas'), cx2 = cv.getContext('2d'), ps = [], run = 0, dpr = Math.min(2, devicePixelRatio || 1), lx = -1, ly = -1, hue = 0;
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
    function size() { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
    size(); addEventListener('resize', size, { passive: true });
    document.body.appendChild(cv);
    function star(x, y, r, a) {
      cx2.beginPath();
      for (var i = 0; i < 8; i++) { var k = i % 2 ? r * .38 : r, t = a + i * Math.PI / 4; cx2.lineTo(x + Math.cos(t) * k, y + Math.sin(t) * k); }
      cx2.closePath(); cx2.fill();
    }
    function frame() {
      cx2.clearRect(0, 0, cv.width, cv.height);
      cx2.globalCompositeOperation = 'lighter';
      for (var i = ps.length - 1; i >= 0; i--) {
        var p = ps[i]; p.l -= 1; if (p.l <= 0) { ps.splice(i, 1); continue; }
        p.vy += .045; p.vx *= .97; p.x += p.vx; p.y += p.vy; p.a += p.s;
        var f = p.l / p.m, tw = .55 + .45 * Math.sin(p.l * .6 + p.h);
        cx2.globalAlpha = f * tw;
        cx2.fillStyle = 'hsl(' + p.h + ',100%,' + (62 + 20 * tw) + '%)';
        star(p.x * dpr, p.y * dpr, p.r * dpr * (.6 + .4 * f), p.a);
      }
      cx2.globalAlpha = 1;
      run = ps.length ? requestAnimationFrame(frame) : 0;
      if (!run) cx2.clearRect(0, 0, cv.width, cv.height);
    }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var dx = e.clientX - lx, dy = e.clientY - ly, d = Math.sqrt(dx * dx + dy * dy); lx = e.clientX; ly = e.clientY;
      if (d < 4 || ps.length > 90) return;
      var n = Math.min(3, 1 + (d / 18 | 0));
      for (var i = 0; i < n; i++) {
        hue = (hue + 23) % 360;
        ps.push({ x: e.clientX + (Math.random() - .5) * 8, y: e.clientY + (Math.random() - .5) * 8, vx: (Math.random() - .5) * 1.4 - dx * .02, vy: (Math.random() - .7) * 1.2, r: 2.2 + Math.random() * 3.2, a: Math.random() * 6, s: (Math.random() - .5) * .2, h: hue, l: 0, m: 0 });
        var q = ps[ps.length - 1]; q.l = q.m = 34 + (Math.random() * 22 | 0);
      }
      if (!run) run = requestAnimationFrame(frame);
    }, { passive: true });
  })();

  // reduced motion: freeze SMIL characters everywhere (cast page, headers)
  if (reduce) [].forEach.call(document.querySelectorAll('svg'), function (s) { try { s.pauseAnimations(); } catch (e) {} });


  // the cast peeps over headings, photos and pictures as you scroll; shy of the pointer, playful on hover
  var PEEKS = /*PEEKS*/{};
  (function () {
    if (reduce || !PEEKS.who) return;
    var main = document.querySelector('main'); if (!main || document.querySelector('.hero')) return;
    var hosts = [].slice.call(main.querySelectorAll('h2, .pgal, .vface, .postcard, .cards')).filter(function (h, i) { return !(h.tagName === 'H2' && h.closest('.castcard, .symgrid, .card')); });
    if (hosts.length < 2) return;
    var names = Object.keys(PEEKS.who), seed = 0, path = location.pathname;
    for (var i = 0; i < path.length; i++) seed = (seed * 31 + path.charCodeAt(i)) >>> 0;
    var want = Math.min(matchMedia('(max-width: 700px)').matches ? 2 : 3, Math.ceil(hosts.length / 3)), step = hosts.length / want, wins = [];
    document.body.insertAdjacentHTML('beforeend', PEEKS.defs);
    for (var k = 0; k < want; k++) {
      var host = hosts[Math.floor((k + (seed % 97) / 97) * step) % hosts.length], who = names[(seed + k * 3) % names.length];
      var win = document.createElement('span'); win.className = 'pk-win'; win.innerHTML = PEEKS.who[who];
      var x = 10 + ((seed >> (k * 3)) % 60);
      if (host.tagName === 'H2') {
        // behind the words themselves: the character rises from behind the last letters of the heading
        host.classList.add('pk-h'); var r = document.createRange(); r.selectNodeContents(host); var tw = r.getBoundingClientRect().width, hw = host.getBoundingClientRect().width;
        win.style.left = Math.max(0, Math.min(hw - 86, tw - 56)) + 'px'; host.appendChild(win);
      } else {
        var hold = document.createElement('span'); hold.className = 'pk-hold'; win.style.left = x + '%'; hold.appendChild(win); host.parentNode.insertBefore(hold, host);
      }
      wins.push(win);
    }
    // no scroll-driven animation support: rise when the host comes into view instead
    if (!(window.CSS && CSS.supports('animation-timeline: view()')) && window.IntersectionObserver) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('up', e.isIntersecting); }); }, { rootMargin: '-15% 0px -20% 0px' });
      wins.forEach(function (w) { w.classList.add('pk-io'); io.observe(w); });
    }
    // shy: duck when the pointer comes close, peek back a moment later
    if (matchMedia('(hover: hover)').matches) {
      var px = -1e4, py = -1e4, ticking = false;
      document.addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false;
        wins.forEach(function (w) { var b = w.getBoundingClientRect(), d = Math.hypot(px - (b.left + b.width / 2), py - (b.top + b.height * .6));
          if (d < 64 && !w.classList.contains('duck')) { w.classList.add('duck'); clearTimeout(w._t); w._t = setTimeout(function () { w.classList.remove('duck'); }, 1400); } }); }); } }, { passive: true });
    }
  })();

  var hero = document.querySelector('.hero'); if (!hero) return;
  var stage = hero.querySelector('.stage'), svgs = [].slice.call(hero.querySelectorAll('.stage svg'));
  // the stage always covers the hero at 16:9, anchored to the road
  if (stage && window.ResizeObserver) new ResizeObserver(function () { hero.style.setProperty('--sw', (hero.offsetHeight * 16 / 9).toFixed(0) + 'px'); }).observe(hero);

  // play / pause everything, CSS and SMIL (Tower LEDs, coaster train)
  var btn = hero.querySelector('.motion-btn'), userOff = false, onScreen = true;
  try { userOff = localStorage.getItem('bg-motion') === 'off'; } catch (e) {}
  function apply() {
    var stop = reduce || userOff || !onScreen;
    hero.classList.toggle('paused', stop);
    svgs.forEach(function (s) { try { stop ? s.pauseAnimations() : s.unpauseAnimations(); } catch (e) {} });
    if (btn) { btn.setAttribute('aria-pressed', userOff ? 'true' : 'false'); btn.textContent = userOff ? 'Play motion' : 'Pause motion'; }
  }
  if (btn) { if (reduce) btn.hidden = true; btn.addEventListener('click', function () { userOff = !userOff; try { localStorage.setItem('bg-motion', userOff ? 'off' : 'on'); } catch (e) {} apply(); }); }
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; apply(); }).observe(hero);
  apply();

  // music: an original disco groove made live in the browser (no audio file, nothing to download).
  // It only ever starts on a click or tap, and it fades out when the scene scrolls away or the tab is hidden.
  var AC = window.AudioContext || window.webkitAudioContext, sbtn = hero.querySelector('.sound-btn');
  if (AC && sbtn) (function () {
    sbtn.hidden = false;
    var ctx, master, nbuf, want = false, on = false, timer = 0, next = 0, step = 0;
    var BPM = 141.18, S16 = 60 / BPM / 4;            // two bars = 3.4 s, one full Y-M-C-A routine
    var PROG = [[50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59], [57, 61, 64, 67]];   // Dm7, G7, Cmaj7, A7
    var hz = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
    function init() {
      ctx = new AC();
      var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
      master = ctx.createGain(); master.gain.value = 0.0001; master.connect(comp); comp.connect(ctx.destination);
      nbuf = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
      var d = nbuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
    function kick(t) { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .14); env(g, t, .003, .9, .28); o.connect(g); g.connect(master); o.start(t); o.stop(t + .34); }
    function hiss(t, type, freq, q, peak, dec) { var n = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); n.buffer = nbuf; fl.type = type; fl.frequency.value = freq; fl.Q.value = q; env(g, t, .002, peak, dec); n.connect(fl); fl.connect(g); g.connect(master); n.start(t); n.stop(t + dec + .05); }
    function tone(t, m, type, peak, dec, cut) { var o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = type; o.frequency.value = hz(m); fl.type = 'lowpass'; fl.frequency.value = cut; env(g, t, .006, peak, dec); o.connect(fl); fl.connect(g); g.connect(master); o.start(t); o.stop(t + dec + .05); }
    function play16(t, s) {
      var bar = Math.floor(s / 16) % 4, i = s % 16, ch = PROG[bar];
      if (i % 4 === 0) kick(t);                                                       // four on the floor
      if (i % 4 === 2) hiss(t, 'highpass', 8000, .7, .2, .09);                         // open hat on the off-beat
      if (i % 2 === 1) hiss(t, 'highpass', 9500, .7, .05, .03);
      if (i === 4 || i === 12) { hiss(t, 'bandpass', 1500, 1.2, .45, .12); hiss(t + .012, 'bandpass', 1150, 1.2, .3, .14); }   // clap
      if (i % 2 === 0) tone(t, ch[0] - 24 + (i % 4 === 2 ? 12 : 0), 'sawtooth', .3, .16, 900);      // octave-jumping bass
      if (i === 6 || i === 14) ch.forEach(function (m) { tone(t, m + 12, 'sawtooth', .06, .24, 3200); });   // string stabs
      if (bar > 1 && i % 2 === 0) tone(t, ch[(i / 2) % 4] + 24, 'triangle', .05, .12, 6000);       // sparkle
    }
    function pump() { while (next < ctx.currentTime + .12) { play16(next, step); next += S16; step++; } timer = setTimeout(pump, 25); }
    function start() {
      if (on) return; if (!ctx) init(); if (ctx.resume) ctx.resume();
      on = true; step = 0; next = ctx.currentTime + .06; pump();
      master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(.7, ctx.currentTime, .25);
      var ps = hero.querySelector('.ly-posse svg'); if (ps) try { ps.setCurrentTime(0); } catch (e) {}   // the Posse hit Y on the downbeat
    }
    function stop() { if (!on) return; on = false; clearTimeout(timer); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0.0001, ctx.currentTime, .12); }
    var visible = true;
    function sync() {
      (want && visible && !document.hidden) ? start() : stop();
      hero.classList.toggle('playing', want);
      sbtn.setAttribute('aria-pressed', want ? 'true' : 'false'); sbtn.textContent = want ? 'Stop the music' : 'Play the Prom';
    }
    function toggle() { want = !want; sync(); }
    sbtn.addEventListener('click', toggle);
    hero.addEventListener('click', function (e) { if (e.target.closest('a,button,input,textarea,select,label')) return; if (getSelection && String(getSelection())) return; toggle(); });
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }, { threshold: .15 }).observe(hero);
    document.addEventListener('visibilitychange', sync);
  })();
  if (reduce) return;

  // pointer parallax: background layers drift against the pointer, eased with a lerp (no CSS transitions)
  var layers = [].slice.call(hero.querySelectorAll('.par')), tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  function tick() {
    cx += (tx - cx) * .08; cy += (ty - cy) * .08;
    layers.forEach(function (l) { var d = +l.getAttribute('data-d') || 0; l.style.translate = (-cx * d).toFixed(2) + 'px ' + (-cy * d * .5).toFixed(2) + 'px'; });
    raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > .001) ? requestAnimationFrame(tick) : 0;
  }
  if (matchMedia('(hover: hover)').matches) hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5; if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  // hovering "Drive it in 3D" puts your foot down: the whole world speeds up, smoothly
  var go = hero.querySelector('.ctas a[href^="/explore/"]'), MOVING = /^(rlHalf|rlDash|rlLamps|turn)$/;
  function speed(to) {
    if (!document.getAnimations) return;
    var anims = document.getAnimations().filter(function (a) { return a.animationName && MOVING.test(a.animationName) && stage.contains(a.effect && a.effect.target); });
    var from = anims.length ? anims[0].playbackRate : 1, t0 = performance.now();
    (function step(now) { var k = Math.min(1, (now - t0) / 600), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, r = from + (to - from) * e; anims.forEach(function (a) { a.updatePlaybackRate ? a.updatePlaybackRate(r) : (a.playbackRate = r); }); if (k < 1) requestAnimationFrame(step); })(t0);
  }
  if (go) { go.addEventListener('mouseenter', function () { speed(2.2); }); go.addEventListener('mouseleave', function () { speed(1); }); go.addEventListener('focus', function () { speed(2.2); }); go.addEventListener('blur', function () { speed(1); }); }
})();
