import { FullSite } from "../_support/site.jsx";

const load = () => import("../../../../packages/room01890/client/src/index.js");

/** Room 01890, rendered by its own src/index.js against the CMS snapshot. Switch viewports to compare. */
export default {
  title: "Sites/Room 01890",
  parameters: { site: "room01890", fullSite: true, route: "/" },
};

export const Home = { render: () => <FullSite load={load} /> };
