const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { createChangeRequestsRouter, ticketName } = require("./changeRequests");
const { createPlaneClient } = require("../lib/plane");

const users = {
  admin: { permissions: { siteText: true, siteImages: false } },
  op: { permissions: { op: true } },
  visitor: { permissions: { siteText: false } },
};

async function withServer(deps, fn) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.wlSite = { slug: "nicole-levin", usersCollection: "users-NL" };
    req.wlCtx = {
      db: {
        collection: (name) => {
          assert.equal(name, "users-NL");
          return { doc: (uid) => ({ get: async () => ({ exists: uid in users, data: () => users[uid] }) }) };
        },
      },
    };
    next();
  });
  app.use("/change-requests", createChangeRequestsRouter(deps));
  const server = app.listen(0);
  try {
    await fn(`http://127.0.0.1:${server.address().port}/change-requests`);
  } finally {
    server.close();
  }
}

const notified = [];
const noSso = { verifiedEmail: async () => "", notify: (d) => notified.push(d) };

const verifyIdToken = async (slug, token) => {
  assert.equal(slug, "nicole-levin");
  if (!(token in users)) throw new Error("bad token");
  return { uid: token, email: `${token}@example.com`, name: token === "admin" ? "Pat <Admin>" : "" };
};

function fakePlane() {
  const created = [];
  return {
    created,
    createWorkItem: async (item) => {
      created.push(item);
      return { identifier: `WL-${created.length + 10}`, url: `https://plane.joed.dev/main/browse/WL-${created.length + 10}/` };
    },
  };
}

