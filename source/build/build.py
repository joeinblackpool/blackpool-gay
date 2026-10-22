#!/usr/bin/env python3
"""Build blackpool.gay into one Cloudflare Worker (src/index.js).
Data: source/data/*.json (facts from the owner's rainbowquarter data + verified research; copy written fresh for this site).
"""
import json, re, html, os, glob, datetime, hashlib, base64, math
import art  # SVG illustrations (same folder)
B = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(B, '..', 'data'); ROOT = os.path.join(B, '..', '..')
SITE = 'https://blackpool.gay'; NAME = 'Blackpool.gay'
TODAY = datetime.date.today().isoformat(); UPDATED = datetime.date.today().strftime('%-d %B %Y')
E = lambda s: html.escape(str(s), quote=True)
J = lambda f, d=None: json.load(open(os.path.join(D, f))) if os.path.exists(os.path.join(D, f)) else d

VEN = [v for v in J('venues.json') if 'closed' not in v['kind'].lower()]
VBY = {v['slug']: v for v in VEN}
EXTRA = [x for x in J('more-stays.json', []) if x.get('status') == 'open']
POST = J('postcodes.json', {})
WALK = J('walk.json', {})
EVENTS = J('events.json', [])
STAYS = J('copy-stays.json', {})
TYPES = J('copy-types-plan.json', {})
NIGHT = J('copy-nightlife.json', {})
CORE = J('copy-core.json', {})
def _norm(d):
    for v in (d.values() if isinstance(d, dict) else []):
        if isinstance(v, dict):
            if 'body' in v and 'body_html' not in v: v['body_html'] = v['body']
            _norm(v)
for _d in (STAYS, TYPES, NIGHT, CORE): _norm(_d)
CARDS = NIGHT.get('cards', {})
BLURB = NIGHT.get('event_blurbs', {})

# extra stays found by research: place them using the owner's postcode file
def pc_geo(pc):
    g = POST.get((pc or '').upper().strip())
    return [g[0], g[1]] if isinstance(g, (list, tuple)) and len(g) >= 2 else (g and [g.get('lat'), g.get('lng') or g.get('lon')])
for x in EXTRA:
    if x['slug'] in VBY: continue
    g = pc_geo(x.get('postcode'))
    if not g or not g[0]: continue
    VBY[x['slug']] = {'slug': x['slug'], 'name': x['name'], 'section': 'hotels', 'kind': {'men-only': 'Men-only hotel', 'adults-only': 'Adults-only guest house'}.get(x.get('policy'), 'LGBTQ+-friendly stay'),
                      'address': x['address'], 'postcode': x['postcode'], 'geo': g, 'phone': x.get('phone'), 'website': x.get('website'), 'price': x.get('price'), 'tags': x.get('features', []), 'extra': x}
STAY_SLUGS = [s for s, v in VBY.items() if v['section'] == 'hotels' or s in ('peek-a-booze', 'mardi-gras', 'trades', 'neon-bar', 'lu-lus-cabaret-lounge')]
BAR_SLUGS = [s for s, v in VBY.items() if v['section'] in ('bars', 'saunas')]

def walk(a, b):
    if a in WALK and b in WALK[a]['to']: return WALK[a]['to'][b]
    va, vb = VBY.get(a), VBY.get(b)
    if not (va and vb and va.get('geo') and vb.get('geo')): return None
    la1, lo1, la2, lo2 = map(math.radians, (*va['geo'], *vb['geo']))
    d = 2 * 6371000 * math.asin(math.sqrt(math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2)) * 1.3
    return max(1, round(d / 80))

def maplinks(v):
    q = E(f"{v['name']}, {v['address']} {v.get('postcode') or ''}".strip())
    lat, lng = v['geo']
    return (f'<div class="mapbtns"><a href="https://www.google.com/maps/search/?api=1&amp;query={lat},{lng}" target="_blank" rel="noopener">Google Maps</a>'
            f'<a href="https://maps.apple.com/?ll={lat},{lng}&amp;q={q}" target="_blank" rel="noopener">Apple Maps</a>'
            f'<a href="https://waze.com/ul?ll={lat},{lng}&amp;navigate=yes" target="_blank" rel="noopener">Waze</a>'
            + (f'<a class="go3d" href="/explore/?to={v["slug"]}">Drive there in 3D</a>' if v.get('slug') else '') + '</div>')

def promo(slug=None, name=None):
    href = f'/explore/?to={slug}' if slug else '/explore/'
    head = f'Drive to {E(name)} in 3D' if name else 'Drive the Rainbow Quarter in 3D'
    sub = ('Hop in the pink soft-top with Jay and Theo and let them drive you there through the real streets.' if name
           else 'Real streets, the Tower, North Pier and the Illuminations. Pick a hotel or bar and the car takes you there.')
    return (f'<a class="promo3d" href="{href}"><div class="pt"><span class="pk">New · 3D Blackpool</span><strong>{head}</strong><span>{sub}</span><br><span class="pg">Start the engine →</span></div><img class="promoimg" src="/assets/promo.svg" width="560" height="220" alt="" loading="lazy" decoding="async"></a>')

def pin(v, kind):
    url = ('/stays/' if kind == 'stay' else '/nightlife/') + v['slug'] + '/'
    lat, lng = v['geo']
    return {'n': v['name'], 'u': url, 'k': kind, 'a': v['address'], 'p': [lat, lng],
            'g': f'https://www.google.com/maps/search/?api=1&query={lat},{lng}', 'ap': f'https://maps.apple.com/?ll={lat},{lng}&q=' + v['name'], 'w': f'https://waze.com/ul?ll={lat},{lng}&navigate=yes'}
ALLPINS = [pin(VBY[s], 'stay') for s in STAY_SLUGS if VBY[s].get('geo')] + [pin(VBY[s], 'bar') for s in BAR_SLUGS if VBY[s].get('geo')]
def mapblock(pins, center=None, zoom=16, h=380):
    data = json.dumps({'pins': pins, 'c': center or [53.8228, -3.0525], 'z': zoom}, separators=(',', ':')).replace('</', '<\\/')
    return f'<div class="map" style="height:{h}px" role="region" aria-label="Map"><script type="application/json" class="mapdata">{data}</script></div><p class="maplegend"><span class="dot stay"></span> Stays <span class="dot bar"></span> Bars and clubs · Map data © OpenStreetMap contributors</p>'

# ---------------------------------------------------------------- page shell
CSS = open(os.path.join(B, 'site.css')).read()
NAV = [('/stays/', 'Where to stay'), ('/nightlife/', 'Nightlife'), ('/open-tonight/', 'Open tonight'), ('/whats-on/', "What's on"), ('/pride/', 'Pride'), ('/forum/', 'Forum'), ('/explore/', 'Drive in 3D')]
BEACON = os.environ.get('CF_BEACON', '')
SECTION = {'stays': ('Where to stay', 'stays'), 'nightlife': ('Nightlife', 'nightlife'), 'open-tonight': ('Open tonight', 'nightlife'), 'whats-on': ("What's on", 'whats-on'),
           'pride': ('Pride', 'whats-on'), 'plan': ('Plan your trip', ''), 'map': ('Map', ''), 'explore': ('Drive in 3D', ''), 'safety': ('Getting home safely', ''), 'about': ('About', ''), 'forum': ('Community', ''), 'cast': ('The cast', ''), '404': ('Lost?', 'stays')}
def phead(path, h1, intro, crumb_html):
    sec = path.strip('/').split('/')[0] if path.strip('/') else ''
    eb, sil = SECTION.get(sec, ('Blackpool.Gay', ''))
    return (f'<header class="phead"><div class="wrap">{crumb_html}<span class="eyebrow">{E(eb)}</span><h1>{E(h1)}</h1>' + (f'<p class="lede">{E(intro)}</p>' if intro else '')
            + f'</div>{art.hub_sil(sil)}</header>')

