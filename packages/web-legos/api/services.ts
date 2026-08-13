type ServiceRuntimeConfig = {
  url?: string;
  apiKey?: string;
  site?: string;
};

type ServiceOptions = {
  site?: string;
  apiUrl?: string;
  apiKey?: string;
};

function readEnv(name: string): string {
  const value = (process.env as Record<string, string | undefined>)[name];
  return typeof value === "string" ? value : "";
}

function readWindow(key: string): ServiceRuntimeConfig {
  if (typeof window === "undefined") return {};
  const cfg = (window as unknown as Record<string, ServiceRuntimeConfig | undefined>)[key];
  return cfg && typeof cfg === "object" ? cfg : {};
}

/**
 * Shared client for wl-auth / wl-forms style microservices.
 */
export class WlServiceClient {
  site: string;
  apiUrl: string;
  apiKey: string;
  private configLoaded = false;
  private readonly windowKey: string;
  private readonly configPath: string;
  private readonly defaultUrl: string;
  private readonly envPrefix: string;

  constructor(
    envPrefix: string,
    windowKey: string,
    configPath: string,
    defaultUrl: string,
    options: ServiceOptions = {},
  ) {
    this.envPrefix = envPrefix;
    this.windowKey = windowKey;
    this.configPath = configPath;
    this.defaultUrl = defaultUrl;
    const win = readWindow(windowKey);
    this.site =
      options.site ||
      win.site ||
      readEnv(`REACT_APP_${envPrefix}_SITE`) ||
      readEnv(`${envPrefix}_SITE`) ||
      "";
    this.apiUrl = (
      options.apiUrl ||
      win.url ||
      readEnv(`REACT_APP_${envPrefix}_URL`) ||
      readEnv(`${envPrefix}_URL`) ||
      defaultUrl
    ).replace(/\/$/, "");
    this.apiKey =
      options.apiKey ||
      win.apiKey ||
      readEnv(`REACT_APP_${envPrefix}_API_KEY`) ||
      readEnv(`${envPrefix}_API_KEY`) ||
      "";
  }

  configure(options: ServiceOptions) {
    if (options.site) this.site = options.site;
    if (options.apiUrl) this.apiUrl = options.apiUrl.replace(/\/$/, "");
    if (options.apiKey) this.apiKey = options.apiKey;
    this.configLoaded = false;
    return this;
  }

  private async ensureConfig() {
    if (this.configLoaded) return;
    this.configLoaded = true;
    if (this.apiKey && this.site) return;
    try {
      const response = await fetch(this.configPath, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return;
      const cfg = (await response.json()) as ServiceRuntimeConfig;
      if (cfg.url && (!this.apiUrl || this.apiUrl === this.defaultUrl)) {
        this.apiUrl = String(cfg.url).replace(/\/$/, "");
      }
      if (!this.apiKey && cfg.apiKey) this.apiKey = cfg.apiKey;
      if (!this.site && cfg.site) this.site = cfg.site;
    } catch (error) {
      console.warn(`WlServiceClient: failed to load ${this.configPath}`, error);
    }
  }

  urlFor(apiPath: string): string {
    const path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
    return `${this.apiUrl}${path}`;
  }

  async fetch(apiPath: string, init: RequestInit = {}): Promise<Response> {
    await this.ensureConfig();
    if (!this.site) {
      throw new Error(`WlServiceClient(${this.envPrefix}): site is not configured`);
    }
    if (!this.apiKey) {
      throw new Error(`WlServiceClient(${this.envPrefix}): API key is not configured`);
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

let authShared: WlServiceClient | null = null;
let formsShared: WlServiceClient | null = null;

export function getAuthClient(): WlServiceClient {
  if (!authShared) {
    authShared = new WlServiceClient(
      "WL_AUTH",
      "__WL_AUTH__",
      "/wl-auth-config",
      "https://wl-auth.joed.dev",
    );
  }
  return authShared;
}

export function configureAuthClient(options: ServiceOptions) {
  return getAuthClient().configure(options);
}

export function getFormsClient(): WlServiceClient {
  if (!formsShared) {
    formsShared = new WlServiceClient(
      "WL_FORMS",
      "__WL_FORMS__",
      "/wl-forms-config",
      "https://wl-forms.joed.dev",
    );
  }
  return formsShared;
}

export function configureFormsClient(options: ServiceOptions) {
  return getFormsClient().configure(options);
}
