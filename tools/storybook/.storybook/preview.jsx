import "bootstrap/dist/css/bootstrap.min.css";
import { useLayoutEffect } from "react";
import siteFonts from "virtual:wl-site-fonts";
import { CmsManager } from "../../../packages/web-legos/api/cms.ts";
import { resetContactsStore } from "../../../packages/web-legos/api/contacts.ts";

/**
 * The catalog shows live prod content: wl-cms with a read-only key (packages/wl-cms/lib/auth.js
 * lets it GET, and answers 403 to anything that would change data). Deployed, the key comes from
 * /wl-config.js (deploy/docker/storybook-config.sh); locally from STORYBOOK_WL_CMS_URL /
 * STORYBOOK_WL_CMS_READ_API_KEY. wl-auth, wl-forms and site-mail aren't configured at all, so
 * nothing can be submitted from here.
 */
const runtime = window.__WL_CMS__ || {};
const CMS_URL = runtime.url || import.meta.env.STORYBOOK_WL_CMS_URL || "https://wl-cms.joed.dev";
const CMS_READ_KEY = runtime.apiKey || import.meta.env.STORYBOOK_WL_CMS_READ_API_KEY || "";
if (!CMS_READ_KEY) {
  console.warn("Storybook: no read-only CMS key; WL components will show their fallbacks.");
}

// Catalog visits aren't site visits: keep them out of Umami.
const realFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const href = typeof input === "string" ? input : input.url;
  if (/analytics\.joed\.dev|\/api\/send(\?|$)/.test(href)) return Promise.resolve(new Response(null, { status: 204 }));
  return realFetch(input, init);
};
if (navigator.sendBeacon) {
  const realBeacon = navigator.sendBeacon.bind(navigator);
  navigator.sendBeacon = (target, data) => (/analytics\.joed\.dev|\/api\/send/.test(String(target)) ? true : realBeacon(target, data));
}

const IFRAME_PATH = window.location.pathname;
const SITE_KEY = "wl-storybook-site";

/**
 * Sites load global CSS (bootstrap overrides, fonts, element styles). Once a story for one site has
 * loaded its CSS it would restyle every later story, so switching to a story for a different site
 * (or between a site and the shared components) reloads the preview iframe.
 */
function reloadOnSiteSwitch(key) {
  const previous = sessionStorage.getItem(SITE_KEY);
  sessionStorage.setItem(SITE_KEY, key);
  if (previous !== null && previous !== key) {
    window.location.replace(IFRAME_PATH + window.location.search);
    return true;
  }
  return false;
}

/** The site's own web fonts (the <link>s in its public/index.html). */
function loadFonts(site) {
  for (const href of siteFonts[site] || []) {
    if (document.querySelector(`link[data-wl-font="${CSS.escape(href)}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.wlFont = href;
    document.head.appendChild(link);
  }
}

function WithSite(Story, context) {
  const site = context.parameters.site || "web-legos";
  // Full-site stories run the site's whole index.js (once per page load), so each gets its own load.
  if (reloadOnSiteSwitch(context.parameters.fullSite ? `${site}#${context.id}` : site)) return null;
  // Shared-component stories show room01890's content.
  const cmsSite = site === "web-legos" ? "room01890" : site;
  CmsManager.configure({ site: cmsSite, apiUrl: CMS_URL, apiKey: CMS_READ_KEY });
  loadFonts(cmsSite);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useLayoutEffect(() => {
    resetContactsStore();
  }, [cmsSite]);
  return <Story />;
}

/** Full-site stories run the site's own BrowserRouter, which needs a real path ("/"). */
function WithSitePath(Story, context) {
  const route = context.parameters.route;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useLayoutEffect(() => {
    if (!route) return undefined;
    return () => window.history.replaceState(null, "", IFRAME_PATH + window.location.search);
  }, [route]);
  if (route) window.history.replaceState(null, "", route + window.location.search);
  return <Story />;
}

const VIEWPORTS = {
  phone: { name: "Phone (390)", styles: { width: "390px", height: "844px" }, type: "mobile" },
  tablet: { name: "Tablet (768)", styles: { width: "768px", height: "1024px" }, type: "tablet" },
  laptop: { name: "Laptop (1000)", styles: { width: "1000px", height: "800px" }, type: "desktop" },
  desktop: { name: "Desktop (1440)", styles: { width: "1440px", height: "900px" }, type: "desktop" },
};

/** @type { import('@storybook/react-vite').Preview } */
export default {
  decorators: [WithSitePath, WithSite],
  parameters: {
    layout: "fullscreen",
    viewport: { options: VIEWPORTS },
    options: {
      storySort: { order: ["Introduction", "Web-Legos", "Patterns", "Sites"] },
    },
  },
};
