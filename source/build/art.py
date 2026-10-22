"""Hand-built SVG illustrations for Blackpool.gay: the pink soft-top with Jay and Theo, the sunset Promenade hero,
the 3D promo strip and the 404 scene. Pure SVG + CSS animation (classes are animated in site.css)."""
import math, random, re

BULBS = ['#ff2e63', '#ff9f1c', '#ffe45e', '#2ec4b6', '#3a86ff', '#c77dff']
RAINBOW = ['#e40303', '#ff8c00', '#ffd23f', '#008026', '#004dff', '#750787']


def car(p='c', beam=True):
    """Side view, facing right. Local box roughly x -10..266, y -10..124 (wheel bottom at 123)."""
    bolts = ''.join(f'<circle cx="{9 * math.cos(a):.1f}" cy="{9 * math.sin(a):.1f}" r="2" fill="#b9b3c4"/>' for a in [i * 2 * math.pi / 5 for i in range(5)])
    wheel = lambda x: (f'<g transform="translate({x} 96)"><g class="wheel"><circle r="27" fill="#1d1b22"/><circle r="22" fill="none" stroke="#2c2934" stroke-width="3"/>'
                       f'<circle r="15" fill="#f1ecf5"/>{bolts}<circle r="4" fill="#9c95a8"/><rect x="-1.5" y="-15" width="3" height="7" fill="#d9d2e2"/></g></g>')
    stripes = ''.join(f'<rect x="60" y="{33 + i * 3.2:.1f}" width="44" height="3.2" fill="{c}"/>' for i, c in enumerate(RAINBOW))
    curls = ''.join(f'<circle cx="{x}" cy="{y}" r="5.4" fill="#1e1612"/>' for x, y in [(99, 4), (102, -2), (108, -5), (115, -5), (121, -1), (123, 5), (110, -1), (104, 1)])
    return (f'<defs><linearGradient id="{p}pk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7dbd"/><stop offset=".45" stop-color="#ff3d9a"/><stop offset="1" stop-color="#cf1a73"/></linearGradient>'
            f'<linearGradient id="{p}bm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff2c8" stop-opacity=".75"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></linearGradient>'
            f'<clipPath id="{p}tc"><path d="M64 52 Q64 28 82 26 Q100 28 100 52Z"/></clipPath></defs>'
            f'<ellipse cx="132" cy="124" rx="150" ry="9" fill="#12081f" opacity=".45"/>'
            + (f'<path class="headbeam" d="M258 56 L560 6 L560 128 Z" fill="url(#{p}bm)" opacity=".85"/>' if beam else '') +
            '<g class="carbob">' +
            '<rect x="-9" y="36" width="17" height="52" rx="8" fill="#1d1b22"/><rect x="-6" y="52" width="11" height="20" rx="4" fill="#ff3d9a"/>'
            '<rect x="10" y="31" width="46" height="22" rx="11" fill="#2b2036"/><path d="M14 36 Q32 30 52 36" stroke="#3d3050" stroke-width="2" fill="none"/>'
            '<path d="M46 53 L51 5 L58 5 L56 53Z" fill="#1d1b22"/><rect x="50" y="3" width="70" height="5" rx="2.5" fill="#1d1b22" opacity=".0"/>'
            # Jay (driving, far side): white vest, dark curls, shades pushed up
            '<path d="M92 53 Q92 27 110 25 Q128 27 128 53Z" fill="#f6f3ec"/><path d="M118 36 L147 41" stroke="#9b6440" stroke-width="7.5" stroke-linecap="round"/>'
            '<rect x="106" y="20" width="8" height="7" fill="#8a5737"/><circle cx="110" cy="11" r="13.5" fill="#9b6440"/>' + curls +
            '<rect x="102" y="-1" width="16" height="3.4" rx="1.7" fill="#111"/><circle cx="115" cy="12" r="1.6" fill="#1b1420"/><path d="M112 17 Q116 19 119 16" stroke="#5a2a2a" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
            # Theo (near side, waving): bleached buzz cut, pink shades, rainbow tank
            f'<path d="M64 53 Q64 28 82 26 Q100 28 100 53Z" fill="#232029"/><g clip-path="url(#{p}tc)">{stripes}</g>'
            '<rect x="78" y="21" width="8" height="7" fill="#e3b18e"/><circle cx="82" cy="12" r="13.5" fill="#f1c7a3"/>'
            '<path d="M68.6 10.5 A13.5 13.5 0 0 1 95.4 10.5 Q82 3.5 68.6 10.5Z" fill="#f3e3a0"/><rect x="76" y="9.5" width="17" height="5" rx="2.5" fill="#ff3d9a"/>'
            '<path d="M84 18 Q88 21 92 18" stroke="#8a3a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
            '<g class="wave"><path d="M94 35 L106 4" stroke="#f1c7a3" stroke-width="8" stroke-linecap="round"/><circle cx="107" cy="0" r="6" fill="#f1c7a3"/></g>'
            '<ellipse cx="149" cy="40" rx="4" ry="11.5" fill="#1d1b22"/>'
            '<path d="M150 51 L140 4 L146.5 4 L157.5 51Z" fill="#1d1b22"/><path d="M147 7 L157 49 L163 49 L154 9Z" fill="#cfe8ff" opacity=".4"/>'
            # body
            f'<path d="M8 96 L30 96 A30 30 0 0 1 90 96 L170 96 A30 30 0 0 1 230 96 L254 96 Q261 96 261 88 L261 61 Q259 50 248 48.5 L161 46.5 L153 52.5 L16 52.5 Q8 52.5 8 60.5Z" fill="url(#{p}pk)"/>'
            '<path d="M18 59 L150 59 M166 53.5 L248 55" stroke="#ffd3ea" stroke-width="2.4" stroke-linecap="round" opacity=".75"/>'
            '<rect x="97" y="60" width="56" height="30" rx="5" fill="none" stroke="#b5145f" stroke-width="2" opacity=".55"/><rect x="138" y="66" width="10" height="3.5" rx="1.7" fill="#1d1b22" opacity=".7"/>'
            '<rect x="196" y="42" width="40" height="7" rx="3.5" fill="#ff3d9a"/>'
            '<path d="M25 96 A35 35 0 0 1 95 96 M165 96 A35 35 0 0 1 235 96" fill="none" stroke="#1d1b22" stroke-width="7.5"/>'
            '<rect x="252" y="80" width="15" height="13" rx="4" fill="#1d1b22"/><rect x="-1" y="80" width="13" height="13" rx="4" fill="#1d1b22"/>'
            '<circle cx="256" cy="63" r="8" fill="#e9e9f2"/><circle cx="256" cy="63" r="5.5" fill="#fff6d2"/><rect x="8.5" y="60" width="5" height="13" rx="2" fill="#ff2a2a"/>'
            '<rect x="148" y="39" width="11" height="8" rx="2" fill="#1d1b22"/>'
            + '</g>' + wheel(60) + wheel(200))


