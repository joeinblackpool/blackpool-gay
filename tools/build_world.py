"""Build source/data/world.json for the 3D drive from real open data.

Inputs (in source/data/):
  osm-extra.json - a fresh OpenStreetMap API extract: furniture 'f' [kind, x, z], addresses 'addr' [number, street, x, z],
                   named businesses 'shops' [name, type, x, z]; merged in below (deduped against osm-full within 2 m)
  osm-pois.txt   - the older list of 545 named businesses 'x|z|kind|name' (kind g/s/f/b, t = tram stop)
  osm-full.json  - OpenStreetMap (ODbL) buildings, highways, areas and street furniture for the Rainbow Quarter,
                   plus Microsoft Global ML Building Footprints (ODbL) for buildings OpenStreetMap does not have yet
                   and measured heights where they overlap. Coordinates are metres east (x) and south (z) of 53.8228, -3.0525.
  world.json     - the previous file: coast, beach, parks, platforms, rail and pier areas are kept from it, as are the
                   OpenStreetMap businesses ('p').

Output keys:
  b   buildings  [height_m or 0, name, x0, z0, dx1, dz1, ...]
  bm  building meta [type, wall colour, roof colour, roof shape, material, source 'o'|'m']
  r   streets    [class, name, x0, z0, dx1, dz1, ...]  class 0 service, 1 residential, 2 tertiary, 3 primary/secondary, 4 footway/pedestrian (not driven)
  rw  street width in metres per street (real where tagged, else by class)
  o   one-way flags per segment ('+' drawing order only, '-' against it, '0' two-way)
  sw  pavements per street from the OpenStreetMap sidewalk tag: 'b' both, 'l' left, 'r' right, 'n' none
      (untagged: both for public streets, none for service roads and paths)
  ln  lanes per street from the OpenStreetMap lanes tag (0 = untagged), one digit per street
  ms  speed limit per street from maxspeed, mph as a string list ('' = untagged)
  x   crossings  [x, z, kind, angle] kind: zebra | signals | rainbow
  f   furniture  [kind, x, z]  lamp | tree | bench | signals | busstop | postbox | phone
  a   areas      kept areas plus parking, grass, walls, fences, tram lines
  p   businesses [x, z, kind, name] kind g stay, b pub/bar/club, f food/drink, s shop/other, t tram stop
  ad  house numbers [number, x, z]
  ph  photo facades  [file, building index, ax, az, bx, bz, credit index]: an openly licensed Wikimedia Commons photo
      on the real building's street face that looks towards where the photographer stood (photo-pick.json + commons-photos.json)
  pa  arrival photos [file, venue slug or landmark key, x, z, credit index]
"""
import json, math, os
D = os.path.join(os.path.dirname(__file__), '..', 'source', 'data')
src = json.load(open(os.path.join(D, 'osm-full.json')))
old = json.load(open(os.path.join(D, 'world.json')))
ext = json.load(open(os.path.join(D, 'osm-extra.json'))) if os.path.exists(os.path.join(D, 'osm-extra.json')) else {'f': [], 'addr': [], 'shops': []}
X0, X1, Z0, Z1 = -560, 600, -690, 880
inb = lambda p: X0 - 40 <= p[0] <= X1 + 40 and Z0 - 40 <= p[1] <= Z1 + 40

def enc(pts):
    out, px, pz = [], 0.0, 0.0
    for i, (x, z) in enumerate(pts):
        x, z = round(x, 1), round(z, 1)
        out += [x, z] if i == 0 else [round(x - px, 1), round(z - pz, 1)]
        px, pz = x, z
    return out

def ring(pts):
    pts = [tuple(p) for p in pts]
    if len(pts) > 2 and pts[0] == pts[-1]: pts = pts[:-1]
    return pts

# ---------------------------------------------------------------- buildings
TOWER = (-180, 768)   # the Tower's own model replaces its OpenStreetMap parts
b, bm = [], []
def height(t, msh):
    try:
        if t.get('h'): return float(str(t['h']).replace('m', '').strip())
    except ValueError: pass
    try:
        if t.get('lv'): return float(t['lv']) * 3.1 + 1.2
    except ValueError: pass
    return msh or 0
for o in src['osmBuildings']:
    pts = ring(o['pts']); t = o['t']
    if len(pts) < 3 or not any(inb(p) for p in pts): continue
    cx, cz = sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)
    h = height(t, o.get('msh'))
    if math.hypot(cx - TOWER[0], cz - TOWER[1]) < 22 and (h > 40 or t.get('bc') == '#aa4043'): continue
    b.append([round(h, 1), t.get('n', '')] + enc(pts)); bm.append([t.get('b', ''), t.get('bc', ''), t.get('rc', ''), t.get('rs', ''), t.get('m', ''), 'o'])
