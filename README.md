# blackpool.gay

Stay-first LGBTQ+ guide to Blackpool: every gay, men-only, adults-only and gay-friendly stay near the Rainbow Quarter, with maps, walking times, nightlife near each stay, what's on, open tonight, Pride, safety and a moderated forum. One Cloudflare Worker.

Positioning: rainbowquarter.co.uk is the reference site (venue history, streets, performers, support). blackpool.gay is the trip planner and must not compete for the same searches. Facts come from the owner's rainbowquarter data plus checked research; all wording is written fresh for this site.

- `source/data/` facts (venues, events, walk times, postcodes) and the written copy (`copy-*.json`)
- `source/build/build.py` builds `src/index.js`; `router.js` is the Worker runtime; `map.js` (Leaflet + OpenStreetMap), `tonight.js`, `forum.js`
- `source/build/crawl.mjs` checks every page, link and JSON-LD block

## Rebuild
```
python3 source/build/build.py && node source/build/crawl.mjs   # must show bad 0, badLD 0, dupTitles 0
```
Push to `main`; Workers Builds deploys (`npx wrangler deploy`).

## Forum moderation
New posts are saved in the `blackpool-gay-forum` KV namespace as `pending:<topic>:<id>`. To publish, append the post object to the JSON array stored at `approved:<topic>` (Cloudflare → Storage → KV) and delete the pending key.

## Hero art
The home hero is layered SVG (source/build/art.py, hero_scene). After changing the skyline shapes, re-bake the rim glow: `python3 tools/bake_skyglow.py`.