def skyline(p='s', ground=742, fill='#24113f', glow='#ffa36b', lights=True, seed=11, split=False):
    """Blackpool skyline as one coherent silhouette (left to right, after the classic seafront view):
    pier with pavilions and a tall mast, the big wheel, seafront pinnacles and blocks, Tower Buildings with
    onion-domed turrets under the Tower, a tall block and a round-topped drum, the church tower with pinnacles,
    and the Pleasure Beach rollercoaster with its tall pole. 1600 units wide, standing on y=ground."""
    rnd = random.Random(seed)
    G = ground
    S, W = [], []

    def windows(x, w, top, rows_gap=18, cols_gap=12, chance=.36):
        if not lights: return
        for wy in range(int(top) + 12, G - 12, rows_gap):
            for wx in range(int(x) + 6, int(x + w) - 7, cols_gap):
                if rnd.random() < chance:
                    W.append(f'<rect class="{"twinkle" if rnd.random() < .16 else ""}" x="{wx}" y="{wy}" width="4.5" height="7" rx="1" fill="{rnd.choice(["#ffd88a", "#ffc36b", "#ffb3da", "#fff1c9"])}"/>')

    def block(x, w, h, win=True):
        S.append(f'<rect x="{x}" y="{G - h}" width="{w}" height="{h + 30}"/>')
        if win: windows(x, w, G - h)

    def onion(cx, base, r=9, h=26):
        S.append(f'<path d="M{cx - r} {base} C{cx - r * 1.5} {base - h * .45} {cx - 2} {base - h * .7} {cx} {base - h} C{cx + 2} {base - h * .7} {cx + r * 1.5} {base - h * .45} {cx + r} {base}Z"/>'
                 f'<path d="M{cx} {base - h} v-9" stroke="{fill}" stroke-width="1.6"/>')

    # 1 pier with pavilions, reaching out to the left
    deck = G - 22
    S.append(f'<rect x="-60" y="{deck}" width="380" height="7"/>' + ''.join(f'<rect x="{x}" y="{deck}" width="3.5" height="24"/>' for x in range(-56, 320, 15)))
    S.append(f'<rect x="-30" y="{deck - 34}" width="78" height="36"/><path d="M-36 {deck - 34} h90 l-12 -10 h-66z"/>')
    S.append(f'<rect x="96" y="{deck - 24}" width="96" height="26"/><path d="M104 {deck - 24} q40 -22 80 0z"/>')
    windows(-30, 78, deck - 34, 12, 10, .5); windows(96, 96, deck - 24, 12, 10, .5)
    # tall mast with a cabin (seafront observation mast)
    S.append(f'<rect x="232" y="{G - 168}" width="10" height="168"/><rect x="224" y="{G - 186}" width="26" height="20" rx="3"/><rect x="236" y="{G - 200}" width="2.5" height="14"/>')
    # 2 the big wheel, standing on the pier
    cx, cy, r = 352, G - 112, 96
    S.append(f'<path d="M{cx - 58} {deck} L{cx} {cy} L{cx + 58} {deck}" fill="none" stroke="{fill}" stroke-width="8" stroke-linejoin="round"/>')
    wheel = [f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{fill}" stroke-width="4.5"/>', f'<circle cx="{cx}" cy="{cy}" r="{r - 10}" fill="none" stroke="{fill}" stroke-width="1.4"/>']
    for i in range(20):
        a = i * math.pi / 10
        wheel.append(f'<path d="M{cx} {cy} L{cx + r * math.cos(a):.1f} {cy + r * math.sin(a):.1f}" stroke="{fill}" stroke-width="1.4"/>')
        wheel.append(f'<rect x="{cx + (r + 5) * math.cos(a) - 5:.1f}" y="{cy + (r + 5) * math.sin(a) - 4:.1f}" width="10" height="9" rx="2.5" fill="{fill}"/>')
        if lights: wheel.append(f'<circle class="bulb" cx="{cx + r * math.cos(a + .16):.1f}" cy="{cy + r * math.sin(a + .16):.1f}" r="2.2" fill="{BULBS[i % 6]}"/>')
    wheel.append(f'<circle cx="{cx}" cy="{cy}" r="10" fill="{fill}"/>')
    # 3 seafront pinnacles and blocks
    block(452, 40, 46)
    for px, ph in [(470, 92), (500, 74), (528, 104)]:
        S.append(f'<rect x="{px - 5}" y="{G - ph + 18}" width="10" height="{ph}"/><path d="M{px - 7} {G - ph + 20} L{px} {G - ph} L{px + 7} {G - ph + 20}Z"/>')
    block(540, 58, 58); block(600, 44, 82); block(646, 66, 50)
    block(714, 108, 72); S.append(f'<path d="M738 {G - 72} a30 30 0 0 1 60 0z"/><rect x="762" y="{G - 112}" width="12" height="12"/><path d="M760 {G - 112} l8 -11 l8 11z"/>')   # Winter Gardens dome
    if lights: W.append(f'<path d="M744 {G - 74} a24 24 0 0 1 48 0" fill="none" stroke="#ffd88a" stroke-width="2" stroke-dasharray="3 5" class="twinkle"/>')
    block(824, 22, 64)
    # 4 Tower Buildings: wide, ornate, onion-domed turrets, raised centre
    bx0, bx1, bt = 850, 1172, G - 118
    S.append(f'<rect x="{bx0}" y="{bt}" width="{bx1 - bx0}" height="{G - bt + 30}"/><rect x="{bx0 + 96}" y="{bt - 14}" width="{bx1 - bx0 - 192}" height="16"/>')
    S.append(''.join(f'<rect x="{x0}" y="{bt - 7}" width="8" height="8"/>' for x0 in range(bx0 + 4, bx1 - 6, 15)))
    for tx, th in [(bx0 + 12, 36), (bx0 + 70, 26), (bx1 - 70, 26), (bx1 - 12, 36)]:
        S.append(f'<rect x="{tx - 11}" y="{bt - th}" width="22" height="{th + 2}"/>'); onion(tx, bt - th, 12, 30)
    if lights:
        for row in (bt + 24, bt + 62):
            for wx in range(bx0 + 14, bx1 - 14, 15):
                W.append(f'<path class="{"twinkle" if rnd.random() < .2 else ""}" d="M{wx} {row + 15} v-9 a3.6 3.6 0 0 1 7.2 0 v9z" fill="{rnd.choice(["#ffd88a", "#ffc36b", "#fff1c9"])}"/>')
    # 5 the Tower (after the original elevation): pinched legs, balcony box, upper cage, two-tier crown, mast and flag
    tc, tb_, tt = (bx0 + bx1) / 2, bt - 14, G - 488
    half = lambda y: 13 + 55 * ((y - tt) / (tb_ - tt)) ** 1.75
    pl = lambda pts: ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    legL = [(tc - half(y), y) for y in range(int(tt), int(tb_) + 1, 6)]
    legR = [(tc + half(y), y) for y in range(int(tt), int(tb_) + 1, 6)]
    T = [f'<polyline points="{pl(legL)}" fill="none" stroke="{fill}" stroke-width="5"/><polyline points="{pl(legR)}" fill="none" stroke="{fill}" stroke-width="5"/>']
    ys = [tt + (tb_ - tt) * (i / 15) ** 1.25 for i in range(16)]
    for y0, y1 in zip(ys, ys[1:]):
        T.append(f'<path d="M{tc - half(y0):.1f} {y0:.1f} L{tc + half(y1):.1f} {y1:.1f} M{tc + half(y0):.1f} {y0:.1f} L{tc - half(y1):.1f} {y1:.1f} M{tc - half(y1):.1f} {y1:.1f} H{tc + half(y1):.1f}" stroke="{fill}" stroke-width="1.5"/>')
    T.append(f'<path d="M{tc - half(tb_ - 34):.1f} {tb_} Q{tc} {tb_ - 62} {tc + half(tb_ - 34):.1f} {tb_}" fill="none" stroke="{fill}" stroke-width="4"/>')
    d = tt
    T.append(f'<rect x="{tc - 26}" y="{d - 12}" width="52" height="14" rx="2"/><rect x="{tc - 30}" y="{d - 16}" width="60" height="5" rx="2"/>'          # balcony box
             f'<rect x="{tc - 17}" y="{d - 52}" width="34" height="40"/><rect x="{tc - 21}" y="{d - 56}" width="42" height="5" rx="2"/>'                 # upper cage
             f'<path d="M{tc - 19} {d - 56} L{tc - 12} {d - 74} L{tc + 12} {d - 74} L{tc + 19} {d - 56}Z"/><rect x="{tc - 13}" y="{d - 78}" width="26" height="5" rx="2"/>'   # crown tier 1
             f'<path d="M{tc - 11} {d - 78} L{tc - 5} {d - 96} L{tc + 5} {d - 96} L{tc + 11} {d - 78}Z"/><path d="M{tc - 6} {d - 96} q6 -14 12 0z"/>'   # crown tier 2 + lantern
             f'<path d="M{tc} {d - 108} V{d - 150}" stroke="{fill}" stroke-width="2.6"/>')
    if not lights:
        T.append(''.join(f'<rect x="{tc - 13 + i * 7}" y="{d - 46}" width="3" height="28" fill="#f6eefb" opacity=".7"/>' for i in range(4)))
    led = ''
    if lights:
        leds = (f'<polyline points="{pl(legL)}"/><polyline points="{pl(legR)}"/><path d="M{tc - 30} {d - 10} H{tc + 30} M{tc - 21} {d - 54} H{tc + 21} M{tc - 17} {d - 14} V{d - 52} M{tc + 17} {d - 14} V{d - 52}"/>')
        crown = f'M{tc - 19} {d - 56} L{tc - 12} {d - 74} L{tc + 12} {d - 74} L{tc + 19} {d - 56} M{tc - 11} {d - 78} L{tc - 5} {d - 96} L{tc + 5} {d - 96} L{tc + 11} {d - 78}'
        heart = f'M{tc} {tb_ - 28} C{tc - 28} {tb_ - 48} {tc - 19} {tb_ - 70} {tc} {tb_ - 57} C{tc + 19} {tb_ - 70} {tc + 28} {tb_ - 48} {tc} {tb_ - 28}Z'
        led = (f'<g fill="none" stroke="url(#{p}led)" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="9" opacity=".45" filter="url(#{p}soft)">{leds}</g><g stroke-width="2.4">{leds}</g></g>'
               f'<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="{crown}" stroke="#5dff9b" stroke-width="8" opacity=".35" filter="url(#{p}soft)"/><path d="{crown}" stroke="#5dff9b" stroke-width="2.2"/><path d="M{tc - 6} {d - 97} q6 -13 12 0 M{tc} {d - 108} V{d - 148}" stroke="#ffe45e" stroke-width="2.2"/></g>'
               + ''.join(f'<rect x="{tc - 13 + i * 7}" y="{d - 46}" width="3.5" height="28" rx="1" fill="#{c}"/>' for i, c in enumerate(['7df9ff', 'ffe45e', 'ff8bd1', '7df9ff']))
               + f'<g class="heartbeat" style="transform-origin:{tc}px {tb_ - 48}px"><path d="{heart}" fill="none" stroke="#ff5fd2" stroke-width="7" opacity=".45" filter="url(#{p}soft)"/><path d="{heart}" fill="#7a1fa8" stroke="#ff8be0" stroke-width="2.2"/></g>')
    flag = f'<g class="flagw">' + ''.join(f'<rect x="{tc + 1.3}" y="{d - 150 + i * 3.6}" width="28" height="3.6" fill="{c}"/>' for i, c in enumerate(RAINBOW)) + '</g>'
    S.append(''.join(T))
    # 6 tall block and the round-topped drum
    block(1180, 46, 150, True); block(1230, 30, 96)
    S.append(f'<rect x="1264" y="{G - 108}" width="38" height="138"/><path d="M1264 {G - 108} a19 12 0 0 1 38 0z"/>'); windows(1264, 38, G - 104, 16, 11, .4)
    block(1306, 52, 54); S.append(f'<path d="M1312 {G - 54} q20 -22 40 0z"/>')
    # 7 church tower with four pinnacles and its nave
    block(1362, 92, 66, False)
    S.append(f'<rect x="1378" y="{G - 176}" width="40" height="176"/><rect x="1374" y="{G - 180}" width="48" height="6"/>'
             + ''.join(f'<path d="M{x - 4} {G - 180} L{x} {G - 206} L{x + 4} {G - 180}Z"/>' for x in (1378, 1391, 1405, 1418))
             + f'<path d="M1386 {G - 120} v-22 a12 12 0 0 1 24 0 v22z" fill="{glow if lights else fill}" opacity="{.55 if lights else 1}"/>')
    # 8 Pleasure Beach rollercoaster with its tall pole
    S.append(f'<rect x="1462" y="{G - 232}" width="9" height="232"/><rect x="1456" y="{G - 244}" width="21" height="14" rx="3"/>')
    keys = [(1440, G - 14), (1500, G - 212), (1540, G - 30), (1580, G - 150), (1612, G - 40), (1650, G - 110), (1700, G - 50)]
    def ty(x):
        for (x0, y0), (x1, y1) in zip(keys, keys[1:]):
            if x0 <= x <= x1:
                t = (x - x0) / (x1 - x0)
                return y0 + (y1 - y0) * (1 - math.cos(t * math.pi)) / 2
        return keys[-1][1]
    xs = list(range(1440, 1701, 3))
    track = 'M' + ' L'.join(f'{x} {ty(x):.1f}' for x in xs)
    C = [f'<path d="{track}" fill="none" stroke="{fill}" stroke-width="5.5" stroke-linejoin="round"/>', f'<path d="{track}" transform="translate(0 7)" fill="none" stroke="{fill}" stroke-width="2.2"/>']
    sup = list(range(1446, 1700, 11))
    for i, x in enumerate(sup):
        C.append(f'<path d="M{x} {ty(x) + 6:.1f} V{G}" stroke="{fill}" stroke-width="1.8"/>')
        if i: C.append(f'<path d="M{sup[i - 1]} {ty(sup[i - 1]) + 9:.1f} L{x} {G} M{sup[i - 1]} {G} L{x} {ty(x) + 9:.1f}" stroke="{fill}" stroke-width=".8"/>')
    S.append(''.join(C))
    train = ''
    if lights:
        train = (f'<g><rect x="-20" y="-8" width="40" height="8" rx="3" fill="#ff3d9a"/>' + ''.join(f'<rect x="{-18 + i * 12}" y="-12" width="7" height="4" rx="2" fill="#ffd88a"/>' for i in range(4))
                 + f'<animateMotion dur="10s" repeatCount="indefinite" rotate="auto" path="{track}"/></g>')
    sil = f'<g fill="{fill}" filter="url(#{p}g)">' + ''.join(S) + '</g>'
    defs = (f'<filter id="{p}g" x="-4%" y="-12%" width="108%" height="124%"><feGaussianBlur in="SourceAlpha" stdDeviation="4.5" result="b"/>'
            f'<feFlood flood-color="{glow}" flood-opacity=".85"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
            f'<filter id="{p}soft" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="3.5"/></filter>'
            f'<linearGradient id="{p}led" gradientUnits="userSpaceOnUse" x1="0" y1="{tt}" x2="0" y2="{tt + 220}" spreadMethod="repeat">' + ''.join(f'<stop offset="{i / 6:.3f}" stop-color="{c}"/>' for i, c in enumerate(['#ff2d55', '#ff9f1c', '#ffe45e', '#2ee59d', '#2fb8ff', '#b56bff', '#ff2d55']))
            + (f'<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="0 -220" dur="5s" repeatCount="indefinite"/>' if lights else '') + '</linearGradient>')
    if split:
        return {'defs': defs, 'static': sil + ''.join(W), 'plain': f'<g fill="{fill}">' + ''.join(S) + '</g>' + ''.join(W), 'shape': ''.join(S), 'wheel': (cx, cy, r, ''.join(wheel)), 'tower': (tc, tt, tb_, led + flag),
                'train': train, 'coaster': (1430, G - 260, 1710, G)}
    body = (sil + f'<g filter="url(#{p}g)"><g class="spinslow" style="transform-origin:{cx}px {cy}px">' + ''.join(wheel) + '</g></g>'
            + ''.join(W) + led + flag + train)
    return defs, body


def lamps_row(y_top, step, n, sag, bulb_r, post_w, ground, k0=0, pal=None):
    pal = pal or BULBS
    out = []
    for k in range(n):
        x = k * step
        out.append(f'<rect x="{x - post_w / 2}" y="{y_top + 4}" width="{post_w}" height="{ground - y_top - 4}" rx="{post_w / 2}" fill="#1a0e30"/>'
                   f'<path d="M{x - 9} {y_top + 6} h18" stroke="#1a0e30" stroke-width="3" stroke-linecap="round"/><circle cx="{x}" cy="{y_top}" r="{post_w * 1.4:.1f}" fill="#fff4d0"/><circle cx="{x}" cy="{y_top}" r="{post_w * 3.6:.1f}" fill="#fff4d0" opacity=".16"/>')
        out.append(f'<path d="M{x} {y_top + 10} Q{x + step / 2} {y_top + 10 + sag * 2} {x + step} {y_top + 10}" fill="none" stroke="#1a0e30" stroke-width="1.4"/>')
        pts = [(x + t * step, y_top + 10 + math.sin(t * math.pi) * sag) for t in [i / 12 for i in range(1, 12)]]
        out.extend(f'<circle class="bulb" cx="{px:.1f}" cy="{py:.1f}" r="{bulb_r}" fill="{pal[(i + k + k0) % len(pal)]}"/>' for i, (px, py) in enumerate(pts))
    return ''.join(out)


def hero_svg():
    rnd = random.Random(7)
    stars = ''.join(f'<circle class="twinkle" cx="{rnd.randint(0, 1600)}" cy="{rnd.randint(0, 300)}" r="{rnd.choice([1, 1.2, 1.5, 2])}" fill="#fff" opacity="{rnd.choice([.5, .7, .9])}"/>' for _ in range(70))
    sdefs, sbody = skyline('hs', ground=742)
    # far roofline for atmospheric depth
    far, x = [], -20
    while x < 1920:
        w = rnd.randint(30, 80); h = rnd.randint(30, 120); far.append(f'<rect x="{x}" y="{742 - h}" width="{w}" height="{h + 10}"/>')
        if rnd.random() < .25: far.append(f'<rect x="{x + w // 2 - 3}" y="{742 - h - rnd.randint(14, 40)}" width="6" height="40"/>')
        x += w
    warm = ['#ffd88a', '#ff9fc9', '#fff1c9', '#ffb36b']
    dashes = ''.join(f'<rect x="{x}" y="806" width="42" height="5" rx="2.5" fill="#f6e9ff" opacity=".7"/>' for x in range(0, 1760, 80))
    return ('<svg class="scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">'
            '<defs><linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120a36"/><stop offset=".34" stop-color="#3d1d78"/><stop offset=".6" stop-color="#b03a8e"/><stop offset=".76" stop-color="#ff7a74"/><stop offset=".84" stop-color="#ffb784"/></linearGradient>'
            '<radialGradient id="hglow" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#ffd7a0" stop-opacity=".85"/><stop offset=".5" stop-color="#ff8f7a" stop-opacity=".35"/><stop offset="1" stop-color="#ff8f7a" stop-opacity="0"/></radialGradient>'
            '<linearGradient id="hhaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8f7a" stop-opacity="0"/><stop offset="1" stop-color="#ff8f7a" stop-opacity=".32"/></linearGradient>'
            '<radialGradient id="hpool"><stop offset="0" stop-color="#fff2c8" stop-opacity=".32"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></radialGradient>'
            '<linearGradient id="hroad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1749"/><stop offset="1" stop-color="#140a26"/></linearGradient>'
            '<filter id="hblur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>'
            '<filter id="hbig" x="-80%" y="-30%" width="260%" height="160%"><feGaussianBlur stdDeviation="30"/></filter>' + sdefs + '</defs>'
            '<rect width="1600" height="900" fill="url(#hsky)"/>' + f'<g>{stars}</g>'
            '<g class="par" data-d="6" data-s="1"><ellipse cx="520" cy="230" rx="260" ry="34" fill="#ff9ec4" opacity=".26" filter="url(#hblur)"/><ellipse cx="1340" cy="170" rx="300" ry="40" fill="#c78bff" opacity=".24" filter="url(#hblur)"/><ellipse cx="260" cy="430" rx="220" ry="26" fill="#ffc0a0" opacity=".34" filter="url(#hblur)"/></g>'
            '<ellipse cx="900" cy="760" rx="1000" ry="330" fill="url(#hglow)"/>'
            '<ellipse cx="1011" cy="430" rx="120" ry="340" fill="#ff6fd0" opacity=".2" filter="url(#hbig)"/>'
            f'<g class="par" data-d="4" fill="#7a3a8e" opacity=".5"><g class="rollfar">{"".join(far)}<g transform="translate(1920 0)">{"".join(far)}</g></g></g>'
            f'<g class="par" data-d="10"><g class="roll">{sbody}<g transform="translate(1920 0)">{sbody}</g></g></g>'
            '<rect y="660" width="1600" height="84" fill="url(#hhaze)"/>'
            '<rect y="740" width="1600" height="16" fill="#341d5c"/><rect y="752" width="1600" height="4" fill="#ff9fc9" opacity=".35"/>'
            '<rect y="756" width="1600" height="150" fill="url(#hroad)"/>'
            '<path d="M0 846 H1600 M0 858 H1600" stroke="#5b4380" stroke-width="2.4" opacity=".75"/>'
            '<ellipse cx="1110" cy="800" rx="230" ry="20" fill="url(#hpool)"/>'
            f'<g class="dash">{dashes}</g>'
            f'<g class="lamps">{lamps_row(624, 240, 10, 30, 4.4, 6, 752, pal=warm)}</g>'
            f'<g transform="translate(560 655) scale(1.32)">{car("h")}</g>'
            '<path d="M0 884 Q800 912 1600 884 V902 H0Z" fill="#fff8f3"/>'
            '</svg>')


import base64 as _b64, os as _os
_gp = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), 'skyglow.webp')
GLOW = 'data:image/webp;base64,' + _b64.b64encode(open(_gp, 'rb').read()).decode() if _os.path.exists(_gp) else ''


