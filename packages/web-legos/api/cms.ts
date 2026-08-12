type CmsRuntimeConfig = {
  url?: string;
  apiKey?: string;
  site?: string;
};

type CmsManagerOptions = {
  site?: string;
  apiUrl?: string;
  apiKey?: string;
};

function readEnv(name: string): string {
  const value = (process.env as Record<string, string | undefined>)[name];
  return typeof value === "string" ? value : "";
}

function readWindowConfig(): CmsRuntimeConfig {
  if (typeof window === "undefined") {
    return {};
  }
  const cfg = (window as unknown as { __WL_CMS__?: CmsRuntimeConfig }).__WL_CMS__;
  return cfg && typeof cfg === "object" ? cfg : {};
}

let shared: CmsManager | null = null;

/**
 * Client for the wl-cms microservice (site text, images, models, assets).
 * Mirrors MailManager: REACT_APP_* / window.__WL_CMS__ / optional /wl-cms-config.
 */
export class CmsManager {
  site: string;
  apiUrl: string;
  apiKey: string;
  private configLoaded = false;

  constructor(options: CmsManagerOptions = {}) {
    const win = readWindowConfig();
    this.site =
      options.site ||
      win.site ||
      readEnv("REACT_APP_WL_CMS_SITE") ||
      readEnv("WL_CMS_SITE") ||
      "";
    this.apiUrl = (
      options.apiUrl ||
      win.url ||
      readEnv("REACT_APP_WL_CMS_URL") ||
      readEnv("WL_CMS_URL") ||
      "https://wl-cms.joed.dev"
    ).replace(/\/$/, "");
    this.apiKey =
      options.apiKey ||
      win.apiKey ||
      readEnv("REACT_APP_WL_CMS_API_KEY") ||
      readEnv("WL_CMS_API_KEY") ||
      "";
  }

  static getShared(): CmsManager {
    if (!shared) {
      shared = new CmsManager();
    }
    return shared;
  }

  static configure(options: CmsManagerOptions) {
    const current = CmsManager.getShared();
    const win = readWindowConfig();
    if (options.site) current.site = options.site;
    if (options.apiUrl) current.apiUrl = options.apiUrl.replace(/\/$/, "");
    if (options.apiKey) current.apiKey = options.apiKey;
    // Re-read env/window defaults when fields still empty
    if (!current.site) {
      current.site =
        win.site ||
        readEnv("REACT_APP_WL_CMS_SITE") ||
        readEnv("WL_CMS_SITE") ||
        "";
    }
    if (!current.apiKey) {
      current.apiKey =
        win.apiKey ||
        readEnv("REACT_APP_WL_CMS_API_KEY") ||
        readEnv("WL_CMS_API_KEY") ||
        "";
    }
    current.configLoaded = false;
    return current;
  }

  private async ensureConfig() {
    if (this.configLoaded) {
      return;
    }
    this.configLoaded = true;

    if (this.apiKey && this.site) {
      return;
    }

    try {
      const response = await fetch("/wl-cms-config", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        return;
      }
      const cfg = (await response.json()) as CmsRuntimeConfig;
      if (cfg.url) {
        const next = String(cfg.url).replace(/\/$/, "");
        if (!this.apiUrl || this.apiUrl === "https://wl-cms.joed.dev") {
          this.apiUrl = next;
        }
      }
      if (!this.apiKey && cfg.apiKey) {
        this.apiKey = cfg.apiKey;
      }
      if (!this.site && cfg.site) {
        this.site = cfg.site;
      }
    } catch (error) {
      console.warn("CmsManager: failed to load /wl-cms-config", error);
    }
  }

  /** Absolute URL for a CMS API path (e.g. /site-text). */
  urlFor(apiPath: string): string {
    const path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
    return `${this.apiUrl}${path}`;
  }

  /**
   * Public asset URL for an images/ relative source from CMS metadata.
   * source is typically "images/fileName.jpg".
   */
  assetUrl(source: string): string {
    if (!source) return "";
    if (/^https?:\/\//i.test(source)) return source;
    const cleaned = source.replace(/^\//, "");
    return `${this.apiUrl}/assets/${this.site}/${cleaned}`;
  }

  async fetch(apiPath: string, init: RequestInit = {}): Promise<Response> {
    await this.ensureConfig();
    if (!this.site) {
      throw new Error("CmsManager: site slug is not configured");
    }
    if (!this.apiKey) {
      throw new Error("CmsManager: WL_CMS_API_KEY is not configured");
    }

    const headers = new Headers(init.headers || {});
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }
    if (!headers.has("X-WL-Site")) {
      headers.set("X-WL-Site", this.site);
    }

    const url = new URL(this.urlFor(apiPath));
    if (!url.searchParams.has("site")) {
      url.searchParams.set("site", this.site);
    }

    return fetch(url.toString(), { ...init, headers });
  }
}

/** Convenience: shared manager URL builder (sync; prefers already-configured env). */
export function getCmsHostname(): string {
  return CmsManager.getShared().apiUrl;
}

export function getCmsSite(): string {
  return CmsManager.getShared().site;
}

export function cmsAssetUrl(source: string): string {
  return CmsManager.getShared().assetUrl(source);
}
