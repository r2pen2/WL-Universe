# @wl-universe/docs

Static component reference for WL-Universe.

**Hard rule:** only indexes existing JSDoc/TSDoc/file headers. Missing docs → “No docstring in source”.

## Hosting

Served on glados at **https://wl-universe.joed.dev** (nginx static export → Traefik → Cloudflare tunnel).

Owner one-time Cloudflare: public hostname `wl-universe.joed.dev` → `http://traefik:80` (same pattern as `site-mail.joed.dev`).

## Scripts

| Script | What it does |
|--------|----------------|
| `npm run generate` | Run `scripts/docs/generate-all.mjs` → `.docs-cache/` + `data/*.json` |
| `npm run build` | Generate then `next build` (`output: 'export'`) |
| `npm run dev` | Generate then local Next dev server |

Root shortcuts: `npm run docs:generate`, `npm run docs:build`.
