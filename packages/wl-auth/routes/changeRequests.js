const express = require("express");
const { getAuth } = require("firebase-admin/auth");
const logger = require("../lib/logger");
const { getAppForSite } = require("../lib/firebase");
const { planeConfig, createPlaneClient } = require("../lib/plane");

// POST /change-requests: a site admin files a content change request; it becomes a Plane ticket in the
// Web Legos project, labelled with the site's slug. The wl-auth API key ships to every browser, so the
// caller must also prove who they are with their Firebase ID token, and hold a permission on the site.

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 5000;
const LIMIT_PER_HOUR = 10;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function describe({ description, pageUrl, user, site }) {
  const paragraphs = String(description || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
  const who = user.name ? `${escapeHtml(user.name)} &lt;${escapeHtml(user.email)}&gt;` : escapeHtml(user.email);
  const page = pageUrl ? `<li>Page: <a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></li>` : "";
  return `${paragraphs || "<p>(no description)</p>"}<hr /><ul><li>Site: ${escapeHtml(site)}</li><li>Requested by: ${who}</li>${page}</ul>`;
}

function validPageUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" || url.protocol === "http:" ? url.href.slice(0, 500) : "";
  } catch {
    return "";
  }
}

/**
 * @param {object} deps - injectable for tests
 * @param {(slug: string, idToken: string) => Promise<{uid, email, name}>} deps.verifyIdToken
 * @param {ReturnType<typeof createPlaneClient>} deps.plane
 */
function createChangeRequestsRouter(deps = {}) {
  const verifyIdToken =
    deps.verifyIdToken || ((slug, idToken) => getAuth(getAppForSite(slug)).verifyIdToken(idToken));
  const config = planeConfig();
  const plane = deps.plane || (config.apiKey ? createPlaneClient(config) : null);
  const recent = new Map(); // uid -> timestamps (ms) of requests in the last hour

  const router = express.Router();

  router.post("/", async (req, res) => {
    const site = req.wlSite.slug;
    if (!plane) {
      return res.status(503).json({ ok: false, error: "Change requests are not configured (PLANE_API_KEY)" });
    }

    const title = String((req.body && req.body.title) || "").trim();
    const description = String((req.body && req.body.description) || "").trim();
    if (!title || title.length > MAX_TITLE) {
      return res.status(400).json({ ok: false, error: `Title is required (at most ${MAX_TITLE} characters)` });
    }
    if (description.length > MAX_DESCRIPTION) {
      return res.status(400).json({ ok: false, error: `Description is at most ${MAX_DESCRIPTION} characters` });
    }

    const match = /^Bearer\s+(.+)$/i.exec(String(req.get("x-firebase-auth") || "").trim());
    if (!match) {
      return res.status(401).json({ ok: false, error: "Sign in first" });
    }
    let user;
    try {
      const token = await verifyIdToken(site, match[1]);
      user = { uid: token.uid, email: token.email || "", name: token.name || "" };
    } catch (error) {
      logger.warn("change_request_bad_token", { site, error: error.message });
      return res.status(401).json({ ok: false, error: "Sign in again" });
    }

    try {
      const doc = await req.wlCtx.db.collection(req.wlSite.usersCollection).doc(user.uid).get();
      const permissions = (doc.exists && doc.data().permissions) || {};
      if (!Object.values(permissions).some((v) => v === true)) {
        return res.status(403).json({ ok: false, error: "Only site admins can request changes" });
      }
    } catch (error) {
      logger.error("change_request_permission_error", { site, error: error.message });
      return res.sendStatus(500);
    }

    const now = Date.now();
    const times = (recent.get(user.uid) || []).filter((t) => now - t < 3600 * 1000);
    if (times.length >= LIMIT_PER_HOUR) {
      return res.status(429).json({ ok: false, error: "Too many requests; try again later" });
    }

    try {
      const ticket = await plane.createWorkItem({
        name: title,
        descriptionHtml: describe({ description, pageUrl: validPageUrl(req.body.pageUrl), user, site }),
        label: site,
      });
      recent.set(user.uid, [...times, now]);
      logger.info("change_request_created", { site, ticket: ticket.identifier, uid: user.uid });
      return res.status(201).json({ ok: true, ticket });
    } catch (error) {
      logger.error("change_request_plane_error", { site, error: error.message });
      return res.status(502).json({ ok: false, error: "Couldn't create the ticket; please try again" });
    }
  });

  return router;
}

module.exports = { createChangeRequestsRouter, describe };
