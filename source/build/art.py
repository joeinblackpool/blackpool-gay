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
    curls = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#1e1612"/>' for x, y, r in [(98, 5, 5.2), (100, -1, 5.6), (105, -6, 5.8), (112, -8, 5.8), (119, -6, 5.4), (124, -1, 4.6), (110, -2, 5), (103, 3, 4.4), (97, 11, 3.6)])
    return (f'<defs><linearGradient id="{p}pk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7dbd"/><stop offset=".45" stop-color="#ff3d9a"/><stop offset="1" stop-color="#cf1a73"/></linearGradient>'
            f'<linearGradient id="{p}bm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff2c8" stop-opacity=".75"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></linearGradient>'
            f'<clipPath id="{p}tc"><path d="M64 52 Q64 28 82 26 Q100 28 100 52Z"/></clipPath></defs>'
            f'<ellipse cx="132" cy="124" rx="150" ry="9" fill="#12081f" opacity=".45"/>'
            + (f'<path class="headbeam" d="M258 56 L560 6 L560 128 Z" fill="url(#{p}bm)" opacity=".85"/>' if beam else '') +
            '<g class="carbob">' +
            '<rect x="-9" y="36" width="17" height="52" rx="8" fill="#1d1b22"/><rect x="-6" y="52" width="11" height="20" rx="4" fill="#ff3d9a"/>'
            '<rect x="10" y="31" width="46" height="22" rx="11" fill="#2b2036"/><path d="M14 36 Q32 30 52 36" stroke="#3d3050" stroke-width="2" fill="none"/>'
            '<path d="M46 53 L51 5 L58 5 L56 53Z" fill="#1d1b22"/><rect x="50" y="3" width="70" height="5" rx="2.5" fill="#1d1b22" opacity=".0"/>'
            # Jay (driving, far side): white vest, dark curls, shades pushed up, warm brown skin
            '<path d="M92 53 Q92 27 110 25 Q128 27 128 53Z" fill="#f6f3ec"/><path d="M104 28 Q110 34 117 28" stroke="#d9d3c8" stroke-width="1.6" fill="none"/>'
            '<path d="M118 36 Q134 38 146 41" stroke="#8f5a38" stroke-width="7.5" stroke-linecap="round" fill="none"/><circle cx="147" cy="41" r="4.2" fill="#8f5a38"/>'
            '<rect x="105.5" y="19" width="9" height="9" rx="3" fill="#7d4c2f"/>'
            '<path d="M97 9 q0 -15 13 -15 q14 0 14 15 q0 7 -4 11 q-4 5 -10 5 q-9 0 -13 -8z" fill="#8f5a38"/><ellipse cx="99.5" cy="11" rx="2.6" ry="3.6" fill="#7d4c2f"/>'
            + curls +
            '<rect x="102" y="-3" width="17" height="3.6" rx="1.8" fill="#111"/><path d="M113 6.5 q3 -1.6 7 0" stroke="#1e1612" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
            '<ellipse cx="117" cy="10.5" rx="1.5" ry="1.9" fill="#1b1420"/><path d="M122 11 q2.4 3 -.6 4.4" stroke="#6e4228" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
            '<path d="M113.5 18.5 q3.5 2.4 7 -1" stroke="#4a1f1f" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
            # Theo (near side, waving): bleached crop, heart shades, earring, rainbow tank
            f'<path d="M64 53 Q64 28 82 26 Q100 28 100 53Z" fill="#232029"/><g clip-path="url(#{p}tc)">{stripes}</g>'
            '<rect x="77.5" y="20" width="9" height="9" rx="3" fill="#e2b08c"/>'
            '<path d="M69 11 q0 -15 13 -15 q14 0 14 15 q0 7 -4 11 q-4 5 -10 5 q-9 0 -13 -8z" fill="#f1c7a3"/><ellipse cx="71.5" cy="13" rx="2.6" ry="3.6" fill="#e2b08c"/><circle cx="71.5" cy="17.6" r="1.5" fill="#ffc93c"/>'
            '<path d="M68.6 9 q.6 -15 13.6 -15 q12.6 0 14.4 10.6 q-6 -3.8 -13.4 -3.6 q-8.6 .2 -14.6 8z" fill="#f3e3a0"/><path d="M70 7 q6 -6 14 -6" stroke="#e6cf7a" stroke-width="1" fill="none"/>'
            '<path d="M85 6.4 q3 -1.6 7 0" stroke="#b8963c" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="89" cy="10.5" rx="1.5" ry="1.9" fill="#1b1420"/>'
            '<path d="M94 11 q2.4 3 -.6 4.4" stroke="#d29a76" stroke-width="1.4" fill="none" stroke-linecap="round"/><ellipse cx="91.5" cy="14.5" rx="2.4" ry="1.2" fill="#ff9fb0" opacity=".5"/>'
            '<path d="M84.6 17 q4 3.6 8.4 0 q-4 1.4 -8.4 0z" fill="#fff" stroke="#8a3a3a" stroke-width="1.3" stroke-linejoin="round"/>'
            '<g class="wave"><path d="M69 36 Q63 20 60 6" stroke="#f1c7a3" stroke-width="8" stroke-linecap="round" fill="none"/><path d="M55 7 q-3.4 -8.6 2.8 -10.8 q6.4 -1.4 7.6 6.4 l.6 5.6 q-5.4 3 -11 -1.2z" fill="#f1c7a3"/><path d="M56.5 1.5 l-4.6 -3.2" stroke="#f1c7a3" stroke-width="3.4" stroke-linecap="round"/></g>'
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
    # a full circuit: lift hill, camelbacks, a vertical loop, a last hop, then a low return run back to the station
    def cosrun(keys, step=3):
        pts = []
        for (x0, y0), (x1, y1) in zip(keys, keys[1:]):
            for x in range(x0, x1, step):
                t = (x - x0) / (x1 - x0); pts.append((x, y0 + (y1 - y0) * (1 - math.cos(t * math.pi)) / 2))
        return pts
    run1 = cosrun([(1440, G - 16), (1495, G - 212), (1545, G - 40), (1580, G - 130), (1615, G - 34)])
    LX, LY, LR = 1632, G - 72, 38
    loop = [(1615 + i * 2.125, G - 34) for i in range(8)] + [(LX + LR * math.sin(t / 60 * 2 * math.pi), LY + LR * math.cos(t / 60 * 2 * math.pi)) for t in range(61)]
    run3 = [(LX + 4 + i * 2, G - 34) for i in range(6)] + cosrun([(1646, G - 34), (1680, G - 92), (1705, G - 16)]) + [(1705, G - 16)]
    fwd = run1 + loop + run3
    ret = [(1705, G - 16), (1709, G - 11), (1702, G - 8)] + [(x, G - 8) for x in range(1696, 1445, -8)] + [(1444, G - 8), (1437, G - 11), (1440, G - 16)]
    d = lambda pts: 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)
    length = lambda pts: sum(math.hypot(x1 - x0, y1 - y0) for (x0, y0), (x1, y1) in zip(pts, pts[1:]))
    hills = run1 + run3
    C = [f'<path d="{d(fwd)}" fill="none" stroke="{fill}" stroke-width="5.5" stroke-linejoin="round"/>',
         f'<path d="{d(run1)}" transform="translate(0 7)" fill="none" stroke="{fill}" stroke-width="2.2"/><path d="{d(run3[6:])}" transform="translate(0 7)" fill="none" stroke="{fill}" stroke-width="2.2"/>',
         f'<circle cx="{LX}" cy="{LY}" r="{LR - 7}" fill="none" stroke="{fill}" stroke-width="2.2"/>',
         f'<path d="{d(ret)}" fill="none" stroke="{fill}" stroke-width="3.4"/>']
    hy = {}
    for x, y in hills: hy[int(x)] = min(y, hy.get(int(x), 9e9))
    sup = [x for x in range(1446, 1700, 11) if not (LX - LR - 4 < x < LX + LR + 4)]
    near = lambda x: hy[min(hy, key=lambda k: abs(k - x))]
    for i, x in enumerate(sup):
        C.append(f'<path d="M{x} {near(x) + 6:.1f} V{G}" stroke="{fill}" stroke-width="1.8"/>')
        if i and sup[i] - sup[i - 1] < 15: C.append(f'<path d="M{sup[i - 1]} {near(sup[i - 1]) + 9:.1f} L{x} {G} M{sup[i - 1]} {G} L{x} {near(x) + 9:.1f}" stroke="{fill}" stroke-width=".8"/>')
    C.append(f'<path d="M{LX - 22} {LY + 30} L{LX - 30} {G} M{LX + 22} {LY + 30} L{LX + 30} {G} M{LX} {LY + LR} V{G}" stroke="{fill}" stroke-width="1.8"/>')
    S.append(''.join(C))
    train = ''
    if lights:
        T = 12; f = length(fwd) / (length(fwd) + length(ret))
        car = f'<rect x="-20" y="-8" width="40" height="8" rx="3" fill="#ff3d9a"/>' + ''.join(f'<rect x="{-18 + i * 12}" y="-12" width="7" height="4" rx="2" fill="#ffd88a"/>' for i in range(4))
        # outbound car, then the same car heading home (flipped so it stays upright while travelling left)
        train = (f'<g>{car}<animateMotion dur="{T}s" repeatCount="indefinite" rotate="auto" calcMode="linear" keyPoints="0;1;1" keyTimes="0;{f:.3f};1" path="{d(fwd)}"/>'
                 f'<animate attributeName="opacity" values="1;0" keyTimes="0;{f:.3f}" calcMode="discrete" dur="{T}s" repeatCount="indefinite"/></g>'
                 f'<g opacity="0"><g transform="scale(1 -1)">{car}</g><animateMotion dur="{T}s" repeatCount="indefinite" rotate="auto" calcMode="linear" keyPoints="0;0;1" keyTimes="0;{f:.3f};1" path="{d(ret)}"/>'
                 f'<animate attributeName="opacity" values="0;1" keyTimes="0;{f:.3f}" calcMode="discrete" dur="{T}s" repeatCount="indefinite"/></g>')
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
    # Prom walkers: they stroll the same way the car is going, so they drift slowly back as it overtakes them
    # each group is its own small layer inside the moving strip, so a leg swing repaints a few hundred pixels, not the whole strip
    groups = walkers(); spots = [90, 380, 690, 1010, 1390, 1690]
    def pbox(x, w):
        bx, by, bw, bh = x - 46, 755 - 186, w + 100, 196
        return (f'<div class="pg" style="left:{bx / 3840 * 100:.4f}%;top:{by / 9:.4f}%;width:{bw / 3840 * 100:.4f}%;height:{bh / 9:.4f}%">'
                f'<svg viewBox="{bx} {by} {bw} {bh}" preserveAspectRatio="none" aria-hidden="true" focusable="false">')
    ppl = ''.join(pbox(x + ox, w) + f'<g transform="translate({x + ox} 755) scale(1.02)">{g}</g></svg></div>' for ox in (0, 1920) for x, (w, g) in zip(spots, groups))
    people_div = (f'<div class="ly ly-people" style="left:0;top:0;width:240%;height:100%"><div class="rl rl-people">'
                  f'<svg class="pdefs" width="0" height="0" aria-hidden="true" focusable="false"><defs>{WALKER_DEFS}</defs></svg>{ppl}</div></div>')
    kerb = '<svg class="kerb" viewBox="0 0 1600 20" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 2 Q800 30 1600 2 V20 H0Z" fill="#fff8f3"/></svg>'
    return ('<div class="stage scene" aria-hidden="true">'
            + layer('ly-sky', 1600, sky)
            + f'<div class="ly ly-clouds par" data-d="14"><svg viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true" focusable="false">{clouds}</svg></div>'
            + f'<div class="ly ly-far par" data-d="9" style="left:0;top:0;width:240%;height:100%"><div class="rl rl-far"><svg viewBox="0 0 3840 900" preserveAspectRatio="none" aria-hidden="true" focusable="false">{far_svg}</svg></div></div>'
            + f'<div class="ov-plane"><div class="ov-plane-bob">{biplane()}</div></div>'
            + sky_strip.replace('class="ly ly-sky2"', 'class="ly ly-sky2 par" data-d="5"', 1)
            + layer('ly-road', 1600, road)
            + f'<div class="ly ly-dash" style="left:0;top:0;width:200%;height:100%"><div class="rl rl-dash"><svg viewBox="0 0 3200 900" preserveAspectRatio="none" aria-hidden="true" focusable="false">{dashes}</svg></div></div>'
            + f'<div class="ly ly-lamps" style="left:0;top:0;width:160%;height:100%"><div class="rl rl-lamps"><svg viewBox="0 0 2560 900" preserveAspectRatio="none" aria-hidden="true" focusable="false">{lamps}</svg></div></div>'
            + people_div + car_div + kerb + '</div>')


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


