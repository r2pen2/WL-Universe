const nodemailer = require("nodemailer");
const logger = require("./logger");

function buildTransport(profile) {
  const service = (profile.service || "").toLowerCase();

  if (service === "godaddy") {
    return nodemailer.createTransport({
      host: profile.host || "smtpout.secureserver.net",
      port: profile.port || 587,
      secure: false,
      auth: {
        user: profile.user,
        pass: profile.pass,
      },
    });
  }

  if (profile.host) {
    return nodemailer.createTransport({
      host: profile.host,
      port: profile.port || 587,
      secure: profile.port === 465,
      auth: {
        user: profile.user,
        pass: profile.pass,
      },
    });
  }

  return nodemailer.createTransport({
    service: service || "gmail",
    auth: {
      user: profile.user,
      pass: profile.pass,
    },
  });
}

/**
 * Send an email using a resolved site profile.
 * @returns {Promise<{ messageId: string, response: string }>}
 */
async function sendMail(profile, { to, subject, text, html }) {
  const transporter = buildTransport(profile);
  const mailOptions = {
    from: profile.from,
    to,
    subject,
    text: text || undefined,
    html: html || undefined,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info("mail_sent", {
      site: profile.site,
      prefix: profile.prefix,
      to,
      subject,
      messageId: info.messageId,
      response: info.response,
    });
    return {
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    logger.error("mail_send_failed", {
      site: profile.site,
      prefix: profile.prefix,
      to,
      subject,
      error: error.message,
    });
    throw error;
  }
}

module.exports = { sendMail, buildTransport };
