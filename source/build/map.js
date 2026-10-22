(() => {
  if (!window.L) return;
  document.querySelectorAll('.map').forEach(el => {
    const d = JSON.parse(el.querySelector('.mapdata').textContent);
    const m = L.map(el, { scrollWheelZoom: false }).setView(d.c, d.z);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(m);
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const pts = [];
    d.pins.forEach(p => {
      const icon = L.divIcon({ className: 'pin ' + p.k, html: '<span></span>', iconSize: [18, 18], iconAnchor: [9, 9] });
      L.marker(p.p, { icon, title: p.n }).addTo(m).bindPopup(`<strong><a href="${esc(p.u)}">${esc(p.n)}</a></strong><br>${esc(p.a)}<br><a href="${esc(p.g)}" target="_blank" rel="noopener">Google</a> · <a href="${esc(p.ap)}" target="_blank" rel="noopener">Apple</a> · <a href="${esc(p.w)}" target="_blank" rel="noopener">Waze</a>`);
      pts.push(p.p);
    });
    if (pts.length > 1 && d.pins.length < 40) m.fitBounds(pts, { padding: [30, 30], maxZoom: 18 });
  });
})();