def hub_sil(kind):
    """Small silhouette for the inner-page marquee header (aria-hidden, decorative)."""
    ink, lit, pink = '#2a1d4a', '#ffc93c', '#ff2e88'
    if kind == 'stays':   # a seafront guest house with a lit VACANCIES sign, the LED-lit Tower rising behind it
        half = lambda y: 4 + 40 * ((y - 40) / 230) ** 1.7
        L = ' '.join(f'{150 - half(y):.1f},{y}' for y in range(40, 271, 10)); R = ' '.join(f'{150 + half(y):.1f},{y}' for y in range(40, 271, 10))
        brace = ''.join(f'<path d="M{150 - half(y0):.1f} {y0} L{150 + half(y0 + 22):.1f} {y0 + 22} M{150 + half(y0):.1f} {y0} L{150 - half(y0 + 22):.1f} {y0 + 22}" stroke="{ink}" stroke-width="1.3"/>' for y0 in range(48, 250, 22))
        tower = (f'<g transform="translate(0 -150)">{brace}<polyline points="{L}" fill="none" stroke="{ink}" stroke-width="4"/><polyline points="{R}" fill="none" stroke="{ink}" stroke-width="4"/>'
                 f'<g fill="none" stroke="url(#sled)" stroke-linecap="round"><g stroke-width="7" opacity=".45" filter="url(#ssoft)"><polyline points="{L}"/><polyline points="{R}"/></g><g stroke-width="2"><polyline points="{L}"/><polyline points="{R}"/></g></g>'
                 f'<rect x="136" y="28" width="28" height="13" rx="2" fill="{ink}"/><path d="M139 28 L150 8 L161 28" fill="{ink}" stroke="#5dff9b" stroke-width="1.8"/><path d="M150 8 V-6" stroke="#ffe45e" stroke-width="1.8"/>'
                 + ''.join(f'<rect x="{140 + i * 6}" y="31" width="3" height="8" fill="#{c}"/>' for i, c in enumerate(['7df9ff', 'ffe45e', 'ff8bd1', '7df9ff'])) + '</g>')
        win = ''.join(f'<rect x="{x}" y="{y}" width="16" height="20" rx="2" fill="{lit if (x + y) % 3 else "#3a2a5c"}"/>' for x in (34, 74, 114, 154) for y in (140, 182))
        return (f'<svg class="sil" viewBox="0 -168 222 488" aria-hidden="true" focusable="false"><defs><filter id="ssoft" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="2.5"/></filter>'
                f'<linearGradient id="sled" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="200" spreadMethod="repeat">' + ''.join(f'<stop offset="{i / 6:.3f}" stop-color="{c}"/>' for i, c in enumerate(['#ff2d55', '#ff9f1c', '#ffe45e', '#2ee59d', '#2fb8ff', '#b56bff', '#ff2d55']))
                + '<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="0 -160" dur="5s" repeatCount="indefinite"/></linearGradient></defs>'
                f'{tower}<path d="M14 320 V124 L110 76 L206 124 V320Z" fill="{ink}" stroke="#1a1033" stroke-width="3"/>{win}'
                f'<rect x="20" y="220" width="180" height="34" rx="6" fill="#1a1033" stroke="{pink}" stroke-width="2"/><text x="110" y="243" text-anchor="middle" font-family="Monoton,sans-serif" font-size="15" fill="{pink}" style="filter:drop-shadow(0 0 4px {pink})">VACANCIES</text>'
                f'<rect x="92" y="266" width="36" height="54" rx="18" fill="#3a2a5c"/><circle cx="110" cy="100" r="9" fill="{lit}"/></svg>')
    if kind == 'nightlife':   # the Tower and a mirrorball
        half = lambda y: 6 + 30 * ((y - 30) / 190) ** 1.7
        legs = ' '.join(f'{110 - half(y):.1f},{y}' for y in range(30, 221, 10)) + ' ' + ' '.join(f'{110 + half(y):.1f},{y}' for y in range(220, 29, -10))
        tiles = ''.join(f'<rect x="{180 + dx}" y="{60 + dy}" width="7" height="7" fill="{lit if (dx * dy) % 3 == 0 else "#f6eefb"}" opacity="{.5 + (dx % 3) * .2:.1f}"/>' for dx in range(-21, 22, 8) for dy in range(-21, 22, 8) if dx * dx + dy * dy < 500)
        return (f'<svg class="sil" viewBox="0 0 230 250" aria-hidden="true" focusable="false"><polygon points="{legs}" fill="none" stroke="{ink}" stroke-width="6"/>'
                f'<rect x="96" y="14" width="28" height="18" fill="{ink}"/><path d="M100 14 L110 0 L120 14Z" fill="{ink}"/><rect x="50" y="220" width="120" height="30" fill="{ink}"/>'
                f'<path d="M180 0 V36" stroke="{ink}" stroke-width="2"/><circle cx="180" cy="60" r="24" fill="#3a2a5c"/>{tiles}</svg>')
    if kind == 'whats-on':   # Winter Gardens style dome and theatre front
        return (f'<svg class="sil" viewBox="0 0 240 250" aria-hidden="true" focusable="false"><rect x="10" y="110" width="220" height="140" fill="{ink}"/><path d="M60 110 a60 60 0 0 1 120 0z" fill="{ink}"/>'
                f'<rect x="112" y="34" width="16" height="18" fill="{ink}"/><path d="M108 34 l12 -16 l12 16z" fill="{ink}"/>'
                + ''.join(f'<circle cx="{30 + i * 18}" cy="128" r="3.4" fill="{lit if i % 2 else pink}"/>' for i in range(11))
                + ''.join(f'<path d="M{34 + i * 36} 236 v-40 a12 12 0 0 1 24 0 v40z" fill="#3a2a5c"/>' for i in range(6)) + '</svg>')
    # default: a slice of skyline with the Tower
    half = lambda y: 5 + 26 * ((y - 40) / 160) ** 1.7
    legs = ' '.join(f'{120 - half(y):.1f},{y}' for y in range(40, 201, 10)) + ' ' + ' '.join(f'{120 + half(y):.1f},{y}' for y in range(200, 39, -10))
    return (f'<svg class="sil" viewBox="0 0 240 250" aria-hidden="true" focusable="false"><polygon points="{legs}" fill="none" stroke="{ink}" stroke-width="5"/>'
            f'<rect x="106" y="22" width="28" height="18" fill="{ink}"/><rect x="40" y="200" width="160" height="50" fill="{ink}"/><rect x="0" y="210" width="40" height="40" fill="{ink}"/><rect x="200" y="190" width="40" height="60" fill="{ink}"/></svg>')