def shell(path, title, desc, h1, intro, body, crumbs=None, ld=None, noindex=False, wide=False, maps=False, script='', hero=None):
    crumb_html = ''
    if crumbs:
        crumb_html = '<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a>' + ''.join(f' › <a href="{u}">{E(n)}</a>' if u else f' › <span>{E(n)}</span>' for n, u in crumbs) + '</nav>'
    ldnodes = [{'@type': 'Organization', '@id': SITE + '/#org', 'name': NAME, 'url': SITE + '/', 'logo': SITE + '/apple-touch-icon.png', 'email': 'hello@blackpool.gay', 'sameAs': ['https://rainbowquarter.co.uk/']},
               {'@type': 'WebSite', '@id': SITE + '/#website', 'name': NAME, 'url': SITE + '/', 'inLanguage': 'en-GB', 'publisher': {'@id': SITE + '/#org'}}] + (ld or [])
    if crumbs: ldnodes.append({'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'}] + [{'@type': 'ListItem', 'position': i + 2, 'name': n, 'item': SITE + (u or path)} for i, (n, u) in enumerate(crumbs)]})
    if not any(n.get('@type') in ('WebPage', 'Hotel', 'LodgingBusiness', 'BarOrPub', 'NightClub', 'CollectionPage', 'Article', 'Event', 'ItemList') for n in (ld or [])):
        ldnodes.append({'@type': 'WebPage', '@id': SITE + path, 'url': SITE + path, 'name': title, 'description': desc, 'isPartOf': {'@id': SITE + '/#website'}, 'inLanguage': 'en-GB', 'dateModified': TODAY})
    ldtxt = json.dumps({'@context': 'https://schema.org', '@graph': ldnodes}, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    head = (f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{E(title)}</title><meta name="description" content="{E(desc)}">' + ('<meta name="robots" content="noindex">' if noindex else f'<link rel="canonical" href="{SITE}{path}">') +
            f'<meta name="theme-color" content="#750787"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest">'
            f'<meta property="og:type" content="website"><meta property="og:site_name" content="{NAME}"><meta property="og:locale" content="en_GB"><meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}"><meta property="og:url" content="{SITE}{path}"><meta property="og:image" content="{SITE}/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">'
            + ('<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">' if maps else '') +
            f'<style>{CSS}</style><script type="application/ld+json">{ldtxt}</script></head>')
    navh = ''.join(f'<a href="{u}"' + (' aria-current="page"' if path == u or (u != '/' and path.startswith(u)) else '') + (' class="nav3d"' if u == '/explore/' else '') + f'>{n}</a>' for u, n in NAV)
    body_html = (f'<body><a class="skip" href="#main">Skip to content</a><div class="flag" aria-hidden="true"></div><header class="top"><div class="wrap topin"><a class="logo" href="/">Blackpool<b>.gay</b></a><nav class="nav" aria-label="Main">{navh}</nav></div></header>' +
                 (hero or phead(path, h1, intro, crumb_html)) + f'<main id="main" class="wrap{" wide" if wide else ""}">' + body + '</main>'
                 f'<footer class="foot"><div class="wrap"><div class="marq" aria-hidden="true">' + ''.join(f'<span style="--i:{i}">{ch}</span>' for i, ch in enumerate('BLACKPOOL.GAY')) + '</div><div class="fgrid"><div><a class="logo" href="/">Blackpool<b>.gay</b></a><p>Independent stay-first guide to LGBTQ+ Blackpool. Facts checked, never paid placements.</p></div>'
                 f'<div><h2>Stay</h2><a href="/stays/">All stays</a><a href="/stays/men-only-hotels/">Men-only hotels</a><a href="/stays/adults-only-guest-houses/">Adults-only guest houses</a><a href="/stays/near-queen-street/">Near Queen Street</a><a href="/stays/pride-weekend-hotels/">Pride weekend</a><a href="/pride/lord-street/">Lord Street Pride</a></div>'
                 f'<div><h2>Go out</h2><a href="/nightlife/">Nightlife</a><a href="/open-tonight/">Open tonight</a><a href="/whats-on/">What\'s on</a><a href="/map/">Map</a><a href="/explore/">Drive in 3D</a><a href="/safety/">Getting home safely</a></div>'
                 f'<div><h2>About</h2><a href="/about/">About &amp; corrections</a><a href="/forum/">Community forum</a><a href="/cast/">Meet the cast</a><a href="https://rainbowquarter.co.uk/" rel="noopener">Venue history: Rainbow Quarter</a></div></div>'
                 f'<p class="small">Last updated {UPDATED} · Opening hours and prices are as listed by venues; always check before you travel.</p></div></footer>'
                 + (('<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script><script src="/assets/map.js" defer></script>') if maps else '') + script + '<script src="/assets/site.js" defer></script>' +
                 (f'<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{{"token": "{BEACON}"}}\'></script>' if BEACON else '') + '</body></html>')
    return head + body_html

PAGES = {}
def add(path, page): PAGES[path] = page

# ---------------------------------------------------------------- stays
def vface(s): v = VBY[s]; return f'<figure class="vface">{art.facade(s, v["name"], v["kind"])}<figcaption>Illustration, not a photo. {E(v["address"])}</figcaption></figure>'
def stay_page(s):
    v = VBY[s]; c = STAYS.get(s) or {}
    near = sorted([(walk(s, b), b) for b in BAR_SLUGS if b != s and walk(s, b)], key=lambda x: x[0])[:6]
    rows = ''.join(f'<tr><td><a href="/nightlife/{b}/">{E(VBY[b]["name"])}</a></td><td class="mins" style="--m:{m}"><b>{m}</b> min<i aria-hidden="true"></i></td></tr>' for m, b in near)
    fixed = ''.join(f'<tr><td>{n}</td><td class="mins" style="--m:{WALK[s]["to"][k]}"><b>{WALK[s]["to"][k]}</b> min<i aria-hidden="true"></i></td></tr>' for k, n in (('blackpool-north-station', 'Blackpool North station'), ('north-pier', 'North Pier and the Prom'), ('blackpool-tower', 'Blackpool Tower')) if WALK.get(s, {}).get('to', {}).get(k))
    facts = '<ul class="facts">' + f'<li><strong>Address:</strong> {E(v["address"])}{", " + E(v["postcode"]) if v.get("postcode") else ""}</li>' + (f'<li><strong>Type:</strong> {E(v["kind"])}</li>') + (f'<li><strong>Price guide:</strong> {E(v["price"])}</li>' if v.get('price') else '') + (f'<li><strong>Phone:</strong> <a href="tel:{E(re.sub(r"[^0-9+]", "", v["phone"]))}">{E(v["phone"])}</a></li>' if v.get('phone') else '') + (f'<li><strong>Website:</strong> <a href="{E(v["website"])}" rel="noopener nofollow" target="_blank">{E(re.sub(r"^https?://(www\.)?", "", v["website"]).rstrip("/"))}</a></li>' if v.get('website') else '') + '</ul>'
    tower = WALK.get(s, {}).get('to', {}).get('blackpool-tower')
    stamp = f'<span class="stamp" aria-hidden="true"><b>{tower}</b>min to the Tower</span>' if tower else ''
    mp = mapblock([p for p in ALLPINS if p['u'] == f'/stays/{s}/'] + [p for p in ALLPINS if p['k'] == 'bar' and p['u'].split('/')[2] in [b for _, b in near]], center=v['geo'], zoom=17, h=340)
    body = (vface(s) + '<div class="stay-grid"><div class="main">' + f'<div class="postcard">{stamp}{mp}</div>' +
            (c.get('body_html') or f'<p>{E(v["name"])} is a {E(v["kind"].lower())} at {E(v["address"])}.</p>') +
            f'<h2>Walking times from {E(v["name"])}</h2><table class="walk"><thead><tr><th>Place</th><th>On foot</th></tr></thead><tbody>{fixed}{rows}</tbody></table><p class="small">Walking times are estimates from map positions.</p>'
            + f'</div><aside class="register" aria-label="Guest register"><span class="eyebrow">Guest register</span>{facts}{maplinks(v)}</aside></div>' + promo(s, v['name']))
    title = c.get('title') or f'{v["name"]} Blackpool | {NAME}'
    desc = c.get('description') or f'{v["name"]}, {v["kind"].lower()} at {v["address"]}: location, who it suits, walking times to Queen Street bars and booking tips.'
    ld = [{'@type': 'Hotel' if 'hotel' in v['kind'].lower() else 'LodgingBusiness', '@id': SITE + f'/stays/{s}/#place', 'name': v['name'], 'url': SITE + f'/stays/{s}/', 'description': desc,
           'address': {'@type': 'PostalAddress', 'streetAddress': v['address'].replace(', Blackpool', ''), 'addressLocality': 'Blackpool', 'postalCode': v.get('postcode') or None, 'addressCountry': 'GB'},
           'geo': {'@type': 'GeoCoordinates', 'latitude': v['geo'][0], 'longitude': v['geo'][1]}, **({'telephone': v['phone']} if v.get('phone') else {}), **({'sameAs': [v['website']]} if v.get('website') else {})}]
    add(f'/stays/{s}/', shell(f'/stays/{s}/', title, desc, c.get('h1') or v['name'], c.get('intro', ''), body, [('Where to stay', '/stays/'), (v['name'], None)], ld, maps=True))
for s in STAY_SLUGS:
    if VBY[s].get('geo'): stay_page(s)

TYPE_ORDER = ['men-only-hotels', 'adults-only-guest-houses', 'gay-owned-guest-houses', 'hotels-with-a-bar', 'near-queen-street', 'near-blackpool-north-station', 'budget-stays', 'pride-weekend-hotels', 'illuminations-breaks', 'quiet-midweek-breaks']
def card(s):
    v = VBY[s]; c = STAYS.get(s, {}); q = walk(s, 'the-flying-handbag')
    kl = v['kind'].lower(); fob = ('men', 'M') if 'men' in kl else ('adults', 'A') if 'adult' in kl else ('mixed', 'H' if 'hotel' in kl else 'G')
    return (f'<a class="card stay" href="/stays/{s}/"><span class="fob fob-{fob[0]}" aria-hidden="true"><em>{fob[1]}</em></span><strong>{E(v["name"])}</strong><span class="k">{E(v["kind"])}</span><span>{E(c.get("intro") or v["address"])}</span>'
            + (f'<span class="walkchip">{q} min walk to Queen Street</span>' if q else '') + '</a>')
for t in TYPE_ORDER:
    c = TYPES.get(t)
    if not c: continue
    listed = [s for s in c.get('listed', []) if s in VBY and f'/stays/{s}/' in PAGES]
    body = c['body_html'] + ('<h2>Stays on this list</h2><div class="cards">' + ''.join(card(s) for s in listed) + '</div>' if listed else '') + mapblock([p for p in ALLPINS if p['k'] == 'stay' and p['u'].split('/')[2] in listed] + [p for p in ALLPINS if p['k'] == 'bar'], zoom=16)
    add(f'/stays/{t}/', shell(f'/stays/{t}/', c['title'], c['description'], c['h1'], c.get('intro', ''), body, [('Where to stay', '/stays/'), (c['h1'], None)],
        [{'@type': 'ItemList', 'name': c['h1'], 'numberOfItems': len(listed), 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'url': SITE + f'/stays/{s}/'} for i, s in enumerate(listed)]}], maps=True))
