type MailManagerOptions = {
  /** Site profile slug sent to site-mail (e.g. beyond-the-bell, andc) */
  site?: string;
  /** Base URL for the site-mail microservice */
  apiUrl?: string;
  /** Bearer API key for site-mail */
  apiKey?: string;
};

function readEnv(name: string): string {
  // CRA inlines REACT_APP_* at build time
  const value = (process.env as Record<string, string | undefined>)[name];
  return typeof value === "string" ? value : "";
}

export class MailManager {
  site: string;
  apiUrl: string;
  apiKey: string;
  recipientEmails: string[] = [];

  constructor(options: MailManagerOptions = {}) {
    this.site =
      options.site ||
      readEnv("REACT_APP_SITE_MAIL_SITE_SLUG") ||
      readEnv("SITE_MAIL_SITE_SLUG") ||
      "";
    this.apiUrl = (
      options.apiUrl ||
      readEnv("REACT_APP_SITE_MAIL_URL") ||
      readEnv("SITE_MAIL_URL") ||
      "https://site-mail.joed.dev"
    ).replace(/\/$/, "");
    this.apiKey =
      options.apiKey ||
      readEnv("REACT_APP_SITE_MAIL_API_KEY") ||
      readEnv("SITE_MAIL_API_KEY") ||
      "";
  }

  addRecipientEmail(toAddress: string) {
    this.recipientEmails.push(toAddress);
  }

  /**
   * Send a message via the site-mail microservice.
   * @param subject - email subject line
   * @param text - email body content
   */
  async sendMail(subject: string, text: string) {
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