def novacancies_svg():
    """404: a guest-house window with a neon NO VACANCIES sign, the car parked below."""
    return ('<svg viewBox="0 0 520 380" role="img" aria-label="A guest-house window with a neon No Vacancies sign, and Jay and Theo parked outside">'
            '<defs><filter id="nv" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'
            '<rect x="40" y="10" width="440" height="230" rx="14" fill="#2a1d4a"/><rect x="58" y="28" width="404" height="194" rx="8" fill="#120a26"/>'
            '<path d="M260 28 V222 M58 125 H462" stroke="#2a1d4a" stroke-width="10"/>'
            '<rect x="58" y="28" width="404" height="194" rx="8" fill="url(#nvg)" opacity="0"/>'
            '<g filter="url(#nv)" font-family="Monoton,sans-serif" text-anchor="middle"><text class="neon-no" x="260" y="104" font-size="54" fill="#ff2e88">NO</text>'
            '<text x="260" y="186" font-size="38" fill="#ff2e88">VACANCIES</text></g>'
            '<path d="M30 250 H490" stroke="#3a2a5c" stroke-width="6" stroke-linecap="round"/>'
            '<g transform="translate(120 238) scale(.9)">' + car('nv', beam=False) + '</g></svg>')


# ---------------------------------------------------------------- Promenade walkers (side view, facing right, feet on y=0)
def _walk(skin, top, legs, shoes, hair, face='', extra_front='', extra_back='', arm_back=None, arm_front=None, phase=0, h=1.0, sleeves=None, legs_bare=False, bob=True, holding=''):
    """One walking figure. arm_back/arm_front: None = swinging arm, or a fixed angle in degrees (for holding hands)."""
    dur = '1.05s'; d = f'-{phase:.2f}s'
    leg_fill = skin if legs_bare else legs
    def leg(vals):
        return (f'<g><path d="M-4.6 -50 h9.2 l-.8 46 h-7.6z" fill="{leg_fill}"/><path d="M-4.4 -5 h10.6 q4.6 0 4.6 5 h-15.2z" fill="{shoes}"/>'
                f'<animateTransform attributeName="transform" type="rotate" values="{vals}" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="{dur}" begin="{d}" repeatCount="indefinite"/></g>')
    def arm(fixed, vals, item=''):
        sl = sleeves or skin
        body = f'<path d="M-3.4 -88 h6.8 l-.8 20 h-5.2z" fill="{sl}"/><path d="M-2.8 -69 h5.6 l-.6 15 h-4.4z" fill="{skin}"/>{item}<circle cx="0" cy="-53" r="3.6" fill="{skin}"/>'
        if isinstance(fixed, str): return fixed
        if fixed is not None: return f'<g transform="rotate({fixed} 0 -88)">{body}</g>'
        return (f'<g>{body}<animateTransform attributeName="transform" type="rotate" values="{vals}" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="{dur}" begin="{d}" repeatCount="indefinite"/></g>')
    fig = (arm(arm_back, '-20 0 -88;20 0 -88;-20 0 -88') + leg('20 0 -50;-20 0 -50;20 0 -50') + extra_back
           + f'<path d="M-11 -88 q11 -7 22 0 l-1.6 40 h-18.8z" fill="{top}"/>'
           + leg('-20 0 -50;20 0 -50;-20 0 -50')
           + f'<rect x="-3.4" y="-97" width="7" height="9" rx="2.5" fill="{skin}"/><path d="M-10 -107 q0 -14 11 -14 q12 0 12 13 q0 6 -3.4 9.4 q-3.6 4 -8.6 4 q-8 0 -11 -7z" fill="{skin}"/>'
           + hair + f'<ellipse cx="6.8" cy="-108" rx="1.3" ry="1.7" fill="#1b1420"/><path d="M4 -100.5 q2.8 1.8 5.6 -.6" stroke="#4a1f1f" stroke-width="1.3" fill="none" stroke-linecap="round"/>'
           + face + extra_front + arm(arm_front, '20 0 -88;-20 0 -88;20 0 -88', holding))
    if bob: fig = f'<g>{fig}<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.6;0 0;0 -1.6;0 0" dur="{dur}" begin="{d}" repeatCount="indefinite"/></g>'
    return f'<g transform="scale({h})">{fig}</g>'


