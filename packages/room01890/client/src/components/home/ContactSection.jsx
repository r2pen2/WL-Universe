import { useState } from "react";
import { Header, Text } from "../Wl.jsx";
import { FormResponse } from "../../libraries/Web-Legos/api/admin.ts";
import { R01MailManager } from "../../App.jsx";
import { SERVICE_TYPES } from "../../content.js";
import { ReactComponent as ChevronDown } from "../../assets/icons/dropdown-chevron.svg";

const EMPTY = { firstName: "", lastName: "", email: "", serviceType: "", message: "", website: "" };

/**
 * Saves the inquiry to wl-forms (formId "room01890-inquiry") and emails it through site-mail.
 * Succeeds if either works, so a mail outage doesn't lose the visitor's message.
 */
async function submitInquiry(values) {
  const name = `${values.firstName} ${values.lastName}`.trim();

  const res = new FormResponse();
  res.content["First Name"] = values.firstName;
  res.content["Last Name"] = values.lastName;
  res.content["Business Email"] = values.email;
  res.content["Service Type"] = values.serviceType;
  res.content["Message"] = values.message;
  res.shortStrings.formId = "room01890-inquiry";
  res.shortStrings.formTitle = "Room 01890 Inquiry";
  res.numbers.createdAtSeconds = Date.now() / 1000;

  const body =
    `Name: ${name}\n` +
    `Business Email: ${values.email}\n` +
    `Service Type: ${values.serviceType}\n` +
    `Message: ${values.message}`;

  const [saved, mailed] = await Promise.all([
    res.sendFormData().then((status) => status >= 200 && status < 300),
    R01MailManager.sendMail(`New Room 01890 inquiry from ${name}`, body).then(
      () => true,
      (error) => {
        console.error("Inquiry email failed", error);
        return false;
      }
    ),
  ]);
  if (!saved && !mailed) throw new Error("Inquiry could not be sent");
}

function Field({ label, required, htmlFor, children, className = "" }) {
  return (
    <div className={`r01-field ${className}`}>
      <label htmlFor={htmlFor} className="r01-field__label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
    </div>
  );
}

function InquiryForm() {
  const [values, setValues] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    if (values.website) return; // honeypot: bots fill every field
    setStatus("sending");
    try {
      await submitInquiry(values);
      setStatus("sent");
      setValues(EMPTY);
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="r01-form" onSubmit={onSubmit} aria-label="Contact form">
      <div className="r01-form__row">
        <Field label="First Name" required htmlFor="r01-first">
          <input id="r01-first" className="r01-input" required autoComplete="given-name" value={values.firstName} onChange={set("firstName")} />
        </Field>
        <Field label="Last Name" required htmlFor="r01-last">
          <input id="r01-last" className="r01-input" required autoComplete="family-name" value={values.lastName} onChange={set("lastName")} />
        </Field>
      </div>
      <Field label="Business Email" required htmlFor="r01-email">
        <input
          id="r01-email"
          type="email"
          className="r01-input"
          required
          autoComplete="email"
          placeholder="email@company.com"
          value={values.email}
          onChange={set("email")}
        />
      </Field>
      <Field label="Service Type" required htmlFor="r01-service">
        <div className="r01-select">
          <select id="r01-service" className="r01-input r01-select__input" required value={values.serviceType} onChange={set("serviceType")}>
            <option value="" disabled hidden />
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="r01-select__icon" aria-hidden="true" />
        </div>
      </Field>
      <Field label="Message" htmlFor="r01-message">
        <textarea id="r01-message" className="r01-input r01-textarea" placeholder="How can we help you?" value={values.message} onChange={set("message")} />
      </Field>
      <div className="r01-form__honeypot" aria-hidden="true">
        <label htmlFor="r01-website">Website</label>
        <input id="r01-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
      </div>
      <button type="submit" className="r01-button r01-button--ink r01-form__submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Submit"}
      </button>
      <p className="r01-form__status" role="status">
        {status === "sent" && "Thanks for submitting!"}
        {status === "error" && "Sorry — we couldn't send your message. Please try again or email info@room01890.com."}
      </p>
    </form>
  );
}

/** "Get in Touch": copy + location/email/phone on the left, inquiry form on the right. */
export function ContactSection() {
  return (
    <section id="contact" className="r01-contact">
      <div className="r01-contact__info">
        <Header id="contact-header" level={2} className="r01-h2" />
        <Text id="contact-text" className="r01-contact__lead" />
        <div className="r01-contact__item">
          <Header id="contact-location-header" level={6} className="r01-contact__label" />
          <Text id="contact-location-text" className="r01-contact__value" tight />
        </div>
        <div className="r01-contact__item">
          <Header id="contact-email-header" level={6} className="r01-contact__label" />
          <Text id="contact-email-text" className="r01-contact__value" />
        </div>
        <div className="r01-contact__item">
          <Header id="contact-phone-header" level={6} className="r01-contact__label" />
          <Text id="contact-phone-text" className="r01-contact__value" />
        </div>
      </div>
      <div className="r01-contact__form">
        <InquiryForm />
      </div>
    </section>
  );
}
