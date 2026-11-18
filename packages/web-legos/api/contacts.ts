import { useEffect, useSyncExternalStore } from "react";
import { CmsManager } from "./cms.ts";

/**
 * Site contact info (email addresses, phone numbers, street addresses), kept in the CMS so a site
 * can list any number of each. Stored with the site models (wl-cms `/site-models`), collection
 * `siteContacts` (`siteContacts-<siteKey>` on v2 sites). One document per contact:
 *   { type: "email" | "phone" | "address" | "formRecipient", value: string, order: number }
 *
 * WLEmailAddress / WLPhoneNumber / WLStreetAddress (components/Contacts.jsx) render them as links and
 * build the href (mailto: / tel: / Google Maps) automatically. "formRecipient" entries are never
 * shown on the page: they're the addresses the site's contact form sends to (MailManager reads
 * them). Admins edit all of it in the Contact info menu (components/SiteSettings.jsx).
 */

export type ContactType = "email" | "phone" | "address" | "formRecipient";

export type SiteContact = {
  id: string;
  type: ContactType;
  value: string;
  order?: number;
};

export const CONTACTS_COLLECTION = "siteContacts";
/** Contact types shown on the page. */
export const CONTACT_TYPES: ContactType[] = ["email", "phone", "address"];
/** Where contact form messages go (not shown on the page). */
export const FORM_RECIPIENT: ContactType = "formRecipient";
const STORED_TYPES: ContactType[] = [...CONTACT_TYPES, FORM_RECIPIENT];

// ------------------------------------------------------------------ hrefs

const KEYPAD: { [letter: string]: string } = {};
["", "", "ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"].forEach((letters, digit) => {
  for (const letter of letters) KEYPAD[letter] = String(digit);
});

/** mailto: link for an email address. */
export function emailHref(value: string): string {
  return `mailto:${String(value || "").trim()}`;
}

/**
 * tel: link for a phone number as people write it: "(781) 910-4756", "781.910.4756",
 * "+44 20 7946 0958", vanity numbers like "(202) 798-ADHD", and extensions ("x12", "ext. 12").
 * 10-digit numbers are taken as US (+1).
 */
export function phoneHref(value: string): string {
  const raw = String(value || "").trim();
  const extMatch = /(?:\s*(?:ext\.?|extension|x|#)\s*)(\d+)\s*$/i.exec(raw);
  const main = extMatch ? raw.slice(0, extMatch.index) : raw;
  const plus = main.trim().startsWith("+");
  const digits = main
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) => KEYPAD[letter] || "")
    .replace(/\D/g, "");
  let number = digits;
  if (plus) number = `+${digits}`;
  else if (digits.length === 10) number = `+1${digits}`;
  else if (digits.length === 11 && digits.startsWith("1")) number = `+${digits}`;
  return `tel:${number}${extMatch ? `;ext=${extMatch[1]}` : ""}`;
}

/** Street address on one line ("38 Church St, 2nd Floor, Winchester, MA"). */
export function addressOneLine(value: string): string {
  return String(value || "")
    .split(/\s*(?:\n|<br\s*\/?>)\s*/i)
    .map((line) => line.trim().replace(/,$/, ""))
    .filter(Boolean)
    .join(", ");
}

