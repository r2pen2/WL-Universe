import "@mantine/core/styles.css";
import "bootstrap/dist/css/bootstrap.css";
import "../../../../../packages/room01890/client/src/assets/style/room01890.css";
import { CurrentSignInContext } from "../../../../../packages/room01890/client/src/App.jsx";
import { ContactSection } from "../../../../../packages/room01890/client/src/components/home/ContactSection.jsx";
import { nextUiTheme } from "../../../../../packages/room01890/client/src/assets/style/nextUiTheme.js";
import { SiteContexts } from "../../_support/site.jsx";

/** Room 01890: ContactSection (inquiry form + contact info). */
export default {
  title: "Patterns/Contact form/Room 01890",
  parameters: { site: "room01890" },
};

const render = (admin) => () => (
  <SiteContexts contexts={{ signIn: CurrentSignInContext }} theme={nextUiTheme} mantine admin={admin}>
    <div className="r01-app"><ContactSection /></div>
  </SiteContexts>
);

export const Visitor = { render: render(false) };
export const Admin = { parameters: { admin: true }, render: render(true) };
