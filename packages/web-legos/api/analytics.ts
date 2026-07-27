import { createContext } from "react";

export type UmamiAnalyticsConfig = {
  /** Umami collector base URL, e.g. https://analytics.joed.dev */
  url: string;
  /** Umami website UUID (from deploy/analytics/websites.json) */
  websiteId: string;
  /**
   * When true, never send beacons. Default: auto-disable on *.qa.joed.dev
   * and when websiteId/url is missing.
   */
  disabled?: boolean;
};

const DEFAULT_UMAMI_URL = "https://analytics.joed.dev";

function isQaHost(hostname: string): boolean {
  return /(^|\.)qa\.joed\.dev$/i.test(hostname);
}

/**
 * Client analytics → self-hosted Umami (`POST /api/send`).
 *
 * Construct with `{ url, websiteId }` from deploy/analytics/websites.json.
 * Env overrides (CRA build-time): REACT_APP_UMAMI_URL, REACT_APP_UMAMI_WEBSITE_ID.
 * Default: no tracking on *.qa.joed.dev.
 *
 * Preserves Context + logPageView(pageId) so route call sites keep working.
 * Does not use Firebase Analytics (Firestore/CMS Firebase stays elsewhere).
 */
export class AnalyticsManager {
  static Context = createContext(null);

  config: UmamiAnalyticsConfig | null = null;
  ready = false;

  constructor(config?: Partial<UmamiAnalyticsConfig> | null) {
    const url =
      (typeof process !== "undefined" && process.env?.REACT_APP_UMAMI_URL) ||
      config?.url ||
      DEFAULT_UMAMI_URL;
    const websiteId =
      (typeof process !== "undefined" &&
        process.env?.REACT_APP_UMAMI_WEBSITE_ID) ||
      config?.websiteId ||
      "";
    this.config = {
      url: String(url).replace(/\/$/, ""),
      websiteId: String(websiteId || ""),
      disabled: config?.disabled,
    };
  }

  setConfig(config: Partial<UmamiAnalyticsConfig>) {
    this.config = {
      ...(this.config || { url: DEFAULT_UMAMI_URL, websiteId: "" }),
      ...config,
      url: String(config.url || this.config?.url || DEFAULT_UMAMI_URL).replace(
        /\/$/,
        "",
      ),
    };
  }

  initialize() {
    if (!this.config?.websiteId || !this.config?.url) {
      console.warn(
        "AnalyticsManager: missing url/websiteId — pageviews disabled.",
      );
      this.ready = false;
      return;
    }
    this.ready = true;
  }

  private shouldTrack(): boolean {
    if (!this.ready || !this.config?.websiteId || !this.config?.url) {
      return false;
    }
    if (this.config.disabled) return false;
    if (typeof window === "undefined") return false;
    if (isQaHost(window.location.hostname)) return false;
    return true;
  }

  /**
   * Send a pageview beacon. `pageId` becomes the URL path segment
   * (e.g. "home" → "/home", "/gallery" stays "/gallery").
   */
  logPageView(pageId: string) {
    if (!this.shouldTrack()) {
      if (!this.ready) {
        console.error("AnalyticsManager has not been initialized");
      }
      return;
    }

    const path =
      !pageId || pageId === "/"
        ? "/"
        : pageId.startsWith("/")
          ? pageId
          : `/${pageId}`;

    // Omit `name` so Umami records a pageview (a name makes it a custom event).
    const body = JSON.stringify({
      type: "event",
      payload: {
        website: this.config!.websiteId,
        hostname: window.location.hostname,
        language: navigator.language || "en-US",
        referrer: document.referrer || "",
        screen: `${window.screen.width}x${window.screen.height}`,
        title: typeof document !== "undefined" ? document.title : "",
        url: path,
      },
    });

    const endpoint = `${this.config!.url}/api/send`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-umami-website-id": this.config!.websiteId,
      "x-umami-hostname": window.location.hostname,
    };
    if (AnalyticsManager._cacheToken) {
      headers["x-umami-cache"] = AnalyticsManager._cacheToken;
    }

    try {
      fetch(endpoint, {
        method: "POST",
        headers,
        body,
        keepalive: true,
        mode: "cors",
        credentials: "omit",
      })
        .then(async (res) => {
          try {
            const json = await res.json();
            if (json?.cache) AnalyticsManager._cacheToken = json.cache;
          } catch {
            /* ignore */
          }
        })
        .catch(() => {
          /* never block UX on analytics */
        });
    } catch {
      /* ignore */
    }
  }

  /** Session cache token from Umami (optional performance header). */
  static _cacheToken: string | null = null;
}
