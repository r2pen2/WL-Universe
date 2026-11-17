#!/usr/bin/env node
/**
 * Snapshot each WL site's public CMS content into fixtures/ so the catalog renders real content
 * without calling any CMS at runtime:
 *   fixtures/cms.json                       text, image metadata and model collections per site
 *   fixtures/cms-assets/<site>/images/...   the image files those reference
 *
 * Reads only what the live sites already serve to every visitor: the CMS key comes from each
 * site's public /wl-config.js. Text and image ids are found in the site source (firestoreId="..."
 * and room01890's content.js); model collections from `super("<collection>"` in siteModels.ts.
 * Contacts come from deploy/cms/site-contacts.json.
 *
 *   node scripts/snapshot-cms.mjs [site ...]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = path.resolve(here, "..");
const repoRoot = path.resolve(pkg, "../..");
const fixtures = path.join(pkg, "fixtures");
const MAX_IMAGE_BYTES = 1536 * 1024;

const SITES = {
  "nicole-levin": "https://nicolelevin.org",
  "a-new-day-coaching": "https://anewdaycoaching.com",
  "beyond-the-bell": "https://beyondthebelleducation.com",
  "you-can-do-it-gardening": "https://youcandoitgardening.com",
  "talk-about-dreams": "https://talkaboutdreams.com",
  "boston-mixtape": "https://bostonmixtape.com",
  room01890: "https://room01890.joed.dev",
};

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "libraries" || entry.name === "node_modules") continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) out.push(p);
  }
  return out;
}

async function idsFor(site) {
  const files = walk(path.join(repoRoot, "packages", site, "client", "src"));
  const text = new Set();
  const images = new Set();
  const models = new Set(["siteContacts"]);
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    for (const m of src.matchAll(/<(\w+)[^>]*?\bfirestoreId=["']([^"']+)["']/g)) {
      (/Image/.test(m[1]) ? images : text).add(m[2]);
    }
    for (const m of src.matchAll(/super\(\s*["']([\w-]+)["']/g)) models.add(m[1]);
  }
  if (site === "room01890") {
    const content = await import(pathToFileURL(path.join(repoRoot, "packages/room01890/client/src/content.js")).href);
    Object.keys(content.TEXT).forEach((id) => text.add(id));
    content.IMAGES.forEach((img) => images.add(img.id));
  }
  return { text: [...text], images: [...images], models: [...models].filter((m) => m !== "example-models") };
}

// Every site uses the same prod wl-cms and key, so the first site that answers is enough.
let sharedConfig = null;
async function publicCmsConfig(origin) {
  if (sharedConfig) return sharedConfig;
  for (const o of [origin, ...Object.values(SITES)]) {
    try {
      sharedConfig = await readConfig(o);
      return sharedConfig;
    } catch {
      // try the next site
    }
  }
  throw new Error("no site served a usable /wl-config.js");
}

async function readConfig(origin) {
  const js = await (await fetch(`${origin}/wl-config.js`, { headers: { "User-Agent": "Mozilla/5.0 (wl-storybook snapshot)" } })).text();
  const block = /__WL_CMS__=\{([^}]*)\}/.exec(js);
  if (!block) throw new Error(`no __WL_CMS__ in ${origin}/wl-config.js`);
  const get = (k) => (new RegExp(`${k}:"([^"]*)"`).exec(block[1]) || [])[1];
  return { url: get("url"), apiKey: get("apiKey"), site: get("site") };
}

async function snapshotSite(site, origin, contacts) {
  const cfg = await publicCmsConfig(origin);
  const cms = (p) => fetch(`${cfg.url}${p}`, { headers: { Authorization: `Bearer ${cfg.apiKey}`, "X-WL-Site": site } });
  const ids = await idsFor(site);
  const out = { text: {}, images: {}, models: {} };

  for (const id of ids.text) {
    const res = await cms(`/site-text?id=${encodeURIComponent(id)}`);
    if (res.ok) out.text[id] = await res.text();
  }
  const files = new Set();
  for (const id of ids.images) {
    const res = await cms(`/site-images?id=${encodeURIComponent(id)}`);
    if (!res.ok) continue;
    out.images[id] = await res.json();
    if (out.images[id].source) files.add(out.images[id].source);
  }
  for (const collection of ids.models) {
    if (collection === "siteContacts") continue;
    const res = await cms(`/site-models?collection=${encodeURIComponent(collection)}`);
    if (!res.ok) continue;
    const docs = await res.json();
    out.models[collection] = docs;
    for (const doc of docs) {
      for (const value of Object.values(doc)) {
        if (typeof value === "string" && /^images\/[^/]+\.(jpe?g|png|webp|gif|svg)$/i.test(value)) files.add(value);
      }
    }
  }
  out.models.siteContacts = (contacts[site] || []).map(({ id, ...c }, i) => ({ id, ...c, order: i }));

  let bytes = 0;
  let skipped = 0;
  for (const source of files) {
    const res = await fetch(`${cfg.url}/assets/${site}/${source}`);
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) {
      skipped++;
      continue;
    }
    const dest = path.join(fixtures, "cms-assets", site, source);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    bytes += buf.length;
  }
  console.log(
    `${site}: ${Object.keys(out.text).length}/${ids.text.length} text, ${Object.keys(out.images).length}/${ids.images.length} images, ` +
      `${Object.keys(out.models).length} model collections, ${files.size - skipped} files (${(bytes / 1024 / 1024).toFixed(1)} MB)` +
      (skipped ? `, ${skipped} over ${MAX_IMAGE_BYTES / 1024} KB skipped` : ""),
  );
  return out;
}

const wanted = process.argv.slice(2);
const contacts = JSON.parse(fs.readFileSync(path.join(repoRoot, "deploy/cms/site-contacts.json"), "utf8"));
const file = path.join(fixtures, "cms.json");
const all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
for (const [site, origin] of Object.entries(SITES)) {
  if (wanted.length && !wanted.includes(site)) continue;
  fs.rmSync(path.join(fixtures, "cms-assets", site), { recursive: true, force: true });
  try {
    all[site] = await snapshotSite(site, origin, contacts);
  } catch (err) {
    console.error(`${site}: ${err.message}`);
  }
}
fs.mkdirSync(fixtures, { recursive: true });
fs.writeFileSync(file, JSON.stringify(all, null, 2) + "\n");
