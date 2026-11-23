import React from "react";

import { WLYoutubeClip } from "../libraries/Web-Legos/components/Media";
import { WLOrnateFrame } from "../libraries/Web-Legos/components/Decoration";
import { Text } from "@nextui-org/react";

/**
 * The homepage's featured clip: a YouTube video, played from `startTime` to `endTime`, in a quiet
 * baroque frame. Renders nothing until the clip has a link.
 * A line above it (`caption`) says what the clip is.
 * @param {object} clip - A FeaturedClip from the CMS: `{ youtubeLink, startTime, endTime, caption }`
 */
export default function FeaturedClip({ clip }) {
  if (!clip || !clip.youtubeLink) { return null; }
  const title = clip.caption || "Featured clip from You Can Do It Gardening";
  return (
    <>
      {clip.caption && <Text align="center" css={{ maxWidth: 800, margin: 0 }}>{clip.caption}</Text>}
      <WLOrnateFrame accent="#a67fcf" background="#ffffff" maxWidth={1000}>
        <WLYoutubeClip link={clip.youtubeLink} start={clip.startTime} end={clip.endTime} title={title} />
      </WLOrnateFrame>
    </>
  );
}
