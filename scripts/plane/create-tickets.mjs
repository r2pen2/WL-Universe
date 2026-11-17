#!/usr/bin/env node
/**
 * Create a linked set of Plane work items from a JSON file in plane/tickets/: an epic, its child
 * items (parent = epic), "blocked by" relations between items, and a Links section in every
 * description. Idempotent: an item whose exact name already exists in the project is reused, not
 * duplicated. Run by .github/workflows/plane-create-tickets.yml when a tickets file is pushed.
 *
 *   node scripts/plane/create-tickets.mjs plane/tickets/<file>.json [--dry-run]
 *
 * File: { "project": "WL", "label": "...", "epic": Ticket, "items": [Ticket & { "blockedBy"?: [key] }] }
 * Ticket: { "key": "local-id", "name": "...", "description": "<p>HTML</p>" }
 *
 * Env: PLANE_API_KEY, PLANE_WORKSPACE_SLUG (default main), PLANE_URL (default https://plane.joed.dev)
 */
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function planeClient({ baseUrl, workspace, apiKey, fetchImpl = fetch }) {
  const root = `${baseUrl.replace(/\/$/, "")}/api/v1/workspaces/${encodeURIComponent(workspace)}`;
  return async function api(method, path, body) {
    const res = await fetchImpl(root + path, {
      method,
      headers: { "X-API-Key": apiKey, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Plane ${method} ${path} -> ${res.status} ${(await res.text().catch(() => "")).slice(0, 300)}`);
    return res.status === 204 ? null : res.json();
  };
}

/** The Links section appended to a ticket's description. */
export function linksHtml({ self, epic, items, byKey, url }) {
  const link = (t) => `<a href="${escapeHtml(url(t))}">${escapeHtml(t.identifier)}</a> ${escapeHtml(t.name)}`;
  const rows = [];
  if (self.key === epic.key) {
    rows.push(...items.map((i) => `<li>${link(byKey.get(i.key))}</li>`));
    return `<h3>Work items</h3><ol>${rows.join("")}</ol>`;
  }
  rows.push(`<li>Part of ${link(byKey.get(epic.key))}</li>`);
  for (const k of self.blockedBy || []) rows.push(`<li>Blocked by ${link(byKey.get(k))}</li>`);
  for (const other of items) {
    if ((other.blockedBy || []).includes(self.key)) rows.push(`<li>Blocks ${link(byKey.get(other.key))}</li>`);
  }
  return `<h3>Links</h3><ul>${rows.join("")}</ul>`;
}

export async function createTickets(spec, { api, baseUrl, workspace, dryRun = false, log = console.log }) {
  const projects = await api("GET", "/projects/");
  const project = (projects.results || projects).find((p) => p.identifier === spec.project);
  if (!project) throw new Error(`No Plane project ${spec.project}`);
  const p = `/projects/${project.id}`;

  // Existing items by exact name (idempotency).
  const existing = new Map();
  let cursor = "";
  for (let page = 0; page < 50; page++) {
    const res = await api("GET", `${p}/work-items/?per_page=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    for (const item of res.results || res) existing.set(item.name, item);
    if (!res.next_page_results || !res.next_cursor) break;
    cursor = res.next_cursor;
  }

  let labelId = null;
  if (spec.label && !dryRun) {
    const labels = await api("GET", `${p}/labels/?per_page=1000`);
    const found = (labels.results || labels).find((l) => String(l.name).toLowerCase() === spec.label.toLowerCase());
    labelId = (found || (await api("POST", `${p}/labels/`, { name: spec.label, color: "#3f76ff" }))).id;
  }

  const all = [spec.epic, ...spec.items];
  const byKey = new Map();
  const url = (t) => `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(workspace)}/browse/${t.identifier}/`;

  for (const t of all) {
    const isEpic = t === spec.epic;
    let item = existing.get(t.name);
    if (item) {
      log(`exists  ${spec.project}-${item.sequence_id} ${t.name}`);
    } else if (dryRun) {
      log(`would create ${t.name}`);
      item = { id: `dry-${t.key}`, sequence_id: `?${t.key}` };
    } else {
      item = await api("POST", `${p}/work-items/`, {
        name: t.name,
        description_html: t.description,
        ...(labelId ? { labels: [labelId] } : {}),
        ...(isEpic ? {} : { parent: byKey.get(spec.epic.key).id }),
      });
      log(`created ${spec.project}-${item.sequence_id} ${t.name}`);
    }
    byKey.set(t.key, { ...t, id: item.id, identifier: `${spec.project}-${item.sequence_id}` });
  }

  if (dryRun) return [...byKey.values()];

  for (const t of all) {
    const me = byKey.get(t.key);
    // Parent for items that already existed without one.
    const patch = { description_html: `${t.description}${linksHtml({ self: t, epic: spec.epic, items: spec.items, byKey, url })}` };
    if (t !== spec.epic) patch.parent = byKey.get(spec.epic.key).id;
    await api("PATCH", `${p}/work-items/${me.id}/`, patch);
    for (const k of t.blockedBy || []) {
      try {
        await api("POST", `${p}/work-items/${me.id}/relations/`, { relation_type: "blocked_by", issues: [byKey.get(k).id] });
      } catch (err) {
        // Older Plane API without relations: the Links section in the description still links them.
        log(`relation ${me.identifier} blocked by ${byKey.get(k).identifier}: ${err.message}`);
      }
    }
  }
  for (const t of byKey.values()) log(`${t.identifier}  ${url(t)}  ${t.name}`);
  return [...byKey.values()];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const dryRun = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";
  const baseUrl = process.env.PLANE_URL || "https://plane.joed.dev";
  const workspace = process.env.PLANE_WORKSPACE_SLUG || "main";
  if (!process.env.PLANE_API_KEY) {
    console.error("PLANE_API_KEY is not set");
    process.exit(1);
  }
  const api = planeClient({ baseUrl, workspace, apiKey: process.env.PLANE_API_KEY });
  for (const file of files) {
    console.log(`== ${file}`);
    await createTickets(JSON.parse(fs.readFileSync(file, "utf8")), { api, baseUrl, workspace, dryRun });
  }
}
