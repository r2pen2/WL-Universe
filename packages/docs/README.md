# @wl-universe/docs

Static component reference for WL-Universe (GitHub Pages).

**Hard rule:** only indexes existing JSDoc/TSDoc/file headers. Missing docs → “No docstring in source”.

## Scripts

| Script | What it does |
|--------|----------------|
| `npm run generate` | Run `scripts/docs/generate-all.mjs` → `.docs-cache/` + `data/*.json` |
| `npm run build` | Generate then `next build` (`output: 'export'`) |
| `npm run dev` | Generate then local Next dev server |

Root shortcuts: `npm run docs:generate`, `npm run docs:build`.

## Pages URL

Configured `basePath` / `assetPrefix`: `/WL-Universe` → https://r2pen2.github.io/WL-Universe/

One-time repo setting: **Settings → Pages → Source = GitHub Actions**.
