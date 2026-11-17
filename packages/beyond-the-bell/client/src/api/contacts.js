import { useContactHref } from "../libraries/Web-Legos/api/contacts.ts";

/** What the site showed before its contacts were in the CMS; shown until Site settings has them. */
export const CONTACT_FALLBACKS = {
  address: "3 Man-Mar Drive #14\nPlainville, MA 02762",
  email: "questions@beyondthebelleducation.com",
  phone: "(508) 316-4751",
};

/** tel: / mailto: / maps hrefs for the icon buttons in the navbar and footer. */
export function useContactLinks() {
  return {
    callLink: useContactHref("phone", { fallback: CONTACT_FALLBACKS.phone }),
    mailLink: useContactHref("email", { fallback: CONTACT_FALLBACKS.email }),
    mapsLink: useContactHref("address", { fallback: CONTACT_FALLBACKS.address }),
  };
}
