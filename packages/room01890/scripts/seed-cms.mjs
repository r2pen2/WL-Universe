/**
 * Seeds room01890's wl-cms data (siteText-R01 / siteImages-R01) with the copy and photos from
 * room01890.com, so the CMS starts identical to the source site.
 *
 *   WL_CMS_URL=https://wl-cms.joed.dev WL_CMS_API_KEY=... \
 *     node packages/room01890/scripts/seed-cms.mjs [--overwrite] [--dry-run] [--only text|images]
 *
 * Idempotent: ids that already exist in the CMS are left alone unless --overwrite, so edits made
 * on the live site are never clobbered by a re-run. Text comes from client/src/content.js; photos
 * from source-assets/images/ (run fetch-source-assets.mjs first if they're missing).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IMAGES, TEXT } from "../client/src/content.js";

const SITE = "room01890";
const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const overwrite = args.has("--overwrite");
const dryRun = args.has("--dry-run");
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex > -1 ? process.argv[onlyIndex + 1] : null;

const base = (process.env.WL_CMS_URL || "").replace(/\/$/, "");
const key = process.env.WL_CMS_API_KEY || "";
if (!base || !key) {
  console.error("Set WL_CMS_URL and WL_CMS_API_KEY.");
  process.exit(1);
}

function cms(apiPath, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("X-WL-Site", SITE);
  return fetch(`${base}${apiPath}`, { ...init, headers });
}

async function exists(kind, id) {
  const res = await cms(`/${kind}?id=${encodeURIComponent(id)}`);
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`GET /${kind}?id=${id} -> ${res.status} ${await res.text()}`);
  return true;
}

let written = 0;
let skipped = 0;

if (only !== "images") {
  for (const [id, text] of Object.entries(TEXT)) {
    if (!overwrite && (await exists("site-text", id))) {
      skipped++;
      continue;
    }
    if (dryRun) {
      console.log(`would write text ${id}`);
      continue;
    }
    const res = await cms("/site-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, newText: text }),
    });
    if (!res.ok) throw new Error(`POST /site-text ${id} -> ${res.status} ${await res.text()}`);
    console.log(`text  ${id}`);
    written++;
  }
}

if (only !== "text") {
  for (const img of IMAGES) {
    if (!overwrite && (await exists("site-images", img.id))) {
      skipped++;
      continue;
    }
    const file = path.join(pkg, "source-assets", "images", img.fileName);
    if (!fs.existsSync(file)) throw new Error(`Missing ${file}; run scripts/fetch-source-assets.mjs`);
    if (dryRun) {
      console.log(`would upload image ${img.id} (${img.fileName})`);
      continue;
    }
    const form = new FormData();
    form.append("file", new Blob([fs.readFileSync(file)], { type: "image/jpeg" }), img.fileName);
    form.append("firestoreId", img.id);
    form.append("fileName", img.fileName);
    const res = await cms("/site-images", { method: "POST", body: form });
    if (!res.ok) throw new Error(`POST /site-images ${img.id} -> ${res.status} ${await res.text()}`);
    console.log(`image ${img.id}`);
    written++;
  }
}

console.log(`${dryRun ? "dry run: " : ""}${written} written, ${skipped} already present${overwrite ? "" : " (use --overwrite to replace)"}`);
