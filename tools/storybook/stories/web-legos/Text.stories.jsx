import { WLHeaderV2, WLLayoutHeader, WLLayoutText, WLTextV2 } from "../../../../packages/web-legos/components/Text.jsx";

export default {
  title: "Web-Legos/Text",
  // Ids resolve against room01890's live CMS content (read-only).
  parameters: { layout: "padded", site: "web-legos" },
};

/** CMS headers and text (WLHeaderV2 / WLTextV2), by text id. */
export const HeaderAndText = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <WLHeaderV2 firestoreId="hero-header" headerLevel={1} />
      <WLTextV2 firestoreId="hero-text" />
    </div>
  ),
};

/** The same, signed in with text-edit permission: click to edit. */
export const Editable = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <WLHeaderV2 firestoreId="hero-header" headerLevel={1} editable />
      <WLTextV2 firestoreId="contact-text" editable />
    </div>
  ),
};

/** Layout variants (WLLayoutHeader / WLLayoutText): inherit the site's typography; used by room01890. */
export const LayoutVariants = {
  render: () => (
    <div style={{ maxWidth: 640, fontFamily: "Georgia, serif" }}>
      <WLLayoutHeader firestoreId="meeting-space-header" headerLevel={2} />
      <WLLayoutText firestoreId="event-meeting-text" />
    </div>
  ),
};

/** Text ids the CMS doesn't have show their built-in children. */
export const MissingId = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <WLLayoutText firestoreId="no-such-id">Fallback copy shown until the CMS has this id.</WLLayoutText>
    </div>
  ),
};

/** Emails and phone numbers inside CMS text become links when rendered. */
export const ContactInfoInText = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <WLLayoutText firestoreId="no-such-id">{"Questions? Email info@room01890.com or call 781-910-4756."}</WLLayoutText>
    </div>
  ),
};
