import { useEffect, useRef, useState } from "react";
import { Button, Loading, Modal, Text } from "@nextui-org/react";
import "../assets/style/contacts.css";
import {
  CONTACT_TYPES,
  closeSiteSettings,
  contactHref,
  loadContacts,
  saveContacts,
  useContactsStore,
  validateContact,
} from "../api/contacts.ts";

const GROUPS = {
  email: { title: "Email addresses", add: "Add email", placeholder: "info@example.com" },
  phone: { title: "Phone numbers", add: "Add phone", placeholder: "(617) 555-0123" },
  address: { title: "Street addresses", add: "Add address", placeholder: "38 Church St, 2nd Floor\nWinchester, MA 01890" },
};

let nextKey = 0;
const rowKey = () => `row-${nextKey++}`;

function initialRows(contacts, fallbacks) {
  const rows = [];
  for (const type of CONTACT_TYPES) {
    const saved = contacts.filter((contact) => contact.type === type);
    if (saved.length) {
      saved.forEach((contact) => rows.push({ key: rowKey(), id: contact.id, type, value: contact.value }));
    } else {
      // Nothing saved yet: offer what the page currently shows, so saving keeps it.
      (fallbacks[type] || []).forEach((value) => rows.push({ key: rowKey(), type, value, draft: true }));
    }
  }
  return rows;
}

/**
 * Site settings for admins. Today it holds the site's contact info: any number of email addresses,
 * phone numbers and street addresses, which WLEmailAddress / WLPhoneNumber / WLStreetAddress show
 * across the site. Opened from FooterAuthButton's "Site settings" link or by clicking one of those
 * components while signed in. FooterAuthButton mounts it for admins; sites don't need to.
 */
export function SiteSettingsModal() {
  const store = useContactsStore();
  const { open, contactId, type: focusType } = store.settings;
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [focusKey, setFocusKey] = useState(null);
  const inputs = useRef({});

  // Fresh rows each time it opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setErrors({});
    setSaveError("");
    loadContacts(true).then((contacts) => {
      if (cancelled) return;
      const next = initialRows(contacts, store.fallbacks);
      let focus = contactId ? next.find((row) => row.id === contactId) : null;
      if (!focus && focusType) {
        focus = next.find((row) => row.type === focusType);
        if (!focus) {
          focus = { key: rowKey(), type: focusType, value: "" };
          next.push(focus);
        }
      }
      setRows(next);
      setFocusKey(focus ? focus.key : null);
    });
    return () => {
      cancelled = true;
    };
    // store.fallbacks is read once per open on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contactId, focusType]);

  useEffect(() => {
    if (focusKey && inputs.current[focusKey]) inputs.current[focusKey].focus();
  }, [focusKey, rows.length]);

  function update(key, patch) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  function remove(key) {
    setRows((current) => current.filter((row) => row.key !== key));
  }

  function move(key, delta) {
    setRows((current) => {
      const row = current.find((r) => r.key === key);
      const sameType = current.filter((r) => r.type === row.type);
      const at = sameType.indexOf(row);
      const target = sameType[at + delta];
      if (!target) return current;
      const a = current.indexOf(row);
      const b = current.indexOf(target);
      const next = [...current];
      next[a] = target;
      next[b] = row;
      return next;
    });
  }

  function add(type) {
    const row = { key: rowKey(), type, value: "" };
    setRows((current) => [...current, row]);
    setFocusKey(row.key);
  }

  async function save() {
    const keep = rows.filter((row) => row.value.trim());
    const nextErrors = {};
    keep.forEach((row) => {
      const problem = validateContact(row.type, row.value);
      if (problem) nextErrors[row.key] = problem;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setSaveError("");
    try {
      const ordered = CONTACT_TYPES.flatMap((type) => keep.filter((row) => row.type === type));
      await saveContacts(ordered.map(({ id, type, value }) => ({ id, type, value })));
      closeSiteSettings();
    } catch (err) {
      setSaveError(err.message || "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function close() {
    if (!saving) closeSiteSettings();
  }

  return (
    <Modal open={open} onClose={close} closeButton blur width="720px" aria-labelledby="wl-site-settings-title">
      <Modal.Header>
        <Text id="wl-site-settings-title" h4>Site settings</Text>
      </Modal.Header>
      <Modal.Body>
        <Text h5 css={{ margin: 0 }}>Contact info</Text>
        <Text size="$sm" color="$accents7" css={{ marginTop: 0 }}>
          Shown everywhere the site lists an email, phone number or address. Links are made automatically.
        </Text>
        {CONTACT_TYPES.map((type) => {
          const group = GROUPS[type];
          const list = rows.filter((row) => row.type === type);
          return (
            <section key={type} className="wl-site-settings__group" aria-label={group.title}>
              <Text h5>{group.title}</Text>
              {list.map((row, i) => {
                const focused = row.key === focusKey;
                const fieldProps = {
                  ref: (el) => (inputs.current[row.key] = el),
                  value: row.value,
                  placeholder: group.placeholder,
                  "aria-label": `${group.title} ${i + 1}`,
                  "aria-invalid": Boolean(errors[row.key]),
                  onChange: (e) => update(row.key, { value: e.target.value }),
                  onFocus: () => setFocusKey(row.key),
                };
                const href = row.value.trim() && !validateContact(type, row.value) ? contactHref(type, row.value) : "";
                return (
                  <div
                    key={row.key}
                    className={["wl-site-settings__row", focused ? "wl-site-settings__row--focused" : "", row.draft ? "wl-site-settings__row--draft" : ""].filter(Boolean).join(" ")}
                  >
                    {type === "address" ? <textarea rows={2} {...fieldProps} /> : <input type={type === "email" ? "email" : type === "phone" ? "tel" : "text"} {...fieldProps} />}
                    <div className="wl-site-settings__actions">
                      <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(row.key, -1)}>↑</button>
                      <button type="button" aria-label="Move down" disabled={i === list.length - 1} onClick={() => move(row.key, 1)}>↓</button>
                      <button type="button" aria-label={`Remove ${group.title} ${i + 1}`} onClick={() => remove(row.key)}>Remove</button>
                    </div>
                    {errors[row.key] && <div className="wl-site-settings__error">{errors[row.key]}</div>}
                    {row.draft && <div className="wl-site-settings__hint">Currently shown on the site but not saved yet. Save to keep it.</div>}
                    {href && <div className="wl-site-settings__hint">Link: {href}</div>}
                  </div>
                );
              })}
              <button type="button" className="wl-site-settings__add" onClick={() => add(type)}>+ {group.add}</button>
            </section>
          );
        })}
        {saveError && <Text color="error">{saveError}</Text>}
      </Modal.Body>
      <Modal.Footer>
        <Button flat auto color="" onClick={close} disabled={saving}>Cancel</Button>
        <Button flat auto color="success" aria-label="site-settings-save" onClick={save} disabled={saving}>
          {saving ? <Loading type="points" color="currentColor" size="sm" /> : "Save"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