/** Google Maps search link for a street address (opens the maps app on phones). */
export function addressHref(value: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressOneLine(value))}`;
}

export function contactHref(type: ContactType, value: string): string {
  if (!value) return "";
  if (type === "email" || type === FORM_RECIPIENT) return emailHref(value);
  if (type === "phone") return phoneHref(value);
  return addressHref(value);
}

/** Why a value can't be saved, or "" when it's fine. */
export function validateContact(type: ContactType, value: string): string {
  const v = String(value || "").trim();
  if (!v) return "Required";
  if ((type === "email" || type === FORM_RECIPIENT) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Not an email address";
  if (type === "phone" && phoneHref(v).replace(/\D/g, "").length < 7) return "Not a phone number";
  return "";
}

// ------------------------------------------------------------------ store

type SettingsState = { open: boolean; section: string; contactId: string | null; type: ContactType | null };

type State = {
  contacts: SiteContact[];
  loaded: boolean;
  canEdit: boolean;
  settings: SettingsState;
  /** True once the page has a contact form (a MailManager), so the menu offers form recipients. */
  hasContactForm: boolean;
  /** Values the page renders while the CMS has none of that type, offered as drafts in the Contact info menu. */
  fallbacks: { [type: string]: string[] };
};

let state: State = {
  contacts: [],
  loaded: false,
  canEdit: false,
  settings: { open: false, section: "contacts", contactId: null, type: null },
  hasContactForm: false,
  fallbacks: {},
};
const listeners = new Set<() => void>();
let loading: Promise<SiteContact[]> | null = null;

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function cms() {
  return CmsManager.getShared();
}

export function sortContacts(list: SiteContact[]): SiteContact[] {
  return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalize(raw: any[]): SiteContact[] {
  if (!Array.isArray(raw)) return [];
  return sortContacts(
    raw
      .filter((doc) => doc && STORED_TYPES.includes(doc.type) && typeof doc.value === "string" && doc.value.trim())
      .map((doc) => ({ id: String(doc.id), type: doc.type, value: doc.value, order: Number(doc.order) || 0 })),
  );
}

/** Load the site's contacts once (shared by every contact component on the page). */
export function loadContacts(force = false): Promise<SiteContact[]> {
  if (loading && !force) return loading;
  loading = (async () => {
    try {
      const res = await cms().fetch(`/site-models?collection=${CONTACTS_COLLECTION}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contacts = normalize(await res.json());
      setState({ contacts, loaded: true });
      return contacts;
    } catch (err) {
      // No CMS (or it's down): components keep showing their fallback values.
      setState({ loaded: true });
      return state.contacts;
    }
  })();
  return loading;
}

async function post(body: object) {
  const res = await cms().fetch(`/site-models`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collection: CONTACTS_COLLECTION, ...body }),
  });
  if (!res.ok) throw new Error(`Saving contacts failed (${res.status}).`);
}

