#!/usr/bin/env node
/**
 * Merge private client billing details into the live billing catalog on glados.
 *
 * This repo is public, so per-client billing details (which Stripe customer a site bills to, and when
 * its first charge is due) are not in deploy/billing/sites.json. They live in the SITE_BILLING_CLIENTS_JSON
 * GitHub secret; the publish workflow passes it here after copying the public catalog into place.
 *
 *   node merge-private-clients.mjs <live catalog path>      (JSON on stdin)
 *
 * Input: { "<site id>": { "stripeCustomerId": "cus_...", "subscriptionStartsAt": "2027-10-01" }, ... }
 * Only those two fields are accepted, only for sites already in the catalog; anything else fails the
 * deploy loudly rather than being half-applied. Prints site ids and which fields were set, never values.
 */
import fs from "node:fs";

export const ALLOWED_FIELDS = ["stripeCustomerId", "subscriptionStartsAt"];

export function mergeClients(catalog, clients) {
  if (!clients || typeof clients !== "object" || Array.isArray(clients)) {
    throw new Error("client details must be a JSON object keyed by site id");
  }
  const byId = new Map(catalog.sites.map((s) => [s.id, s]));
  const applied = [];
  for (const [id, fields] of Object.entries(clients)) {
    const site = byId.get(id);
    if (!site) throw new Error(`unknown site '${id}'`);
    if (site.billedWith) throw new Error(`'${id}' is billed with '${site.billedWith}'; set details on that site`);
    for (const [key, value] of Object.entries(fields || {})) {
      if (!ALLOWED_FIELDS.includes(key)) throw new Error(`'${id}': field '${key}' isn't allowed`);
      if (key === "stripeCustomerId" && !/^cus_[A-Za-z0-9]+$/.test(String(value))) {
        throw new Error(`'${id}': stripeCustomerId doesn't look like a Stripe customer id`);
      }
      if (key === "subscriptionStartsAt" && Number.isNaN(Date.parse(value))) {
        throw new Error(`'${id}': subscriptionStartsAt isn't a date`);
      }
    }
    Object.assign(site, fields);
    applied.push(`${id} (${Object.keys(fields || {}).join(", ")})`);
  }
  return applied;
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("/merge-private-clients.mjs")) {
  const file = process.argv[2];
  if (!file) throw new Error("usage: merge-private-clients.mjs <live catalog path> < clients.json");
  const input = fs.readFileSync(0, "utf8").trim();
  if (!input) {
    console.log("No private client details given; catalog unchanged.");
  } else {
    const catalog = JSON.parse(fs.readFileSync(file, "utf8"));
    const applied = mergeClients(catalog, JSON.parse(input));
    fs.writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`);
    console.log(`Merged private billing details for: ${applied.join("; ") || "nothing"}`);
  }
}
