(() => {
  const el = document.getElementById('tonight'), data = JSON.parse(document.getElementById('otdata').textContent);
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const get = t => (parts.find(x => x.type === t) || {}).value;
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const today = days.indexOf(get('weekday').toLowerCase().slice(0, 3)); const now = (+get('hour') % 24) * 60 + +get('minute');
  const mins = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const status = h => {
    const yest = h[days[(today + 6) % 7]], tod = h[days[today]];
    const parse = r => { const m = /^(\d\d:\d\d)\s*-\s*(\d\d:\d\d)/.exec(r || ''); if (!m) return null; let a = mins(m[1]), b = mins(m[2]); if (b <= a) b += 1440; return [a, b]; };
    const y = parse(yest); if (y && now + 1440 < y[1]) return ['open', 'Open now, until ' + yest.split('-')[1].trim()];
    const t = parse(tod); if (!t) return ['closed', 'Not listed as open today'];
    if (now >= t[0] && now < t[1]) return ['open', 'Open now, until ' + tod.split('-')[1].trim()];
    if (now < t[0]) return ['later', 'Opens ' + tod.split('-')[0].trim()];
    return ['closed', 'Closed for the night'];
  };
  const rows = Object.values(data).map(v => ({ ...v, s: status(v.h) }));
  const order = { open: 0, later: 1, closed: 2 }; rows.sort((a, b) => order[a.s[0]] - order[b.s[0]] || a.n.localeCompare(b.n));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  el.innerHTML = '<p class="small">Checked at ' + get('hour') + ':' + get('minute') + ' UK time, from listed hours.</p><ul class="otlist">' + rows.map(r => `<li class="${r.s[0]}"><a href="${esc(r.u)}">${esc(r.n)}</a><span>${esc(r.s[1])}</span><em>${esc(r.k)}</em></li>`).join('') + '</ul>';
})();
