import { test } from "node:test";
import assert from "node:assert/strict";
import { findTicketIds, pickDoneState, closeTickets } from "./close-tickets.mjs";

test("finds tickets in branch, title and body, deduped and normalized", () => {
  assert.deepEqual(
    findTicketIds(["claude/wl-12-update-hero", "WL-12: update hero", "Also fixes wl-7 and WL-007."]),
    ["WL-12", "WL-7"],
  );
});

test("ignores other projects, WL-Universe and glued prefixes", () => {
  assert.deepEqual(findTicketIds(["packages/WL-Universe", "XWL-3", "LF-2", "WL-", "WL-4x"]), ["WL-4"]);
  assert.deepEqual(findTicketIds(["LF-2 WL-1"], ["LF"]), ["LF-2"]);
});

test("pickDoneState prefers the completed state named Done", () => {
  const states = [
    { id: "a", group: "started", name: "In Progress" },
    { id: "b", group: "completed", name: "Shipped" },
    { id: "c", group: "completed", name: "Done" },
  ];
  assert.equal(pickDoneState(states).id, "c");
  assert.equal(pickDoneState(states.slice(0, 2)).id, "b");
  assert.equal(pickDoneState(states.slice(0, 1)), null);
});

test("closeTickets moves open tickets, comments, and skips done/missing ones", async () => {
  const calls = [];
  const items = {
    "WL-1": { id: "i1", project: "p", state: "todo" },
    "WL-2": { id: "i2", project: "p", state: "done" },
  };
  const api = async (method, path, body) => {
    calls.push([method, path, body]);
    if (method === "GET" && path.startsWith("/work-items/")) return items[path.split("/")[2]] || null;
    if (method === "GET" && path.endsWith("/states/")) return { results: [{ id: "done", group: "completed", name: "Done" }] };
    return {};
  };
  const pr = { repo: "r2pen2/WL-Universe", number: 80, url: "https://github.com/r2pen2/WL-Universe/pull/80", title: "WL-1 <b>x</b>" };
  const lines = [];
  const results = await closeTickets({ ids: ["WL-1", "WL-2", "WL-9"], api, pr, log: (l) => lines.push(l) });
  assert.deepEqual(results.map((r) => r.status), ["moved to Done", "already done", "not found"]);
  assert.deepEqual(lines, ["WL-1: moved to Done", "WL-2: already done", "WL-9: not found"], "every ticket is reported");
  assert.deepEqual(calls.find((c) => c[0] === "PATCH"), ["PATCH", "/projects/p/work-items/i1/", { state: "done" }]);
  const comment = calls.find((c) => c[0] === "POST");
  assert.match(comment[2].comment_html, /r2pen2\/WL-Universe#80/);
  assert.match(comment[2].comment_html, /&lt;b&gt;x&lt;\/b&gt;/);
  assert.equal(calls.filter((c) => c[1].endsWith("/states/")).length, 1, "states fetched once per project");
});

test("closeTickets dry run changes nothing", async () => {
  const calls = [];
  const api = async (method, path) => {
    calls.push(method);
    if (path.startsWith("/work-items/")) return { id: "i1", project: "p", state: "todo" };
    return [{ id: "done", group: "completed", name: "Done" }];
  };
  const results = await closeTickets({ ids: ["WL-1"], api, pr: {}, dryRun: true, log: () => {} });
  assert.equal(results[0].status, "would move to Done");
  assert.ok(calls.every((m) => m === "GET"));
});
