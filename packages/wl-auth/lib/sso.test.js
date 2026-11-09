const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { isSsoSiteAdmin, effectivePermissionsFor, lumosGrants, _cache } = require("./sso");
const { createAuthRouter } = require("../routes/auth");

beforeEach(() => _cache.clear());

const lumos = { "joe@x.com": "admin", "client@x.com": ["you-can-do-it-gardening"] };
const deps = {
  verifiedEmail: async (_slug, uid) => ({ joe: "joe@x.com", client: "client@x.com", rando: "rando@x.com", unverified: "" })[uid] ?? "",
  lumosGrants: async (email, slug) => lumos[email] === "admin" || (lumos[email] || []).includes?.(slug) || false,
};

test("Lumos admins administer every site; others only the sites Lumos gives them", async () => {
  assert.equal(await isSsoSiteAdmin("you-can-do-it-gardening", "joe", deps), true);
  assert.equal(await isSsoSiteAdmin("nicole-levin", "joe", deps), true);
  assert.equal(await isSsoSiteAdmin("you-can-do-it-gardening", "client", deps), true);
  assert.equal(await isSsoSiteAdmin("nicole-levin", "client", deps), false);
  assert.equal(await isSsoSiteAdmin("nicole-levin", "rando", deps), false);
  assert.equal(await isSsoSiteAdmin("nicole-levin", "unverified", deps), false, "no verified email, no SSO");
});

test("fails closed and doesn't cache failures", async () => {
  let calls = 0;
  const flaky = { verifiedEmail: async () => "joe@x.com", lumosGrants: async () => { calls++; if (calls === 1) throw new Error("access down"); return true; } };
  assert.equal(await isSsoSiteAdmin("nicole-levin", "joe", flaky), false);
  assert.equal(await isSsoSiteAdmin("nicole-levin", "joe", flaky), true);
  assert.equal(await isSsoSiteAdmin("nicole-levin", "joe", flaky), true);
  assert.equal(calls, 2, "second answer cached");
});

test("effective permissions: SSO admins become operators with everything on", async () => {
  assert.deepEqual(await effectivePermissionsFor("nicole-levin", "joe", { permissions: { siteText: false, siteImages: false } }, deps),
    { siteText: true, siteImages: true, op: true });
  assert.deepEqual(await effectivePermissionsFor("nicole-levin", "joe", null, deps), { op: true });
  assert.deepEqual(await effectivePermissionsFor("nicole-levin", "rando", { permissions: { siteText: true } }, deps), { siteText: true });
});

test("lumosGrants asks access.joed.dev's internal endpoint", async () => {
  let asked;
  const fetchImpl = async (url) => { asked = url; return { ok: true, json: async () => ({ admin: false, access: true }) }; };
  assert.equal(await lumosGrants("Client@X.com", "you-can-do-it-gardening", fetchImpl), true);
  assert.equal(asked, "http://access:3000/internal/access?email=Client%40X.com&app=you-can-do-it-gardening");
  await assert.rejects(lumosGrants("a@b.c", "s", async () => ({ ok: false, status: 404 })));
});

test("GET /site-auth: SSO admins get op even without a users doc; others unchanged", async () => {
  const docs = { client: { permissions: { siteText: false } }, editor: { permissions: { siteText: true } } };
  const app = express();
  app.use((req, _res, next) => {
    req.wlSite = { slug: "you-can-do-it-gardening", usersCollection: "users" };
    req.wlCtx = { db: { collection: () => ({ doc: (id) => ({ get: async () => ({ exists: id in docs, data: () => docs[id] }) }) }) } };
    next();
  });
  app.use("/site-auth", createAuthRouter(deps));
  const server = app.listen(0);
  const get = async (id) => {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/site-auth?id=${id}`);
    return [res.status, res.status === 200 ? await res.json() : null];
  };
  try {
    assert.deepEqual(await get("joe"), [200, { op: true }], "no doc, Lumos admin");
    assert.deepEqual(await get("client"), [200, { siteText: true, op: true }], "doc + Lumos grant for this site");
    assert.deepEqual(await get("editor"), [200, { siteText: true }], "doc only");
    assert.deepEqual(await get("rando"), [404, null], "neither");
  } finally {
    server.close();
  }
});