for m in src['msBuildings']:
    pts = ring(m['pts'])
    if len(pts) < 3 or not any(inb(p) for p in pts): continue
    xs = [p[0] for p in pts]; zs = [p[1] for p in pts]
    if (max(xs) - min(xs)) * (max(zs) - min(zs)) < 12: continue      # sheds and noise
    b.append([round(m.get('h') or 0, 1), ''] + enc(pts)); bm.append(['', '', '', '', '', 'm'])

# ---------------------------------------------------------------- streets
CLS = {'primary': 3, 'secondary': 3, 'trunk': 3, 'tertiary': 2, 'residential': 1, 'unclassified': 1, 'living_street': 1, 'service': 0,
       'pedestrian': 4, 'footway': 4, 'path': 4, 'steps': 4, 'cycleway': 4}
DEFW = {3: 10.5, 2: 8.5, 1: 7.0, 0: 4.5, 4: 3.0}
r, rw, ow, sw, ln, ms = [], [], [], [], [], []
for h in src['highways']:
    c = CLS.get(h['hw'])
    if c is None or len(h['pts']) < 2 or not any(inb(p) for p in h['pts']): continue
    if c == 0 and h.get('sv') in ('parking_aisle', 'driveway', 'drive-through'): continue
    w = DEFW[c]
    try:
        if h.get('w'): w = float(str(h['w']).replace('m', '').strip())
        elif h.get('ln') and c < 4: w = max(4.5, float(h['ln']) * 3.3 + 1)
    except ValueError: pass
    if h['hw'] == 'pedestrian': w = max(w, 6)
    pts = [tuple(p) for p in h['pts']]
    r.append([c, h.get('n', '')] + enc(pts)); rw.append(round(w, 1))
    f = '+' if h.get('ow') in ('yes', 'true', '1') else '-' if h.get('ow') == '-1' else '0'
    ow.append(f * (len(pts) - 1) if c < 4 else '0' * (len(pts) - 1))
    try: ln.append(str(min(9, int(float(h.get('ln') or 0)))))
    except ValueError: ln.append('0')
    ms.append(''.join(ch for ch in (h.get('ms') or '') if ch.isdigit()))
    t = h.get('sw') or ''
    sw.append({'both': 'b', 'separate': 'b', 'left': 'l', 'right': 'r', 'no': 'n', 'none': 'n'}.get(t, 'b' if 1 <= c <= 3 and h['hw'] != 'living_street' else 'n'))

# ---------------------------------------------------------------- crossings: real OpenStreetMap crossings plus the 2024 rainbow crossings on Dickson Road
def road_angle(x, z, names=None):
    best, ang = 1e9, 0
    for row, h in zip(r, src['highways']):
        pass
    for h in src['highways']:
        if CLS.get(h['hw'], 4) >= 4: continue
        if names and h.get('n') not in names: continue
        for a, c in zip(h['pts'], h['pts'][1:]):
            dx, dz = c[0] - a[0], c[1] - a[1]; l2 = dx * dx + dz * dz or 1
            t = max(0, min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); d = math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)
            if d < best: best, ang = d, math.atan2(dz, dx)
    return best, ang
xs = []
for k, x, z in src['furniture']:
    if not k.startswith('crossing') or not inb((x, z)): continue
    parts = k.split(':'); kind = 'zebra' if 'zebra' in parts else 'signals' if 'traffic_signals' in parts else ''
    if not kind: continue
    d, ang = road_angle(x, z)
    if d < 8: xs.append([round(x, 1), round(z, 1), kind, round(ang, 3)])

def along(name, a_name, offset):
    """Point on street `name` `offset` metres from where it meets street `a_name` (towards the town centre, +z)."""
    A = [h for h in src['highways'] if h.get('n') == name]; Bn = [h for h in src['highways'] if h.get('n') == a_name]
    best = None
    for h in A:
        for p in h['pts']:
            for g in Bn:
                for q in g['pts']:
                    d = math.hypot(p[0] - q[0], p[1] - q[1])
                    if best is None or d < best[0]: best = (d, p, h)
    d, p, h = best
    pts = h['pts']; i = min(range(len(pts)), key=lambda k: math.hypot(pts[k][0] - p[0], pts[k][1] - p[1]))
    j = i + 1 if i + 1 < len(pts) else i - 1
    dx, dz = pts[j][0] - pts[i][0], pts[j][1] - pts[i][1]; L = math.hypot(dx, dz) or 1
    if dz < 0: dx, dz = -dx, -dz
    return [round(p[0] + dx / L * offset, 1), round(p[1] + dz / L * offset, 1), 'rainbow', round(math.atan2(dz, dx), 3)]
