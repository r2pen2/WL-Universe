# WL component catalog (Storybook)

Live at **https://storybook.joed.dev**; each PR that touches web-legos, a site's client code or this folder also gets `https://pr-<n>-storybook.joed.dev`.

- **Web-Legos**: the shared components (text, images, contact links, navigation, footer pieces, buttons, layouts).
- **Patterns**: every site's current footer and contact form, one per site. These are the "before" pictures for the shared skins (Plane WL-8, WL-9).
- **Sites**: each whole site, mounted by its own `src/index.js`.

Stories import the real source from `packages/`. Sites' `libraries/Web-Legos` imports point at `packages/web-legos`, so the catalog always shows current code.

## Data: live prod, read-only

Content comes from the production wl-cms through a **read-only key** (`WL_CMS_READ_API_KEY`):
- wl-cms accepts it for GET/HEAD and answers **403** to anything that would change data (`packages/wl-cms/lib/auth.js`).
- `scripts/glados/provision-cms-read-key.sh` generates the key into `wl-cms.env` and writes the catalog's `storybook.env`.
- The container serves the key to the browser as `/wl-config.js`.

wl-auth, wl-forms and site-mail aren't configured, so forms can't be submitted from the catalog. "Admin" stories fake the signed-in state to show admin UI; saving there fails because the key is read-only.

## Local

```powershell
npm ci --prefix tools/storybook          # plus the root `npm ci` for the sites' dependencies
$env:STORYBOOK_WL_CMS_READ_API_KEY = "<read-only key from glados wl-cms.env>"
npm run storybook --prefix tools/storybook   # http://localhost:6006
```

Without a key, WL components show their fallback content.

It lives outside the npm workspaces (like `tools/wl-lint`), so Storybook and Vite stay out of the root lockfile.
