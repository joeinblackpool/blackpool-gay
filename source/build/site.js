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