hub = CORE.get('stays_hub', {})
types_html = '<h2>Find the right stay</h2><div class="chips">' + ''.join(f'<a href="/stays/{t}/">{E(TYPES[t]["h1"])}</a>' for t in TYPE_ORDER if t in TYPES) + '</div>'
allstays = [s for s in STAY_SLUGS if f'/stays/{s}/' in PAGES]
allstays.sort(key=lambda s: (walk(s, 'the-flying-handbag') or 99, VBY[s]['name']))
add('/stays/', shell('/stays/', hub.get('title', f'Gay Hotels in Blackpool: Every Stay | {NAME}'), hub.get('description', 'Every gay, men-only, adults-only and LGBTQ+-friendly hotel and guest house in Blackpool, with maps and walking times to Queen Street.'),
    hub.get('h1', 'Where to stay in Blackpool'), hub.get('intro', ''), mapblock([p for p in ALLPINS if p['k'] == 'stay'] + [p for p in ALLPINS if p['k'] == 'bar'], zoom=16, h=420) + hub.get('body_html', '') + types_html +
    f'<h2>All {len(allstays)} stays, nearest Queen Street first</h2><div class="cards">' + ''.join(card(s) for s in allstays) + '</div>', [('Where to stay', None)],
    [{'@type': 'ItemList', 'name': 'LGBTQ+ stays in Blackpool', 'numberOfItems': len(allstays), 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'url': SITE + f'/stays/{s}/'} for i, s in enumerate(allstays)]}], maps=True))

# ---------------------------------------------------------------- nightlife
DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
HOURS = {s: VBY[s].get('hours') for s in BAR_SLUGS if isinstance(VBY[s].get('hours'), dict)}
def hours_table(v):
    h = v.get('hours') if isinstance(v.get('hours'), dict) else None
    if not h: return f'<p>{E(v.get("hoursText") or "Opening hours are not published; check with the venue.")}</p>'
    return '<table class="hours"><tbody>' + ''.join(f'<tr><th>{d.capitalize()}</th><td>{E(h.get(d) or "Closed")}</td></tr>' for d in DAYS) + '</tbody></table>' + (f'<p class="small">{E(v["hoursText"])}</p>' if v.get('hoursText') else '') + '<p class="small">Listed hours. Check with the venue before you go.</p>'
for s in BAR_SLUGS:
    v = VBY[s]; c = CARDS.get(s)
    if not c or not v.get('geo'): continue
    near = sorted([(walk(s, h), h) for h in STAY_SLUGS if h != s and walk(s, h) and f'/stays/{h}/' in PAGES], key=lambda x: x[0])[:5]
    body = (vface(s) + f'<div class="staybox"><ul class="facts"><li><strong>Address:</strong> {E(v["address"])}{", " + E(v["postcode"]) if v.get("postcode") else ""}</li><li><strong>Type:</strong> {E(v["kind"])}</li>' + (f'<li><strong>Prices:</strong> {E(v["price"])}</li>' if v.get('price') else '') + '</ul>' + maplinks(v) + '</div>' + c['body_html'] +
            '<h2>Opening hours</h2>' + hours_table(v) + ('<h2>Closest places to stay</h2><ul>' + ''.join(f'<li><a href="/stays/{h}/">{E(VBY[h]["name"])}</a>, {m} min walk</li>' for m, h in near) + '</ul>' if near else '') +
            mapblock([p for p in ALLPINS if p['u'] == f'/nightlife/{s}/'] + [p for p in ALLPINS if p['k'] == 'stay' and p['u'].split('/')[2] in [h for _, h in near]], center=v['geo'], zoom=17, h=300) + promo(s, v['name']))
    typ = v.get('schemaType') or ('NightClub' if 'club' in v['kind'].lower() else 'BarOrPub')
    ld = [{'@type': typ, 'name': v['name'], 'url': SITE + f'/nightlife/{s}/', 'address': {'@type': 'PostalAddress', 'streetAddress': v['address'].replace(', Blackpool', ''), 'addressLocality': 'Blackpool', 'postalCode': v.get('postcode'), 'addressCountry': 'GB'}, 'geo': {'@type': 'GeoCoordinates', 'latitude': v['geo'][0], 'longitude': v['geo'][1]}, **({'telephone': v['phone']} if v.get('phone') else {})}]
    add(f'/nightlife/{s}/', shell(f'/nightlife/{s}/', c['title'], c['description'], c['h1'], c.get('intro', ''), body, [('Nightlife', '/nightlife/'), (v['name'], None)], ld, maps=True))
