#!/usr/bin/env node
/**
 * Move the Plane tickets a merged PR mentions to their project's "completed" state (Done) and leave a
 * comment on each linking the PR. Run by .github/workflows/plane-close-tickets.yml.
 *
 * Tickets are found as <PROJECT>-<number> (case-insensitive) in the PR's branch name or title, e.g.
 * branch `wl-12-update-hero-text` or title `WL-12: update hero text`, or in the body after a closing
 * keyword ("Closes WL-12"). Only PLANE_PROJECTS count.
 *
 * Env: PLANE_API_KEY, PLANE_WORKSPACE_SLUG, PLANE_URL (default https://plane.joed.dev),
 *      PLANE_PROJECTS (default "WL"), PR_BRANCH, PR_TITLE, PR_BODY, PR_URL, PR_NUMBER, PR_REPO,
 *      DRY_RUN=1 to only report.
 */

export function findTicketIds(texts, projects = ["WL"]) {
  const alternatives = projects.map((p) => p.replace(/[^A-Za-z0-9]/g, "")).filter(Boolean).join("|");
  if (!alternatives) return [];
  // Not preceded by a letter/digit (so "XWL-1" doesn't count) and the number not followed by a digit.
  const re = new RegExp(`(?<![A-Za-z0-9])(${alternatives})-(\\d+)(?!\\d)`, "gi");
  const found = new Set();
  for (const text of texts) {
    for (const m of String(text || "").matchAll(re)) found.add(`${m[1].toUpperCase()}-${Number(m[2])}`);
  }
  return [...found];
}

/**
 * Tickets a PR closes: any in the branch name or title, but in the body only after a closing keyword
 * ("Closes WL-12", "fixes wl-3, WL-4"), so ticket numbers quoted in notes or examples don't count.
 */
export function ticketsClosedByPr({ branch, title, body }, projects = ["WL"]) {
  const keyword = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\b:?\s+((?:[A-Za-z]+-\d+(?:\s*(?:,|and)\s*)?)+)/gi;
  const closingPhrases = [...String(body || "").matchAll(keyword)].map((m) => m[1]);
  return findTicketIds([branch, title, ...closingPhrases], projects);
}

export function pickDoneState(states) {
  const completed = states.filter((s) => s.group === "completed");
  return completed.find((s) => s.name.toLowerCase() === "done") || completed[0] || null;
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export async function closeTickets({ ids, api, pr, dryRun = false, log = console.log }) {
  const results = [];
  const doneByProject = new Map();
  async function closeOne(id) {
    const item = await api("GET", `/work-items/${id}/`);
    if (!item) return "not found";
    if (!doneByProject.has(item.project)) {
      const states = await api("GET", `/projects/${item.project}/states/`);
      doneByProject.set(item.project, pickDoneState(states?.results || states || []));
    }
    const done = doneByProject.get(item.project);
    if (!done) return "no completed state in project";
    if (item.state === done.id) return "already done";
    if (dryRun) return `would move to ${done.name}`;
    await api("PATCH", `/projects/${item.project}/work-items/${item.id}/`, { state: done.id });
    const ref = `${pr.repo}#${pr.number}`;
    await api("POST", `/projects/${item.project}/work-items/${item.id}/comments/`, {
      comment_html: `<p>Done: merged <a href="${escapeHtml(pr.url)}">${escapeHtml(ref)}</a> (${escapeHtml(pr.title)}).</p>`,
    });
    return `moved to ${done.name}`;
  }

  for (const id of ids) {
    let result;
    try {
      result = { id, status: await closeOne(id) };
    } catch (err) {
      result = { id, status: `error: ${err.message}`, error: true };
    }
    results.push(result);
    log(`${id}: ${result.status}`);
  }
  return results;
}

export function planeApi({ baseUrl, workspace, apiKey, fetchImpl = fetch }) {
  const root = `${baseUrl.replace(/\/$/, "")}/api/v1/workspaces/${encodeURIComponent(workspace)}`;
  return async (method, path, body) => {
    const res = await fetchImpl(root + path, {
      method,
      headers: { "X-API-Key": apiKey, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (method === "GET" && res.status === 404) return null;
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${(await res.text()).slice(0, 200)}`);
    return res.status === 204 ? null : res.json();
  };
}

async function main() {
  const env = process.env;
  const ids = ticketsClosedByPr({ branch: env.PR_BRANCH, title: env.PR_TITLE, body: env.PR_BODY }, (env.PLANE_PROJECTS || "WL").split(","));
  if (!ids.length) {
    console.log("No Plane tickets in the branch name, title, or a closing keyword in the body.");
    return;
  }
  for (const k of ["PLANE_API_KEY", "PLANE_WORKSPACE_SLUG"]) if (!env[k]) throw new Error(`${k} is not set`);
  const api = planeApi({ baseUrl: env.PLANE_URL || "https://plane.joed.dev", workspace: env.PLANE_WORKSPACE_SLUG, apiKey: env.PLANE_API_KEY });
  const pr = { repo: env.PR_REPO, number: env.PR_NUMBER, url: env.PR_URL, title: env.PR_TITLE || "" };
  const results = await closeTickets({ ids, api, pr, dryRun: env.DRY_RUN === "1" });
  if (env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import("node:fs");
    appendFileSync(env.GITHUB_STEP_SUMMARY, `### Plane tickets\n\n| Ticket | Result |\n| --- | --- |\n${results.map((r) => `| ${r.id} | ${r.status} |`).join("\n")}\n`);
  }
  if (results.some((r) => r.error)) process.exitCode = 1;
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("/close-tickets.mjs")) {
  try {
    await main();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
