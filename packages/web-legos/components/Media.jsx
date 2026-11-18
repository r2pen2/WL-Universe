import "../assets/style/media.css";

import React from "react";
import { parseTimecode, parseYoutubeLink } from "../api/media.ts";

export function WLYoutubeEmbed(props) {
  return (
    <div className="d-flex flex-column w-100 justify-content-center align-items-center">
      <div className="web-legos-video-responsive" style={{maxWidth: props.maxWidth}}>
        <iframe width="560" height="315" src={`https://www.youtube.com/embed/${props.embedCode ? props.embedCode : ""}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
      </div>
    </div>
  );
}

/**
 * A YouTube video that plays only part of itself: from `start` to `end`. Takes any YouTube link
 * (or bare id) and timecodes the way people write them ("0:36", "11:50", "36"). A start time in the
 * link itself (`?t=36`) is used when `start` is blank. Renders nothing without a usable link.
 * @param {string} link - YouTube link or id
 * @param {string|number} start - Where to start, e.g. "0:36"
 * @param {string|number} end - Where to stop, e.g. "11:50"
 * @param {string} title - What the video is, for screen readers
 * @param {number|string} maxWidth - Max width of the player
 */
export function WLYoutubeClip({ link, start, end, title = "YouTube video", maxWidth }) {
  const { id, start: linkStart } = parseYoutubeLink(link);
  if (!id) { return null; }
  const from = parseTimecode(start) ?? linkStart;
  const to = parseTimecode(end);
  const params = new URLSearchParams({ rel: "0" });
  if (from) { params.set("start", String(from)); }
  if (to && (!from || to > from)) { params.set("end", String(to)); }
  return (
    <div data-wl="youtube-clip" style={{ width: "100%", maxWidth, margin: "0 auto" }}>
      <iframe
        style={{ display: "block", width: "100%", height: "auto", aspectRatio: "16 / 9", border: 0 }}
        src={`https://www.youtube.com/embed/${id}?${params}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
