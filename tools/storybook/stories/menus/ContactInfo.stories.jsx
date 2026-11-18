import { useEffect } from "react";
import { ContactInfoModal } from "../../../../packages/web-legos/components/SiteSettings.jsx";
import { enableFormRecipients, openSiteSettings } from "../../../../packages/web-legos/api/contacts.ts";

/**
 * Contact info: the admin menu for the site's email addresses, phone numbers and street addresses,
 * and (on sites with a contact form) where the form's messages go. Opened from "Contact info" under
 * the admin login, or by clicking a contact link while signed in. Shows room01890's live values;
 * saving is refused here because the catalog's CMS key is read-only.
 */
export default {
  title: "Admin menus/Contact info",
  parameters: { layout: "fullscreen" },
};

function Open({ contactForm }) {
  useEffect(() => {
    // A site with a contact form has a MailManager, which turns this on.
    if (contactForm) enableFormRecipients();
    openSiteSettings({ section: "contacts" });
  }, [contactForm]);
  return <ContactInfoModal />;
}

export const ContactInfo = {
  name: "Contact info",
  args: { contactForm: true },
  argTypes: { contactForm: { control: "boolean", description: "The site has a contact form (shows where its messages go)" } },
  render: ({ contactForm }) => <Open key={String(contactForm)} contactForm={contactForm} />,
};