def walkers():
    """Three groups strolling the Prom: two camp lads hand in hand, two women hand in hand, a drag queen. Returns [(width, svg_group)]."""
    HOLD = 39   # arm angle at which partners 44 units apart meet exactly: 35*sin(39deg) = 22
    clasp = '<circle cx="22" cy="-60.8" r="4.4" fill="{a}"/><path d="M19.4 -62 q2.6 -2.6 5.2 0" stroke="{b}" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
    # Kai: rainbow T-shirt, tiny denim shorts, white high-tops, quiff and beard, free hand on his hip
    akimbo = ('<path d="M-3.4 -86 l-8 14" stroke="#8a5a3c" stroke-width="6.4" stroke-linecap="round"/><path d="M-11.4 -72 l6.6 9" stroke="#8a5a3c" stroke-width="5.6" stroke-linecap="round"/>'
              '<path d="M-3.4 -88 l-5 9" stroke="#ff2d55" stroke-width="7.4" stroke-linecap="round"/>')
    kai = _walk('#8a5a3c', 'url(#wrb)', '#8a5a3c', '#ffffff',
                '<path d="M-11 -110 q-2 -13 9 -16 q8 -3 16 1 q4 3 2 7 q-5 -4 -11 -2 l-1 -2 q-5 5 -15 12z" fill="#20140f"/><path d="M2 -127 q6 -6 13 -2" stroke="#20140f" stroke-width="3" fill="none" stroke-linecap="round"/>',
                face='<path d="M-1 -100 q2 7 9 6 q4 -1 5 -6 q-3 3 -8 2.4 q-4 -.4 -6 -2.4z" fill="#20140f"/><circle cx="-2.4" cy="-104" r="1.5" fill="#ffc93c"/>'
                     '<path d="M-9 -88 q3 7 6 0" stroke="#ffc93c" stroke-width=".9" fill="none"/><path d="M-7.4 -82.6 l3.4 6.6 M-5.6 -79.2 l-2.2 3.2" stroke="#ffc93c" stroke-width="1.5" stroke-linecap="round" fill="none"/>',
                arm_front=-HOLD, arm_back=akimbo, phase=0, legs_bare=True, sleeves='#ff2d55',
                extra_front='<path d="M-10.6 -52 h21.2 l1.4 12 h-10 l-2 -4 l-2 4 h-10z" fill="#4a78c2"/><path d="M-10 -51 h20" stroke="#2f5a9e" stroke-width="1.2"/>')
    # Ollie: open pink bomber over a white tee, ginger quiff, sunnies pushed up, a fluttering fan held high
    fan = ('<g><path d="M2 -86 l11 -6" stroke="#ff2e88" stroke-width="7" stroke-linecap="round"/><path d="M13 -92 l5 -13" stroke="#f2c9a5" stroke-width="5.4" stroke-linecap="round"/>'
           '<g><path d="M18 -106 l-14 -12 a19 19 0 0 1 26 -7z" fill="#ffc93c"/><path d="M18 -106 l-14 -12 M18 -106 l-7 -16 M18 -106 l1 -18 M18 -106 l9 -16 M18 -106 l12 -13" stroke="#ff2e88" stroke-width="1.3"/>'
           '<animateTransform attributeName="transform" type="rotate" values="-14 18 -106;12 18 -106;-14 18 -106" dur=".42s" repeatCount="indefinite"/></g>'
           '<circle cx="18" cy="-106" r="3.4" fill="#f2c9a5"/></g>')
    ollie = _walk('#f2c9a5', '#ffffff', '#f2c9a5', '#ff2e88',
                  '<path d="M-11 -108 q-1 -15 13 -16 q10 -1 13 7 q-6 -4 -11 -1 q-3 -6 -15 10z" fill="#d9763a"/><path d="M-6 -121 q5 -4 13 -1" stroke="#1a1033" stroke-width="2.6" fill="none"/>',
                  sleeves='#ff2e88', arm_back=HOLD, arm_front=fan, phase=.18, h=.95, legs_bare=True,
                  extra_front='<path d="M-11.6 -88 q-1 18 1 40 h5 l-1 -40z" fill="#ff2e88"/><path d="M4 -87 q2 18 7 38 h-4 q-4 -18 -7 -38z" fill="#ff2e88"/><path d="M-2 -88 q3 6 6 0" stroke="#ffc93c" stroke-width="1.4" fill="none"/>'
                              '<path d="M-10.6 -52 h21.2 l1 10 h-9 l-2 -3 l-2 3 h-10z" fill="#1a1033"/>'
                              '<path d="M7 -78 l-1.4 6" stroke="#2e8b3e" stroke-width="1.2"/><circle cx="7.6" cy="-80" r="2.6" fill="#3fcf62"/><circle cx="5.6" cy="-80.6" r="1.9" fill="#5ee07c"/><circle cx="9.2" cy="-81.6" r="1.9" fill="#2fb854"/><circle cx="7.6" cy="-82.4" r="1.6" fill="#6cf08a"/>')
    ollie = f'<g>{ollie}<animateTransform attributeName="transform" type="rotate" values="-2.4 0 0;2.4 0 0;-2.4 0 0" dur="1.05s" begin="-.18s" repeatCount="indefinite"/></g>'
    g1 = f'<g>{kai}</g><g transform="translate(44 0)">{ollie}</g>' + clasp.format(a='#b98a62', b='#7a4c33')
    # Amara: sunflower-yellow sundress, afro with a flower, gold hoops, pink sandals
    amara_hair = '<circle cx="-1" cy="-114" r="15" fill="#1a1210"/><circle cx="-10" cy="-106" r="9" fill="#1a1210"/>' + ''.join(f'<g transform="translate({x} {y})">' + ''.join(f'<circle cx="{dx}" cy="{dy}" r="1.9" fill="#7b4bd1"/>' for dx, dy in ((0, -2.2), (2.1, -.7), (1.3, 1.8), (-1.3, 1.8), (-2.1, -.7))) + '<circle r="1.1" fill="#ffe45e"/></g>' for x, y in ((-13, -121), (-7, -126), (-15, -114)))
    amara = _walk('#6b3f2a', '#ffc93c', '#6b3f2a', '#ff2e88', amara_hair, arm_front=-HOLD, phase=.4, legs_bare=True, sleeves='#ffc93c',
                  face='<path d="M4.4 -101 q2.6 1.8 5.2 -.4" stroke="#b0123f" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
                  extra_front='<path d="M-11 -66 l-7 30 h36 l-7 -30z" fill="#ffc93c"/><path d="M-14 -46 h30" stroke="#e8ad1f" stroke-width="1.4"/><circle cx="-3" cy="-100" r="3" fill="none" stroke="#ffc93c" stroke-width="1.4"/>')
    # Rue: long wavy lilac hair down her back, cropped tee, rainbow skater skirt, white trainers, hoop earring
    rue_hair = ('<path d="M-11 -106 q-3 -18 12 -18 q14 0 14 12 q-6 -5 -13 -4 q-6 1 -9 6 q-3 14 -4 24 q-2 10 -6 14 q-6 -6 -4 -16 q2 -10 -1 -16z" fill="#b38cff"/>'
                '<path d="M-12 -98 q-2 10 -1 18" stroke="#8a63e0" stroke-width="1.6" fill="none"/>')
    rue = _walk('#e8b48f', '#c9a7ff', '#e8b48f', '#f6f1ea', rue_hair, sleeves='#c9a7ff', arm_back=HOLD, phase=.55, h=.97, legs_bare=True,
                face='<path d="M4.4 -100.6 q2.6 1.8 5.2 -.4" stroke="#c2185b" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="-3" cy="-100" r="2.8" fill="none" stroke="#ffc93c" stroke-width="1.3"/>',
                extra_front='<path d="M-10 -68 h20 l7 26 h-34z" fill="url(#wrb)"/><path d="M-10 -68 h20" stroke="#1a1033" stroke-width="1.6"/>'
                            '<path d="M-8 -68 v4 a2.4 2.4 0 0 0 4.8 0 v-4" stroke="#c0c0c0" stroke-width="1.3" fill="none"/><path d="M-6.6 -61.6 l-1.4 5 M-5 -61.6 l1 4.4" stroke="#ffc93c" stroke-width="1.4" stroke-linecap="round"/>'
                            '<path d="M2 -85.4 v12.4" stroke="#4b2a8a" stroke-width="1.1"/><path d="M1.4 -82.6 q-5.4 -1.4 -5.4 3 q0 4.4 5.4 3z M2.6 -82.6 q5.4 -1.4 5.4 3 q0 4.4 -5.4 3z" fill="#4b2a8a"/>',
                holding='<path d="M-3.4 -58 h6.8 l-.8 11 h-5.2z" fill="#fff6ec" opacity=".85"/><path d="M-3 -54 h6 l-.6 7 h-4.8z" fill="#a0663c"/><path d="M1 -58 l2.4 -6" stroke="#ff2e88" stroke-width="1.2"/>')
    g2 = f'<g>{amara}</g><g transform="translate(44 0)">{rue}</g>' + clasp.format(a='#a87856', b='#6b3f2a')
    # the drag queen: beehive, sequin gown with a slit, feather boa, gold handbag, heels, a sashay
    sequins = ''.join(f'<circle cx="{x}" cy="{y}" r="1.1" fill="#fff" opacity=".8"/>' for x, y in [(-6, -78), (4, -70), (-2, -60), (8, -48), (-8, -40), (2, -30), (-4, -18), (9, -12), (-10, -8), (6, -36)])
    queen = (f'<g transform="scale(1.14)"><g>'
             f'<g><path d="M2 -46 l6 -2 l1 42 l7 4 h-12 l-2 -4z" fill="#f1c7a3"/><path d="M4 -4 l12 1 l-1 4 h-12z" fill="#ff2e88"/><path d="M14 0 l1 4" stroke="#ff2e88" stroke-width="1.6"/>'
             f'<animateTransform attributeName="transform" type="rotate" values="-8 4 -46;10 4 -46;-8 4 -46" dur="1.2s" repeatCount="indefinite"/></g>'
             f'<path d="M-12 -86 q12 -7 24 0 l1 30 q9 38 7 56 h-17 l-4 -40 l-3 40 h-12 q-3 -18 3 -56z" fill="url(#qgown)"/>{sequins}'
             f'<rect x="-3.4" y="-97" width="7" height="9" rx="2.5" fill="#c98f6d"/><path d="M-10 -107 q0 -14 11 -14 q12 0 12 13 q0 6 -3.4 9.4 q-3.6 4 -8.6 4 q-8 0 -11 -7z" fill="#c98f6d"/>'
             f'<path d="M-15 -112 q-4 -34 14 -40 q18 -4 22 18 q2 14 -8 22 q4 -14 -6 -18 q-12 -2 -16 12z" fill="url(#qwig)"/><path d="M-6 -146 q8 -8 16 2" stroke="#ffd1f0" stroke-width="2" fill="none" opacity=".7"/>'
             f'<path d="M3 -111 q4 -4 9 -1 M4 -107.5 l-1 -2.4 M6.5 -108.4 l-.6 -2.6 M9 -108.4 l.2 -2.6" stroke="#1b1420" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M4.6 -101 q3 2.6 6.2 -.4 q-3 -1.2 -6.2 .4z" fill="#e0004d"/><circle cx="-6" cy="-102" r="2.4" fill="#ffc93c"/>'
             + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#ff6fd0"/>' for x, y, r in [(-14, -86, 5.4), (-8, -90, 5.8), (0, -91, 5.6), (8, -90, 5.8), (14, -86, 5.4), (17, -78, 4.8), (18, -70, 4.4), (-17, -78, 4.8), (-18, -70, 4.4)])
             + f'<g><path d="M8 -86 l12 18 l4 -2" stroke="#c98f6d" stroke-width="5.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 -66 h12 l-2 12 h-8z" fill="#ffc93c"/><path d="M22 -66 q4 -7 8 0" stroke="#ffc93c" stroke-width="1.6" fill="none"/>'
             f'<animateTransform attributeName="transform" type="rotate" values="-4 8 -86;5 8 -86;-4 8 -86" dur="1.2s" repeatCount="indefinite"/></g>'
             f'<animateTransform attributeName="transform" type="rotate" values="-2.5 0 0;2.5 0 0;-2.5 0 0" dur="1.2s" repeatCount="indefinite"/></g></g>')
    queen += ('<path d="M27 -70 q18 26 32 44" stroke="#ff2e88" stroke-width="1.4" fill="none"/>'
              '<g transform="translate(52 0)">' + dog() + '</g>')
    return [(90, g1), (90, g2), (110, queen), (200, posse()), (40, cat()), (40, flamingo())]


