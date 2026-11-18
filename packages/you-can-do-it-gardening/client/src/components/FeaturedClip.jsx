import React from "react";

import { WLYoutubeClip } from "../libraries/Web-Legos/components/Media";
import { WLOrnateFrame } from "../libraries/Web-Legos/components/Decoration";

/**
 * The homepage's featured clip: a YouTube video, played from `startTime` to `endTime`, in a quiet
 * baroque frame. Renders nothing until the clip has a link.
 * @param {object} clip - A FeaturedClip from the CMS: `{ youtubeLink, startTime, endTime }`
 */
export default function FeaturedClip({ clip, title = "Featured clip from You Can Do It Gardening" }) {
  if (!clip || !clip.youtubeLink) { return null; }
  return (
    <WLOrnateFrame accent="#a67fcf" background="#ffffff" maxWidth={1000}>
      <WLYoutubeClip link={clip.youtubeLink} start={clip.startTime} end={clip.endTime} title={title} />
    </WLOrnateFrame>
  );
}