nh = NIGHT.get('nightlife_hub', {})
bars = [s for s in BAR_SLUGS if f'/nightlife/{s}/' in PAGES]
add('/nightlife/', shell('/nightlife/', nh.get('title', f'Gay Bars Near Your Hotel in Blackpool | {NAME}'), nh.get('description', 'Gay bars, cabaret and clubs near the Rainbow Quarter hotels, with maps, listed hours and walking times.'), nh.get('h1', 'Nightlife near your hotel'), nh.get('intro', ''),
    mapblock(ALLPINS, zoom=16, h=420) + nh.get('body_html', '') + '<h2>Every bar, club and sauna</h2><div class="cards">' + ''.join(f'<a class="card ticket" href="/nightlife/{s}/"><strong>{E(VBY[s]["name"])}</strong><span class="k">{E(VBY[s]["kind"])}</span><span>{E(CARDS[s].get("intro", ""))}</span></a>' for s in bars) + '</div>', [('Nightlife', None)], maps=True))
add('/map/', shell('/map/', f'Rainbow Quarter Map: Gay Hotels and Bars | {NAME}', 'Interactive map of every gay and gay-friendly hotel, bar, club and sauna in Blackpool, with Google Maps, Apple Maps and Waze links for each.', 'Map of gay Blackpool',
    'Every stay and bar on one map. Tap a pin for directions.', mapblock(ALLPINS, zoom=16, h=620) + promo() + '<h2>Stays</h2><ul>' + ''.join(f'<li><a href="/stays/{s}/">{E(VBY[s]["name"])}</a>, {E(VBY[s]["address"])}</li>' for s in allstays) + '</ul><h2>Bars and clubs</h2><ul>' + ''.join(f'<li><a href="/nightlife/{s}/">{E(VBY[s]["name"])}</a>, {E(VBY[s]["address"])}</li>' for s in bars) + '</ul>', [('Map', None)], maps=True, wide=True))

XPCSS = '<style>' + open(os.path.join(B, 'explore.css')).read() + '</style>'
xpdata = json.dumps({'pins': ALLPINS, 'c': [53.8228, -3.0525], 'world': '/assets/world.json'}, separators=(',', ':')).replace('</', '<\\/')
add('/explore/', shell('/explore/', f'Drive Around Gay Blackpool in 3D | {NAME}', 'Drive a pink soft-top through the real streets of Blackpool in 3D: the Tower, North Pier, the Illuminations and every gay hotel, guest house, bar and club, with directions.', 'Drive gay Blackpool in 3D',
    'The real streets of the Rainbow Quarter, built in 3D. Pink lights are places to stay, blue lights are bars and clubs. Pick one and the car drives you there.',
    XPCSS + '<div class="xp" id="xp" role="region" aria-label="3D map of gay Blackpool"><noscript><p style="padding:20px">The 3D view needs JavaScript. Use the <a href="/map/" style="color:#fff">flat map</a> instead.</p></noscript></div>'
    f'<script type="application/json" id="xpdata">{xpdata}</script>'
    '<p class="small">Streets, buildings, the coast and North Pier: © <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap contributors</a>. Venue positions match our <a href="/map/">map</a>. Building heights are estimates where none are recorded.</p>'
    '<h2>Places to stay</h2><ul class="cols">' + ''.join(f'<li><a href="/stays/{s}/">{E(VBY[s]["name"])}</a> · <a href="/explore/?to={s}" class="small">drive there</a></li>' for s in allstays) + '</ul><h2>Bars and clubs</h2><ul class="cols">' + ''.join(f'<li><a href="/nightlife/{s}/">{E(VBY[s]["name"])}</a> · <a href="/explore/?to={s}" class="small">drive there</a></li>' for s in bars) + '</ul>',
    [('Map', '/map/'), ('Drive in 3D', None)], wide=True,
    script='<script src="/assets/three-r160.min.js" defer></script><script src="/assets/explore.js" defer></script>'))

# open tonight (client-side, Europe/London time) from listed hours
ot = {s: {'n': VBY[s]['name'], 'u': f'/nightlife/{s}/', 'h': HOURS[s], 'k': VBY[s]['kind']} for s in bars if s in HOURS}
otjs = '<script type="application/json" id="otdata">' + json.dumps(ot, separators=(',', ':')).replace('</', '<\\/') + '</script><script src="/assets/tonight.js" defer></script>'
add('/open-tonight/', shell('/open-tonight/', f'Gay Bars Open Tonight in Blackpool | {NAME}', 'Which Blackpool gay bars and clubs are open right now and later tonight, from each venue\'s listed hours, with walking times from the hotels.', 'Open tonight in Blackpool',
    '', NIGHT.get('open_tonight_intro', '') + '<div id="tonight" class="tonight" aria-live="polite"><p>Loading tonight\'s list…</p></div><noscript><p>Turn on JavaScript to see what is open now, or browse <a href="/nightlife/">all bars</a>.</p></noscript>', [('Open tonight', None)], script=otjs))

# what's on: upcoming dated events + recurring
def ev_date(e): return e.get('startDate') or '9999'
up = [e for e in EVENTS if (e.get('endDate') or e.get('startDate') or '9999') >= TODAY or e.get('type') == 'recurring']
up.sort(key=lambda e: (e['type'] == 'recurring', ev_date(e)))
def fmt(d):
    try: return datetime.date.fromisoformat(d).strftime('%a %-d %b %Y')
    except Exception: return ''
rows = ''
evld = []
for e in up:
    when = e.get('recurrenceText') or (fmt(e['startDate']) + (' to ' + fmt(e['endDate']) if e.get('endDate') and e['endDate'] != e['startDate'] else ''))
    venue = f'<a href="/nightlife/{e["venueSlug"]}/">{E(e.get("venueName"))}</a>' if e.get('venueSlug') and f'/nightlife/{e["venueSlug"]}/' in PAGES else E(e.get('venueName') or '')
    rows += f'<div class="ev"><div class="when">{E(when)}{" · " + E(e["startTime"]) if e.get("startTime") else ""}</div><h3>{E(e["name"])}</h3><p>{venue}{" · " + E(e["price"]) if e.get("price") else ""}</p><p>{E(BLURB.get(e["slug"], ""))}</p>' + (f'<p><a href="{E(e["ticketUrl"])}" target="_blank" rel="noopener nofollow">Tickets and details</a></p>' if e.get('ticketUrl') else '') + '</div>'
    if e.get('type') == 'dated' and e.get('startDate'):
        evld.append({'@type': 'Event', 'name': e['name'], 'startDate': e['startDate'] + (('T' + e['startTime']) if e.get('startTime') and re.match(r'^\d\d:\d\d$', e['startTime']) else ''), **({'endDate': e['endDate']} if e.get('endDate') else {}),
                     'eventStatus': 'https://schema.org/EventScheduled', 'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode', 'location': {'@type': 'Place', 'name': e.get('venueName') or 'Blackpool', 'address': {'@type': 'PostalAddress', 'streetAddress': e.get('venueAddress') or '', 'addressLocality': 'Blackpool', 'addressCountry': 'GB'}}, 'description': BLURB.get(e['slug'], e['name'])})
add('/whats-on/', shell('/whats-on/', f"What's On: Gay Blackpool Events | {NAME}", 'Drag shows, cabaret, Pride and LGBTQ+ events in Blackpool, with dates, venues and the nearest places to stay.', "What's on in gay Blackpool", '', NIGHT.get('whats_on_intro', '') + '<div class="events">' + rows + '</div>', [("What's on", None)], evld[:40]))

