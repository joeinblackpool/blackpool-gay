(() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  document.querySelectorAll('.posts').forEach(async box => {
    try { const r = await fetch('/api/forum/' + box.dataset.topic); const j = await r.json();
      box.innerHTML = (j.posts || []).length ? j.posts.map(p => `<div class="post"><strong>${esc(p.name)}</strong> <span class="small">${esc((p.at || '').slice(0, 10))}</span><p>${esc(p.body)}</p></div>`).join('') : '<p class="small">No approved posts yet. Be the first.</p>';
    } catch (e) { box.innerHTML = ''; }
  });
  document.querySelectorAll('.postform').forEach(f => {
    const hp = document.createElement('input'); hp.name = 'website'; hp.tabIndex = -1; hp.autocomplete = 'off'; hp.className = 'hp'; f.appendChild(hp);
    f.addEventListener('submit', async e => {
      e.preventDefault(); const st = f.querySelector('.status'); st.textContent = 'Sending…';
      try { const r = await fetch('/api/forum/' + f.dataset.topic, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: f.name.value, body: f.body.value, website: hp.value }) });
        const j = await r.json(); st.textContent = j.message || j.error || 'Sent.'; if (r.ok) f.reset();
      } catch (err) { st.textContent = 'Could not send. Please try again.'; }
    });
  });
})();