# Blackpool Tram Blog (March 2024): zebra crossings near Cocker Street and Banks Street, and a four-way crossing at the Springfield Road lights
rain = [along('Dickson Road', 'Cocker Street', 9), along('Dickson Road', 'Banks Street', 9)]
jx = along('Dickson Road', 'Springfield Road', 0)
arms = []
for h in src['highways']:
    if h.get('n') not in ('Dickson Road', 'Springfield Road'): continue
    pts = h['pts']
    for i, q in enumerate(pts):
        if math.hypot(q[0] - jx[0], q[1] - jx[1]) > 2: continue
        for j in (i - 1, i + 1):
            if 0 <= j < len(pts):
                dx, dz = pts[j][0] - q[0], pts[j][1] - q[1]; L = math.hypot(dx, dz) or 1; ang = math.atan2(dz, dx)
                if all(abs(math.remainder(ang - a2, 2 * math.pi)) > .5 for a2 in arms):
                    arms.append(ang); rain.append([round(jx[0] + dx / L * 8, 1), round(jx[1] + dz / L * 8, 1), 'rainbowlights', round(ang, 3)])
# crossings from the fresh extract (kind:crossing:crossing_ref), deduped against the ones we have within 2 m
for k, x, z in ext['f']:
    if not k.startswith('crossing') or not inb((x, z)): continue
    parts = k.split(':')
    kind = 'zebra' if 'zebra' in parts else 'signals' if ('traffic_signals' in parts or 'puffin' in parts or 'toucan' in parts) else 'marked' if 'marked' in parts else ''
    if not kind or any(math.hypot(c[0] - x, c[1] - z) < 2 for c in xs): continue
    d, ang = road_angle(x, z)
    if d < 8: xs.append([round(x, 1), round(z, 1), kind, round(ang, 3)])
xs = [c for c in xs if all(math.hypot(c[0] - q[0], c[1] - q[1]) > 6 for q in rain)] + rain

# ---------------------------------------------------------------- furniture
F = [[k, round(x, 1), round(z, 1)] for k, x, z in src['furniture'] if not k.startswith('crossing') and inb((x, z))]
for k, x, z in ext['f']:
    if k.startswith('crossing') or not inb((x, z)): continue
    near = 8 if k == 'tramstop' else 2          # a tram stop is mapped as several nodes (stop, platform): keep one per stop side
    if any(f[0] == k and math.hypot(f[1] - x, f[2] - z) < near for f in F): continue
    F.append([k, round(x, 1), round(z, 1)])

# ---------------------------------------------------------------- businesses and house numbers
KIND = lambda t: ('g' if t in ('guest_house', 'hotel', 'apartment', 'hostel', 'motel', 'chalet') else
                  'b' if t in ('pub', 'bar', 'nightclub', 'biergarten', 'casino') else
                  'f' if t in ('fast_food', 'cafe', 'restaurant', 'ice_cream', 'food_court') else 's')
P = []
for x, z, k, name in (l.rstrip('\n').split('|', 3) for l in open(os.path.join(D, 'osm-pois.txt')) if l.count('|') >= 3):
    P.append([round(float(x), 1), round(float(z), 1), k, name])
for name, t, x, z in ext['shops']:
    if not name or t == 'parking' or not inb((x, z)): continue
    hit = [q for q in P if q[3] == name and math.hypot(q[0] - x, q[1] - z) < 20]
    if hit: hit[0][0], hit[0][1] = round(x, 1), round(z, 1); continue    # same business: take the fresher position
    P.append([round(x, 1), round(z, 1), KIND(t), name])
P = [q for q in P if inb((q[0], q[1]))]
AD = []
for num, street, x, z in ext['addr']:
    if num and inb((x, z)) and not any(a[0] == num and math.hypot(a[1] - x, a[2] - z) < 2 for a in AD): AD.append([str(num)[:9], round(x, 1), round(z, 1)])

# ---------------------------------------------------------------- areas
A = [a for a in old['a'] if a[0] in ('coast', 'beach', 'park', 'park0', 'plat', 'rail', 'pier')]
for a in src['areas']:
    k, pts = a['k'], [tuple(p) for p in a['pts']]
    if len(pts) < 2 or not any(inb(p) for p in pts): continue
    kk = {'parking': 'parking', 'grass': 'grass', 'park': 'park', 'pitch': 'grass', 'wall': 'wall', 'fence': 'wall', 'retaining_wall': 'wall', 'tram': 'tram'}.get(k)
    if kk: A.append([kk, a.get('n', '')] + enc(pts))
