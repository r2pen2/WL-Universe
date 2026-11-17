import "../../../../../packages/beyond-the-bell/client/src/index.css";
import "../../../../../packages/beyond-the-bell/client/src/assets/style/layout.css";
import { AuthenticationManagerContext, CurrentSignInContext } from "../../../../../packages/beyond-the-bell/client/src/App.jsx";
import Footer from "../../../../../packages/beyond-the-bell/client/src/components/Footer.jsx";
import { theme } from "../../../../../packages/beyond-the-bell/client/src/assets/style/theme.js";
import { SiteContexts } from "../../_support/site.jsx";

/** Beyond the Bell: its own Footer component. */
export default {
  title: "Patterns/Footer/Beyond the Bell",
  parameters: { site: "beyond-the-bell" },
};

const render = (admin) => () => (
  <SiteContexts contexts={{ signIn: CurrentSignInContext, auth: AuthenticationManagerContext }} theme={theme} admin={admin}>
    <Footer />
  </SiteContexts>
);

export const Default = { name: "Beyond the Bell", render: render(false) };
