import React, { Component } from 'react'

import "./banner.css"

class Banner extends Component {

  static Header = (headerProps) => <div data-testid="wl-banner-header" className={"wl-text-primary "}>{headerProps.children}</div>;

  static Body = (bodyProps) => <div data-testid="wl-banner-body" className={"wl-text-secondary "}>{bodyProps.children}</div>;

  header = React.Children.toArray(this.props.children).find(child => child.type === Banner.Header);
  body = React.Children.toArray(this.props.children).find(child => child.type === Banner.Body);
}

export class BannerCentered extends Banner {
  render() {
    return (
      <div data-testid="wl-banner-centered" className={`mw-800 wl-banner flex-column align-items-center justify-content-center ${this.props.dark && "wl-section-dark"}`}>
        {this.header}
        {this.body}
      </div>
    )
  }
}

export class BannerWithImage extends Banner {

  static ImageContainer = (imageContainerProps) => <div data-testid="wl-banner-with-image-image-container" className="wl-banner-with-image-image-container">{imageContainerProps.children}</div>

  image = React.Children.toArray(this.props.children).find(child => child.type === BannerWithImage.ImageContainer);

  render() {
    return (
      <div data-testid="wl-banner-with-image" className={`wl-banner flex-row align-items-center justify-content-center gap-2 ${this.props.dark && "wl-section-dark"}`}>
        <div className="d-flex flex-column align-items-start justify-content-start mw-650 text-left">
          {this.header}
          {this.body}
        </div>
        {this.image}
      </div>
    )
  }
}
