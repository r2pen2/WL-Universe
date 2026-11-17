# room01890

Rebuild of room01890.com (a Wix site) as a WL site, served at **https://room01890.joed.dev**.

- Pages: `/` (Hero, Meeting Space, Events & Games, Our Space gallery and lightbox, Get in Touch form) and `/book-online` (Consultation service card).
- Data: wl-cms site `room01890`, siteKey **`R01`**, in the shared `wladminportal` Firebase project. Text lives in `siteText-R01`, images in `siteImages-R01`, users in `users-R01`. Inquiry-form responses go through wl-forms (`formId: room01890-inquiry`), plus an email via site-mail (`SITE_ROOM01890_*`).
- Every piece of copy is a WL header or text element (`WLLayoutHeader` / `WLLayoutText`, wrapped in `client/src/components/Wl.jsx`), keyed by a text id in [`client/src/content.js`](client/src/content.js). That file also holds the exact source copy, which is used as the fallback until the CMS has the id. Every photo is a `WLImageV2`, keyed by an image id in the same file. Signed-in admins (joed.dev SSO) can click any text or photo to edit it.

## Scripts

```bash
# Re-download the source photos, logo and SVG glyphs from room01890.com
node packages/room01890/scripts/fetch-source-assets.mjs

# Seed wl-cms with the source copy + photos (skips ids that already exist; --overwrite to replace)
WL_CMS_URL=https://wl-cms.joed.dev WL_CMS_API_KEY=... node packages/room01890/scripts/seed-cms.mjs
```

`source-assets/` holds what was downloaded:

- `images/`: photos at no more than 1920px, the files that get uploaded to the CMS
- `icons/`: every inline SVG glyph on the source pages

The bundled copies used by the client are in `client/src/assets/`.

## Local dev

```powershell
npm run client -- room01890   # port 3113; needs the local stack (npm run stack) with a wladminportal service account
```

## Deploy

The site deploys like the other SPA sites, through `publish-app-images.yml` (`deploy/compose/room01890.yml`, with a Traefik rule for `room01890.joed.dev`).

On its first prod deploy, `scripts/glados/provision-site.sh` sets up the site on glados:

- creates `/opt/services/data/app-env/room01890.env`
- copies the wladminportal service account
- generates the wl-auth and wl-forms keys

After that first deploy, run the seed script once.

Admin sign-in (Google) also needs `room01890.joed.dev` listed under *Authorized domains* in the wladminportal Firebase Auth settings.
