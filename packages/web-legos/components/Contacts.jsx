import { Fragment, useEffect } from "react";
import "../assets/style/contacts.css";
import {
  addressOneLine,
  contactHref,
  openSiteSettings,
  registerContactFallback,
  useContactsStore,
} from "../api/contacts.ts";

const PLACEHOLDER = {
  email: "Add an email address",
  phone: "Add a phone number",
  address: "Add a street address",
};

function fallbackText(fallback, children) {
  if (typeof fallback === "string") return fallback;
  if (typeof children === "string") return children;
  return "";
}

/**
 * A site contact (email address, phone number or street address) from the CMS, rendered as a link
 * whose href is built from the value (mailto: / tel: / Google Maps). For admins (signed in through
 * FooterAuthButton) clicking it opens Site settings at that contact instead of following the link.
 *
 * Shared props of WLEmailAddress / WLPhoneNumber / WLStreetAddress:
 * @param {string} id - which contact (its CMS id); without it, the `index`th of its type
 * @param {number} index - position among the site's contacts of this type (default 0)
 * @param {string} fallback - value shown until the CMS has one (a string child works too)
 * @param {string} fallbackLabel - label offered with the fallback when an admin first saves contacts
 * @param {Function} children - optional render function ({value, href, label, contact}) => node,
 *   for custom markup inside the link (e.g. a NextUI <Text>)
 * @param {string} className - classes for the <a>
 * @param {object} style - style for the <a>
 * @param {boolean} editable - override whether clicking opens Site settings (default: signed-in admin)
 * @param {boolean} newTab - open the link in a new tab (default only for street addresses)
 * @param {string} ariaLabel - aria-label for the link
 */
function WLContactLink({ type, id, index = 0, fallback, fallbackLabel = "", children, className, style, editable, newTab, ariaLabel, singleLine, linkProps }) {
  const store = useContactsStore();
  const ofType = store.contacts.filter((contact) => contact.type === type);
  const contact = (id && ofType.find((c) => c.id === id)) || ofType[index];
  const fallbackValue = fallbackText(fallback, children);
  const value = contact ? contact.value : fallbackValue;
  const canEdit = editable ?? store.canEdit;

  useEffect(() => {
    if (fallbackValue) registerContactFallback(type, fallbackValue, fallbackLabel);
  }, [type, fallbackValue, fallbackLabel]);

  if (!value && !canEdit) return null;

  const href = contactHref(type, value);
  const display = !value
    ? PLACEHOLDER[type]
    : type === "address" && !singleLine
      ? addressLines(value)
      : type === "address"
        ? addressOneLine(value)
        : value;
  const content = typeof children === "function"
    ? children({ value, href, label: contact ? contact.label : "", contact, display })
    : display;
  const opensNewTab = newTab ?? type === "address";

  function edit(e) {
    e.preventDefault();
    openSiteSettings({ section: "contacts", contactId: contact ? contact.id : null, type });
  }

  return (
    <a
      {...linkProps}
      href={href || undefined}
      className={["wl-contact", `wl-contact--${type}`, canEdit ? "wl-contact--editable" : "", className].filter(Boolean).join(" ")}
      style={style}
      aria-label={ariaLabel}
      data-wl-contact={type}
      target={opensNewTab && !canEdit ? "_blank" : undefined}
      rel={opensNewTab && !canEdit ? "noopener noreferrer" : undefined}
      title={canEdit ? "Edit in Site settings" : undefined}
      onClick={canEdit ? edit : linkProps && linkProps.onClick}
    >
      {content}
    </a>
  );
}

function addressLines(value) {
  const lines = String(value).split(/\s*(?:\n|<br\s*\/?>)\s*/i).filter(Boolean);
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));
}

/** An email address from Site settings, as a mailto: link. See {@link WLContactLink} for props. */
export function WLEmailAddress(props) {
  return <WLContactLink {...props} type="email" />;
}

/** A phone number from Site settings, as a tel: link (vanity letters and extensions work). See {@link WLContactLink}. */
export function WLPhoneNumber(props) {
  return <WLContactLink {...props} type="phone" />;
}

/**
 * A street address from Site settings, as a Google Maps link. Line breaks in the value render as
 * line breaks; `singleLine` joins them with commas. See {@link WLContactLink} for props.
 */
export function WLStreetAddress(props) {
  return <WLContactLink {...props} type="address" />;
}

const BY_TYPE = { email: WLEmailAddress, phone: WLPhoneNumber, address: WLStreetAddress };

/**
 * Every contact of one type, each as its WL contact link (for "any number of" emails/phones/addresses).
 * @param {string} type - "email" | "phone" | "address"
 * @param {Array<string|{value: string, label: string}>} fallback - shown until the CMS has any
 * @param {boolean} showLabels - put each contact's label before its link ("Media inquiries: ...")
 * @param {boolean} block - one contact per line
 * @param {React.ReactNode} separator - between items (default: none)
 * @param {string} className - classes for the wrapper
 * @param {object} itemProps - props passed to each link
 */
export function WLContactList({ type, fallback = [], showLabels, block, separator = null, className, itemProps = {} }) {
  const { contacts } = useContactsStore();
  const ofType = contacts.filter((contact) => contact.type === type);
  const Item = BY_TYPE[type];
  const entries = ofType.length
    ? ofType.map((contact) => ({ key: contact.id, label: contact.label, props: { id: contact.id } }))
    : fallback.map((entry, i) => {
        const { value, label = "" } = typeof entry === "string" ? { value: entry } : entry;
        return { key: value, label, props: { index: i, fallback: value, fallbackLabel: label } };
      });
  const Wrapper = block ? "div" : "span";
  return (
    <Wrapper className={["wl-contact-list", block ? "wl-contact-list--block" : "", className].filter(Boolean).join(" ")}>
      {entries.map((entry, i) => (
        <Fragment key={entry.key}>
          {i > 0 && separator}
          <span className="wl-contact-list__item">
            {showLabels && entry.label && <span className="wl-contact-list__label">{entry.label}</span>}
            <Item {...entry.props} {...itemProps} />
          </span>
        </Fragment>
      ))}
    </Wrapper>
  );
}
