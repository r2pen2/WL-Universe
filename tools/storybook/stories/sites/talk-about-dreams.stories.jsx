import { FullSite } from "../_support/site.jsx";
import DreamBubbles from "../../../../packages/talk-about-dreams/client/src/components/DreamBubbles.jsx";
import "../../../../packages/talk-about-dreams/client/src/assets/style/homepageV2.css";

const load = () => import("../../../../packages/talk-about-dreams/client/src/index.js");

/** Talk About Dreams, rendered by its own src/index.js with live prod content (read-only). Switch viewports to compare. */
export default {
  title: "Sites/Talk About Dreams",
  parameters: { site: "talk-about-dreams", fullSite: true, route: "/" },
};

export const Default = { name: "Talk About Dreams", render: () => <FullSite load={load} /> };

/** The homepage splash's background animation on its own: the real `.splash` section, without the content. */
export const DreamBubblesStory = {
  name: "Dream bubbles",
  parameters: { fullSite: false, route: undefined },
  render: () => (
    <section className="splash">
      <DreamBubbles />
    </section>
  ),
};
