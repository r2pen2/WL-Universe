type MailManagerOptions = {
  /** Site profile slug sent to site-mail (e.g. beyond-the-bell, andc) */
  site?: string;
  /** Base URL for the site-mail microservice */
  apiUrl?: string;
  /** Bearer API key for site-mail */
  apiKey?: string;
};

type MailRuntimeConfig = {
  url?: string;
  apiKey?: string;
  site?: string;
};

function readEnv(name: string): string {
  // CRA inlines REACT_APP_* at build time
  const value = (process.env as Record<string, string | undefined>)[name];
  return typeof value === "string" ? value : "";
}

function readWindowConfig(): MailRuntimeConfig {
  if (typeof window === "undefined") {
    return {};
  }
  const cfg = (window as unknown as { __WL_SITE_MAIL__?: MailRuntimeConfig })
    .__WL_SITE_MAIL__;
  return cfg && typeof cfg === "object" ? cfg : {};
}

export class MailManager {
  site: string;
  apiUrl: string;
  apiKey: string;
  recipientEmails: string[] = [];
  private configLoaded = false;

  constructor(options: MailManagerOptions = {}) {
    const win = readWindowConfig();
    this.site =
      options.site ||
      win.site ||
      readEnv("REACT_APP_SITE_MAIL_SITE_SLUG") ||
      readEnv("SITE_MAIL_SITE_SLUG") ||
      "";
    this.apiUrl = (
      options.apiUrl ||
      win.url ||
      readEnv("REACT_APP_SITE_MAIL_URL") ||
      readEnv("SITE_MAIL_URL") ||
      "https://site-mail.joed.dev"
    ).replace(/\/$/, "");
    this.apiKey =
      options.apiKey ||
      win.apiKey ||
      readEnv("REACT_APP_SITE_MAIL_API_KEY") ||
      readEnv("SITE_MAIL_API_KEY") ||
      "";
  }

  addRecipientEmail(toAddress: string) {
    this.recipientEmails.push(toAddress);
  }

  /**
   * Load runtime config from the hosting site's /wl-mail-config endpoint
   * when build-time REACT_APP_* values are absent (glados env_file model).
   */
  private async ensureConfig() {
    if (this.configLoaded) {
      return;
    }
    this.configLoaded = true;

    if (this.apiKey && this.site) {
      return;
    }

    try {
      const response = await fetch("/wl-mail-config", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        return;
      }
      const cfg = (await response.json()) as MailRuntimeConfig;
      if (!this.apiUrl && cfg.url) {
        this.apiUrl = String(cfg.url).replace(/\/$/, "");
      } else if (cfg.url && this.apiUrl === "https://site-mail.joed.dev") {
        this.apiUrl = String(cfg.url).replace(/\/$/, "");
      }
      if (!this.apiKey && cfg.apiKey) {
        this.apiKey = cfg.apiKey;
      }
      if (!this.site && cfg.site) {
        this.site = cfg.site;
      }
    } catch (error) {
      console.warn("MailManager: failed to load /wl-mail-config", error);
    }
  }

  /**
   * Send a message via the site-mail microservice.
   * @param subject - email subject line
   * @param text - email body content
   */
  async sendMail(subject: string, text: string) {
    await this.ensureConfig();

    if (!this.site) {
      throw new Error("MailManager: site slug is not configured");
    }
    if (!this.apiKey) {
      throw new Error("MailManager: SITE_MAIL_API_KEY is not configured");
    }

    const results: Array<{ to: string; ok: boolean; error?: string }> = [];

    for (const to of this.recipientEmails) {
      const response = await fetch(`${this.apiUrl}/v1/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          site: this.site,
          to,
          subject,
          text,
        }),
      });

      let body: { ok?: boolean; error?: string; messageId?: string } = {};
      try {
        body = await response.json();
      } catch {
        body = {};
      }

      if (!response.ok || body.ok === false) {
        const error = body.error || `HTTP ${response.status}`;
        console.error("MailManager send failed", { to, subject, error });
        results.push({ to, ok: false, error });
      } else {
        results.push({ to, ok: true });
      }
    }

    const failed = results.filter((r) => !r.ok);
    if (failed.length) {
      throw new Error(
        `MailManager: failed to send to ${failed.map((f) => f.to).join(", ")}`
      );
    }

    return results;
  }
}
