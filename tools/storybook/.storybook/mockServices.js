/**
 * Stands in for wl-cms, wl-auth, wl-forms and site-mail inside the catalog, so stories render real
 * (snapshotted) content and never call a live service. Content comes from fixtures/cms.json
 * (scripts/snapshot-cms.mjs); image files are served from fixtures/cms-assets at /mock-cms/assets.
 *
 * Every WL client reads its base URL from window.__WL_*__, set here before any story renders. The
 * active site comes from each request's X-WL-Site header (CmsManager sets it), so one page can
 * show stories for different sites.
 */
import cms from "../fixtures/cms.json";

const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
export const MOCK = {
  cms: `${origin}/mock-cms`,
  auth: `${origin}/mock-auth`,
  forms: `${origin}/mock-forms`,
  mail: `${origin}/mock-mail`,
};

/** Requests made to the mock services, newest last (shown by the Forms stories). */
export const requestLog = [];

/** Contacts edited in Site settings during this session, per site (so saving "works"). */
const contactEdits = {};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function siteOf(url, init) {
  const headers = new Headers(init && init.headers);
  return headers.get("X-WL-Site") || url.searchParams.get("site") || "";
}

async function handleCms(url, init) {
  const site = siteOf(url, init);
  const data = cms[site] || { text: {}, images: {}, models: {} };
  const method = (init && init.method) || "GET";
  const route = url.pathname.slice(new URL(MOCK.cms).pathname.length);

  if (route === "/site-text") {
    if (method === "POST") return new Response("OK");
    const text = data.text[url.searchParams.get("id")];
    return text === undefined ? new Response("Not Found", { status: 404 }) : new Response(text);
  }
  if (route === "/site-images") {
    if (method === "POST") return new Response("OK");
    const image = data.images[url.searchParams.get("id")];
    // Some image components parse every reply as JSON, so a missing id answers with JSON too.
    return image ? json(image) : json({ ok: false, error: "Not found" }, 404);
  }
  if (route === "/site-models") {
    if (method === "POST") {
      const body = JSON.parse(init.body);
      if (body.collection === "siteContacts") {
        const list = (contactEdits[site] = contactEdits[site] || [...(data.models.siteContacts || [])]);
        const i = list.findIndex((c) => c.id === body.documentId);
        if (body.action === "delete") {
          if (i >= 0) list.splice(i, 1);
        } else if (i >= 0) list[i] = { id: body.documentId, ...body.documentData };
        else list.push({ id: body.documentId, ...body.documentData });
      }
      return new Response("OK");
    }
    const collection = url.searchParams.get("collection");
    if (collection === "siteContacts" && contactEdits[site]) return json(contactEdits[site]);
    return json((data.models && data.models[collection]) || []);
  }
  return new Response("Not Found", { status: 404 });
}

async function handle(url, init) {
  const method = (init && init.method) || "GET";
  if (url.href.startsWith(MOCK.cms)) return handleCms(url, init);
  requestLog.push({ service: url.href.split("/")[3], method, path: url.pathname, body: init && init.body });
  if (url.href.startsWith(MOCK.auth)) {
    // Signed-in admin in the "Admin" stories; nobody otherwise.
    return json(window.__WL_STORY_ADMIN__ ? { op: true, siteText: true, siteImages: true } : {});
  }
  return new Response("OK");
}

let installed = false;
export function installMockServices() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.__WL_CMS__ = { url: MOCK.cms, apiKey: "mock", site: "" };
  window.__WL_AUTH__ = { url: MOCK.auth, apiKey: "mock", site: "" };
  window.__WL_FORMS__ = { url: MOCK.forms, apiKey: "mock", site: "" };
  window.__WL_SITE_MAIL__ = { url: MOCK.mail, apiKey: "mock" };
  const realBeacon = navigator.sendBeacon && navigator.sendBeacon.bind(navigator);
  if (realBeacon) {
    navigator.sendBeacon = (target, data) => (/analytics\.joed\.dev|\/api\/send/.test(String(target)) ? true : realBeacon(target, data));
  }
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const href = typeof input === "string" ? input : input.url;
    const url = new URL(href, window.location.href);
    if (Object.values(MOCK).some((base) => url.href.startsWith(base) && !url.pathname.startsWith("/mock-cms/assets/"))) {
      return handle(url, init);
    }
    // Never report catalog pageviews to the real Umami.
    if (/(^|\.)analytics\.joed\.dev$/.test(url.hostname) || url.pathname === "/api/send") return new Response(null, { status: 204 });
    // Runtime-config endpoints the clients probe on a real host.
    if (/^\/wl-(cms|auth|forms|mail)-config$/.test(url.pathname)) return new Response("", { status: 404 });
    return realFetch(input, init);
  };
}

export const MOCK_SITES = Object.keys(cms);
