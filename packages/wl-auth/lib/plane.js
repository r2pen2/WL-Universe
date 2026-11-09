/**
 * Minimal Plane (plane.joed.dev) client for content change requests.
 *
 * Env: PLANE_API_KEY (required), PLANE_URL (default https://plane.joed.dev),
 *      PLANE_WORKSPACE_SLUG (default "main"), PLANE_PROJECT_ID (default: the Web Legos "WL" project).
 */

const DEFAULT_PROJECT_ID = "6ca472a9-89a5-406f-9b6c-ff3039d6ffb2";
const LABEL_COLOR = "#3f76ff";

function planeConfig(env = process.env) {
  return {
    apiKey: env.PLANE_API_KEY || "",
    baseUrl: (env.PLANE_URL || "https://plane.joed.dev").replace(/\/$/, ""),
    workspace: env.PLANE_WORKSPACE_SLUG || "main",
    projectId: env.PLANE_PROJECT_ID || DEFAULT_PROJECT_ID,
  };
}

function createPlaneClient(config = planeConfig(), fetchImpl = fetch) {
  const root = `${config.baseUrl}/api/v1/workspaces/${encodeURIComponent(config.workspace)}/projects/${config.projectId}`;
  let projectIdentifier = null;
  const labelIds = new Map();

  async function api(method, path, body) {
    const res = await fetchImpl(root + path, {
      method,
      headers: {
        "X-API-Key": config.apiKey,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Plane ${method} ${path} -> ${res.status} ${text.slice(0, 200)}`);
    }
    return res.json();
  }

  async function getProjectIdentifier() {
    if (!projectIdentifier) projectIdentifier = (await api("GET", "/")).identifier;
    return projectIdentifier;
  }

  /** The id of the label named `name` in the project, creating it if needed. */
  async function ensureLabel(name) {
    if (labelIds.has(name)) return labelIds.get(name);
    const list = await api("GET", "/labels/?per_page=1000");
    const labels = list.results || list;
    let label = labels.find((l) => String(l.name).toLowerCase() === name.toLowerCase());
    if (!label) label = await api("POST", "/labels/", { name, color: LABEL_COLOR });
    labelIds.set(name, label.id);
    return label.id;
  }

  /** Create a work item with one label; returns { identifier: "WL-12", url }. */
  async function createWorkItem({ name, descriptionHtml, label }) {
    const labelId = await ensureLabel(label);
    const item = await api("POST", "/work-items/", {
      name,
      description_html: descriptionHtml,
      labels: [labelId],
    });
    const identifier = `${await getProjectIdentifier()}-${item.sequence_id}`;
    return {
      identifier,
      url: `${config.baseUrl}/${encodeURIComponent(config.workspace)}/browse/${identifier}/`,
    };
  }

  return { createWorkItem, ensureLabel, getProjectIdentifier };
}

module.exports = { planeConfig, createPlaneClient, DEFAULT_PROJECT_ID };
