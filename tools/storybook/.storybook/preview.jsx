import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useLayoutEffect } from "react";
import { installMockServices, MOCK } from "./mockServices.js";
import { CmsManager } from "../../../packages/web-legos/api/cms.ts";
import { configureAuthClient, configureFormsClient } from "../../../packages/web-legos/api/services.ts";
import { resetContactsStore } from "../../../packages/web-legos/api/contacts.ts";

installMockServices();

const IFRAME_PATH = window.location.pathname;
const SITE_KEY = "wl-storybook-site";

/**
 * Sites load global CSS (bootstrap overrides, fonts, element styles). Once a story for one site has
 * loaded its CSS it would restyle every later story, so switching to a story for a different site
 * (or between a site and the shared components) reloads the preview iframe.
 */
function reloadOnSiteSwitch(site) {
  const previous = sessionStorage.getItem(SITE_KEY);
  sessionStorage.setItem(SITE_KEY, site);
  if (previous !== null && previous !== site) {
    window.location.replace(IFRAME_PATH + window.location.search);
    return true;
  }
  return false;
}

/** Point every WL client at the mock services for this story's site. */
function useSite(site, admin) {
  window.__WL_STORY_ADMIN__ = Boolean(admin);
  CmsManager.configure({ site, apiUrl: MOCK.cms, apiKey: "mock" });
  configureAuthClient({ site, apiUrl: MOCK.auth, apiKey: "mock" });
  configureFormsClient({ site, apiUrl: MOCK.forms, apiKey: "mock" });
  useLayoutEffect(() => {
    resetContactsStore();
  }, [site]);
}

function WithSite(Story, context) {
  const site = context.parameters.site || "web-legos";
  // Full-site stories run the site's whole index.js (once per page load), so each gets its own load.
  if (reloadOnSiteSwitch(context.parameters.fullSite ? `${site}#${context.id}` : site)) return null;
  // useSite runs the configure calls during render, before any child fetches.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useSite(site === "web-legos" ? "room01890" : site, context.parameters.admin);
  return <Story />;
}

/** Full-site stories run the site's own BrowserRouter, which needs a real path ("/"). */
function WithSitePath(Story, context) {
  const route = context.parameters.route;
  useEffect(() => {
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
