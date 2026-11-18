import { WLFooterSocials } from "../../../../packages/web-legos/components/Footer.jsx";
import { WLNavSocials } from "../../../../packages/web-legos/components/Navigation.jsx";
import { SocialButton, SocialIcon, platformKeys } from "../../../../packages/web-legos/components/Icons.jsx";
import { OnEachSite as Usages } from "../_support/usages.jsx";

/** Icon buttons that open a link (social profiles, mail, phone, maps). */
export default {
  title: "UI elements/Social buttons",
  parameters: { layout: "centered" },
};

/** Every instance on the WL sites, as each site renders it, grouped into variants. */
export const OnEachSite = {
  name: "On each site",
  parameters: { layout: "fullscreen", controls: { disable: true } },
  render: () => <Usages elements={["socialButtons"]} />,
};

const KEYS = Object.values(platformKeys);

/** Every platform key at once (SocialButton + SocialIcon), labeled with the key to pass. */
export const AllPlatforms = {
  name: "All platforms",
  args: { size: 40, color: "", bordered: false, background: "#ffffff" },
  argTypes: {
    color: { control: "color", description: "Override every icon's color (empty = each platform's own)" },
    size: { control: { type: "range", min: 16, max: 96 } },
    background: { control: "color" },
  },
  render: ({ size, color, bordered, background }) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(size + 48, 110)}px, 1fr))`, gap: 16, width: "min(1100px, 92vw)", padding: 20, background, borderRadius: 12 }}>
      {KEYS.map((key) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <SocialButton platformKey={key} bordered={bordered} borderColor={color || undefined} socialLink="https://example.com" socialIcon={<SocialIcon platformKey={key} size={size} color={color || undefined} />} />
          <code style={{ fontSize: 12, color: "#687076", background: "#f1f3f5", padding: "1px 6px", borderRadius: 4 }}>{key}</code>
        </div>
      ))}
    </div>
  ),
};

/** One button. */
export const Button = {
  args: { platformKey: "instagram", size: 40, color: "" },
  argTypes: {
    platformKey: { control: "select", options: KEYS },
    color: { control: "color" },
    size: { control: { type: "range", min: 16, max: 96 } },
  },
  render: ({ platformKey, size, color }) => (
    <SocialButton socialLink="https://example.com" socialIcon={<SocialIcon platformKey={platformKey} size={size} color={color || undefined} />} />
  ),
};

/** WLFooterSocials: the row of buttons in a footer (optional rules above and below). */
export const FooterRow = {
  args: { lineTop: true, lineBottom: true, size: 40 },
  render: ({ lineTop, lineBottom, size }) => (
    <WLFooterSocials lineTop={lineTop} lineBottom={lineBottom}>
      {["facebook", "instagram", "youtube", "linkedin", "tiktok", "mail", "phone", "location"].map((key) => (
        <WLFooterSocials.Button key={key} platformKey={key} href="https://example.com" size={size} color={["mail", "phone", "location"].includes(key) ? "#5F5A67" : undefined} />
      ))}
    </WLFooterSocials>
  ),
};

/** WLNavSocials: the same buttons sized for a navigation bar. Hidden below `showIn` (default xxl). */
export const NavRow = {
  globals: { viewport: { value: "desktop" } },
  render: () => (
    <WLNavSocials showIn="sm">
      <WLNavSocials.Button platformKey="phone" color="#F97316" href="tel:+16175550123" />
      <WLNavSocials.Button platformKey="mail" color="#AB1CD6" href="mailto:info@example.com" />
      <WLNavSocials.Button platformKey="facebook" href="https://facebook.com" />
      <WLNavSocials.Button platformKey="location" color="#16A34A" href="https://maps.google.com" />
    </WLNavSocials>
  ),
};
