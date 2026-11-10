const logger = require("./logger");

// Emails Joe when a content change request is filed, through site-mail (site-mail.joed.dev).
//
// Env: SITE_MAIL_API_KEY (required to send; copied from site-mail.env by the deploy),
//      SITE_MAIL_URL (default https://site-mail.joed.dev),
//      CHANGE_REQUEST_NOTIFY_TO (default joedobbelaar@gmail.com),
//      CHANGE_REQUEST_MAIL_SITE (site-mail sender profile, default "billing" = billing@joed.dev).
//
// Subject always starts with "[Change request]" so a Gmail filter can star it; marked high priority.

const SUBJECT_PREFIX = "[Change request]";

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function buildChangeRequestEmail({ ticket, site, title, description, user, pageUrl }) {
  const who = user.name ? `${user.name} <${user.email}>` : user.email;
  const subject = `${SUBJECT_PREFIX} ${ticket.identifier} · ${site}: ${title}`.slice(0, 250);
  const text = [
    `${who} requested a content change on ${site}.`,
    "",
    title,
    "",
    description || "(no details)",
    "",
    pageUrl ? `Page: ${pageUrl}` : null,
    `Ticket: ${ticket.identifier} ${ticket.url}`,
  ].filter((l) => l !== null).join("\n");
  const html =
    `<p><b>${escapeHtml(who)}</b> requested a content change on <b>${escapeHtml(site)}</b>.</p>` +
    `<h3>${escapeHtml(title)}</h3>` +
    `<p>${escapeHtml(description || "(no details)").replace(/\n/g, "<br />")}</p>` +
    (pageUrl ? `<p>Page: <a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></p>` : "") +
    `<p><a href="${escapeHtml(ticket.url)}">Open ${escapeHtml(ticket.identifier)} in Plane</a></p>`;
  return { subject, text, html, replyTo: user.email || undefined };
}

/** Send the notification. Never throws: a mail problem must not fail the request. */
async function notifyChangeRequest(details, { env = process.env, fetchImpl = fetch } = {}) {
  const apiKey = env.SITE_MAIL_API_KEY;
  if (!apiKey) {
    logger.warn("change_request_notify_skipped", { reason: "SITE_MAIL_API_KEY not set", ticket: details.ticket.identifier });
    return false;
  }
  const url = `${(env.SITE_MAIL_URL || "https://site-mail.joed.dev").replace(/\/$/, "")}/v1/send`;
  const mail = buildChangeRequestEmail(details);
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        site: env.CHANGE_REQUEST_MAIL_SITE || "billing",
        to: env.CHANGE_REQUEST_NOTIFY_TO || "joedobbelaar@gmail.com",
        priority: "high",
        ...mail,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`site-mail ${res.status} ${(await res.text().catch(() => "")).slice(0, 200)}`);
    logger.info("change_request_notified", { ticket: details.ticket.identifier });
    return true;
  } catch (error) {
    logger.error("change_request_notify_failed", { ticket: details.ticket.identifier, error: error.message });
    return false;
  }
}

module.exports = { notifyChangeRequest, buildChangeRequestEmail, SUBJECT_PREFIX };
