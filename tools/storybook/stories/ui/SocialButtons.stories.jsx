import { WLFooterSocials } from "../../../../packages/web-legos/components/Footer.jsx";
import { WLNavSocials } from "../../../../packages/web-legos/components/Navigation.jsx";
import { SocialButton, SocialIcon, platformKeys } from "../../../../packages/web-legos/components/Icons.jsx";

/** Icon buttons that open a link (social profiles, mail, phone, maps). */
export default {
  title: "UI elements/Social buttons",
  parameters: { layout: "centered" },
};

const KEYS = Object.values(platformKeys);

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