# plan + core pages
for s, c in TYPES.items():
    if c.get('section') == 'plan':
        add(f'/plan/{s}/', shell(f'/plan/{s}/', c['title'], c['description'], c['h1'], c.get('intro', ''), c['body_html'], [('Plan your trip', '/plan/'), (c['h1'], None)], [{'@type': 'Article', 'headline': c['h1'], 'description': c['description'], 'url': SITE + f'/plan/{s}/', 'datePublished': TODAY, 'dateModified': TODAY, 'author': {'@id': SITE + '/#org'}, 'publisher': {'@id': SITE + '/#org'}, 'inLanguage': 'en-GB'}]))
plans = [(s, c) for s, c in TYPES.items() if c.get('section') == 'plan']
add('/plan/', shell('/plan/', f'Plan a Gay Weekend in Blackpool | {NAME}', 'Practical guides for a gay weekend in Blackpool: first-timer plan, getting home late, drag nights, groups and where to eat.', 'Plan your Blackpool trip', 'Practical guides for your stay.', '<div class="cards">' + ''.join(f'<a class="card" href="/plan/{s}/"><strong>{E(c["h1"])}</strong><span>{E(c.get("intro", ""))}</span></a>' for s, c in plans) + '</div>', [('Plan your trip', None)]))
# ---------------------------------------------------------------- Pride + Lord Street Pride (photos live in /public/img, served as static assets)
DIMS = json.load(open(os.path.join(D, 'photo-dims.json')))
def gallery(items, label):
    return (f'<div class="pgal" role="list" aria-label="{E(label)}">' + ''.join(
        f'<figure class="pic" role="listitem" style="--r:{(-1.6, 1.2, -0.8, 1.8, -1.2)[i % 5]}deg"><a href="/img/pride/{k}.webp"><img src="/img/pride/{k}.webp" width="{DIMS[k][0]}" height="{DIMS[k][1]}" alt="{E(alt)}" loading="{"eager" if i == 0 else "lazy"}" decoding="async"></a><figcaption>{E(alt)}</figcaption></figure>'
        for i, (k, alt) in enumerate(items)) + '</div>')
NEXTPRIDE = '<p class="nextpride"><span class="np-k">Next Blackpool Pride</span><strong>June 2027</strong><span class="np-tba">Dates TBA</span></p>'
def bar_ticket(s): return f'<a class="card ticket" href="/nightlife/{s}/"><strong>{E(VBY[s]["name"])}</strong><span class="k">{E(VBY[s]["kind"])}</span><span>{E(CARDS.get(s, {}).get("intro", "") or VBY[s]["address"])}</span></a>'
def everyone(): return (f'<h2>Every LGBTQ+ hotel and guest house ({len(allstays)})</h2><div class="cards">' + ''.join(card(s) for s in allstays) + '</div>'
                        + f'<h2>Every bar, club and sauna ({len(bars)})</h2><div class="cards">' + ''.join(bar_ticket(s) for s in bars) + '</div>')
PRIDE_PICS = [('prom-crowd', 'Crowds fill the Promenade for Blackpool Pride'), ('tower-flags', 'Pride flags flying below Blackpool Tower'), ('parade', 'The Pride parade on the Promenade'),
              ('lord-street-samba', 'Samba drummers on Pride weekend'), ('festival-poster-2026', 'The 20th anniversary programme: 5 to 7 June 2026')]
LORD_PICS = [('lord-street-mardi-gras', 'The street party outside Mardi Gras on Lord Street'), ('lord-street-flags', 'Pride flags over the street party'), ('lord-street-crowd', 'A packed Rainbow Quarter street for Pride'),
             ('lord-street-samba', 'Samba drummers working the crowd'), ('lord-street-poster-2024', 'Poster for the free Mardi Gras Pride street party, Sunday 9 June 2024')]
pc = CORE['pride']
lordlink = '<a class="card ticket feature" href="/pride/lord-street/"><strong>Lord Street Pride street party</strong><span class="k">Free, in the Rainbow Quarter</span><span>Photos, what happened in 2026 and the bars and hotels right on the street.</span></a>'
add('/pride/', shell('/pride/', 'Blackpool Pride 2027: Dates, Parade & Gay Hotels | Blackpool.gay', pc['description'], 'Blackpool Pride: June 2027, dates TBA', pc.get('intro', ''),
    NEXTPRIDE + gallery(PRIDE_PICS, 'Blackpool Pride photos') + pc['body_html'] + '<h2>Lord Street street party</h2><div class="cards">' + lordlink + '<a class="card ticket" href="/cast/#symbols"><strong>Spot the symbols</strong><span class="k">A short history of Pride signs</span><span>The rainbow flag, the pink triangle, the green carnation and more, hidden in our Prom scene.</span></a></div>' + everyone(), [('Pride', None)],
    [{'@type': 'Article', 'headline': 'Blackpool Pride: June 2027, dates TBA', 'description': pc['description'], 'url': SITE + '/pride/', 'image': [SITE + f'/img/pride/{k}.webp' for k, _ in PRIDE_PICS], 'dateModified': TODAY, 'author': {'@id': SITE + '/#org'}, 'publisher': {'@id': SITE + '/#org'}, 'inLanguage': 'en-GB'}]))
lord = [s for s in allstays + bars if 'Lord Street' in VBY[s]['address']]
lord = sorted(dict.fromkeys(lord), key=lambda s: int(re.match(r'\d+', VBY[s]['address']).group()))
LORD_BODY = (NEXTPRIDE + gallery(LORD_PICS, 'Lord Street Pride photos') +
    '<p>When Blackpool Pride comes to town, Lord Street becomes the party. The street sits in the middle of the Rainbow Quarter, lined with gay-owned guest houses and bars, and on Pride weekend it closes to traffic for a free street party with live music, DJs, stalls and food.</p>'
    '<h2>When is the Lord Street Pride street party in 2027?</h2><p>Expect it in June 2027, alongside the main Blackpool Pride festival. Dates are TBA: nothing had been announced when we checked on 22 October 2026, so we are not guessing. Watch <a href="https://www.blackpoolpride.org">blackpoolpride.org</a>, and we will update this page as soon as dates are confirmed.</p>'
    '<h2>What happened in 2026</h2><p>For the 20th anniversary of Blackpool Pride, more than 20 Rainbow Quarter businesses hosted a community street party on Saturday 6 and Sunday 7 June 2026, alongside the main festival on the Tower Festival Headland. Lord Street had music and performances from local talent across both days. Gates opened at 12pm, with DJs from 1pm and live entertainment from 5pm, and entry was free but one-in-one-out once the street was full.</p>'
    '<h2>How it started: the Mardi Gras community day</h2><p>In 2024 Mardi Gras, the bar and hotel at 41-43 Lord Street, closed off the street for a free Pride community day on Sunday 9 June, from 12pm to 8pm. There were 21 acts, stalls and hot food, with guest appearances from Su Pollard and Cheryl Fergison and sets from Angie Brown, Katherine Ellis, Samantha Atkinson and Ross Alexander and the Blitz Kidz. Owner John Street summed it up: entry was free and everyone was welcome.</p>'
    '<h2>Bars and hotels on Lord Street</h2><p>Stay on the street and the party is on your doorstep. These are all on Lord Street, in house-number order.</p><div class="cards">'
    + ''.join(card(s) if s in allstays else bar_ticket(s) for s in lord) + '</div>'
    '<h2>Tips for the street party</h2><ul><li>Arrive early: the street fills up and entry goes one-in-one-out.</li><li>Book your room as soon as the 2027 dates are out. Rooms on Lord Street go first.</li><li>Agree a meeting point, because phone signal can struggle in a packed street.</li><li>The parade is on the Promenade on the Saturday morning, a ten-minute walk away. See <a href="/pride/">Blackpool Pride</a> for parade details.</li></ul>'
    + everyone())
