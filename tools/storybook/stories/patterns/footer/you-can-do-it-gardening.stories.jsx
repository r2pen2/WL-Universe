import "../../../../../packages/you-can-do-it-gardening/client/src/index.css";
import "../../../../../packages/you-can-do-it-gardening/client/src/assets/style/layout.css";
import { CurrentSignInContext } from "../../../../../packages/you-can-do-it-gardening/client/src/App.jsx";
import Footer from "../../../../../packages/you-can-do-it-gardening/client/src/components/Footer.jsx";

import { SiteContexts } from "../../_support/site.jsx";

/** You Can Do It Gardening: its own Footer component. */
export default {
  title: "Patterns/Footer/You Can Do It Gardening",
  parameters: { site: "you-can-do-it-gardening" },
};

const render = (admin) => () => (
  <SiteContexts contexts={{ signIn: CurrentSignInContext }} theme={undefined} admin={admin}>
    <Footer />
  </SiteContexts>
);

export const Default = { name: "You Can Do It Gardening", render: render(false) };
