import { FullSite } from "../_support/site.jsx";

const load = () => import("../../../../packages/beyond-the-bell/client/src/index.js");

/** Beyond the Bell, rendered by its own src/index.js with live prod content (read-only). Switch viewports to compare. */
export default {
  title: "Sites/Beyond the Bell",
  parameters: { site: "beyond-the-bell", fullSite: true, route: "/" },
};

export const Home = { render: () => <FullSite load={load} /> };