add('/pride/lord-street/', shell('/pride/lord-street/', 'Lord Street Pride Street Party Blackpool 2027 | Blackpool.gay', 'The free Lord Street Pride street party in Blackpool\'s Rainbow Quarter: June 2027, dates TBA. Photos, what happened in 2026, and every bar and hotel on the street.',
    'Lord Street Pride street party', 'Free, loud and right outside the guest houses: the Rainbow Quarter\'s own Pride party.', LORD_BODY, [('Pride', '/pride/'), ('Lord Street', None)],
    [{'@type': 'Article', 'headline': 'Lord Street Pride street party', 'url': SITE + '/pride/lord-street/', 'image': [SITE + f'/img/pride/{k}.webp' for k, _ in LORD_PICS], 'dateModified': TODAY, 'author': {'@id': SITE + '/#org'}, 'publisher': {'@id': SITE + '/#org'}, 'inLanguage': 'en-GB'}]))
# ---------------------------------------------------------------- Meet the cast (the illustrated characters from the home page scene)
_W = art.walkers()
def castpic(i, label):
    w, g = _W[i]; top = (-152, -152, -200, -146, -52, -122)[i]; pad = (40, 40, 40, 30, 20, 30)[i]; x0, x1 = -pad, w + pad + (14 if i == 2 else 0)
    return f'<svg viewBox="{x0} {top} {x1 - x0} {-top + 8}" role="img" aria-label="{E(label)}"><path d="M{x0} 2 H{x1}" stroke="#3a2a5c" stroke-width="4"/><g transform="scale(1.02)">{g}</g></svg>'
CAST = [
    (f'<svg viewBox="-14 -30 590 170" role="img" aria-label="Jay and Theo in their pink soft-top"><path d="M-14 128 H576" stroke="#3a2a5c" stroke-width="4"/>{art.car("cast", beam=False)}</svg>', 'Jay and Theo', 'Behind the wheel',
     'Jay drives, Theo waves at everyone. They have done the Prom in the pink soft-top more times than either will admit, and they always book the room before the bar.'),
    (castpic(0, 'Kai and Ollie walking hand in hand, Ollie fluttering a fan'), 'Kai and Ollie', 'Hand in hand on the Prom',
     'Kai wears the rainbow and Ollie brings the fan. One hand on the hip, one hand in his boyfriend\'s, and never in a hurry.'),
    (castpic(1, 'Amara and Rue walking hand in hand'), 'Amara and Rue', 'Sunshine and a rainbow skirt',
     'Amara is in sunflower yellow, Rue in a rainbow skirt with her lilac hair down. First to the street party, last to leave.'),
    (castpic(2, 'A drag queen in a purple sequin gown walking a small white dog'), 'Lady Illuminata and Biscuit', 'The Queen of the Prom',
     'Six inches of beehive, a sequin gown and a gold handbag. Biscuit, in his rainbow bow, sets the pace.'),
    (castpic(3, 'Five men dancing in sync, arms spelling out letters: a cop, a cowboy, a builder, a leather biker and a sailor'), 'The Prom Posse', 'Four letters, five moustaches',
     'A cop, a cowboy, a builder, a biker and a sailor stop on the Prom and spell out the most famous four letters in disco. Everybody joins in.'),
    (castpic(4, 'A grey cat with a rainbow mohican'), 'Ziggy', 'Cat about town',
     'A grey tabby with a rainbow mohican and absolutely no interest in anyone\'s opinion.'),
    (castpic(5, 'A pink flamingo strutting'), 'Flo', 'The flamingo',
     'Nobody knows where Flo came from. Everybody agrees she should stay.'),
]

RB = ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787']
SYMBOLS = [
    ('<g>' + ''.join(f'<rect x="8" y="{12 + i * 4}" width="30" height="4" fill="{c}"/>' for i, c in enumerate(['#ff69b4', '#e40303', '#ff8c00', '#ffed00', '#008026', '#40e0d0', '#3e2fbf', '#8b00ff'])) + '<path d="M8 10 V48" stroke="#fff6ec" stroke-width="2"/></g>',
     'The rainbow flag', 'Spot it on the banner plane, every venue front, Kai\'s T-shirt and Rue\'s skirt.',
     'Artist Gilbert Baker made the first rainbow flags for San Francisco Pride on 25 June 1978. There were eight stripes, and each one meant something: hot pink for sexuality, red for life, orange for healing, yellow for sunlight, green for nature, turquoise for magic and art, indigo for serenity and violet for spirit.'),
    ('<path d="M10 12 L40 12 L25 40 Z" fill="#FF2E88" transform="rotate(180 25 26)"/>',
     'The pink triangle', 'It is your mouse pointer.',
     'The Nazis forced gay men in the camps to wear a pink triangle. In 1986 six New York activists put it on their Silence = Death poster, flipped to point upwards, and ACT UP made it the face of its fight against AIDS. A badge of persecution became a badge of defiance.'),
    ('<path d="M26 44 V30 M26 30 l-4 14" stroke="#ff7fae" stroke-width="2" fill="none"/><ellipse cx="22" cy="26" rx="11" ry="6" fill="#ff8fbd"/><path d="M30 24 q6 -6 1 -12 q-4 -5 2 -8" stroke="#ff6fa8" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="34" cy="5" r="3.4" fill="#ff6fa8"/><path d="M36 4 q4 0 4 4" stroke="#1a1033" stroke-width="2" fill="none"/>',
     'The pink flamingo', 'That is Flo, strutting the Prom.',
     'John Waters\' 1972 cult film Pink Flamingos, starring Divine, was billed as an exercise in poor taste. It turned the plastic lawn flamingo into a byword for camp: glorious bad taste, worn with pride.'),
    ('<path d="M25 44 V24" stroke="#2e8b3e" stroke-width="2"/><path d="M25 34 q-7 -2 -9 -8" stroke="#2e8b3e" stroke-width="2" fill="none"/>' + ''.join(f'<circle cx="{25 + dx}" cy="{18 + dy}" r="5" fill="{c}"/>' for dx, dy, c in ((0, 0, '#3fcf62'), (-5, 2, '#5ee07c'), (5, 2, '#2fb854'), (0, -5, '#6cf08a'))),
     'The green carnation', 'Ollie wears one on his lapel.',
     'At the 1892 premiere of Lady Windermere\'s Fan, Oscar Wilde had friends wear green carnations in their buttonholes. Asked what it meant, he said: "Nothing whatever, but that is just what nobody will guess." It went on to be read as a quiet signal between gay men.'),
    ('<g>' + ''.join(f'<g transform="translate({x} {y})">' + ''.join(f'<circle cx="{dx}" cy="{dy}" r="4.4" fill="#7b4bd1"/>' for dx, dy in ((0, -5), (4.8, -1.6), (3, 4.2), (-3, 4.2), (-4.8, -1.6))) + '<circle r="2.4" fill="#ffe45e"/></g>' for x, y in ((18, 20), (32, 30))) + '</g>',
     'Violets', 'Amara wears them in her hair.',
     'The poet Sappho, writing on Lesbos in the 6th century BC, described garlands of violets. Women who loved women have given and worn violets ever since, from 1920s Paris to New York audiences at the 1926 play The Captive.'),
    ('<path d="M18 8 h12 a8 8 0 0 1 8 8 v14 a8 8 0 0 1 -8 8 h-4 a8 8 0 0 1 -8 -8 v-14" stroke="#c0c0c0" stroke-width="3.4" fill="none"/><path d="M22 38 l-4 10 M26 38 l3 9" stroke="#ffc93c" stroke-width="3" stroke-linecap="round"/>',
     'The carabiner', 'Clipped to Rue\'s skirt, keys and all.',
     'A climbing clip loaded with keys on a belt loop: practical, and a famously knowing nod in lesbian style.'),
    ('<path d="M25 6 V46" stroke="#c9a7ff" stroke-width="3"/><path d="M23 14 q-14 -4 -14 8 q0 12 14 8z M27 14 q14 -4 14 8 q0 12 -14 8z" fill="#c9a7ff"/>',
     'The labrys', 'Printed on Rue\'s top.',
     'A double-headed axe linked in myth to the Amazons. Lesbian feminists took it up in the 1970s as a sign of strength and self-reliance.'),
    ('<text x="25" y="40" text-anchor="middle" font-size="38" font-weight="800" fill="#ffc93c" font-family="Georgia,serif">λ</text>',
     'The lambda', 'On the chain round Kai\'s neck.',
     'Designer Tom Doerr chose the Greek letter in 1970 for New York\'s Gay Activists Alliance. In science it marks a change in energy, which was the point. It became a sign of gay liberation everywhere.'),
    ('<circle cx="25" cy="22" r="13" fill="#8a5a3c"/><circle cx="16" cy="28" r="4" fill="none" stroke="#ffc93c" stroke-width="2.6"/>',
     'The right ear', 'Kai\'s earring is in his right ear.',
     'Schoolyard lore in the 1980s and 1990s said one earring in the right ear meant you were gay: "left is right, right is wrong". It was always a myth. Kai just likes the earring.'),
    ('<path d="M10 14 H40 L25 40 Z" fill="#ff2e88"/><circle cx="20" cy="20" r="1.6" fill="#fff"/><circle cx="30" cy="20" r="1.6" fill="#fff"/><circle cx="25" cy="28" r="1.6" fill="#fff"/>',
     'The bandana', 'Round the cowboy\'s neck, where it is just a bandana.',
     'In 1970s gay bars, a coloured handkerchief in a back pocket was a whole silent language, the hanky code: the colour and the side said what you were after. We will leave the translation to the bars.'),
    ('<path d="M15 16 h20 l-3 30 h-14z" fill="#fff6ec" opacity=".9"/><path d="M16 26 h18 l-2 20 h-14z" fill="#a0663c"/><path d="M27 16 l5 -12" stroke="#ff2e88" stroke-width="2.4"/><rect x="18" y="20" width="5" height="5" fill="#d8f3ff"/><rect x="25" y="22" width="5" height="5" fill="#d8f3ff"/>',
     'Iced coffee', 'Rue\'s drink, whatever the weather.',
     'The newest symbol here and the only joke: the running gag that queer people drink iced coffee all year round. Even in Blackpool in October.'),
]
symbols_html = ('<section class="symbols" id="symbols" aria-labelledby="symh"><h2 id="symh">Spot the symbols</h2>'
                '<p>Look closer at the Prom and you will find a short history of queer culture hiding in plain sight. Each of these signs began as a code, a joke or a badge, and each one is somewhere in our scene.</p>'
                '<ul class="symgrid">' + ''.join(f'<li><svg viewBox="0 0 50 50" aria-hidden="true" focusable="false">{ic}</svg><div><h3>{E(n)}</h3><p class="spot">{E(w)}</p><p>{E(t)}</p></div></li>' for ic, n, w, t in SYMBOLS) + '</ul>'
                '<p class="small">Sources: <a href="https://lgbthistoryuk.org/wiki/Green_carnation" rel="noopener">LGBT History UK</a>, <a href="https://www.kew.org/read-and-watch/plants-LGBTQ-symbols" rel="noopener">Kew</a>, <a href="https://www.villagevoice.com/how-six-nyc-activists-changed-history-with-silence-death/" rel="noopener">Village Voice</a>, <a href="https://en.wikipedia.org/wiki/Gilbert_Baker_(artist)" rel="noopener">Gilbert Baker</a>, <a href="https://en.wikipedia.org/wiki/Tom_Doerr" rel="noopener">Tom Doerr</a>, <a href="https://www.sensesofcinema.com/2022/great-actors/divine/" rel="noopener">Senses of Cinema</a>.</p></section>')