def _legs4(color, xs, top, dur, phase=0):
    """Four little trotting legs, diagonal pairs in step."""
    out = ''
    for i, x in enumerate(xs):
        v = '22;-22;22' if i in (0, 3) else '-22;22;-22'
        vals = ';'.join(f'{a} {x} {top}' for a in v.split(';'))
        out += (f'<g><path d="M{x - 2} {top} h4 l-.4 {-top - 1} h-3.2z" fill="{color}"/><ellipse cx="{x + .6}" cy="-1" rx="2.6" ry="1.4" fill="{color}"/>'
                f'<animateTransform attributeName="transform" type="rotate" values="{vals}" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="{dur}" begin="-{phase}s" repeatCount="indefinite"/></g>')
    return out


def dog():
    """A fluffy little white dog with a rainbow bow on its collar, trotting, tail wagging. Feet on y=0, faces right."""
    tail = ('<g><path d="M-13 -20 q-9 -6 -5 -16 q4 6 9 9z" fill="#fbf6ff"/>'
            '<animateTransform attributeName="transform" type="rotate" values="-14 -12 -20;14 -12 -20;-14 -12 -20" dur=".36s" repeatCount="indefinite"/></g>')
    fluff = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fbf6ff"/>' for x, y, r in ((9.4, -32.6, 4.4), (13.4, -35.2, 4.8), (17.8, -34.2, 4.4), (20.6, -31, 3.4)))
    body = ('<ellipse cx="0" cy="-17" rx="15" ry="9" fill="#fbf6ff"/><path d="M-12 -24 q4 -5 9 -2 q5 -5 10 -1 q5 -4 9 1" stroke="#e7dcf2" stroke-width="1.4" fill="none"/>'
            '<circle cx="14" cy="-27" r="8" fill="#fbf6ff"/>' + fluff +
            '<path d="M10.6 -35 q3 -2.4 6 -.6 M14 -36.6 q3 -1.6 5.6 .4" stroke="#e7dcf2" stroke-width="1" fill="none" stroke-linecap="round"/>'
            '<ellipse cx="21" cy="-25" rx="4.6" ry="3.4" fill="#fbf6ff"/><circle cx="25" cy="-26" r="1.7" fill="#1a1033"/>'
            '<circle cx="16.6" cy="-28.4" r="1.3" fill="#1a1033"/><path d="M8.6 -31 q-3.6 3 -2.4 10 q3.4 .6 4.6 -3 q.6 -4 -2.2 -7z" fill="#ece2f6"/><path d="M20 -21 q2 3 4 0" stroke="#ff6fa8" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
            '<path d="M6 -22.6 q6 3.4 12 -1" stroke="#ff2e88" stroke-width="2.6" fill="none"/>'
            '<path d="M10 -18 l-8.4 -6 q-1.8 6 0 12z M10 -18 l8.4 -6 q1.8 6 0 12z" fill="url(#wrb)" stroke="#1a1033" stroke-width=".7" stroke-linejoin="round"/><circle cx="10" cy="-18" r="2.3" fill="#ffc93c" stroke="#1a1033" stroke-width=".6"/>')
    bob = '<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.4;0 0" dur=".36s" repeatCount="indefinite"/>'
    return f'<g>{tail}{_legs4("#efe6f7", (-9, -4, 6, 11), -12, ".36s")}<g>{body}{bob}</g></g>'


def cat():
    """A strutting grey cat with a rainbow Mohican, tail up. Feet on y=0, faces right."""
    mohawk = ''.join(f'<path d="M{x} {y} l{-2.2} -7 l4.6 1.4z" fill="{c}"/>' for (x, y), c in zip([(14, -36), (10, -37), (6, -35), (2.6, -32), (-.4, -29), (-3, -26)], ['#ff2d55', '#ff9f1c', '#ffe45e', '#2ee59d', '#2fb8ff', '#b56bff']))
    tail = ('<g><path d="M-14 -20 q-8 -6 -6 -16 q2 -8 7 -9" stroke="#8e8aa6" stroke-width="3.6" fill="none" stroke-linecap="round"/>'
            '<animateTransform attributeName="transform" type="rotate" values="-6 -14 -20;8 -14 -20;-6 -14 -20" dur="1.6s" repeatCount="indefinite"/></g>')
    body = ('<path d="M-15 -14 q0 -10 12 -11 h10 q8 0 9 9 q0 4 -4 4 h-23 q-4 0 -4 -2z" fill="#8e8aa6"/>'
            '<path d="M-10 -22 l3 6 M-4 -24 l2 6 M2 -24 l1 6" stroke="#6f6a8a" stroke-width="1.6" stroke-linecap="round"/>'
            '<circle cx="13" cy="-27" r="7.4" fill="#8e8aa6"/><path d="M8 -32 l-1 -8 l6 5z M15 -33 l3 -7 l2 7z" fill="#8e8aa6"/><path d="M15.8 -34.6 l1.6 -3.4 l1 3.6z" fill="#ff9fc9"/>'
            + mohawk +
            '<ellipse cx="16" cy="-28" rx="1.3" ry="1.8" fill="#ffe45e"/><path d="M15.6 -29 v2" stroke="#1a1033" stroke-width=".8"/><path d="M19.6 -25.4 l1.4 .6 l-1.2 .8z" fill="#ff9fc9"/>'
            '<path d="M20 -24 l7 -1 M20 -23 l7 1" stroke="#e7dcf2" stroke-width=".6"/>')
    return f'<g>{tail}{_legs4("#7d7896", (-11, -6, 6, 11), -12, ".6s")}<g>{body}<animateTransform attributeName="transform" type="translate" values="0 0;0 -.8;0 0" dur=".6s" repeatCount="indefinite"/></g></g>'