_seen = set(); A = [a for a in A if not (json.dumps(a) in _seen or _seen.add(json.dumps(a)))]   # re-running must not duplicate kept areas

# ---------------------------------------------------------------- Wikimedia Commons photos (credits in photo-credits.json)
PH, PA = [], []
if os.path.exists(os.path.join(D, 'photo-pick.json')) and os.path.exists(os.path.join(D, 'photo-credits.json')):
    pick = json.load(open(os.path.join(D, 'photo-pick.json'))); cred = json.load(open(os.path.join(D, 'photo-credits.json')))
    cam = {c[0]: (c[1], c[2]) for c in json.load(open(os.path.join(D, 'commons-photos.json')))}
    ci = {c['file']: i for i, c in enumerate(cred)}
    def dec(a):
        o, x, z = [], 0, 0
        for i in range(2, len(a) - 1, 2): x += a[i]; z += a[i + 1]; o.append((x, z))
        return ring(o)
    FPS = [dec(x) for x in b]
    def inside(x, z, pts):
        c, j = False, len(pts) - 1
        for i in range(len(pts)):
            a1, b1 = pts[i], pts[j]
            if (a1[1] > z) != (b1[1] > z) and x < (b1[0] - a1[0]) * (z - a1[1]) / (b1[1] - a1[1]) + a1[0]: c = not c
            j = i
        return c
    def faces(i, cx, cz):
        pts = FPS[i]; ar = sum(pts[k - 1][0] * pts[k][1] - pts[k][0] * pts[k - 1][1] for k in range(len(pts))) / 2; out = []
        for k in range(len(pts)):
            a1, b1 = pts[k], pts[(k + 1) % len(pts)]; dx, dz = b1[0] - a1[0], b1[1] - a1[1]; L = math.hypot(dx, dz)
            if L < 4: continue
            nx, nz = dz / L, -dx / L
            if ar < 0: nx, nz = -nx, -nz
            mx, mz = (a1[0] + b1[0]) / 2, (a1[1] + b1[1]) / 2; d = math.hypot(cx - mx, cz - mz) or 1
            dot = (nx * (cx - mx) + nz * (cz - mz)) / d
            if dot > .35: out.append((L * dot / (d + 15), a1, b1, d))
        return sorted(out, key=lambda o: -o[0])
    for f, use, t, crop in pick:
        c = cred[ci[f]]; cx, cz = cam.get(c['title'], (None, None))
        if use == 'arrival':
            PA.append([f, t, cx, cz, ci[f]]); continue
        if cx is None: continue
        bi = None
        if t.get('poi') or t.get('pin'):
            nm = (t.get('poi') or t.get('pin')).lower()
            q = next((q for q in P if q[3].lower() == nm), None) or next((q for q in P if nm in q[3].lower()), None)
            if q:
                bi = next((i for i, pts in enumerate(FPS) if len(pts) > 2 and inside(q[0], q[1], pts)), None)
                if bi is None: bi = min(range(len(FPS)), key=lambda i: min(math.hypot(p[0] - q[0], p[1] - q[1]) for p in FPS[i]) if len(FPS[i]) > 2 else 1e9)
        best = None
        for i in ([bi] if bi is not None else range(len(FPS))):
            if len(FPS[i]) < 3: continue
            for sc, a1, b1, d in faces(i, cx, cz)[:1]:
                if (bi is not None or d < 45) and (best is None or sc > best[0]): best = (sc, i, a1, b1)
        if best: PH.append([f, best[1], round(best[2][0], 1), round(best[2][1], 1), round(best[3][0], 1), round(best[3][1], 1), ci[f]])

W = dict(old)
W.update({'p': P, 'ad': AD, 'ph': PH, 'pa': PA, 'b': b, 'bm': bm, 'r': r, 'rw': rw, 'o': ow, 'sw': ''.join(sw), 'ln': ''.join(ln), 'ms': ms, 'x': xs, 'f': F, 'a': A})
json.dump(W, open(os.path.join(D, 'world.json'), 'w'), separators=(',', ':'))
print('photo facades', len(PH), 'arrival photos', len(PA), 'businesses', len(P), 'house numbers', len(AD), 'buildings', len(b), 'with height', sum(1 for x in b if x[0] > 0), 'streets', len(r), 'crossings', len(xs), 'rainbow', len(rain), 'furniture', len(F), 'areas', len(A),
      'kb', os.path.getsize(os.path.join(D, 'world.json')) // 1024)