cast_body = ('<p>Everyone you see on the home page has a name. These are illustrations, drawn for Blackpool.gay: no real people, just the kind of crowd you meet on a good night in the Rainbow Quarter.</p>'
             f'<svg class="pdefs" width="0" height="0" aria-hidden="true" focusable="false"><defs>{art.WALKER_DEFS}</defs></svg>'
             '<div class="cast">' + ''.join(f'<article class="castcard"><div class="castpic">{pic}</div><h2>{E(n)}</h2><p class="k">{E(r)}</p><p>{E(b)}</p></article>' for pic, n, r, b in CAST) + '</div>' + symbols_html +
             '<p><a class="btn" href="/">See them on the Prom</a> <a class="btn alt" href="/explore/">Drive it in 3D</a></p>')
add('/cast/', shell('/cast/', f'Meet the Cast & Spot the Queer Symbols | {NAME}', 'Meet the illustrated cast of Blackpool.gay, and spot the queer symbols hidden in the scene: the rainbow flag, pink triangle, green carnation, violets, lambda and more, with their history.',
    'Meet the cast', 'The characters strolling the Prom on our home page.', cast_body, [('Meet the cast', None)]))
for key, path, crumb in (('safety', '/safety/', 'Safety'), ('about', '/about/', 'About')):
    c = CORE.get(key)
    if c: add(path, shell(path, c['title'], c['description'], c['h1'], c.get('intro', ''), c['body_html'], [(crumb, None)]))
fc = CORE.get('forum', {})
topics = fc.get('forum_topics', [])
forum_body = fc.get('body_html', '') + '<div class="topics">' + ''.join(f'<section class="topic" id="{E(t["slug"])}"><h2>{E(t["title"])}</h2><p>{E(t["desc"])}</p><div class="posts" data-topic="{E(t["slug"])}"></div><form class="postform" data-topic="{E(t["slug"])}"><label>Your name or nickname<input name="name" maxlength="40" required></label><label>Your post<textarea name="body" maxlength="1500" rows="4" required></textarea></label><button type="submit">Send for approval</button><p class="status" role="status"></p></form></section>' for t in topics) + '</div>'
add('/forum/', shell('/forum/', fc.get('title', f'Blackpool Gay Forum: Ask Before You Go | {NAME}'), fc.get('description', 'A friendly, moderated forum for visitors to gay Blackpool: where to stay, quiet nights, eating out and getting home late.'), fc.get('h1', 'Community forum'), fc.get('intro', ''), forum_body, [('Forum', None)], script='<script src="/assets/forum.js" defer></script>'))
hc = CORE.get('home', {})
home_body = ('<h2>Stays nearest the Rainbow Quarter</h2><div class="cards">' + ''.join(card(s) for s in allstays[:6]) + '</div><p><a class="btn" href="/stays/">See all ' + str(len(allstays)) + ' stays</a> <a class="btn alt" href="/open-tonight/">What\'s open tonight</a></p>'
             + '<h2>Find the right kind of stay</h2><div class="chips big">' + ''.join(f'<a href="/stays/{t}/">{E(TYPES[t]["h1"])}</a>' for t in TYPE_ORDER if t in TYPES) + '</div>'
             + promo() + mapblock(ALLPINS, zoom=16, h=420) + hc.get('body_html', ''))
HERO = (f'<section class="hero" aria-labelledby="h1">{art.hero_scene()}<div class="hero-ctl"><button type="button" class="sound-btn" aria-pressed="false" hidden>Play the Prom</button><button type="button" class="motion-btn" aria-pressed="false">Pause motion</button></div><div class="hin"><p class="kick rise">Gay hotels &amp; weekend breaks in Blackpool</p>'
        f'<h1 id="h1" class="rise">Blackpool<span>.Gay</span></h1><p class="lede rise">{E(hc.get("intro", ""))}</p>'
        '<div class="ctas rise"><a class="btn" href="/stays/">Find your stay</a><a class="btn glass" href="/explore/">Drive it in 3D</a></div></div></section>')
