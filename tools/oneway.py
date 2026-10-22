"""Mark one-way street segments in source/data/world.json from OpenStreetMap one-way ways (source/data/osm-oneway.txt).
Each road gets a flag string in W['o'], one character per segment: '0' two-way, '+' only in drawing order, '-' only against it."""
import json, math, os
D = os.path.join(os.path.dirname(__file__), '..', 'source', 'data')
W = json.load(open(os.path.join(D, 'world.json')))
segs = []
for line in open(os.path.join(D, 'osm-oneway.txt')):
    pts = [tuple(map(float, p.split(','))) for p in line.split()]
    segs += [(a, b) for a, b in zip(pts, pts[1:]) if a != b]
grid = {}
for i, (a, b) in enumerate(segs):
    for x in range(int(min(a[0], b[0]) // 20) - 1, int(max(a[0], b[0]) // 20) + 2):
        for z in range(int(min(a[1], b[1]) // 20) - 1, int(max(a[1], b[1]) // 20) + 2):
            grid.setdefault((x, z), []).append(i)
def dec(a):
    o, x, z = [], 0, 0
    for i in range(2, len(a) - 1, 2): x += a[i]; z += a[i + 1]; o.append((x, z))
    return o
flags, stats = [], {'0': 0, '+': 0, '-': 0}
for r in W['r']:
    pts, f = dec(r), ''
    for a, b in zip(pts, pts[1:]):
        mx, mz = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2; dx, dz = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dz) or 1
        best, c = 4.5, '0'
        for i in grid.get((int(mx // 20), int(mz // 20)), []):
            (p, q) = segs[i]; sx, sz = q[0] - p[0], q[1] - p[1]; l2 = sx * sx + sz * sz
            t = max(0, min(1, ((mx - p[0]) * sx + (mz - p[1]) * sz) / l2)); d = math.hypot(mx - p[0] - sx * t, mz - p[1] - sz * t)
            cos = (dx * sx + dz * sz) / (L * math.sqrt(l2))
            if d < best and abs(cos) > .85: best, c = d, '+' if cos > 0 else '-'
        f += c; stats[c] += 1
    flags.append(f)
W['o'] = flags
json.dump(W, open(os.path.join(D, 'world.json'), 'w'), separators=(',', ':'))
print(stats)
