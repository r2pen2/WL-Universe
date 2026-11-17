import { useEffect } from "react";
import { WLContactList, WLEmailAddress, WLPhoneNumber, WLStreetAddress } from "../../../../packages/web-legos/components/Contacts.jsx";
import { SiteSettingsModal } from "../../../../packages/web-legos/components/SiteSettings.jsx";
import { openSiteSettings, setContactsEditable } from "../../../../packages/web-legos/api/contacts.ts";

export default {
  title: "Web-Legos/Contacts",
  parameters: { layout: "padded", site: "web-legos" },
};

const box = { display: "flex", flexDirection: "column", gap: 12, fontFamily: "system-ui", fontSize: 18 };

/** The site's contacts from the CMS (room01890's in the mock), each a link built from its value. */
export const Links = {
  render: () => (
    <div style={box}>
      <WLEmailAddress fallback="info@example.com" />
      <WLPhoneNumber fallback="(617) 555-0123" />
      <WLStreetAddress fallback={"38 Church St, 2nd Floor\nWinchester, MA 01890"} />
      <WLStreetAddress fallback={"38 Church St, 2nd Floor\nWinchester, MA 01890"} singleLine />
    </div>
  ),
};

/** Customized only with style / className. */
export const Styled = {
  render: () => (
    <div style={box}>
      <WLEmailAddress fallback="info@example.com" style={{ color: "#8C8C8C", fontSize: "1.125rem" }} />
      <WLPhoneNumber fallback="(202) 798-ADHD" style={{ color: "#5738B3", fontWeight: 600, textDecoration: "none" }} />
    </div>
  ),
};

/** Fallback values when the CMS has none of a type (here, a site with no contacts saved). */
export const Fallbacks = {
  parameters: { site: "joe-dobbelaar" },
  render: () => (
    <div style={box}>
      <WLEmailAddress fallback="hire@joed.dev" />
      <WLPhoneNumber fallback="(781) 879-9058" />
    </div>
  ),
};

export const ContactList = {
  render: () => (
    <div style={box}>
      <WLContactList type="email" fallback={["one@example.com", "two@example.com"]} />
      <WLContactList type="phone" block fallback={["(617) 555-0123", "(617) 555-0199"]} />
    </div>
  ),
};

function AdminView() {
  useEffect(() => {
    setContactsEditable(true);
    return () => setContactsEditable(false);
  }, []);
  return (
    <div style={box}>
      <p style={{ margin: 0, color: "#687076", fontSize: 14 }}>Signed in as an admin: click a contact to edit it in Site settings.</p>
      <WLEmailAddress fallback="info@example.com" />
      <WLPhoneNumber fallback="(617) 555-0123" />
      <WLStreetAddress fallback={"38 Church St\nWinchester, MA"} />
      <SiteSettingsModal />
    </div>
  );
}

/** What admins see: dashed outlines; clicking opens Site settings at that contact. */
export const AdminEditing = { render: () => <AdminView /> };

function SettingsOpen() {
  useEffect(() => {
    setContactsEditable(true);
    openSiteSettings({ section: "contacts" });
  }, []);
  return (
    <>
      <WLEmailAddress fallback="info@example.com" />
      <SiteSettingsModal />
    </>
  );
}

/** The Site settings contact editor (FooterAuthButton mounts it for admins on every site). */
export const SiteSettings = { render: () => <SettingsOpen /> };
