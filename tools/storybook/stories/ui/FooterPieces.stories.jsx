import { Copyright, WLFooterLogo, WLFooterSignature } from "../../../../packages/web-legos/components/Footer.jsx";
import logo from "../../../../packages/room01890/client/public/logo.png";

/** Small pieces every footer is built from (see Patterns/Footer for how each site combines them). */
export default {
  title: "UI elements/Footer pieces",
  parameters: { layout: "centered" },
};

/** WLFooterLogo: the site logo, capped at 150px tall. */
export const Logo = { render: () => <WLFooterLogo source={logo} /> };

export const CopyrightLine = {
  name: "Copyright",
  args: { year: 2026, name: "Example Site" },
  render: (args) => <Copyright {...args} />,
};

/** WLFooterSignature: the web developer credit. */
export const DeveloperCredit = { render: () => <WLFooterSignature /> };
