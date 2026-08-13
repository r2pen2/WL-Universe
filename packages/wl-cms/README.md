# @wl-universe/wl-cms

Shared CMS microservice for WL-Universe marketing sites (site text, images metadata, models, image blobs, BTB live collections).

## Run locally

Prefer the monorepo stack:

```powershell
npm run stack
```

Or:

```powershell
npm start -w @wl-universe/wl-cms
```

Default port **3021**. Auth: `Authorization: Bearer <WL_CMS_API_KEY>`. Site: `X-WL-Site` / `?site=` / `body.site`.

## Endpoints

- `GET /health`, `GET /liveness`
- `GET|POST /site-text`, `/site-images`, `/site-models`
- `GET /site-rules/max-upload`
- `GET|POST /images/*`, `POST /delete-img`
- `GET /assets/:site/...` (public image files)
- `GET /testimonials|offerings|staff` (beyond-the-bell only)

See [deploy/local/README.md](../../deploy/local/README.md).
