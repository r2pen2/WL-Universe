# @wl-universe/docs

Astro **Starlight** reference for WL-Universe.

**Hard rule:** only indexes existing JSDoc/TSDoc/file headers. Missing docs → “No docstring in source”.

## Hosting

https://wl-universe.joed.dev — nginx static → Traefik → Cloudflare.

## Scripts

| Script | What |
|--------|------|
| `npm run generate` | Extract JSDoc → JSON + Starlight MDX |
| `npm run build` | Generate + `astro build` → `dist/` |
| `npm run dev` | Local Starlight |

## Sites

**Site assets** pages list each export under that app’s `client/src/components` (file + docstring). There is no separate empty “sites inventory” index.
