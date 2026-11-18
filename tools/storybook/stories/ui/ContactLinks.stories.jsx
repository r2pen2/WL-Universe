import { WLContactList, WLEmailAddress, WLPhoneNumber, WLStreetAddress } from "../../../../packages/web-legos/components/Contacts.jsx";
import { OnEachSite as Usages } from "../_support/usages.jsx";

/**
 * Contact info as links (AGENTS.md rule 1). Values come from the site's contacts in the CMS
 * (room01890's here); the link is built from the value. Sites only change how they look, with
 * `style` / `className`. Admins edit the values in the Contact info menu (Admin menus).
 */
export default {
  title: "UI elements/Contact links",
  parameters: { layout: "centered" },
  args: { color: "#11181c", fontSize: 18 },
  argTypes: { color: { control: "color" }, fontSize: { control: { type: "range", min: 12, max: 40 } } },
};

/** Every instance on the WL sites, as each site renders it, grouped into variants. */
export const OnEachSite = {
  name: "On each site",
  parameters: { layout: "fullscreen", controls: { disable: true } },
  render: () => <Usages elements={["email","phone","address"]} />,
};

const style = ({ color, fontSize }) => ({ color, fontSize, fontFamily: "system-ui, sans-serif" });

export const EmailAddress = { render: (args) => <WLEmailAddress fallback="info@example.com" style={style(args)} /> };

export const PhoneNumber = { render: (args) => <WLPhoneNumber fallback="(617) 555-0123" style={style(args)} /> };

export const StreetAddress = {
  args: { singleLine: false },
  render: (args) => <WLStreetAddress fallback={"38 Church St, 2nd Floor\nWinchester, MA 01890"} singleLine={args.singleLine} style={style(args)} />,
};

/** WLContactList: every contact of one type (sites can have any number). */
export const ContactList = {
  args: { type: "email", block: true },
  argTypes: { type: { control: "inline-radio", options: ["email", "phone", "address"] } },
  render: (args) => <WLContactList type={args.type} block={args.block} itemStyle={style(args)} />,
};
