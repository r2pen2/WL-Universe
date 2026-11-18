import { WLDriftingShapes } from "../../../../packages/web-legos/components/Backgrounds.jsx";
import { DREAM_BUBBLE_SHAPES } from "../../../../packages/talk-about-dreams/client/src/components/DreamBubbles.jsx";
import { GARDEN_SHAPES } from "../../../../packages/you-can-do-it-gardening/client/src/components/GardenDrift.jsx";

/**
 * WLDriftingShapes (components/Backgrounds): shapes drifting slowly across a section behind its
 * content, swaying like falling leaves. Each site passes its own shapes. Use the Controls panel to
 * try direction, count and sizes.
 */
export default {
  title: "UI elements/Drifting shapes",
  parameters: { layout: "fullscreen" },
  args: { direction: "up", count: 11, sway: 26, seed: 20261118 },
  argTypes: {
    direction: { control: "inline-radio", options: ["up", "down"] },
    count: { control: { type: "range", min: 1, max: 40, step: 1 } },
    sway: { control: { type: "range", min: 0, max: 80, step: 1 } },
    seed: { control: "number" },
  },
};

function Stage({ background, children }) {
  return <section style={{ position: "relative", isolation: "isolate", height: 600, background }}>{children}</section>;
}

/** Talk About Dreams: speech and thought bubbles rising behind the homepage splash. */
export const DreamBubbles = {
  render: (args) => (
    <Stage background="linear-gradient(180deg, #2b2470 0%, #4a3fb0 60%, #6b78e0 100%)">
      <WLDriftingShapes {...args} shapes={DREAM_BUBBLE_SHAPES} className="dream-bubbles" />
    </Stage>
  ),
};

/** You Can Do It Gardening: leaves and hydrangea florets falling over the homepage hero. */
export const LeavesAndFlowers = {
  args: { direction: "down" },
  render: (args) => (
    <Stage background="linear-gradient(160deg, #7f97e8 0%, #b9c9f4 50%, #dfe9a8 100%)">
      <WLDriftingShapes {...args} size={[24, 52]} shapes={GARDEN_SHAPES} />
    </Stage>
  ),
};
