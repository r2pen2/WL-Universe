import { WLHeaderV2, WLLayoutHeader, WLLayoutText, WLTextV2 } from "../../../../packages/web-legos/components/Text.jsx";
import { WLImageV2 } from "../../../../packages/web-legos/components/Images.jsx";

/**
 * Reference only: the CMS-backed elements every site's copy and photos go through. They take their
 * look from the site they're in, so they're shown plainly here; see Sites for them in context.
 */
export default {
  title: "CMS elements",
  parameters: { layout: "padded" },
};

const card = { border: "1px solid #e6e8eb", borderRadius: 12, padding: 20, marginBottom: 16, maxWidth: 720, fontFamily: "system-ui, sans-serif" };
const label = { margin: "0 0 4px", fontSize: 13, fontWeight: 600 };
const note = { margin: "0 0 12px", fontSize: 13, color: "#687076" };

function Item({ name, children, description }) {
  return (
    <section style={card}>
      <p style={label}><code>{name}</code></p>
      <p style={note}>{description}</p>
      {children}
    </section>
  );
}

export const Overview = {
  render: () => (
    <div>
      <Item name="WLHeaderV2 / WLTextV2" description="A header or paragraph from the CMS by text id (firestoreId). Admins with text permission click to edit it. Emails and phone numbers inside become links.">
        <WLHeaderV2 firestoreId="hero-header" headerLevel={2} />
        <WLTextV2 firestoreId="hero-text" />
      </Item>
      <Item name="WLLayoutHeader / WLLayoutText" description="The same, but inheriting the surrounding typography (room01890 uses these). Missing ids show their built-in fallback.">
        <div style={{ fontFamily: "Georgia, serif" }}>
          <WLLayoutHeader firestoreId="meeting-space-header" headerLevel={3} />
          <WLLayoutText firestoreId="event-meeting-text" />
        </div>
      </Item>
      <Item name="WLImageV2" description="A photo from the CMS by image id. Admins with image permission click to replace it.">
        <div style={{ width: 320 }}>
          <WLImageV2 firestoreId="meeting-space-image-1" alt="Meeting room" />
        </div>
      </Item>
    </div>
  ),
};
