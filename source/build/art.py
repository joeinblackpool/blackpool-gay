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


def hero_svg():
    random.seed(7)
    stars = ''.join(f'<circle class="twinkle" cx="{random.randint(0, 1600)}" cy="{random.randint(0, 330)}" r="{random.choice([1, 1.2, 1.5, 2])}" fill="#fff" opacity="{random.choice([.5, .7, .9])}"/>' for _ in range(70))
    # skyline (right), windows twinkle
    sky = []
    x = 760
    while x < 1640:
        w = random.randint(46, 96); h = random.randint(60, 170)
        if 1100 < x < 1260: x += w; continue  # leave room for the Tower
        sky.append(f'<rect x="{x}" y="{705 - h}" width="{w}" height="{h + 10}" fill="#2a1550"/>')
        for wy in range(705 - h + 14, 690, 22):
            for wx in range(x + 8, x + w - 10, 16):
                if random.random() < .38: sky.append(f'<rect class="{"twinkle" if random.random() < .15 else ""}" x="{wx}" y="{wy}" width="7" height="9" rx="1" fill="{random.choice(["#ffd88a", "#ffc36b", "#ffb3da"])}"/>')
        x += w + random.randint(0, 6)
    # Tower lattice
    T = []
    base, top = 705, 300
    L = lambda y: 1180 - (60 - 40 * ((base - y) / (base - top)) ** .85)
    Rr = lambda y: 1180 + (60 - 40 * ((base - y) / (base - top)) ** .85)
    T.append(f'<path d="M{L(base):.1f} {base} L{L(top):.1f} {top} L{Rr(top):.1f} {top} L{Rr(base):.1f} {base}" fill="none" stroke="#a42c4b" stroke-width="7" stroke-linejoin="round"/>')
    ys = [base - i * (base - top) / 14 for i in range(15)]
    for y0, y1 in zip(ys, ys[1:]):
        T.append(f'<path d="M{L(y0):.1f} {y0:.1f} L{Rr(y1):.1f} {y1:.1f} M{Rr(y0):.1f} {y0:.1f} L{L(y1):.1f} {y1:.1f} M{L(y1):.1f} {y1:.1f} L{Rr(y1):.1f} {y1:.1f}" stroke="#a42c4b" stroke-width="2.2"/>')
    T.append(f'<path d="M{L(base):.1f} {base} Q1180 {base - 70} {Rr(base):.1f} {base}" fill="none" stroke="#a42c4b" stroke-width="5"/>')
    T.append('<rect x="1154" y="262" width="52" height="40" rx="3" fill="#f2e9df"/><rect x="1158" y="270" width="44" height="7" fill="#ffd88a"/><rect x="1158" y="285" width="44" height="7" fill="#ffd88a" opacity=".8"/>')
    T.append('<path d="M1156 263 L1180 205 L1204 263Z" fill="#a42c4b"/><rect x="1172" y="188" width="16" height="18" rx="2" fill="#f2e9df"/><path d="M1170 189 L1180 172 L1190 189Z" fill="#a42c4b"/><path d="M1180 172 V128" stroke="#a42c4b" stroke-width="3"/>')
    T.append('<g class="flagw">' + ''.join(f'<rect x="1181" y="{130 + i * 4}" width="34" height="4" fill="{c}"/>' for i, c in enumerate(RAINBOW)) + '</g>')
    tb = ''.join(f'<circle class="bulb" cx="{(L(y) if s < 0 else Rr(y)) + s * 3:.1f}" cy="{y:.1f}" r="2.6" fill="{BULBS[i % 6]}"/>' for s in (-1, 1) for i, y in enumerate(range(base - 10, top, -18)))
    # pier (left)
    pier = '<rect x="110" y="668" width="520" height="7" rx="2" fill="#3a1f58"/>' + ''.join(f'<rect x="{x}" y="675" width="5" height="40" fill="#2a1546"/>' for x in range(120, 630, 26))
    pier += '<path d="M150 668 L150 640 L176 624 L202 640 L202 668Z M420 668 L420 646 L452 628 L484 646 L484 668Z" fill="#3a1f58"/>' + ''.join(f'<circle class="bulb" cx="{x}" cy="664" r="2.4" fill="{BULBS[i % 6]}"/>' for i, x in enumerate(range(116, 630, 18)))
    # promenade lamps + festoons (repeat every 240 px; the group slides left for motion)
    lamps = []
    for k in range(9):
        x = k * 240
        lamps.append(f'<rect x="{x - 3}" y="606" width="6" height="146" rx="3" fill="#1f1236"/><circle cx="{x}" cy="602" r="9" fill="#fff4d0"/><circle cx="{x}" cy="602" r="22" fill="#fff4d0" opacity=".18"/>')
        pts = [(x + t * 240, 612 + math.sin(t * math.pi) * 34) for t in [i / 12 for i in range(1, 12)]]
        lamps.append(f'<path d="M{x} 612 Q{x + 120} 680 {x + 240} 612" fill="none" stroke="#1f1236" stroke-width="1.6"/>')
        lamps.extend(f'<circle class="bulb" cx="{px:.1f}" cy="{py:.1f}" r="4.4" fill="{BULBS[(i + k) % 6]}"/>' for i, (px, py) in enumerate(pts))
    dashes = ''.join(f'<rect x="{x}" y="806" width="42" height="5" rx="2.5" fill="#f6e9ff" opacity=".7"/>' for x in range(0, 1760, 80))
    shimmer = ''.join(f'<rect x="{random.randint(0, 1800)}" y="{random.randint(690, 760)}" width="{random.randint(20, 90)}" height="2" rx="1" fill="#ffd1b3" opacity="{random.choice([.25, .4, .6])}"/>' for _ in range(40))
    return ('<svg class="scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">'
            '<defs><linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120a36"/><stop offset=".32" stop-color="#3d1d78"/><stop offset=".56" stop-color="#a8358f"/><stop offset=".72" stop-color="#ff6f7d"/><stop offset=".8" stop-color="#ffb184"/></linearGradient>'
            '<radialGradient id="hsun"><stop offset="0" stop-color="#fff6d5"/><stop offset=".35" stop-color="#ffd08a"/><stop offset=".6" stop-color="#ff8f6b" stop-opacity=".55"/><stop offset="1" stop-color="#ff6f7d" stop-opacity="0"/></radialGradient>'
            '<linearGradient id="hsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8f7a"/><stop offset=".25" stop-color="#9b3a8c"/><stop offset="1" stop-color="#2a1160"/></linearGradient>'
            '<linearGradient id="hroad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1749"/><stop offset="1" stop-color="#170c2c"/></linearGradient>'
            '<filter id="hblur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="14"/></filter></defs>'
            '<rect width="1600" height="900" fill="url(#hsky)"/>' + f'<g>{stars}</g>'
            '<g class="par" data-d="6"><ellipse cx="560" cy="250" rx="260" ry="36" fill="#ff9ec4" opacity=".28" filter="url(#hblur)"/><ellipse cx="1320" cy="180" rx="300" ry="40" fill="#c78bff" opacity=".25" filter="url(#hblur)"/><ellipse cx="300" cy="420" rx="220" ry="26" fill="#ffc0a0" opacity=".35" filter="url(#hblur)"/></g>'
            '<g class="par" data-d="10"><circle cx="400" cy="676" r="330" fill="url(#hsun)" opacity=".85"/><circle cx="400" cy="676" r="92" fill="#fff1c9"/></g>'
            '<rect y="676" width="1600" height="230" fill="url(#hsea)"/>'
            '<g opacity=".8"><rect x="340" y="680" width="120" height="3" rx="1.5" fill="#fff1c9"/><rect x="310" y="692" width="180" height="3" rx="1.5" fill="#ffd8a6" opacity=".8"/><rect x="350" y="706" width="100" height="3" rx="1.5" fill="#ffd8a6" opacity=".6"/><rect x="290" y="722" width="220" height="2" rx="1" fill="#ffd8a6" opacity=".35"/></g>'
            f'<g class="shimmer">{shimmer}</g>'
            f'<g class="par" data-d="14">{pier}</g>'
            '<g class="par" data-d="18">' + ''.join(sky) + ''.join(T) + tb + '</g>'
            '<rect y="738" width="1600" height="18" fill="#3a2263"/><rect y="752" width="1600" height="4" fill="#ff9fc9" opacity=".35"/>'
            '<rect y="756" width="1600" height="150" fill="url(#hroad)"/>'
            f'<g class="dash">{dashes}</g>'
            f'<g class="lamps">{"".join(lamps)}</g>'
            f'<g transform="translate(610 688) scale(1.12)">{car("h")}</g>'
            '</svg>')


