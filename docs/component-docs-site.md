# Component Docs Site — Agent Handoff Plan

> **Goal:** Publish a Mantine-style component reference for WL-Universe on **GitHub Pages**, deployed on push to `main`.  
> **Hard rule:** Do **not** invent documentation prose. Index and surface text that already exists in source JSDoc/TSDoc/file headers. Missing docs → show “No docstring in source” (or omit the page), never AI filler.

## Why

Joe’s existing docstrings in `web-legos` (and sparse ones in `server-legos`) are the **final reference** for what parts do. The site is a browsable index of that truth, with small live previews where safe—similar in spirit to [Mantine Core docs](https://mantine.dev/core/package/).

## Recommended stack

| Piece | Choice | Why |
|-------|--------|-----|
| App | **Next.js App Router** in `packages/docs` | MDX pages, static export, familiar React |
| Hosting | **GitHub Pages** via `actions/deploy-pages` | Deploy on push to `main` |
| Export | `output: 'export'` + `basePath: '/WL-Universe'` (or repo name) | Pages is static-only |
| Doc extract | **react-docgen** (JSX) + **TypeDoc** (`api/*.ts`) + light custom parse for **server-legos** CJS | Fits current JSDoc style; no PropTypes |
| Live demos | Inline **client demos** on the component page (Mantine pattern), not Storybook-first | User asked for “a little example on the page” |
| Styling | Clean docs chrome (sidebar + content). Avoid purple/AI-default theme; keep readable | Match “reference” feel, not marketing |

**Do not** add a separate Storybook unless demos in Next become unblockable; prefer one site.

## Information architecture

```
/                         Overview (short; link sync paths — no invented essays)
/web-legos                Index of extracted components
/web-legos/[slug]         Title + docstring + props table + live demo (if registered)
/server-legos             Index of modules
/server-legos/[slug]      File header / JSDoc + mount snippet copied from source comments
/sites                    Per-app site-specific components
/sites/[app]              Inventory + any JSDoc found on site components
```

### Section rules

1. **web-legos** — Primary. Source: `packages/web-legos/components/**`, `Layouts/**`, `api/**`. ~60% of PascalCase exports already have adjacent JSDoc (`Text`, `Icons`, `Layout`, `Socials`, `Backgrounds` are richest).
2. **server-legos** — `packages/server-legos/*.js`. Surface module headers and `@deprecated` notes (`siteMail`, `siteHealth` patterns). Document V1 router vs V2 manager **only** from comments/code structure, not new narrative.
3. **Website-specific** — `packages/*/client/src/components/**`. CRM is large/product-specific; other sites are thin (Navbar/Footer). Label clearly as **not** shared legos. Extract JSDoc if present; otherwise list exports with “No docstring”.

## Live demos (on-page)

Register an allowlist of **presentational** demos (no Firebase/edit-mode required), e.g.:

- Icons / Socials icon row  
- Buttons  
- Waves / Backgrounds (static)  
- Simple Layout shells with hardcoded children  

For CMS/editable components (`WLText`, firestore-backed sections): **props table + docstring only** (or static screenshot later)—do not fake live Firebase on Pages.

Demo code lives beside the page (e.g. `packages/docs/demos/web-legos/IconColorsDemo.tsx`) and imports from `web-legos` via relative/workspace path mirroring app sync (`libraries/Web-Legos/...` mental model).

## Extraction pipeline

```
packages/web-legos/**/*.jsx  --react-docgen-->  .docs-cache/web-legos.json
packages/web-legos/api/**/*.ts --TypeDoc------>  .docs-cache/web-legos-api.json
packages/server-legos/*.js    --custom JSDoc-->  .docs-cache/server-legos.json
packages/*/client/src/components/**           -->  .docs-cache/sites/<app>.json

scripts/docs/generate-mdx.mjs  -->  packages/docs/content/**/*.mdx  (generated; commit or generate in CI)
```

Generated MDX must only include:

- export name  
- source file path + line  
- description / `@param` / `@default` / `@deprecated` / `@link` from AST  
- optional demo component id if in allowlist  

**CI fails or warns** if generator would write non-empty prose not present in source (keep generator dumb).

## GitHub Pages deploy

New workflow `.github/workflows/docs-pages.yml`:

- `on.push.branches: [main]` + `paths:` for `packages/docs/**`, `packages/web-legos/**`, `packages/server-legos/**`, `packages/*/client/src/components/**`, `scripts/docs/**`
- Job: install → generate docs cache → `next build` → upload artifact → `actions/deploy-pages`
- Permissions: `pages: write`, `id-token: write`
- One-time repo setting: enable Pages source = **GitHub Actions** (agent notes this in PR; owner clicks)

`next.config`: `output: 'export'`, `basePath`/`assetPrefix` matching Pages URL (`https://r2pen2.github.io/WL-Universe`).

## Out of scope

- Rewriting or “improving” docstring wording  
- Promoting CRM UI as shared design system  
- SSR/API routes on the docs site  
- Full interactive CMS demos on Pages  

## Agent operating notes

- Work on branch `feature/component-docs` off `main` (not in `/opt/actions-runner/_work/...` while Actions is running—use a clone under `/home/joe/src/WL-Universe` or similar).  
- Follow issue order below.  
- PR to `main` when issues 1–6 are done; link all issues.  

## Issue map

| # | Title |
|---|--------|
| 1 | Scaffold `packages/docs` Next.js static site + GH Pages workflow |
| 2 | Docstring extract pipeline (no invented copy) |
| 3 | Docs chrome + component page template (Mantine-like) |
| 4 | web-legos section: generated pages + presentational demos |
| 5 | server-legos section: generated module reference |
| 6 | Sites section + final Pages verify / PR |

Tracking issue / milestone: use labels `docs`, `gh-pages`.