def hero_scene():
    """Layered, GPU-friendly hero. Every moving layer is its own <svg> inside an HTML wrapper that is slid by a
    CSS transform (composited, no SVG repaint). Speeds come from one car speed V = 123 units/s:
    dashes k=1, lamps k=.75, skyline k=.325, far roofline k=.14; wheels turn once per 2*pi*r/V."""
    rnd = random.Random(7)
    U = 1600  # stage width in units (stage is 1600 x 900)
    pct = lambda v, of=U: f'{v / of * 100:.4f}%'
    def layer(cls, w, inner, extra='', vb_x=0, h=900, y=0, x=0):
        return (f'<div class="ly {cls}" style="left:{pct(x)};top:{pct(y, 900)};width:{pct(w)};height:{pct(h, 900)}"{extra}>'
                f'<svg viewBox="{vb_x} {y} {w} {h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">{inner}</svg></div>')
    # sky (static)
    stars = ''.join(f'<circle class="star" style="animation-duration:{rnd.choice([2.3, 3.1, 4.7, 5.9])}s;animation-delay:-{rnd.random() * 6:.2f}s" cx="{rnd.randint(0, 1600)}" cy="{rnd.randint(0, 300)}" r="{rnd.choice([1, 1.2, 1.5, 2])}" fill="#fff" opacity="{rnd.choice([.5, .7, .9])}"/>' for _ in range(46))
    sky = ('<defs><linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120a36"/><stop offset=".34" stop-color="#3d1d78"/><stop offset=".6" stop-color="#b03a8e"/><stop offset=".76" stop-color="#ff7a74"/><stop offset=".84" stop-color="#ffb784"/></linearGradient>'
           '<radialGradient id="hglow" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#ffd7a0" stop-opacity=".85"/><stop offset=".5" stop-color="#ff8f7a" stop-opacity=".35"/><stop offset="1" stop-color="#ff8f7a" stop-opacity="0"/></radialGradient></defs>'
           '<rect width="1600" height="900" fill="url(#hsky)"/>' + stars + '<ellipse cx="900" cy="760" rx="1000" ry="330" fill="url(#hglow)"/>')
    clouds = ('<defs><radialGradient id="hc1"><stop offset="0" stop-color="#ff9ec4" stop-opacity=".34"/><stop offset="1" stop-color="#ff9ec4" stop-opacity="0"/></radialGradient>'
              '<radialGradient id="hc2"><stop offset="0" stop-color="#c78bff" stop-opacity=".3"/><stop offset="1" stop-color="#c78bff" stop-opacity="0"/></radialGradient>'
              '<radialGradient id="hc3"><stop offset="0" stop-color="#ffc0a0" stop-opacity=".42"/><stop offset="1" stop-color="#ffc0a0" stop-opacity="0"/></radialGradient></defs>'
              '<ellipse cx="520" cy="230" rx="300" ry="46" fill="url(#hc1)"/><ellipse cx="1340" cy="170" rx="340" ry="52" fill="url(#hc2)"/><ellipse cx="260" cy="430" rx="260" ry="36" fill="url(#hc3)"/>')
    # far roofline strip: 2 x 1920
    far, x = [], -20
    while x < 1920:
        w = rnd.randint(30, 80); h = rnd.randint(30, 120); far.append(f'<rect x="{x}" y="{742 - h}" width="{w}" height="{h + 10}"/>')
        if rnd.random() < .25: far.append(f'<rect x="{x + w // 2 - 3}" y="{742 - h - rnd.randint(14, 40)}" width="6" height="40"/>')
        x += w
    farg = ''.join(far)
    far_svg = f'<g fill="#7a3a8e" opacity=".5">{farg}<g transform="translate(1920 0)">{farg}</g></g>'
    # skyline strip: two tiles 1920 apart, static art; wheel, Tower lights and coaster train are small overlays
    tiles, over = [], []
    for t in (0, 1):
        P = skyline(f'hs{t}', ground=742, split=True)
        ox = t * 1920
        sdefs = re.sub(r'<linearGradient id="hs\d+led".*?</linearGradient>', '', P['defs'])
        tiles.append(f'<g transform="translate({ox} 0)">{P["plain"]}</g>'
                     f'<ellipse cx="{P["tower"][0] + ox}" cy="430" rx="130" ry="340" fill="url(#bloom)"/>')
        cx, cy, r, wh = P['wheel']; R = r + 14
        over.append(f'<div class="ov ov-wheel" style="left:{pct(cx + ox - R, 3840)};top:{pct(cy - R, 900)};width:{pct(2 * R, 3840)};height:{pct(2 * R, 900)}">'
                    f'<svg viewBox="{cx - R} {cy - R} {2 * R} {2 * R}" aria-hidden="true" focusable="false"><g fill="#24113f">{wh}</g></svg></div>')
        tc, tt, tb, fx = P['tower']; x0, y0, w0, h0 = tc - 80, tt - 175, 160, tb - tt + 190
        over.append(f'<div class="ov ov-tower" style="left:{pct(x0 + ox, 3840)};top:{pct(y0, 900)};width:{pct(w0, 3840)};height:{pct(h0, 900)}">'
                    f'<svg viewBox="{x0} {y0} {w0} {h0}" aria-hidden="true" focusable="false"><defs>{P["defs"].replace(f"hs{t}", f"ht{t}")}</defs>{fx.replace(f"hs{t}", f"ht{t}")}</svg></div>')
        c0x, c0y, c1x, c1y = P['coaster']
        over.append(f'<div class="ov ov-train" style="left:{pct(c0x + ox, 3840)};top:{pct(c0y, 900)};width:{pct(c1x - c0x, 3840)};height:{pct(c1y - c0y, 900)}">'
                    f'<svg viewBox="{c0x} {c0y} {c1x - c0x} {c1y - c0y}" aria-hidden="true" focusable="false">{P["train"]}</svg></div>')
    bloom = '<defs><radialGradient id="bloom"><stop offset="0" stop-color="#ff6fd0" stop-opacity=".22"/><stop offset="1" stop-color="#ff6fd0" stop-opacity="0"/></radialGradient></defs>'
    sky_strip = (f'<div class="ly ly-sky2" style="left:0;top:0;width:240%;height:100%"><div class="rl rl-sky">'
                 f'<svg viewBox="0 0 3840 900" preserveAspectRatio="none" aria-hidden="true" focusable="false">{bloom}<image href="{GLOW}" x="0" y="0" width="3840" height="900" preserveAspectRatio="none"/>{"".join(tiles)}</svg>{"".join(over)}</div></div>')
    # road (static) and its moving dashes
    road = ('<defs><linearGradient id="hroad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1749"/><stop offset="1" stop-color="#140a26"/></linearGradient>'
            '<linearGradient id="hhaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8f7a" stop-opacity="0"/><stop offset="1" stop-color="#ff8f7a" stop-opacity=".32"/></linearGradient>'
            '</defs>'
            '<rect y="660" width="1600" height="84" fill="url(#hhaze)"/><rect y="740" width="1600" height="16" fill="#341d5c"/><rect y="752" width="1600" height="4" fill="#ff9fc9" opacity=".35"/>'
            '<rect y="756" width="1600" height="150" fill="url(#hroad)"/><path d="M0 846 H1600 M0 858 H1600" stroke="#5b4380" stroke-width="2.4" opacity=".75"/>'
            )
    dashes = ''.join(f'<rect x="{x}" y="806" width="42" height="5" rx="2.5" fill="#f6e9ff" opacity=".7"/>' for x in range(0, 3200, 80))
    # lamps strip: 2560 units, loops every 960 (4 posts = one full colour cycle), steady warm bulbs
    warm = ['#ffd88a', '#ff9fc9', '#fff1c9', '#ffb36b']
    lamps = lamps_row(624, 240, 11, 30, 4.4, 6, 752, pal=warm)
    # car (own small layer): viewBox around the car incl. beam
    cvx, cvy, cvw, cvh, cs, cxp, cyp = -14, -18, 590, 150, 1.32, 560, 655
    car_div = (f'<div class="ly ly-car" style="left:{pct(cxp + cvx * cs)};top:{pct(cyp + cvy * cs, 900)};width:{pct(cvw * cs)};height:{pct(cvh * cs, 900)}"><div class="carsettle">'
               f'<svg viewBox="{cvx} {cvy} {cvw} {cvh}" aria-hidden="true" focusable="false"><defs><radialGradient id="hpool"><stop offset="0" stop-color="#fff2c8" stop-opacity=".32"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></radialGradient></defs><ellipse cx="417" cy="110" rx="174" ry="15" fill="url(#hpool)"/>{car("h")}</svg></div></div>')
    kerb = '<svg class="kerb" viewBox="0 0 1600 20" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 2 Q800 30 1600 2 V20 H0Z" fill="#fff8f3"/></svg>'
    return ('<div class="stage scene" aria-hidden="true">'
            + layer('ly-sky', 1600, sky)
            + f'<div class="ly ly-clouds par" data-d="14"><svg viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true" focusable="false">{clouds}</svg></div>'
            + f'<div class="ly ly-far par" data-d="9" style="left:0;top:0;width:240%;height:100%"><div class="rl rl-far"><svg viewBox="0 0 3840 900" preserveAspectRatio="none" aria-hidden="true" focusable="false">{far_svg}</svg></div></div>'
            + sky_strip.replace('class="ly ly-sky2"', 'class="ly ly-sky2 par" data-d="5"', 1)
            + layer('ly-road', 1600, road)
            + f'<div class="ly ly-dash" style="left:0;top:0;width:200%;height:100%"><div class="rl rl-dash"><svg viewBox="0 0 3200 900" preserveAspectRatio="none" aria-hidden="true" focusable="false">{dashes}</svg></div></div>'
            + f'<div class="ly ly-lamps" style="left:0;top:0;width:160%;height:100%"><div class="rl rl-lamps"><svg viewBox="0 0 2560 900" preserveAspectRatio="none" aria-hidden="true" focusable="false">{lamps}</svg></div></div>'
            + car_div + kerb + '</div>')


