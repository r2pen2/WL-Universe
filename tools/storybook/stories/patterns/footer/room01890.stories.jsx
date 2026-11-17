import "@mantine/core/styles.css";
import "bootstrap/dist/css/bootstrap.css";
import "../../../../../packages/room01890/client/src/assets/style/room01890.css";
import { CurrentSignInContext } from "../../../../../packages/room01890/client/src/App.jsx";
import { SiteFooter } from "../../../../../packages/room01890/client/src/components/SiteFooter.jsx";
import { nextUiTheme } from "../../../../../packages/room01890/client/src/assets/style/nextUiTheme.js";
import { SiteContexts } from "../../_support/site.jsx";

/** Room 01890: its own SiteFooter component. */
export default {
  title: "Patterns/Footer/Room 01890",
  parameters: { site: "room01890" },
};

const render = (admin) => () => (
  <SiteContexts contexts={{ signIn: CurrentSignInContext }} theme={nextUiTheme} mantine admin={admin}>
    <div className="r01-app"><SiteFooter /></div>
  </SiteContexts>
);

export const Default = { name: "Room 01890", render: render(false) };
