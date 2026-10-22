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
  // hero: gentle parallax on pointer and scroll
  var hero = document.querySelector('.hero');
  if (hero && !reduce) {
    var layers = [].slice.call(hero.querySelectorAll('.par')), px = 0, py = 0, sy = 0, raf = 0;
    var paint = function () { raf = 0; layers.forEach(function (l) { var d = +l.getAttribute('data-d') || 0; l.style.transform = 'translate(' + (px * d).toFixed(1) + 'px,' + (py * d * .6 + sy * d * .02).toFixed(1) + 'px)'; }); };
    var ask = function () { if (!raf) raf = requestAnimationFrame(paint); };
    hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - .5; py = (e.clientY - r.top) / r.height - .5; ask(); }, { passive: true });
    addEventListener('scroll', function () { sy = Math.min(scrollY, 900); ask(); }, { passive: true });
    // pause scene animations when the hero is off screen
    new IntersectionObserver(function (es) { hero.classList.toggle('paused', !es[0].isIntersecting); }).observe(hero);
  }
})();