def flamingo():
    """A pink flamingo strutting the Prom, head bobbing. Feet on y=0, faces right."""
    def leg(vals, ph):
        v = ';'.join(f'{a} 0 -54' for a in vals)
        return (f'<g><path d="M-1 -54 L1 -30 L-3 -2" stroke="#ff7fae" stroke-width="2.2" fill="none" stroke-linejoin="round"/><circle cx="1" cy="-30" r="1.8" fill="#ff7fae"/><path d="M-3 -2 h9" stroke="#ff7fae" stroke-width="2.4" stroke-linecap="round"/>'
                f'<animateTransform attributeName="transform" type="rotate" values="{v}" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur=".9s" begin="-{ph}s" repeatCount="indefinite"/></g>')
    neck = ('<g><path d="M12 -64 q10 -10 2 -22 q-7 -11 3 -20" stroke="#ff6fa8" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="18" cy="-108" r="6" fill="#ff6fa8"/>'
            '<path d="M22 -111 q8 0 9 6 q-1 4 -4 5 q1 -4 -5 -5z" fill="#fff6ec"/><path d="M28 -103 q2 0 3 -2 q0 4 -4 5z" fill="#1a1033"/><circle cx="19" cy="-109.6" r="1.2" fill="#1a1033"/>'
            '<animateTransform attributeName="transform" type="translate" values="0 0;3 1;0 0" dur=".9s" repeatCount="indefinite"/></g>')
    body = ('<path d="M-22 -66 q4 -12 20 -12 q16 0 18 10 q0 10 -14 12 q-14 2 -24 -10z" fill="#ff8fbd"/><path d="M-20 -66 q10 -8 22 -4 q-6 8 -22 4z" fill="#ff5c9a"/>'
            '<path d="M-22 -66 l-8 -4 l3 6z" fill="#ff5c9a"/>')
    return (f'<g>{leg(("16", "-16", "16"), 0)}{leg(("-16", "16", "-16"), 0)}<g>{body}{neck}'
            '<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.6;0 0;0 -1.6;0 0" dur=".9s" repeatCount="indefinite"/></g></g>')


def _dancer(skin, shirt, sleeves, trousers, shoes, hair, _unused, tash, hat='', front='', delay=0.0):
    """Front-facing dancer doing the four-letter arm routine: Y, M, C, A, then a rest. Feet on y=0."""
    KT = '0;.07;.19;.25;.37;.43;.55;.61;.76;.86;1'
    # (upper, forearm) angles per keyframe for the dancer's arm on the viewer's left; the right arm mirrors except C
    L = [(14, 0), (150, 0), (150, 0), (120, 112), (120, 112), (158, 70), (158, 70), (178, 34), (178, 34), (14, 0), (14, 0)]
    R = [(-14, 0), (-150, 0), (-150, 0), (-120, -112), (-120, -112), (66, -58), (66, -58), (-178, -34), (-178, -34), (-14, 0), (-14, 0)]
    sp = ';'.join(['.4 0 .2 1'] * 10)
    def arm(x, keys):
        up = ';'.join(f'{u} {x} -86' for u, _ in keys); fo = ';'.join(f'{f} {x} -69' for _, f in keys)
        return (f'<g><path d="M{x - 3.2} -88 h6.4 v19 h-6.4z" fill="{sleeves}"/>'
                f'<g><path d="M{x - 2.8} -70 h5.6 v19 h-5.6z" fill="{skin}"/><circle cx="{x}" cy="-50" r="3.6" fill="{skin}"/>'
                f'<animateTransform attributeName="transform" type="rotate" values="{fo}" keyTimes="{KT}" calcMode="spline" keySplines="{sp}" dur="3.4s" begin="-{delay}s" repeatCount="indefinite"/></g>'
                f'<animateTransform attributeName="transform" type="rotate" values="{up}" keyTimes="{KT}" calcMode="spline" keySplines="{sp}" dur="3.4s" begin="-{delay}s" repeatCount="indefinite"/></g>')
    body = (f'<path d="M-8 -50 h7 l-.6 45 h-7z M1 -50 h7 l.6 45 h-7z" fill="{trousers}"/><path d="M-10 -6 h9 v6 h-11z M1 -6 h9 l2 6 h-11z" fill="{shoes}"/>'
            f'<path d="M-12 -88 q12 -6 24 0 l-1 40 h-22z" fill="{shirt}"/>{front}'
            f'<rect x="-3.4" y="-97" width="6.8" height="9" rx="2.5" fill="{skin}"/><ellipse cx="0" cy="-107" rx="10" ry="11.6" fill="{skin}"/>{hair}'
            f'<circle cx="-3.6" cy="-108" r="1.4" fill="#1b1420"/><circle cx="3.6" cy="-108" r="1.4" fill="#1b1420"/>'
            f'<path d="M-6 -101 q3 -2.6 6 -.6 q3 -2 6 .6 q-2 2.4 -6 1 q-4 1.4 -6 -1z" fill="{tash}"/><path d="M-2.6 -97.6 q2.6 1.8 5.2 0" stroke="#7a2a2a" stroke-width="1.2" fill="none" stroke-linecap="round"/>{hat}')
    bounce = (f'<animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0;0 -3;0 0;0 -3;0 0;0 -3;0 0;0 0;0 0" keyTimes="{KT}" dur="3.4s" begin="-{delay}s" repeatCount="indefinite"/>')
    return f'<g>{body}{arm(-14, L)}{arm(14, R)}{bounce}</g>'


def posse():
    """The Prom Posse: five original characters in classic disco-era costumes doing the four-letter arm dance.
    Cop, cowboy, builder, leather biker and sailor. Returns one group, about 150 wide."""
    short = lambda c: f'<path d="M-10 -110 q0 -10 10 -10 q10 0 10 10 q-4 -5 -10 -5 q-6 0 -10 5z" fill="{c}"/>'
    cop = _dancer('#f0c39f', '#1f2f5c', '#1f2f5c', '#1f2f5c', '#111', short('#3a2618'),
                  '', '#3a2618', hat='<path d="M-12 -117 q12 -10 24 0 v3 h-24z" fill="#1f2f5c"/><path d="M-11 -114 h22 l-2 3 h-18z" fill="#111"/><circle cx="0" cy="-118" r="2" fill="#ffc93c"/><path d="M-8 -110 h16 v3.6 h-16z" fill="#1a1033" opacity=".9"/>',
                  front='<path d="M-7 -80 l2.4 -2 l2.4 2 l-2.4 4z" fill="#ffc93c"/><path d="M-11 -50 h22" stroke="#111" stroke-width="3"/>', delay=0)
    cowboy = _dancer('#c98f6d', '#4a78c2', '#4a78c2', '#2d3f66', '#7a4a2a', short('#20140f'), '', '#20140f',
                     hat='<path d="M-21 -116 q21 5 42 0 q-3 5 -21 6 q-18 -1 -21 -6z" fill="#c8964f"/><path d="M-10 -116 q0 -14 10 -14 q10 0 10 14z" fill="#c8964f"/><path d="M-10 -118 h20" stroke="#7a4a2a" stroke-width="2"/>',
                     front='<path d="M-6 -88 l6 9 l6 -9z" fill="#ff2e88"/><path d="M-11 -50 h22" stroke="#7a4a2a" stroke-width="3"/><rect x="-3" y="-52" width="6" height="4" fill="#ffc93c"/>', delay=0)
    builder = _dancer('#8a5a3c', '#ffffff', '#8a5a3c', '#3d5f99', '#8a5a2b', short('#120c08'), '', '#120c08',
                      hat='<path d="M-11 -114 q0 -14 11 -14 q11 0 11 14z" fill="#ffd400"/><path d="M-13 -114 h26" stroke="#e0b800" stroke-width="2.4" stroke-linecap="round"/><path d="M0 -128 v14" stroke="#e0b800" stroke-width="2"/>',
                      front='<path d="M-12 -87 h7 l1 38 h-7z M5 -87 h7 l-1 38 h-7z" fill="#ff9f1c"/><path d="M-12 -68 h24" stroke="#d9d9d9" stroke-width="2.4"/><path d="M-11 -50 h22" stroke="#5a3a1a" stroke-width="3"/>', delay=0)
    biker = _dancer('#f2c9a5', '#111111', '#f2c9a5', '#1b1b1f', '#111', short('#5a3a24'), '', '#5a3a24',
                    hat='<path d="M-11 -116 q11 -8 22 0 v3 h-22z" fill="#111"/><path d="M-11 -113 h22 l-2 3 h-18z" fill="#111"/><path d="M-4 -117 h8" stroke="#c0c0c0" stroke-width="1.6"/>',
                    front='<path d="M-4 -88 l4 34 l4 -34z" fill="#f2c9a5"/><circle cx="-7" cy="-78" r="1.2" fill="#c0c0c0"/><circle cx="7" cy="-72" r="1.2" fill="#c0c0c0"/><path d="M-11 -50 h22" stroke="#c0c0c0" stroke-width="2.4"/>', delay=0)
    sailor = _dancer('#e8b48f', '#ffffff', '#ffffff', '#ffffff', '#111', short('#d9a441'), '', '#b8862a',
                     hat='<path d="M-10 -116 q0 -9 10 -9 q10 0 10 9z" fill="#fff"/><path d="M-12 -117 h24 v3 h-24z" fill="#fff" stroke="#d9d9e8" stroke-width=".8"/>',
                     front='<path d="M-12 -88 h24 l-5 12 h-14z" fill="#1f2f5c"/><path d="M-4 -78 l4 6 l4 -6" stroke="#ff2e88" stroke-width="2.2" fill="none"/>', delay=0)
    figs = [cop, cowboy, builder, biker, sailor]
    return ''.join(f'<g transform="translate({i * 50} 0)">{f}</g>' for i, f in enumerate(figs))



