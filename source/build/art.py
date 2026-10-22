"""Hand-built SVG illustrations for Blackpool.gay: the pink soft-top with Jay and Theo, the sunset Promenade hero,
the 3D promo strip and the 404 scene. Pure SVG + CSS animation (classes are animated in site.css)."""
import math, random

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
            '<g class="carbob">'
            + (f'<path class="beam" d="M258 56 L560 6 L560 128 Z" fill="url(#{p}bm)"/>' if beam else '') +
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
            + wheel(60) + wheel(200) + '</g>')


def skyline(p='s', ground=738, fill='#24113f', glow='#ffa36b', lights=True, seed=11):
    """Blackpool skyline in one silhouette layer, 1600 units wide, standing on y=ground.
    Landmarks (left to right): Central Pier big wheel, seafront arcades, church spires, Winter Gardens dome,
    Tower Buildings with corner turrets and the Tower, the Big One rollercoaster. Returns (defs, body)."""
    rnd = random.Random(seed)
    G = ground
    S, W = [], []                                          # silhouette shapes, lit windows
    def block(x, w, h, win=True):
        S.append(f'<rect x="{x}" y="{G - h}" width="{w}" height="{h + 2}"/>')
        if win and lights:
            for wy in range(G - h + 12, G - 14, 19):
                for wx in range(x + 6, x + w - 8, 13):
                    if rnd.random() < .34: W.append(f'<rect class="{"twinkle" if rnd.random() < .18 else ""}" x="{wx}" y="{wy}" width="5" height="8" rx="1" fill="{rnd.choice(["#ffd88a", "#ffc36b", "#ffb3da", "#fff1c9"])}"/>')
    # seafront blocks, left
    x = -170
    for w, h in [(48, 70), (60, 50), (44, 88), (70, 54), (46, 78), (60, 44), (52, 92), (38, 60), (64, 70)]:
        block(x, w, h); x += w + 2
    S.append('<path d="M60 684 q20 -26 40 0z M150 660 q14 -18 28 0z"/>')       # little arcade domes
    # Central Pier big wheel (rotates)
    cx, cy, r = 300, G - 132, 104
    S.append(f'<path d="M{cx - 70} {G} L{cx} {cy} L{cx + 70} {G}" fill="none" stroke="{fill}" stroke-width="9" stroke-linejoin="round"/>')
    wheel = [f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{fill}" stroke-width="5"/>', f'<circle cx="{cx}" cy="{cy}" r="{r - 9}" fill="none" stroke="{fill}" stroke-width="1.6"/>']
    for i in range(18):
        a = i * math.pi / 9
        wheel.append(f'<path d="M{cx} {cy} L{cx + r * math.cos(a):.1f} {cy + r * math.sin(a):.1f}" stroke="{fill}" stroke-width="1.6"/>')
        wheel.append(f'<rect x="{cx + (r + 6) * math.cos(a) - 6:.1f}" y="{cy + (r + 6) * math.sin(a) - 5:.1f}" width="12" height="10" rx="3" fill="{fill}"/>')
        if lights: wheel.append(f'<circle class="bulb" cx="{cx + r * math.cos(a + .17):.1f}" cy="{cy + r * math.sin(a + .17):.1f}" r="2.4" fill="{BULBS[i % 6]}"/>')
    wheel.append(f'<circle cx="{cx}" cy="{cy}" r="11" fill="{fill}"/>')
    x = 420
    for w, h in [(54, 66), (40, 50), (62, 84), (44, 58)]:
        block(x, w, h); x += w + 2
    # church spires
    for sx, sh in [(640, 168), (690, 132)]:
        S.append(f'<rect x="{sx - 14}" y="{G - sh + 60}" width="28" height="{sh - 58}"/><path d="M{sx - 16} {G - sh + 62} L{sx} {G - sh} L{sx + 16} {G - sh + 62}Z"/><path d="M{sx} {G - sh} v-14" stroke="{fill}" stroke-width="2"/>')
    block(612, 110, 52)
    # Winter Gardens dome
    block(730, 120, 74); S.append(f'<path d="M754 {G - 74} a36 36 0 0 1 72 0z"/><rect x="783" y="{G - 122}" width="14" height="14"/><path d="M781 {G - 122} l9 -12 l9 12z"/>')
    if lights: W.append(f'<path d="M760 {G - 76} a30 30 0 0 1 60 0" fill="none" stroke="#ffd88a" stroke-width="2" stroke-dasharray="3 5" class="twinkle"/>')
    block(852, 26, 60)
    # Tower Buildings with turrets
    bx0, bx1, bt = 880, 1180, G - 112
    S.append(f'<rect x="{bx0}" y="{bt}" width="{bx1 - bx0}" height="{G - bt + 2}"/>')
    S.append(''.join(f'<rect x="{x0}" y="{bt - 8}" width="10" height="9"/>' for x0 in range(bx0 + 4, bx1 - 8, 18)))  # parapet
    for tx in (bx0 + 12, bx0 + 64, bx1 - 64, bx1 - 12):
        S.append(f'<rect x="{tx - 12}" y="{bt - 40}" width="24" height="42"/><path d="M{tx - 14} {bt - 38} Q{tx - 12} {bt - 66} {tx} {bt - 84} Q{tx + 12} {bt - 66} {tx + 14} {bt - 38}Z"/><path d="M{tx} {bt - 84} v-12" stroke="{fill}" stroke-width="2"/>')
    if lights:
        for row in (bt + 22, bt + 58):
            for wx in range(bx0 + 14, bx1 - 14, 16):
                W.append(f'<path class="{"twinkle" if rnd.random() < .2 else ""}" d="M{wx} {row + 16} v-10 a4 4 0 0 1 8 0 v10z" fill="{rnd.choice(["#ffd88a", "#ffc36b", "#fff1c9"])}"/>')
    # the Tower: curved iron legs, X-bracing, balcony deck, crown, crow's nest, mast, flag
    tc, tb_, tt = (bx0 + bx1) / 2, bt, G - 540
    half = lambda y: 15 + 47 * ((y - tt) / (tb_ - tt)) ** 1.8
    T = []
    legL = [(tc - half(y), y) for y in range(int(tt), int(tb_) + 1, 6)]
    legR = [(tc + half(y), y) for y in range(int(tt), int(tb_) + 1, 6)]
    pl = lambda pts: ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    T.append(f'<polyline points="{pl(legL)}" fill="none" stroke="{fill}" stroke-width="5.5"/><polyline points="{pl(legR)}" fill="none" stroke="{fill}" stroke-width="5.5"/>')
    ys = [tt + (tb_ - tt) * (i / 16) ** 1.2 for i in range(17)]
    for y0, y1 in zip(ys, ys[1:]):
        T.append(f'<path d="M{tc - half(y0):.1f} {y0:.1f} L{tc + half(y1):.1f} {y1:.1f} M{tc + half(y0):.1f} {y0:.1f} L{tc - half(y1):.1f} {y1:.1f} M{tc - half(y1):.1f} {y1:.1f} H{tc + half(y1):.1f}" stroke="{fill}" stroke-width="1.6"/>')
    T.append(f'<path d="M{tc - half(tb_ - 30):.1f} {tb_} Q{tc} {tb_ - 64} {tc + half(tb_ - 30):.1f} {tb_}" fill="none" stroke="{fill}" stroke-width="4"/>')
    d = tt
    T.append(f'<rect x="{tc - 30}" y="{d - 14}" width="60" height="16" rx="2"/><rect x="{tc - 34}" y="{d - 18}" width="68" height="6" rx="2"/>'
             f'<rect x="{tc - 21}" y="{d - 48}" width="42" height="32"/><rect x="{tc - 25}" y="{d - 52}" width="50" height="6" rx="2"/>'
             f'<path d="M{tc - 21} {d - 52} L{tc} {d - 90} L{tc + 21} {d - 52}Z"/><rect x="{tc - 7}" y="{d - 108}" width="14" height="20"/><path d="M{tc - 9} {d - 108} L{tc} {d - 121} L{tc + 9} {d - 108}Z"/>'
             f'<path d="M{tc} {d - 121} V{d - 168}" stroke="{fill}" stroke-width="3"/>')
    led = ''
    if lights:
        leds = (f'<polyline points="{pl(legL)}"/><polyline points="{pl(legR)}"/><path d="M{tc - 34} {d - 12} H{tc + 34} M{tc - 25} {d - 50} H{tc + 25} M{tc - 21} {d - 18} V{d - 48} M{tc + 21} {d - 18} V{d - 48}"/>')
        heart = f'M{tc} {tb_ - 36} C{tc - 30} {tb_ - 56} {tc - 20} {tb_ - 80} {tc} {tb_ - 66} C{tc + 20} {tb_ - 80} {tc + 30} {tb_ - 56} {tc} {tb_ - 36}Z'
        led = (f'<g fill="none" stroke="url(#{p}led)" stroke-linecap="round"><g stroke-width="9" opacity=".45" filter="url(#{p}soft)">{leds}</g><g stroke-width="2.6">{leds}</g></g>'
               f'<g fill="none" stroke-linecap="round"><path d="M{tc - 21} {d - 52} L{tc} {d - 90} L{tc + 21} {d - 52}" stroke="#5dff9b" stroke-width="8" opacity=".35" filter="url(#{p}soft)"/><path d="M{tc - 21} {d - 52} L{tc} {d - 90} L{tc + 21} {d - 52}" stroke="#5dff9b" stroke-width="2.6"/><path d="M{tc - 7} {d - 106} h14 M{tc} {d - 121} V{d - 166}" stroke="#ffe45e" stroke-width="2.4"/></g>'
               + ''.join(f'<rect x="{tc - 17 + i * 7}" y="{d - 42}" width="4" height="16" rx="1" fill="#{c}"/>' for i, c in enumerate(['7df9ff', 'ffe45e', 'ff8bd1', '7df9ff', 'ffe45e']))
               + f'<g class="heartbeat" style="transform-origin:{tc}px {tb_ - 56}px"><path d="{heart}" fill="none" stroke="#ff5fd2" stroke-width="7" opacity=".45" filter="url(#{p}soft)"/><path d="{heart}" fill="#7a1fa8" stroke="#ff8be0" stroke-width="2.4"/></g>')
    flag = f'<g class="flagw">' + ''.join(f'<rect x="{tc + 1}" y="{d - 168 + i * 4}" width="32" height="4" fill="{c}"/>' for i, c in enumerate(RAINBOW)) + '</g>'
    S.append(''.join(T))
    # blocks right of the Tower
    x = 1184
    for w, h in [(44, 86), (58, 62), (40, 100)]:
        block(x, w, h); x += w + 2
    # the Big One rollercoaster
    keys = [(1300, G - 18), (1392, G - 330), (1446, G - 24), (1500, G - 190), (1548, G - 40), (1590, G - 140), (1660, G - 60)]
    def ty(x):
        for (x0, y0), (x1, y1) in zip(keys, keys[1:]):
            if x0 <= x <= x1:
                t = (x - x0) / (x1 - x0)
                if y1 < y0: t = t ** .9
                return y0 + (y1 - y0) * (1 - math.cos(t * math.pi)) / 2
        return keys[-1][1]
    xs = list(range(1300, 1661, 4))
    track = 'M' + ' L'.join(f'{x} {ty(x):.1f}' for x in xs)
    C = [f'<path d="{track}" fill="none" stroke="{fill}" stroke-width="6" stroke-linejoin="round"/>',
         f'<path d="{track}" transform="translate(0 7)" fill="none" stroke="{fill}" stroke-width="2.4"/>']
    sup = list(range(1304, 1660, 13))
    for i, x in enumerate(sup):
        C.append(f'<path d="M{x} {ty(x) + 6:.1f} V{G}" stroke="{fill}" stroke-width="2"/>')
        if i: C.append(f'<path d="M{sup[i - 1]} {ty(sup[i - 1]) + 10:.1f} L{x} {G} M{sup[i - 1]} {G} L{x} {ty(x) + 10:.1f}" stroke="{fill}" stroke-width=".9" opacity=".8"/>')
    train = ''
    if lights:
        train = (f'<g><rect x="-22" y="-9" width="44" height="9" rx="3" fill="#ff3d9a"/><rect x="-20" y="-14" width="8" height="5" rx="2" fill="#ffd88a"/><rect x="-6" y="-14" width="8" height="5" rx="2" fill="#ffd88a"/><rect x="8" y="-14" width="8" height="5" rx="2" fill="#ffd88a"/>'
                 f'<animateMotion dur="11s" repeatCount="indefinite" rotate="auto" path="{track}"/></g>')
    S.append(''.join(C))
    sil = f'<g fill="{fill}" filter="url(#{p}g)">' + ''.join(S) + '</g>'
    defs = (f'<filter id="{p}g" x="-4%" y="-12%" width="108%" height="124%"><feGaussianBlur in="SourceAlpha" stdDeviation="4.5" result="b"/>'
            f'<feFlood flood-color="{glow}" flood-opacity=".85"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
            f'<filter id="{p}soft" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="3.5"/></filter>'
            f'<linearGradient id="{p}led" gradientUnits="userSpaceOnUse" x1="0" y1="{tt}" x2="0" y2="{tt + 220}" spreadMethod="repeat">' + ''.join(f'<stop offset="{i / 6:.3f}" stop-color="{c}"/>' for i, c in enumerate(['#ff2d55', '#ff9f1c', '#ffe45e', '#2ee59d', '#2fb8ff', '#b56bff', '#ff2d55']))
            + (f'<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="0 -220" dur="5s" repeatCount="indefinite"/>' if lights else '') + '</linearGradient>')
    body = (sil + f'<g filter="url(#{p}g)"><g class="spinslow" style="transform-origin:{cx}px {cy}px">' + ''.join(wheel) + '</g></g>'
            + ''.join(W) + led + flag + train)
    return defs, body


def lamps_row(y_top, step, n, sag, bulb_r, post_w, ground, k0=0):
    out = []
    for k in range(n):
        x = k * step
        out.append(f'<rect x="{x - post_w / 2}" y="{y_top + 4}" width="{post_w}" height="{ground - y_top - 4}" rx="{post_w / 2}" fill="#1a0e30"/>'
                   f'<path d="M{x - 9} {y_top + 6} h18" stroke="#1a0e30" stroke-width="3" stroke-linecap="round"/><circle cx="{x}" cy="{y_top}" r="{post_w * 1.4:.1f}" fill="#fff4d0"/><circle cx="{x}" cy="{y_top}" r="{post_w * 3.6:.1f}" fill="#fff4d0" opacity=".16"/>')
        out.append(f'<path d="M{x} {y_top + 10} Q{x + step / 2} {y_top + 10 + sag * 2} {x + step} {y_top + 10}" fill="none" stroke="#1a0e30" stroke-width="1.4"/>')
        pts = [(x + t * step, y_top + 10 + math.sin(t * math.pi) * sag) for t in [i / 12 for i in range(1, 12)]]
        out.extend(f'<circle class="bulb" cx="{px:.1f}" cy="{py:.1f}" r="{bulb_r}" fill="{BULBS[(i + k + k0) % 6]}"/>' for i, (px, py) in enumerate(pts))
    return ''.join(out)


def hero_svg():
    rnd = random.Random(7)
    stars = ''.join(f'<circle class="twinkle" cx="{rnd.randint(0, 1600)}" cy="{rnd.randint(0, 300)}" r="{rnd.choice([1, 1.2, 1.5, 2])}" fill="#fff" opacity="{rnd.choice([.5, .7, .9])}"/>' for _ in range(70))
    sdefs, sbody = skyline('hs', ground=742)
    dashes = ''.join(f'<rect x="{x}" y="800" width="42" height="5" rx="2.5" fill="#f6e9ff" opacity=".7"/>' for x in range(0, 1760, 80))
    return ('<svg class="scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">'
            '<defs><linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120a36"/><stop offset=".34" stop-color="#3d1d78"/><stop offset=".6" stop-color="#b03a8e"/><stop offset=".76" stop-color="#ff7a74"/><stop offset=".84" stop-color="#ffb784"/></linearGradient>'
            '<radialGradient id="hglow" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#ffd7a0" stop-opacity=".85"/><stop offset=".5" stop-color="#ff8f7a" stop-opacity=".35"/><stop offset="1" stop-color="#ff8f7a" stop-opacity="0"/></radialGradient>'
            '<linearGradient id="hroad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1749"/><stop offset="1" stop-color="#140a26"/></linearGradient>'
            '<filter id="hblur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>' + sdefs + '</defs>'
            '<rect width="1600" height="900" fill="url(#hsky)"/>' + f'<g>{stars}</g>'
            '<g class="par" data-d="6"><ellipse cx="520" cy="230" rx="260" ry="34" fill="#ff9ec4" opacity=".26" filter="url(#hblur)"/><ellipse cx="1340" cy="170" rx="300" ry="40" fill="#c78bff" opacity=".24" filter="url(#hblur)"/><ellipse cx="260" cy="430" rx="220" ry="26" fill="#ffc0a0" opacity=".34" filter="url(#hblur)"/></g>'
            '<ellipse cx="900" cy="760" rx="1000" ry="330" fill="url(#hglow)"/>'
            f'<g class="par" data-d="12"><g transform="translate(105 0)">{sbody}</g></g>'
            '<rect y="740" width="1600" height="16" fill="#341d5c"/><rect y="752" width="1600" height="4" fill="#ff9fc9" opacity=".35"/>'
            '<rect y="756" width="1600" height="150" fill="url(#hroad)"/>'
            '<path d="M0 846 H1600 M0 858 H1600" stroke="#5b4380" stroke-width="2.4" opacity=".75"/>'
            f'<g class="dash">{dashes}</g>'
            f'<g class="lamps">{lamps_row(606, 240, 9, 34, 4.4, 6, 752)}</g>'
            f'<g transform="translate(610 682) scale(1.12)">{car("h")}</g>'
            '</svg>')


SCENE_CSS = ('.twinkle{animation:tw 3s ease-in-out infinite}.twinkle:nth-child(3n){animation-delay:-1s}@keyframes tw{50%{opacity:.25}}'
             '.lamps{animation:lm 2.2s linear infinite}@keyframes lm{to{transform:translateX(-160px)}}.dash{animation:dm .65s linear infinite}@keyframes dm{to{transform:translateX(-80px)}}'
             '.bulb{animation:bb 1.2s steps(1) infinite}.bulb:nth-child(4n+1){animation-delay:-.3s}.bulb:nth-child(4n+2){animation-delay:-.6s}.bulb:nth-child(4n+3){animation-delay:-.9s}@keyframes bb{50%{opacity:.35}}'
             '.carbob{animation:cb .42s ease-in-out infinite alternate}@keyframes cb{to{transform:translateY(-2.5px)}}'
             '.wheel{animation:sp .5s linear infinite;transform-box:fill-box;transform-origin:center}.spinslow{animation:sp 48s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}'
             '.wave{animation:wv .7s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:10% 95%}@keyframes wv{from{transform:rotate(-18deg)}to{transform:rotate(14deg)}}'
             '.flagw{animation:fl 1.4s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:0 50%}@keyframes fl{to{transform:skewY(-8deg) scaleX(.92)}}'
             '.beam{animation:bm 4s ease-in-out infinite alternate}@keyframes bm{to{opacity:.55}}'
             '.heartbeat{animation:hb 1.6s ease-in-out infinite}@keyframes hb{0%,100%{transform:scale(1)}15%{transform:scale(1.14)}30%{transform:scale(.98)}45%{transform:scale(1.08)}}'
             '@media(prefers-reduced-motion:reduce){*{animation:none!important}}')


def promo_svg():
    """Standalone animated SVG file (served once, cached): skyline with the LED Tower, festoons, and the car."""
    sdefs, sbody = skyline('ps', ground=742, seed=5)
    lamps = lamps_row(40, 160, 6, 20, 3.4, 4, 150)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 220"><style>' + SCENE_CSS + '</style><defs>' + sdefs + '</defs>'
            '<rect width="560" height="160" fill="#3a1a6e" opacity="0"/>'
            '<g transform="translate(-150 -146) scale(.44)">' + sbody + '</g>'
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
