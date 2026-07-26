import "../assets/style/media.css";

import React from "react";

export function WLYoutubeEmbed(props) {
  return (
    <div className="d-flex flex-column w-100 justify-content-center align-items-center">
      <div className="web-legos-video-responsive" style={{maxWidth: props.maxWidth}}>
        <iframe width="560" height="315" src={`https://www.youtube.com/embed/${props.embedCode ? props.embedCode : ""}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
      </div>
    </div>
  );
}