def biplane():
    """A little biplane towing a waving rainbow banner. viewBox 0 0 320 80, flies to the right."""
    cols = ['#ff2d55', '#ff9f1c', '#ffe45e', '#2ee59d', '#2fb8ff', '#b56bff']
    def flag(a):
        return (f'M6 {12 + a} C46 {12 - a} 86 {12 + a} 126 {12 - a * .6} L170 12 L170 52 L126 {52 - a * .6} C86 {52 + a} 46 {52 - a} 6 {52 + a} Z')
    shapes = [flag(a) for a in (4, -4, 4)]
    stripes = ''.join(f'<rect x="0" y="{12 + i * 40 / 6:.2f}" width="172" height="{40 / 6 + .4:.2f}" fill="{c}"/>' for i, c in enumerate(cols))
    banner = (f'<clipPath id="bpclip"><path d="{shapes[0]}"><animate attributeName="d" values="{";".join(shapes)}" dur="1.1s" repeatCount="indefinite"/></path></clipPath>'
              f'<g clip-path="url(#bpclip)">{stripes}</g>'
              f'<path d="M6 12 V52" stroke="#fff6ec" stroke-width="2.4"/>')
    rope = '<path d="M170 22 L214 40 M170 42 L214 40" stroke="#fff6ec" stroke-width="1" opacity=".8"/>'
    plane = ('<g transform="translate(214 18)">'
             '<path d="M2 22 l-6 -12 h8 l8 10z" fill="#ff2e88"/>'                                # tail fin
             '<path d="M0 20 q30 -8 70 -4 q8 2 8 8 q0 6 -8 7 q-40 3 -70 -4z" fill="#fff6ec"/>'   # fuselage
             '<path d="M10 24 h56" stroke="#ff2e88" stroke-width="2.4"/>'
             '<rect x="22" y="2" width="44" height="5" rx="2.5" fill="#ff2e88"/><rect x="24" y="34" width="44" height="5" rx="2.5" fill="#ff2e88"/>'  # wings
             '<path d="M30 7 L32 34 M58 7 L60 34" stroke="#2a1d4a" stroke-width="1.6"/>'
             '<circle cx="44" cy="15" r="4.4" fill="#f1c7a3"/><path d="M39.6 13 q4.4 -6 9 -1.6" fill="#7a4a2a"/><path d="M40 14 h8" stroke="#2a1d4a" stroke-width="1.6"/>'  # pilot + goggles
             '<path d="M40 19 q-10 0 -18 -4 q8 6 18 7z" fill="#ffc93c"><animate attributeName="d" values="M40 19 q-10 0 -18 -4 q8 6 18 7z;M40 19 q-10 4 -18 2 q8 2 18 3z;M40 19 q-10 0 -18 -4 q8 6 18 7z" dur=".5s" repeatCount="indefinite"/></path>'  # scarf
             '<circle cx="78" cy="23" r="3" fill="#ffc93c"/>'
             '<ellipse cx="80" cy="23" rx="1.6" ry="13" fill="#fff6ec" opacity=".55"><animate attributeName="ry" values="13;4;13" dur=".12s" repeatCount="indefinite"/></ellipse>'  # propeller blur
             '<path d="M36 41 l-4 6 M60 41 l4 6" stroke="#2a1d4a" stroke-width="1.6"/><circle cx="31" cy="48" r="3.4" fill="#2a1d4a"/><circle cx="65" cy="48" r="3.4" fill="#2a1d4a"/>'
             '</g>')
    return f'<svg viewBox="0 0 320 80" aria-hidden="true" focusable="false">{banner}{rope}{plane}</svg>'


WALKER_DEFS = ('<linearGradient id="wrb" x1="0" y1="0" x2="0" y2="1">' + ''.join(f'<stop offset="{i / 6:.3f}" stop-color="{c}"/><stop offset="{(i + 1) / 6:.3f}" stop-color="{c}"/>' for i, c in enumerate(['#ff2d55', '#ff9f1c', '#ffe45e', '#2ee59d', '#2fb8ff', '#b56bff'])) + '</linearGradient>' + '<linearGradient id="qgown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b56bff"/><stop offset=".6" stop-color="#7b2cbf"/><stop offset="1" stop-color="#ff2e88"/></linearGradient>'
               '<linearGradient id="qwig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9ed8"/><stop offset="1" stop-color="#c77dff"/></linearGradient>')


