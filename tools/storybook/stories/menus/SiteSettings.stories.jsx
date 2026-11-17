import { useEffect } from "react";
import { SiteSettingsModal } from "../../../../packages/web-legos/components/SiteSettings.jsx";
import { openSiteSettings } from "../../../../packages/web-legos/api/contacts.ts";

/**
 * Site settings: the admin menu for site-wide settings (today, contact info: any number of email
 * addresses, phone numbers and street addresses). Opened from "Site settings" under the admin
 * login, or by clicking a contact link while signed in. Shows room01890's live values; saving is
 * refused here because the catalog's CMS key is read-only.
 */
export default {
  title: "Admin menus/Site settings",
  parameters: { layout: "fullscreen" },
};

function Open() {
  useEffect(() => {
    openSiteSettings({ section: "contacts" });
  }, []);
  return <SiteSettingsModal />;
}

export const SiteSettings = { name: "Site settings", render: () => <Open /> };