const post = (url, token, body) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { "X-Firebase-Auth": `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

test("an admin's request becomes a labelled ticket", async () => {
  const plane = fakePlane();
  await withServer({ verifyIdToken, plane, ...noSso }, async (url) => {
    const res = await post(url, "admin", {
      description: "Change it to <b>Spring</b>.\n\nThanks",
      pageUrl: "https://nicolelevin.org/about",
    });
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.deepEqual(json.ticket, { identifier: "WL-11", url: "https://plane.joed.dev/main/browse/WL-11/" });
    const [item] = plane.created;
    const mail = notified.at(-1);
    assert.equal(mail.ticket.identifier, "WL-11");
    assert.equal(mail.site, "nicole-levin");
    assert.equal(mail.user.email, "admin@example.com");
    assert.equal(mail.pageUrl, "https://nicolelevin.org/about");
    assert.equal(item.name, "Change it to <b>Spring</b>.");
    assert.equal(item.label, "nicole-levin");
    assert.match(item.descriptionHtml, /<p>Change it to &lt;b&gt;Spring&lt;\/b&gt;\.<\/p><p>Thanks<\/p>/);
    assert.match(item.descriptionHtml, /Requested by: Pat &lt;Admin&gt; &lt;admin@example.com&gt;/);
    assert.match(item.descriptionHtml, /href="https:\/\/nicolelevin.org\/about"/);
  });
});

test("operators count as admins", async () => {
  const plane = fakePlane();
  await withServer({ verifyIdToken, plane, ...noSso }, async (url) => {
    assert.equal((await post(url, "op", { description: "x" })).status, 201);
  });
});

test("refuses missing/bad tokens, non-admins, bad input, and odd page URLs", async () => {
  const plane = fakePlane();
  await withServer({ verifyIdToken, plane, ...noSso }, async (url) => {
    assert.equal((await post(url, null, { description: "x" })).status, 401);
    assert.equal((await post(url, "forged", { description: "x" })).status, 401);
    assert.equal((await post(url, "visitor", { description: "x" })).status, 403);
    assert.equal((await post(url, "admin", { description: "  " })).status, 400);
    assert.equal((await post(url, "admin", {})).status, 400);
    assert.equal((await post(url, "admin", { description: "y".repeat(5001) })).status, 400);
    assert.equal(plane.created.length, 0);
    const before = notified.length;
    assert.equal((await post(url, "admin", { description: "x", pageUrl: "javascript:alert(1)" })).status, 201);
    assert.doesNotMatch(plane.created[0].descriptionHtml, /javascript:|Page:/);
    assert.equal(notified.length, before + 1, "one email per ticket, none for refused requests");
  });
});

test("rate limits each admin to 10 an hour", async () => {
  const plane = fakePlane();
  await withServer({ verifyIdToken, plane, ...noSso }, async (url) => {
    for (let i = 0; i < 10; i++) assert.equal((await post(url, "admin", { title: `t${i}` })).status, 201);
    assert.equal((await post(url, "admin", { description: "one too many" })).status, 429);
    assert.equal((await post(url, "op", { description: "someone else" })).status, 201);
  });
});

test("Plane failures surface as 502 without creating anything twice", async () => {
  const plane = { createWorkItem: async () => { throw new Error("Plane POST -> 500"); } };
  const before = notified.length;
  await withServer({ verifyIdToken, plane, ...noSso }, async (url) => {
    const res = await post(url, "admin", { description: "x" });
    assert.equal(res.status, 502);
  });
  assert.equal(notified.length, before, "no email when no ticket");
});

test("Plane client reuses an existing label (any case), creates a missing one once, builds the browse URL", async () => {
  const calls = [];
  let labels = [{ id: "L1", name: "Nicole-Levin" }];
  let seq = 41;
  const fetchImpl = async (url, init) => {
    const path = url.replace("https://plane.example/api/v1/workspaces/main/projects/P", "");
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push([init.method, path, body]);
    assert.equal(init.headers["X-API-Key"], "k");
    let out;
    if (path === "/") out = { identifier: "WL" };
    else if (path.startsWith("/labels/") && init.method === "GET") out = { results: labels };
    else if (path === "/labels/") { out = { id: "L2", name: body.name }; labels = [...labels, out]; }
    else if (path === "/work-items/") out = { id: "i", sequence_id: ++seq };
    return { ok: true, status: 200, json: async () => out, text: async () => "" };
  };
  const plane = createPlaneClient({ apiKey: "k", baseUrl: "https://plane.example", workspace: "main", projectId: "P" }, fetchImpl);

  assert.deepEqual(await plane.createWorkItem({ name: "a", descriptionHtml: "<p>a</p>", label: "nicole-levin" }), {
    identifier: "WL-42",
    url: "https://plane.example/main/browse/WL-42/",
  });
  assert.deepEqual(calls.find((c) => c[1] === "/work-items/")[2], { name: "a", description_html: "<p>a</p>", labels: ["L1"] });

  await plane.createWorkItem({ name: "b", descriptionHtml: "", label: "boston-mixtape" });
  await plane.createWorkItem({ name: "c", descriptionHtml: "", label: "boston-mixtape" });
  assert.equal(calls.filter((c) => c[0] === "POST" && c[1] === "/labels/").length, 1, "label created once");
  assert.equal(calls.filter((c) => c[1] === "/").length, 1, "project identifier fetched once");
});

test("SSO admins of the site can file requests without any users-collection permission", async () => {
  const plane = fakePlane();
  const sso = { verifiedEmail: async (_s, uid) => (uid === "visitor" ? "joe@x.com" : ""), lumosGrants: async () => true, notify: () => {} };
  require("../lib/sso")._cache.clear();
  await withServer({ verifyIdToken, plane, ...sso }, async (url) => {
    assert.equal((await post(url, "visitor", { description: "x" })).status, 201);
  });
});

test("older site builds that still send a title get it folded into the details", async () => {
  const plane = fakePlane();
  await withServer({ verifyIdToken, plane, ...noSso }, async (url) => {
    assert.equal((await post(url, "admin", { title: "New hours", description: "Mon-Fri 9-5" })).status, 201);
    assert.equal(plane.created[0].name, "New hours");
    assert.match(plane.created[0].descriptionHtml, /<p>New hours<\/p><p>Mon-Fri 9-5<\/p>/);
  });
});

test("ticket names come from the first line of the details, cut at a word", () => {
  assert.equal(ticketName("\n  Fix the hours  \nmore", "s"), "Fix the hours");
  assert.equal(ticketName("", "nicole-levin"), "Content change on nicole-levin");
  const long = ticketName("word ".repeat(40), "s");
  assert.ok(long.length <= 80 && long.endsWith("word…"), long);
});