function newContactId(type: ContactType) {
  return `${type}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Replace the site's contacts with `next` (in display order within each type): writes every
 * contact and deletes the ones that were removed. Contacts without an id get one.
 */
export async function saveContacts(next: Array<Omit<SiteContact, "id"> & { id?: string }>): Promise<SiteContact[]> {
  const counters: { [type: string]: number } = {};
  const contacts: SiteContact[] = next.map((contact) => {
    const order = (counters[contact.type] = (counters[contact.type] ?? -1) + 1);
    return {
      id: contact.id || newContactId(contact.type),
      type: contact.type,
      value: contact.value.trim(),
      order,
    };
  });
  const keep = new Set(contacts.map((contact) => contact.id));
  const removed = state.contacts.filter((contact) => !keep.has(contact.id));
  await Promise.all([
    ...contacts.map(({ id, ...documentData }) => post({ documentId: id, documentData })),
    ...removed.map((contact) => post({ documentId: contact.id, action: "delete" })),
  ]);
  setState({ contacts: sortContacts(contacts) });
  return contacts;
}

/** Called by FooterAuthButton once it knows whether the signed-in user is a site admin. */
export function setContactsEditable(canEdit: boolean) {
  if (state.canEdit !== canEdit) setState({ canEdit });
}

/** Open the Contact info menu (mounted by FooterAuthButton for admins), optionally at one contact. */
export function openSiteSettings(options: { section?: string; contactId?: string | null; type?: ContactType | null } = {}) {
  setState({
    settings: { open: true, section: options.section || "contacts", contactId: options.contactId || null, type: options.type || null },
  });
}

export function closeSiteSettings() {
  setState({ settings: { ...state.settings, open: false } });
}

export function registerContactFallback(type: ContactType, value: string) {
  const current = state.fallbacks[type] || [];
  if (!value || current.includes(value)) return;
  setState({ fallbacks: { ...state.fallbacks, [type]: [...current, value] } });
}

/** Called by MailManager: the page has a contact form, so the menu lists where it sends. */
export function enableFormRecipients() {
  if (!state.hasContactForm) setState({ hasContactForm: true });
}

/** The addresses saved for the contact form ([] when none are saved or the CMS can't be reached). */
export async function loadFormRecipients(): Promise<string[]> {
  await loadContacts();
  // Read the store, not the load's result, so values saved since the page loaded count.
  return state.contacts.filter((contact) => contact.type === FORM_RECIPIENT).map((contact) => contact.value.trim());
}

/** Test hook: forget everything loaded. */
export function resetContactsStore() {
  loading = null;
  state = {
    contacts: [],
    loaded: false,
    canEdit: false,
    settings: { open: false, section: "contacts", contactId: null, type: null },
    hasContactForm: false,
    fallbacks: {},
  };
  listeners.forEach((listener) => listener());
}

function getState() {
  return state;
}

/** The whole contacts store; loads the contacts on first use. */
export function useContactsStore(): State {
  const current = useSyncExternalStore(subscribe, getState, getState);
  useEffect(() => {
    loadContacts();
  }, []);
  return current;
}

/** Every contact of a type (or every one shown on the page), in display order. */
export function useSiteContacts(type?: ContactType): SiteContact[] {
  const { contacts } = useContactsStore();
  return type ? contacts.filter((contact) => contact.type === type) : contacts.filter((contact) => CONTACT_TYPES.includes(contact.type));
}

/**
 * One contact: the one with `id`, else the `index`th of its type (first by default).
 * Undefined until loaded, or when the site has none.
 */
export function useSiteContact(type: ContactType, options: { id?: string; index?: number } = {}): SiteContact | undefined {
  const list = useSiteContacts(type);
  if (options.id) {
    const byId = list.find((contact) => contact.id === options.id);
    if (byId) return byId;
  }
  return list[options.index ?? 0];
}

/**
 * href for a contact, for links that aren't WL contact components (icon buttons, "Email us" buttons).
 * Falls back to `fallback` (a plain value, e.g. "info@example.com") until the CMS has one.
 */
export function useContactHref(type: ContactType, options: { id?: string; index?: number; fallback?: string } = {}): string {
  const contact = useSiteContact(type, options);
  return contactHref(type, contact ? contact.value : options.fallback || "");
}

export function useCanEditContacts(): boolean {
  return useContactsStore().canEdit;
}

// ------------------------------------------------------------------ links inside CMS text

const EMAIL_IN_TEXT = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// No lookbehind (older Safari can't parse it): the leading group keeps what came before the number.
const PHONE_IN_TEXT = /(^|[^\w+])((?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]\d{4})(?![\w])/g;

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Turn email addresses and phone numbers written inside CMS text (HTML) into mailto:/tel: links, for
 * display only (never saved). Leaves existing <a> elements and tag attributes alone.
 */
export function linkifyContacts(html: string): string {
  if (!html || typeof html !== "string") return html;
  const parts = html.split(/(<a\b[^>]*>[\s\S]*?<\/a>|<[^>]+>)/i);
  return parts
    .map((part) => {
      if (!part || part.startsWith("<")) return part;
      return part
        .replace(EMAIL_IN_TEXT, (email) => `<a class="wl-contact wl-contact--email" href="${escapeAttr(emailHref(email))}">${email}</a>`)
        .replace(PHONE_IN_TEXT, (_match, before, phone) => `${before}<a class="wl-contact wl-contact--phone" href="${escapeAttr(phoneHref(phone))}">${phone}</a>`);
    })
    .join("");
}
