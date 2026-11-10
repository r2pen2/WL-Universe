import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import fs from "node:fs";
import os from "node:os";

const require = createRequire(import.meta.url);
const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { mergeClients } = await import(new URL("../../../scripts/billing/merge-private-clients.mjs", import.meta.url));

// The public catalog plus made-up private client details, merged the way the deploy does it.
const FAKE = {
  "beyond-the-bell": { stripeCustomerId: "cus_TESTbtb", subscriptionStartsAt: "2026-12-09" },
  "nicole-levin": { stripeCustomerId: "cus_TESTnl" },
  "boston-mixtape": { stripeCustomerId: "cus_TESTbbm", subscriptionStartsAt: "2027-10-01" },
  "a-new-day-coaching": { stripeCustomerId: "cus_TESTandc" },
};
const publicCatalog = JSON.parse(fs.readFileSync(path.join(repoRoot, "deploy/billing/sites.json"), "utf8"));
const merged = structuredClone(publicCatalog);
mergeClients(merged, FAKE);
const tmpCatalog = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "join-")), "sites.json");
fs.writeFileSync(tmpCatalog, JSON.stringify(merged));
process.env.SITE_BILLING_CATALOG_PATH = tmpCatalog;
process.env.SITE_BILLING_API_KEY = "test-key";
const { joinToken, joinUrl, startJoin, trialEnd } = require("../lib/join.js");
const catalog = require("../lib/catalog.js");

// The real catalog has no price id (bootstrap writes it on glados); stub it for these tests.
catalog.sharedPriceId = () => "price_20";
const PRICE = "price_20";

function fakeStripe(subsByCustomer = {}) {
  const created = [];
  return {
    created,
    subscriptions: { list: async ({ customer }) => ({ data: subsByCustomer[customer] || [] }) },
    checkout: { sessions: { create: async (params) => { created.push(params); return { url: "https://checkout.stripe.com/c/pay/x" }; } } },
  };
}
const sub = (status, price = PRICE, extra = {}) => ({ status, cancel_at_period_end: false, items: { data: [{ price: { id: price } }] }, ...extra });
const NOW = Date.parse("2026-11-10T00:00:00Z");

test("links are permanent per site and can't be forged", () => {
  assert.equal(joinToken("nicole-levin"), joinToken("nicole-levin"));
  assert.notEqual(joinToken("nicole-levin"), joinToken("boston-mixtape"));
  assert.match(joinUrl("nicole-levin"), /^https:\/\/billing\.joed\.dev\/join\/nicole-levin\/[0-9a-f]{32}$/);
});

test("a valid link opens Checkout on the client's existing customer at the shared price", async () => {
  const stripe = fakeStripe();
  const r = await startJoin("nicole-levin", joinToken("nicole-levin"), { stripe, now: NOW });
  assert.equal(r.redirect, "https://checkout.stripe.com/c/pay/x");
  const [p] = stripe.created;
  assert.equal(p.mode, "subscription");
  assert.equal(p.customer, "cus_TESTnl");
  assert.deepEqual(p.line_items, [{ price: PRICE, quantity: 1 }]);
  assert.equal(p.subscription_data.trial_end, undefined, "Nicole starts now");
  assert.equal(p.success_url, "https://nicolelevin.org/?billing=success");
});

test("Rachel's link covers the CRM; Behzad and Nancy aren't charged until their paid time runs out", async () => {
  const stripe = fakeStripe();
  await startJoin("a-new-day-coaching", joinToken("a-new-day-coaching"), { stripe, now: NOW });
  assert.equal(stripe.created[0].customer, "cus_TESTandc");
  assert.equal(stripe.created[0].subscription_data.metadata.site_ids, "a-new-day-coaching,a-new-day-coaching-crm");

  await startJoin("boston-mixtape", joinToken("boston-mixtape"), { stripe, now: NOW });
  assert.equal(stripe.created[1].subscription_data.trial_end, Date.parse("2027-10-01") / 1000);

  await startJoin("beyond-the-bell", joinToken("beyond-the-bell"), { stripe, now: NOW });
  assert.equal(stripe.created[2].customer, "cus_TESTbtb");
  assert.equal(stripe.created[2].subscription_data.trial_end, Date.parse("2026-12-09") / 1000);
});

test("start dates in the past (or within two days) just start now", () => {
  assert.equal(trialEnd({ subscriptionStartsAt: "2026-11-11" }, NOW), null);
  assert.equal(trialEnd({ subscriptionStartsAt: "2026-01-01" }, NOW), null);
  assert.equal(trialEnd({}, NOW), null);
});

test("already on the plan: no second Checkout; an ending old plan doesn't count", async () => {
  const stripe = fakeStripe({
    cus_TESTnl: [sub("active")],
    cus_TESTbtb: [sub("active", "price_old10", { cancel_at_period_end: true })],
    cus_TESTbbm: [sub("trialing")],
  });
  assert.equal((await startJoin("nicole-levin", joinToken("nicole-levin"), { stripe, now: NOW })).page, "already");
  assert.equal((await startJoin("boston-mixtape", joinToken("boston-mixtape"), { stripe, now: NOW })).page, "already");
  assert.ok((await startJoin("beyond-the-bell", joinToken("beyond-the-bell"), { stripe, now: NOW })).redirect);
  assert.equal(stripe.created.length, 1);
});

test("forged tokens, unknown sites, riders and sites without a customer are refused", async () => {
  const stripe = fakeStripe();
  const code = async (site, token) => {
    try { await startJoin(site, token, { stripe, now: NOW }); return 200; } catch (e) { return e.statusCode; }
  };
  assert.equal(await code("nicole-levin", joinToken("boston-mixtape")), 404);
  assert.equal(await code("nicole-levin", "0".repeat(32)), 404);
  assert.equal(await code("nope", joinToken("nope")), 404);
  assert.equal(await code("a-new-day-coaching-crm", joinToken("a-new-day-coaching-crm")), 404);
  assert.equal(await code("talk-about-dreams", joinToken("talk-about-dreams")), 409);
  assert.equal(stripe.created.length, 0);
});

test("the public catalog carries no client billing details", () => {
  for (const site of publicCatalog.sites) {
    assert.equal(site.stripeCustomerId ?? null, null, site.id);
    assert.equal(site.subscriptionStartsAt, undefined, site.id);
  }
});

test("merge-private-clients only accepts known fields for known, non-rider sites", () => {
  const fresh = () => structuredClone(publicCatalog);
  assert.throws(() => mergeClients(fresh(), { nope: { stripeCustomerId: "cus_x" } }), /unknown site/);
  assert.throws(() => mergeClients(fresh(), { "a-new-day-coaching-crm": { stripeCustomerId: "cus_x" } }), /billed with/);
  assert.throws(() => mergeClients(fresh(), { "nicole-levin": { billingRequired: true } }), /isn't allowed/);
  assert.throws(() => mergeClients(fresh(), { "nicole-levin": { stripeCustomerId: "sub_x" } }), /customer id/);
  assert.throws(() => mergeClients(fresh(), { "nicole-levin": { subscriptionStartsAt: "soon" } }), /isn't a date/);
  assert.throws(() => mergeClients(fresh(), []), /JSON object/);
  const c = fresh();
  assert.deepEqual(mergeClients(c, { "nicole-levin": { stripeCustomerId: "cus_x" } }), ["nicole-levin (stripeCustomerId)"]);
  assert.equal(c.sites.find((x) => x.id === "nicole-levin").stripeCustomerId, "cus_x");
});
