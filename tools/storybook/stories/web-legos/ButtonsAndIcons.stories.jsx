import { LineButton } from "../../../../packages/web-legos/components/Buttons.jsx";
import { ButtonRounded } from "../../../../packages/web-legos/Layouts/Buttons/Buttons.jsx";
import { SocialIcon, platformKeys } from "../../../../packages/web-legos/components/Icons.jsx";

export default {
  title: "Web-Legos/Buttons and icons",
  parameters: { layout: "padded", site: "web-legos" },
};

export const Buttons = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 24 }}>
      <LineButton text="Speak With Me" color="#5738B3" onClick={() => {}} />
      <ButtonRounded color="#5738B3" size="lg" onClick={() => {}}>Rounded button</ButtonRounded>
      <ButtonRounded color="#0D0E26" onClick={() => {}}>Another color</ButtonRounded>
    </div>
  ),
};

/** Every social / contact icon (platformKeys). */
export const SocialIcons = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 120px)", gap: 16, fontFamily: "system-ui", fontSize: 12 }}>
      {Object.entries(platformKeys).map(([name, key]) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <SocialIcon platformKey={key} size={40} />
          <span>{name}</span>
        </div>
      ))}
    </div>
  ),
};