# ---------------------------------------------------------------- venue facades (illustrations, not photos)
def facade(slug, name, kind):
    """Night-time illustration of a venue front in the house style: a Blackpool terrace with a neon name sign.
    Bars get a glowing shopfront, stays a bay-windowed guest house, Funny Girls an art deco picture house. Closed venues stay dark."""
    import random as _r
    from html import escape as _e
    R = _r.Random(slug); k = kind.lower(); closed = 'closed' in k
    deco = slug == 'funny-girls'
    bar = (not deco) and any(w in k for w in ('bar', 'club', 'pub', 'lounge', 'cabaret', 'sauna', 'bistro'))
    if any(w in k for w in ('hotel', 'guest house', 'b&b')) and 'bar and hotel' not in k and 'bar with rooms' not in k and 'cabaret bar' not in k: bar = False
    paint = R.choice(['#f3d9e6', '#d8ecf0', '#efe3c8', '#e3dcf5', '#cfe8d8', '#f2c9b8', '#9a5a46'])
    trim = R.choice(['#ff2e88', '#0fb5ae', '#ffc93c', '#8b5cf6'])
    neon = '#5a5470' if closed else R.choice(['#ff2e88', '#ff5fb0', '#2ff3e0', '#ffe45e'])
    lit = lambda: '#3a2a5c' if closed or R.random() < .3 else R.choice(['#ffd88a', '#ffc46b', '#ffb3d9', '#fff1c9'])
    uid = re.sub(r'[^a-z0-9]', '', slug)[:10] or 'v'
    W, H, G = 800, 460, 410    # canvas, ground line
    out = [f'<svg class="facade" viewBox="0 0 {W} {H}" role="img" aria-label="Illustration of the front of {_e(name)}{" (closed)" if closed else ""} at night">',
           f'<defs><linearGradient id="fs{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#170c2c"/><stop offset=".7" stop-color="#3a1a6e"/><stop offset="1" stop-color="#7a2f7a"/></linearGradient>'
           f'<filter id="fg{uid}" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
           f'<linearGradient id="fw{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a8"/><stop offset="1" stop-color="#ff9fc9"/></linearGradient></defs>',
           f'<rect width="{W}" height="{H}" fill="url(#fs{uid})"/>']
    out += [f'<circle cx="{R.randint(10, 790)}" cy="{R.randint(8, 120)}" r="{R.choice([.8, 1, 1.3])}" fill="#fff" opacity="{R.choice([.4, .6, .9])}"/>' for _ in range(26)]
    # neighbours
    for x0, x1 in ((-10, 170), (630, 810)):
        top = R.randint(110, 170)
        out.append(f'<rect x="{x0}" y="{top}" width="{x1 - x0}" height="{G - top}" fill="#2a1d4a"/>')
        out += [f'<rect x="{x}" y="{y}" width="26" height="34" rx="2" fill="{lit() if R.random() < .5 else "#3a2a5c"}" opacity=".8"/>' for x in range(x0 + 24, x1 - 30, 52) for y in range(top + 24, G - 50, 66)]
    x0, x1 = 170, 630
    if deco:
        out.append('<g transform="translate(0 80)">')
        G -= 80
        out.append(f'<path d="M{x0} {G} V120 H{x1} V{G}Z" fill="#efe3c8"/><path d="M{x0} {G} V120 H{x1} V{G}Z" fill="#1a1033" opacity=".35"/>')
        out += [f'<path d="M{x0} {y} H{x1}" stroke="#d6c6a4" stroke-width="3" opacity=".7"/>' for y in (150, 162, 174)]
        out.append(f'<rect x="372" y="34" width="56" height="200" fill="#efe3c8"/><rect x="372" y="34" width="56" height="200" fill="#1a1033" opacity=".3"/>'
                   f'<g filter="url(#fg{uid})" font-family="\'Bricolage Grotesque\',system-ui,sans-serif" font-weight="800" font-size="24" fill="{neon}" text-anchor="middle">'
                   + ''.join(f'<text x="400" y="{62 + i * 23}">{_e(ch)}</text>' for i, ch in enumerate('FUNNY')) + '</g>'
                   f'<rect x="{x0 + 20}" y="236" width="{x1 - x0 - 40}" height="20" rx="4" fill="#1a1033"/>'
                   + ''.join(f'<circle cx="{x}" cy="246" r="3.2" fill="{"#ffe45e" if i % 2 else "#ff9fc9"}"/>' for i, x in enumerate(range(x0 + 30, x1 - 20, 16)))
                   + f'<text x="400" y="226" text-anchor="middle" font-family="Monoton,sans-serif" font-size="30" fill="{neon}" filter="url(#fg{uid})">GIRLS</text>'
                   + ''.join(f'<rect x="{x}" y="262" width="54" height="{G - 262}" rx="3" fill="url(#fw{uid})" opacity=".85"/>' for x in (200, 270, 476, 546))
                   + f'<rect x="352" y="262" width="96" height="{G - 262}" rx="3" fill="#2a1d4a"/><rect x="398" y="262" width="4" height="{G - 262}" fill="#1a1033"/></g>')
        G += 80
    else:
        fsz = max(18, min(34, int(400 / max(6, len(name)) * 1.5)))
        floors = 2     # storeys above the ground floor (stays: above the two-storey bay)
        base = (G - 182) if bar else (G - 174)                        # bottom of the sign band
        rows = [base - fsz - 84 - 70 * j for j in range(floors)]            # window tops, above the sign
        top = rows[-1] - 22
        out.append(f'<rect x="{x0}" y="{top}" width="{x1 - x0}" height="{G - top}" fill="{paint}"/><rect x="{x0}" y="{top}" width="{x1 - x0}" height="{G - top}" fill="#1a1033" opacity=".42"/>'
                   f'<rect x="{x0 - 8}" y="{top - 12}" width="{x1 - x0 + 16}" height="14" fill="{paint}"/><rect x="{x0 - 8}" y="{top - 12}" width="{x1 - x0 + 16}" height="14" fill="#1a1033" opacity=".55"/>')
        for y in rows:
            for wx in (205, 300, 440, 535):
                out.append(f'<rect x="{wx}" y="{y}" width="60" height="48" rx="3" fill="{lit()}"/><path d="M{wx + 30} {y} V{y + 48} M{wx} {y + 24} H{wx + 60}" stroke="#2a1d4a" stroke-width="3"/>')
        if not bar:   # two-storey canted bay on the left, door with fanlight on the right
            out.append(f'<path d="M190 {G} V{G - 150} L210 {G - 166} H350 L370 {G - 150} V{G}Z" fill="{paint}"/><path d="M190 {G} V{G - 150} L210 {G - 166} H350 L370 {G - 150} V{G}Z" fill="#1a1033" opacity=".3"/>')
            for yy in (G - 148, G - 74):
                out.append(f'<rect x="206" y="{yy}" width="44" height="54" rx="2" fill="{lit()}"/><rect x="258" y="{yy}" width="44" height="54" rx="2" fill="{lit()}"/><rect x="310" y="{yy}" width="44" height="54" rx="2" fill="{lit()}"/>')
            out.append(f'<rect x="452" y="{G - 96}" width="70" height="96" rx="4" fill="{trim}"/><path d="M452 {G - 96} a35 30 0 0 1 70 0z" fill="{lit()}"/><circle cx="508" cy="{G - 46}" r="3.4" fill="#ffc93c"/>'
                       f'<path d="M444 {G} h86 v-6 h-86z M436 {G + 6} h102 v-6 h-102z" fill="#cfc4dc"/>')
        else:          # glowing shopfront with dancing silhouettes and a striped awning
            out.append(f'<rect x="{x0}" y="{G - 108}" width="{x1 - x0}" height="108" fill="#1a1033"/>')
            out.append(f'<rect x="190" y="{G - 92}" width="170" height="80" rx="4" fill="{"#2a2440" if closed else "url(#fw" + uid + ")"}"/><rect x="440" y="{G - 92}" width="170" height="80" rx="4" fill="{"#2a2440" if closed else "url(#fw" + uid + ")"}"/>')
            if not closed:
                for bx in (205, 252, 300, 455, 505, 560):
                    hh = R.randint(34, 46)
                    out.append(f'<g fill="#1a1033" opacity=".55"><circle cx="{bx + 10}" cy="{G - 12 - hh}" r="6"/><path d="M{bx} {G - 12} q0 -{hh - 6} 10 -{hh - 6} q10 0 10 {hh - 6}z"/>'
                               f'<path d="M{bx + 2} {G - 30 - hh // 2} l-8 -{hh // 2}" stroke="#1a1033" stroke-width="4" stroke-linecap="round"/></g>')
                out.append(f'<circle cx="275" cy="{G - 82}" r="7" fill="#fff" opacity=".7"/><circle cx="525" cy="{G - 82}" r="7" fill="#fff" opacity=".7"/>')
            else:
                out.append(f'<text x="275" y="{G - 46}" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="16" fill="#8f86a8">CLOSED</text>'
                           f'<text x="525" y="{G - 46}" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="16" fill="#8f86a8">CLOSED</text>')
            out.append(f'<rect x="372" y="{G - 92}" width="56" height="92" rx="3" fill="{trim}" opacity="{.45 if closed else 1}"/><rect x="398" y="{G - 92}" width="4" height="92" fill="#1a1033"/>')
            out.append(''.join(f'<path d="M{x} {G - 116} h28 l-4 18 h-28z" fill="{trim if i % 2 else "#fff6ec"}" opacity="{.5 if closed else .95}"/>' for i, x in enumerate(range(186, 612, 28))))
        # name sign over the ground floor
        sy = base - 12
        fs = fsz
        out.append(f'<rect x="{x0 + 20}" y="{sy - fs - 4}" width="{x1 - x0 - 40}" height="{fs + 22}" rx="8" fill="#1a1033" stroke="{neon}" stroke-width="2.4" opacity=".96"/>'
                   f'<text x="400" y="{sy + 6}" text-anchor="middle" font-family="\'Bricolage Grotesque\',system-ui,sans-serif" font-weight="800" font-size="{fs}" fill="{neon}"{"" if closed else f" filter=\"url(#fg{uid})\""}>{_e(name)}</text>')
        if not closed:   # rainbow flag on a pole
            fy = top + 30
            out.append(f'<path d="M{x1 - 30} {fy} l40 -26" stroke="#cfc4dc" stroke-width="3"/>'
                       + ''.join(f'<path d="M{x1 + 8} {fy - 24 + i * 5} l38 6 v5 l-38 -6z" fill="{c}"/>' for i, c in enumerate(['#ff2d55', '#ff9f1c', '#ffe45e', '#2ee59d', '#2fb8ff', '#b56bff'])))
    # pavement, kerb, lamp
    out.append(f'<rect y="{G}" width="{W}" height="{H - G}" fill="#241640"/><rect y="{G + 22}" width="{W}" height="4" fill="#ff9fc9" opacity=".25"/>'
               f'<path d="M110 {G} V{G - 170} q0 -14 14 -14 h14" stroke="#2a1d4a" stroke-width="6" fill="none"/><circle cx="140" cy="{G - 180}" r="9" fill="#ffd88a"/><circle cx="140" cy="{G - 180}" r="28" fill="#ffd88a" opacity=".16"/>')
    out.append('</svg>')
    return ''.join(out)
