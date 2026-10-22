"""Bake the skyline's warm rim glow into a small PNG (run after changing the skyline art):
    python3 tools/bake_skyglow.py
Renders the silhouette (both tiles + the big wheels) with headless Chromium, blurs it with Pillow and tints it.
Output: source/build/skyglow.webp (used by art.hero_scene under the crisp, filter-free silhouette)."""
import os, subprocess, sys, json
from PIL import Image, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'source', 'build'))
import art
W, H, S = 3840, 900, .5
parts = []
for t in (0, 1):
    P = art.skyline(f'b{t}', ground=742, split=True)
    cx, cy, r, wh = P['wheel']
    parts.append(f'<g transform="translate({t * 1920} 0)"><g fill="#fff" stroke="#fff">{P["shape"]}</g><g fill="#fff">{wh.replace("#24113f", "#fff")}</g></g>')
svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{int(W * S)}" height="{int(H * S)}" viewBox="0 0 {W} {H}">' + ''.join(parts) + '</svg>'
tmp = os.path.join(ROOT, 'tools', '_sil.svg'); open(tmp, 'w').write(svg)
png = os.path.join(ROOT, 'tools', '_sil.png')
js = f"""import {{ chromium }} from '/home/claude/.npm-global/lib/node_modules/@playwright/mcp/node_modules/playwright/index.mjs';
const b = await chromium.launch({{ executablePath: '/opt/pw-browsers/chromium' }});
const p = await b.newPage({{ viewport: {{ width: {int(W * S)}, height: {int(H * S)} }} }});
await p.goto('file://{tmp}'); await p.screenshot({{ path: '{png}', omitBackground: true }}); await b.close();"""
open(os.path.join(ROOT, 'tools', '_r.mjs'), 'w').write(js)
subprocess.run(['node', os.path.join(ROOT, 'tools', '_r.mjs')], check=True)
a = Image.open(png).convert('RGBA').split()[3]
a = a.filter(ImageFilter.GaussianBlur(4.5 * S * 1.15))
a = a.point(lambda v: min(255, int(v * 1.9)))
glow = Image.new('RGBA', a.size, (255, 163, 107, 0)); glow.putalpha(a.point(lambda v: int(v * .85)))
glow = glow.resize((int(W * S / 2), int(H * S / 2)), Image.LANCZOS)  # blurry anyway: quarter-res is enough
out = os.path.join(ROOT, 'source', 'build', 'skyglow.webp')
glow.save(out, quality=80, method=6)
for f in ('_sil.svg', '_sil.png', '_r.mjs'): os.remove(os.path.join(ROOT, 'tools', f))
print('wrote', out, os.path.getsize(out), 'bytes', glow.size)