SCENE_CSS = ('.twinkle{animation:tw 3s ease-in-out infinite}.twinkle:nth-child(3n){animation-delay:-1s}@keyframes tw{50%{opacity:.25}}'
             '.lamps{animation:lm 2.2s linear infinite}@keyframes lm{to{transform:translateX(-160px)}}.dash{animation:dm .65s linear infinite}@keyframes dm{to{transform:translateX(-80px)}}'
             ''
             '.carbob{transform-box:fill-box;transform-origin:50% 100%;animation:cb 1.9s cubic-bezier(.45,0,.55,1) infinite}@keyframes cb{18%{transform:translateY(-1.6px) rotate(-.25deg)}35%{transform:translateY(.4px) rotate(.1deg)}52%{transform:translateY(-.8px) rotate(.2deg)}70%{transform:translateY(-2px) rotate(-.15deg)}}'
             '.wheel{animation:sp 1.07s linear infinite;transform-box:fill-box;transform-origin:center}.spinslow{animation:sp 48s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}'
             '.wave{animation:wv 4s ease-in-out infinite;transform-box:fill-box;transform-origin:10% 95%}@keyframes wv{0%{transform:rotate(-5deg)}7%{transform:rotate(-20deg)}15%{transform:rotate(14deg)}23%{transform:rotate(-20deg)}31%{transform:rotate(14deg)}39%{transform:rotate(-18deg)}45%,100%{transform:rotate(-5deg)}}'
             '.flagw{animation:fl 1.4s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:0 50%}@keyframes fl{to{transform:skewY(-8deg) scaleX(.92)}}'
             ''
             '.heartbeat{animation:hb 1.6s ease-in-out infinite}@keyframes hb{0%,100%{transform:scale(1)}15%{transform:scale(1.14)}30%{transform:scale(.98)}45%{transform:scale(1.08)}}'
             '.roll{animation:rl 34s linear infinite}@keyframes rl{to{transform:translateX(-1920px)}}'
             '@media(prefers-reduced-motion:reduce){*{animation:none!important}}')