def promo_svg():
    """Compact Promenade strip with the car, for the 'drive in 3D' promo cards."""
    lamps = ''.join(f'<rect x="{x - 2}" y="40" width="4" height="96" rx="2" fill="#1f1236"/><circle cx="{x}" cy="38" r="6" fill="#fff4d0"/>'
                    + f'<path d="M{x} 44 Q{x + 80} 84 {x + 160} 44" fill="none" stroke="#1f1236" stroke-width="1.4"/>'
                    + ''.join(f'<circle class="bulb" cx="{x + t * 160:.1f}" cy="{44 + math.sin(t * math.pi) * 20:.1f}" r="3.4" fill="{BULBS[(i + k) % 6]}"/>' for i, t in enumerate([j / 8 for j in range(1, 8)]))
                    for k, x in enumerate(range(0, 800, 160)))
    return ('<svg class="scene" viewBox="0 0 560 220" aria-hidden="true" focusable="false"><rect y="150" width="560" height="70" fill="#170c2c"/>'
            '<g class="dash">' + ''.join(f'<rect x="{x}" y="186" width="30" height="4" rx="2" fill="#f6e9ff" opacity=".6"/>' for x in range(0, 700, 80)) + '</g>'
            f'<g class="lamps">{lamps}</g><g transform="translate(150 84) scale(.78)">{car("p", beam=True)}</g></svg>')


def lost_svg():
    return ('<svg viewBox="-40 -60 640 260" role="img" aria-label="The pink soft-top with Jay and Theo, parked and looking lost">'
            '<path d="M-40 184 H600" stroke="#eadff2" stroke-width="4"/><g transform="translate(140 60)">' + car('l', beam=False) + '</g>'
            '<g transform="translate(470 40)"><rect x="-4" y="0" width="8" height="144" rx="4" fill="#2a1d4a"/><path d="M-60 6 H40 L58 26 L40 46 H-60Z" fill="#ff3d9a"/>'
            '<text x="-8" y="33" text-anchor="middle" font-size="19" font-weight="800" fill="#fff" font-family="system-ui,sans-serif">This way?</text></g></svg>')
