import "@mantine/core/styles.css";
import "../../../../../packages/boston-mixtape/client/src/index.css";
import "../../../../../packages/web-legos/assets/style/layout.css";
import { CurrentSignInContext } from "../../../../../packages/boston-mixtape/client/src/App.jsx";
import { Contact } from "../../../../../packages/boston-mixtape/client/src/components/homepage/Contact.jsx";
import { nextUiTheme } from "../../../../../packages/boston-mixtape/client/src/assets/style/nextUiTheme.js";
import { SiteContexts } from "../../_support/site.jsx";

/** Boston Mixtape: Contact component. */
export default {
  title: "Patterns/Contact form/Boston Mixtape",
  parameters: { site: "boston-mixtape" },
};

const render = (admin) => () => (
  <SiteContexts contexts={{ signIn: CurrentSignInContext }} theme={nextUiTheme} mantine admin={admin}>
    <Contact />
  </SiteContexts>
);

export const Visitor = { render: render(false) };
export const Admin = { parameters: { admin: true }, render: render(true) };