add('/', shell('/', hc.get('title', f'Gay Hotels in Blackpool & Weekend Breaks | {NAME}'), hc.get('description', 'Gay, men-only and adults-only hotels in Blackpool, with maps and walking times to Queen Street bars, what\'s on and what\'s open tonight.'), hc.get('h1', 'Blackpool.Gay'), hc.get('intro', ''), home_body, None, maps=True, hero=HERO))
NOTFOUND = shell('/404/', f'Page not found | {NAME}', 'This page does not exist.', 'That page has checked out', 'Jay and Theo took a wrong turn too. Try one of these instead.',
    f'<div class="lost">{art.novacancies_svg()}<div><h2>Plenty of rooms elsewhere</h2><p>The page you wanted has checked out, but the rest of Blackpool is wide awake.</p><a class="btn" href="/stays/">Find a stay</a></div></div>'
    '<ul class="stubs">' + ''.join(f'<li><a href="{u}"><small>{k}</small>{n}</a></li>' for u, k, n in (('/stays/', 'Stay', 'Where to stay'), ('/nightlife/', 'Go out', 'Nightlife'), ('/open-tonight/', 'Tonight', 'Open tonight'), ('/map/', 'Find it', 'Map'), ('/explore/', 'Drive', 'Drive in 3D'))) + '</ul>', noindex=True)

# ---------------------------------------------------------------- fix internal links that point to pages we did not build
FIXED = {}
def _fix(m):
    href, inner = m.group(1), m.group(2)
    if href in PAGES or not href.startswith('/') or href.startswith('/api/') or href.startswith('/img/'): return m.group(0)
    for alt in (href.replace('/stays/', '/nightlife/'), href.replace('/nightlife/', '/stays/')):
        if alt in PAGES: FIXED[href] = alt; return m.group(0).replace(f'href="{href}"', f'href="{alt}"')
    FIXED[href] = None; return inner
for _p in list(PAGES): PAGES[_p] = re.sub(r'<a href="(/[^"#?]*)"[^>]*>([\s\S]*?)</a>', _fix, PAGES[_p])
if FIXED: print('link fixes:', {k: v for k, v in sorted(FIXED.items())})

# ---------------------------------------------------------------- CSP per page
def csp(t):
    hs = sorted({"'sha256-" + base64.b64encode(hashlib.sha256(m.encode()).digest()).decode() + "'" for m in re.findall(r'<script>([\s\S]*?)</script>', t)})
    return ("default-src 'self'; script-src 'self' " + ' '.join(hs) + " https://unpkg.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https://*.tile.openstreetmap.org https://unpkg.com; connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests")
# cache-bust every asset URL with a content hash so a deploy is picked up at once
_A = lambda f: open(os.path.join(B, f)).read()
SITEJS = _A('site.js').replace('/*PEEKS*/{}', json.dumps(art.peeks(), separators=(',', ':')))
_V = {k: hashlib.sha256((v if isinstance(v, str) else str(v)).encode()).hexdigest()[:10] for k, v in {
    '/assets/map.js': _A('map.js'), '/assets/tonight.js': _A('tonight.js'), '/assets/forum.js': _A('forum.js'), '/assets/explore.js': _A('explore.js'),
    '/assets/site.js': SITEJS, '/assets/promo.svg': art.promo_svg(), '/assets/three-r160.min.js': 'r160', '/assets/world.json': open(os.path.join(D, 'world.json')).read()}.items()}
def _bust(t):
    for k, h in _V.items(): t = t.replace(f'"{k}"', f'"{k}?v={h}"').replace(f"'{k}'", f"'{k}?v={h}'")
    return t
PAGES = {p: _bust(t) for p, t in PAGES.items()}; NOTFOUND = _bust(NOTFOUND)
CSPS = {p: csp(t) for p, t in PAGES.items()}; CSPS['/404/'] = csp(NOTFOUND)

URLS = sorted(PAGES, key=lambda u: (u != '/', u.count('/'), u))
SITEMAP = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(f'<url><loc>{SITE}{u}</loc><lastmod>{TODAY}</lastmod></url>' for u in URLS) + '</urlset>'
ROBOTS = f'User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: {SITE}/sitemap.xml\n'
LLMS = (f'# {NAME}\n\n> Independent stay-first guide to LGBTQ+ Blackpool: gay, men-only and adults-only hotels and guest houses near the Rainbow Quarter, with walking times, maps, nightlife near each stay, events and safety. Venue history and support services live on the sister site https://rainbowquarter.co.uk/.\n\n## Stays\n'
        + ''.join(f'- [{VBY[s]["name"]}]({SITE}/stays/{s}/): {VBY[s]["kind"]}, {VBY[s]["address"]}\n' for s in allstays) + '\n## Stay by type\n' + ''.join(f'- [{TYPES[t]["h1"]}]({SITE}/stays/{t}/)\n' for t in TYPE_ORDER if t in TYPES)
        + '\n## Nightlife\n' + ''.join(f'- [{VBY[s]["name"]}]({SITE}/nightlife/{s}/)\n' for s in bars) + f'\n## More\n- [Open tonight]({SITE}/open-tonight/)\n- [What\'s on]({SITE}/whats-on/)\n- [Map]({SITE}/map/)\n- [Pride]({SITE}/pride/)\n- [Safety]({SITE}/safety/)\n')
FORUM_TOPICS = [t['slug'] for t in topics]
INDEXNOW = hashlib.sha256(b'blackpool.gay-indexnow').hexdigest()[:32]

def js(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
def chunk(s, n=8000): return '[' + ',\n'.join(js(s[i:i + n]) for i in range(0, len(s), n)) + "].join('')"
A = lambda f: open(os.path.join(B, f)).read()
out = ['// blackpool.gay Worker. Generated by source/build/build.py: edit the source, not this file.',
       f'const SITE={js(SITE)};const BUILT={js(TODAY)};const DEPLOY={js(hashlib.sha256(json.dumps(PAGES, sort_keys=True).encode()).hexdigest()[:12])};const INDEXNOW={js(INDEXNOW)};const FORUM_TOPICS={js(FORUM_TOPICS)};', 'const PAGES={']
for p in URLS: out.append(f'{js(p)}:{chunk(PAGES[p])},')
out += ['};', f'const NOTFOUND={chunk(NOTFOUND)};', f'const CSP={js(CSPS)};', f'const URLS={js(URLS)};',
        f'const SITEMAP={chunk(SITEMAP)};const ROBOTS={js(ROBOTS)};const LLMS={chunk(LLMS)};',
        f'const ASSETS={js({"/assets/map.js": A("map.js"), "/assets/tonight.js": A("tonight.js"), "/assets/forum.js": A("forum.js"), "/assets/explore.js": A("explore.js"), "/assets/site.js": SITEJS, "/assets/promo.svg": art.promo_svg(), "/assets/three-r160.min.js": A("three.min.js"), "/assets/world.json": open(os.path.join(B, "..", "data", "world.json")).read().strip(), "/favicon.svg": A("favicon.svg")})};',
        f'const BIN={js({k: base64.b64encode(open(os.path.join(B, f), "rb").read()).decode() for k, f in (("/og.png", "og.png"), ("/apple-touch-icon.png", "icon.png"), ("/assets/fonts/bricolage-800.woff", "fonts/bricolage-800.woff"), ("/assets/fonts/inter-var.woff", "fonts/inter-var.woff"), ("/assets/fonts/monoton.woff", "fonts/monoton.woff"))})};',
        A('router.js')]
open(os.path.join(ROOT, 'src', 'index.js'), 'w').write('\n'.join(out))
print('pages', len(PAGES), 'stays', len(allstays), 'bars', len(bars), 'events', len(up), 'bytes', os.path.getsize(os.path.join(ROOT, 'src', 'index.js')))
