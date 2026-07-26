import React, { Component } from 'react'

import "./glyphSections.css";

class GlyphSection extends Component {

  glyph = React.Children.toArray(this.props.children).find(child => child.type === GlyphSection.Glyph);

  static Glyph = ({imageSource}) => <img src={imageSource} alt="glyph" className="wl-glyph-section-glyph" data-testid="wl-glyph-section-glyph" />;
}

export class GlyphSectionTwoItemsNoActions extends GlyphSection {


  static Left = (leftProps) => (
    <div className="wl-glyph-section-two-items-no-actions-item text-center">
      {leftProps.children}
    </div>
  )

  static Right = (rightProps) => (
    <div className="wl-glyph-section-two-items-no-actions-item text-center">
      {rightProps.children}
    </div>
  )

  leftChild = React.Children.toArray(this.props.children).find(child => child.type === GlyphSectionTwoItemsNoActions.Left);
  rightChild = React.Children.toArray(this.props.children).find(child => child.type === GlyphSectionTwoItemsNoActions.Right);

  render() {
    return (
      <div className={`w-100 ${this.props.dark && "wl-section-dark"}`}>
        <div className="wl-glyph-section-two-items-no-actions d-none d-lg-flex wl-gap-3">
          {this.leftChild}
          <div className="wl-glyph-section-two-items-no-actions-glyph-container">
            {this.glyph}
          </div>
          {this.rightChild}
        </div>
        <div className="wl-glyph-section-two-items-no-actions d-flex d-lg-none">
          <div className="wl-glyph-section-two-items-no-actions-md-container container-fluid">
            <div className="row">
              <div className="col-12 col-md-6 d-flex flex-column align-items-center justify-content-center">{this.leftChild}</div>
              <div className="col-12 col-md-6 d-flex flex-column align-items-center justify-content-center">{this.rightChild}</div>
            </div>
          </div>
          <div className="wl-glyph-section-two-items-no-actions-glyph-container">
            {this.glyph}
          </div>
        </div>
      </div>
    )
  }
}
