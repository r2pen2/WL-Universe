import { FooterAuthButton } from "../../../../packages/web-legos/components/Auth.jsx";
import { fakeAuthManager } from "../_support/site.jsx";
import { OnEachSite as Usages } from "../_support/usages.jsx";

/**
 * FooterAuthButton: the "Admin Login" control every site has in its footer. Once an admin signs in
 * it reads "Signed in as ..." and adds links to the admin menus (see Admin menus). Sign-in is
 * disabled in the catalog.
 */
export default {
  title: "UI elements/Admin login",
  parameters: { layout: "centered" },
};

/** Every instance on the WL sites, as each site renders it, grouped into variants. */
export const OnEachSite = {
  name: "On each site",
  parameters: { layout: "fullscreen", controls: { disable: true } },
  render: () => <Usages elements={["adminLogin"]} />,
};

export const AdminLogin = {
  name: "Admin login",
  args: { link: true, color: "#11181c" },
  argTypes: { color: { control: "color" } },
  render: (args) => <FooterAuthButton {...args} authManager={fakeAuthManager()} currentSignIn={null} setCurrentSignIn={() => {}} />,
};
