# Local development (microservices + CRA)

## Quick start

```powershell
copy deploy\local\.env.example deploy\local\.env
# set WL_CMS_API_KEY + WL_AUTH_API_KEY; place Firebase SAs under packages/<site>/config/
npm install --legacy-peer-deps

npm run stack                          # wl-cms :3021, wl-auth :3022 (+ forms/mail if keyed)
npm run client -- nicole-levin
npm run client -- beyond-the-bell
```

Marketing CMS sites have **no** `server.js` — only CRA locally and nginx static images in prod.

Apps that still ship Node: `joe-dobbelaar`, `a-new-day-coaching-crm`, `wl-admin-portal`, plus microservices (`wl-cms`, `wl-auth`, `wl-forms`, `site-mail`).

## Microservices

| Service | Port | Host |
|---------|------|------|
| site-mail | 3020 | site-mail.joed.dev |
| wl-cms | 3021 | wl-cms.joed.dev |
| wl-auth | 3022 | wl-auth.joed.dev |
| wl-forms | 3023 | wl-forms.joed.dev |

Static SPA images write `wl-config.js` at container start from env (`WL_CMS_*`, `WL_AUTH_*`, …).
