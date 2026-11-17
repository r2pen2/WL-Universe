import "../../../../../packages/beyond-the-bell/client/src/index.css";
import "../../../../../packages/beyond-the-bell/client/src/assets/style/layout.css";
import { AuthenticationManagerContext, CurrentSignInContext } from "../../../../../packages/beyond-the-bell/client/src/App.jsx";
import { ContactForm } from "../../../../../packages/beyond-the-bell/client/src/components/ContactForm.jsx";
import { theme } from "../../../../../packages/beyond-the-bell/client/src/assets/style/theme.js";
import { SiteContexts } from "../../_support/site.jsx";

/** Beyond the Bell: ContactForm component (with reCAPTCHA). */
export default {
  title: "Patterns/Contact form/Beyond the Bell",
  parameters: { site: "beyond-the-bell" },
};

const render = (admin) => () => (
  <SiteContexts contexts={{ signIn: CurrentSignInContext, auth: AuthenticationManagerContext }} theme={theme} admin={admin}>
    <ContactForm setHeaderLoaded={() => {}} setSubtitleLoaded={() => {}} />
  </SiteContexts>
);

export const Default = { name: "Beyond the Bell", render: render(false) };
