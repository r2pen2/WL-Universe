import { WLOrnateFrame } from "../../../../packages/web-legos/components/Decoration.jsx";
import { WLYoutubeClip } from "../../../../packages/web-legos/components/Media.jsx";

/**
 * WLOrnateFrame (components/Decoration): a quiet baroque frame, a double rule with corner scrolls
 * and the flourish ornament breaking the rule top and bottom. Here around WLYoutubeClip
 * (components/Media), which plays a YouTube video from a start to an end timecode.
 */
export default {
  title: "UI elements/Ornate frame",
  parameters: { layout: "padded" },
  args: { accent: "#a67fcf", background: "#ffffff", maxWidth: 1000, ornamentWidth: 260, link: "https://www.youtube.com/watch?v=rNOzgQm63BE", start: "0:36", end: "11:50" },
  argTypes: {
    accent: { control: "color" },
    background: { control: "color" },
    maxWidth: { control: { type: "range", min: 320, max: 1400, step: 20 } },
    ornamentWidth: { control: { type: "range", min: 120, max: 480, step: 10 } },
  },
};

/** You Can Do It Gardening's featured clip, above the testimonials. */
export const AroundAVideo = {
  name: "Around a video clip",
  render: ({ link, start, end, ...frame }) => (
    <div style={{ background: frame.background, padding: "48px 16px" }}>
      <WLOrnateFrame {...frame}>
        <WLYoutubeClip link={link} start={start} end={end} title="Featured clip" />
      </WLOrnateFrame>
    </div>
  ),
};

/** The frame works around anything, e.g. a quote. */
export const AroundText = {
  name: "Around text",
  args: { maxWidth: 560 },
  render: ({ link, start, end, ...frame }) => (
    <div style={{ background: frame.background, padding: "48px 16px" }}>
      <WLOrnateFrame {...frame}>
        <p style={{ textAlign: "center", fontStyle: "italic", fontSize: 20, margin: "24px 8px" }}>
          “Like having a visit from a loving mom and your favorite teacher who is also a great gardener.”
        </p>
      </WLOrnateFrame>
    </div>
  ),
};
