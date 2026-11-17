#!/usr/bin/env node
/**
 * Seed each site's contact info (wl-cms model collection `siteContacts`) from
 * deploy/cms/site-contacts.json. A site is only written while its collection is empty, so contacts
 * admins have edited in Site settings are never overwritten. Run by publish-app-images.yml after
 * deploys; safe to re-run.
 *
 *   WL_CMS_API_KEY=... node scripts/cms/seed-site-contacts.mjs [slug ...] [--dry-run]
 *   (no slugs = every site in the file; WL_CMS_URL defaults to https://wl-cms.joed.dev)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const all = JSON.parse(fs.readFileSync(path.join(root, "deploy/cms/site-contacts.json"), "utf8"));
delete all.$comment;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const slugs = args.filter((a) => !a.startsWith("--"));
const base = (process.env.WL_CMS_URL || "https://wl-cms.joed.dev").replace(/\/$/, "");
const key = process.env.WL_CMS_API_KEY || "";
if (!key) {
  console.error("Set WL_CMS_API_KEY.");
  process.exit(1);
}

const health = await fetch(`${base}/health`).then((r) => r.json()).catch(() => ({}));
if (!Array.isArray(health.features) || !health.features.includes("siteContacts")) {
  // An older wl-cms would put v1-model sites' contacts in an unscoped collection.
  console.log("wl-cms doesn't report the siteContacts feature yet; skipping (re-run after it deploys).");
}

function cms(site, apiPath, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("X-WL-Site", site);
  return fetch(`${base}${apiPath}`, { ...init, headers });
}

let failed = 0;
const ready = Array.isArray(health.features) && health.features.includes("siteContacts");
for (const site of ready ? (slugs.length ? slugs : Object.keys(all)) : []) {
  const contacts = all[site];
  if (!contacts) {
    console.log(`${site}: no contacts in site-contacts.json`);
    continue;
  }
  try {
    const res = await cms(site, "/site-models?collection=siteContacts");
    if (!res.ok) throw new Error(`GET ${res.status} ${await res.text()}`);
    const existing = await res.json();
    if (existing.length) {
      console.log(`${site}: ${existing.length} contact(s) already set, left alone`);
      continue;
    }
    const order = {};
    for (const { id, ...contact } of contacts) {
      order[contact.type] = (order[contact.type] ?? -1) + 1;
      const documentData = { ...contact, order: order[contact.type] };
      if (dryRun) {
        console.log(`${site}: would write ${id} ${JSON.stringify(documentData)}`);
        continue;
      }
      const post = await cms(site, "/site-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: "siteContacts", documentId: id, documentData }),
      });
      if (!post.ok) throw new Error(`POST ${id} ${post.status} ${await post.text()}`);
    }
    console.log(`${site}: ${dryRun ? "would seed" : "seeded"} ${contacts.length} contact(s)`);
  } catch (err) {
    failed++;
    console.error(`${site}: ${err.message}`);
  }
}
process.exitCode = failed ? 1 : 0;
