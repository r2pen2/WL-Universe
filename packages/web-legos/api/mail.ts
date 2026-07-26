import { getHostname } from "./development.ts";

const developmentHostname = getHostname();

export class MailManager {

  fromAddress: string;
  fromPassword: string;
  recipientEmails: string[] = [];

  constructor(fromAddress: string, fromPassword: string) {
    this.fromAddress = fromAddress;
    this.fromPassword = fromPassword;
  }

  addRecipientEmail(toAddress: string) {
    this.recipientEmails.push(toAddress);
  }

  /**
   * Send a message using this {@link MainManager} to SiteMail from Server-Legos
   * @param subject - email subject line
   * @param text  - email body content
   */
  async sendMail(subject: string, text: string) {
    for (const toAddress of this.recipientEmails) {
      fetch(`${developmentHostname}/site-mail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toAddress: toAddress,
          text: text,
          subject: subject
        }),
      })
    }
  }
}