def promo_svg():
    """Standalone animated SVG file (served once, cached): skyline with the LED Tower, festoons, and the car."""
    sdefs, sbody = skyline('ps', ground=742, seed=5)
    lamps = lamps_row(40, 160, 6, 20, 3.4, 4, 150)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 220"><style>' + SCENE_CSS + '</style><defs>' + sdefs + '</defs>'
            '<rect width="560" height="160" fill="#3a1a6e" opacity="0"/>'
            '<g transform="translate(-150 -146) scale(.44)"><g class="roll">' + sbody + '<g transform="translate(1920 0)">' + sbody + '</g></g></g>'
            '<rect y="150" width="560" height="70" fill="#170c2c"/><rect y="148" width="560" height="3" fill="#ff9fc9" opacity=".4"/>'
            '<g class="dash">' + ''.join(f'<rect x="{x}" y="186" width="30" height="4" rx="2" fill="#f6e9ff" opacity=".6"/>' for x in range(0, 700, 80)) + '</g>'
            f'<g class="lamps">{lamps}</g><g transform="translate(150 84) scale(.78)">{car("p", beam=True)}</g></svg>')


def lost_svg():
    sdefs, sbody = skyline('ls', ground=742, fill='#e6d8f2', glow='#fff0f6', lights=False)
    return ('<svg viewBox="-40 -60 640 260" role="img" aria-label="The pink soft-top with Jay and Theo, parked under the Blackpool skyline and looking lost"><defs>' + sdefs + '</defs>'
            '<g transform="translate(-60 -150) scale(.45)">' + sbody + '</g>'
            '<path d="M-40 184 H600" stroke="#d9c7ea" stroke-width="4"/><g transform="translate(140 60)">' + car('l', beam=False) + '</g>'
            '<g transform="translate(470 40)"><rect x="-4" y="0" width="8" height="144" rx="4" fill="#2a1d4a"/><path d="M-60 6 H40 L58 26 L40 46 H-60Z" fill="#ff3d9a"/>'
            '<text x="-8" y="33" text-anchor="middle" font-size="19" font-weight="800" fill="#fff" font-family="system-ui,sans-serif">This way?</text></g></svg>')
