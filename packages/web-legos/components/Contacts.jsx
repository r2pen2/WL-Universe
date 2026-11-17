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

/**
 * A site contact (email address, phone number or street address) from the CMS, rendered as a link
 * whose href is built from the value (mailto: / tel: / Google Maps). The link text is always the
 * value itself; sites only change how it looks. For admins (signed in through FooterAuthButton)
 * clicking it opens Site settings at that contact instead of following the link.
 *
 * Props of WLEmailAddress / WLPhoneNumber / WLStreetAddress:
 * @param {string} id - which contact (its CMS id); without it, the `index`th of its type
 * @param {number} index - position among the site's contacts of this type (default 0)
 * @param {string} fallback - value shown until the CMS has one
 * @param {string} className - classes for the link
 * @param {object} style - inline style for the link
 * @param {boolean} singleLine - street addresses only: join the lines with commas
 * @param {string} ariaLabel - aria-label for the link
 */
function WLContactLink({ type, id, index = 0, fallback = "", className, style, singleLine, ariaLabel, editable }) {
  const store = useContactsStore();
  const ofType = store.contacts.filter((contact) => contact.type === type);
  const contact = (id && ofType.find((c) => c.id === id)) || ofType[index];
  const value = contact ? contact.value : fallback;
  const canEdit = editable ?? store.canEdit;

  useEffect(() => {
    if (fallback) registerContactFallback(type, fallback);
  }, [type, fallback]);

  if (!value && !canEdit) return null;

  const href = contactHref(type, value);
  const display = !value
    ? PLACEHOLDER[type]
    : type === "address" && !singleLine
      ? addressLines(value)
      : type === "address"
        ? addressOneLine(value)
        : value;
  const newTab = type === "address" && !canEdit;

  function edit(e) {
    e.preventDefault();
    openSiteSettings({ section: "contacts", contactId: contact ? contact.id : null, type });
  }

  return (
    <a
      href={href || undefined}
      className={["wl-contact", `wl-contact--${type}`, canEdit ? "wl-contact--editable" : "", className].filter(Boolean).join(" ")}
      style={style}
      aria-label={ariaLabel}
      data-wl-contact={type}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      title={canEdit ? "Edit in Site settings" : undefined}
      onClick={canEdit ? edit : undefined}
    >
      {display}
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
 * Every contact of one type, each as its WL contact link (sites can have any number of each).
 * @param {string} type - "email" | "phone" | "address"
 * @param {string[]} fallback - values shown until the CMS has any
 * @param {boolean} block - one contact per line
 * @param {string} className - classes for the wrapper
 * @param {object} style - inline style for the wrapper
 * @param {string} itemClassName - classes for each link
 * @param {object} itemStyle - inline style for each link
 */
export function WLContactList({ type, fallback = [], block, className, style, itemClassName, itemStyle }) {
  const { contacts } = useContactsStore();
  const ofType = contacts.filter((contact) => contact.type === type);
  const Item = BY_TYPE[type];
  const items = ofType.length
    ? ofType.map((contact) => ({ key: contact.id, props: { id: contact.id } }))
    : fallback.map((value, i) => ({ key: value, props: { index: i, fallback: value } }));
  const Wrapper = block ? "div" : "span";
  return (
    <Wrapper className={["wl-contact-list", block ? "wl-contact-list--block" : "", className].filter(Boolean).join(" ")} style={style}>
      {items.map((item) => (
        <Item key={item.key} {...item.props} className={itemClassName} style={itemStyle} />
      ))}
    </Wrapper>
  );
}
