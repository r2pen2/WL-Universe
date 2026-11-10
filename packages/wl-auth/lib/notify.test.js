const { test } = require("node:test");
const assert = require("node:assert/strict");
const { notifyChangeRequest, buildChangeRequestEmail } = require("./notify");

const details = {
  ticket: { identifier: "WL-5", url: "https://plane.joed.dev/main/browse/WL-5/" },
  site: "you-can-do-it-gardening",
  title: "New <hours>",
  description: "Mon-Fri\n9-5",
  user: { email: "client@example.com", name: "Pat" },
  pageUrl: "https://youcandoitgardening.com/contact",
};

test("email: filterable subject, reply goes to the requester, content escaped", () => {
  const m = buildChangeRequestEmail(details);
  assert.equal(m.subject, "[Change request] WL-5 · you-can-do-it-gardening: New <hours>");
  assert.equal(m.replyTo, "client@example.com");
  assert.match(m.text, /Pat <client@example.com> requested a content change on you-can-do-it-gardening/);
  assert.match(m.text, /Ticket: WL-5 https:\/\/plane.joed.dev\/main\/browse\/WL-5\//);
  assert.match(m.html, /<h3>New &lt;hours&gt;<\/h3>/);
  assert.match(m.html, /Mon-Fri<br \/>9-5/);
  assert.match(m.html, /href="https:\/\/plane.joed.dev\/main\/browse\/WL-5\/"/);
});

test("sends high priority through site-mail with the configured profile and recipient", async () => {
  let sent;
  const fetchImpl = async (url, init) => { sent = { url, init, body: JSON.parse(init.body) }; return { ok: true }; };
  const env = { SITE_MAIL_API_KEY: "k" };
  assert.equal(await notifyChangeRequest(details, { env, fetchImpl }), true);
  assert.equal(sent.url, "https://site-mail.joed.dev/v1/send");
  assert.equal(sent.init.headers.Authorization, "Bearer k");
  assert.equal(sent.body.site, "billing");
  assert.equal(sent.body.to, "joedobbelaar@gmail.com");
  assert.equal(sent.body.priority, "high");
  assert.equal(sent.body.replyTo, "client@example.com");
  assert.ok(sent.body.subject.startsWith("[Change request] WL-5"));
});

test("never throws: no key, site-mail error, network error", async () => {
  assert.equal(await notifyChangeRequest(details, { env: {}, fetchImpl: async () => { throw new Error("should not call"); } }), false);
  assert.equal(await notifyChangeRequest(details, { env: { SITE_MAIL_API_KEY: "k" }, fetchImpl: async () => ({ ok: false, status: 502, text: async () => "smtp" }) }), false);
  assert.equal(await notifyChangeRequest(details, { env: { SITE_MAIL_API_KEY: "k" }, fetchImpl: async () => { throw new Error("down"); } }), false);
});
