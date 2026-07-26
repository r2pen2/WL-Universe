import React, { Component } from 'react'

import "./headers.css"

/**
 * @deprecated don't use this lol it sucks
 * @param {textAlign} - Text alignment
 * @default
 * textAlign = "center";
 */
export class HeaderThreeLevels extends Component {

  /**
   * The HeaderThreeLevels' first level— title
   * @param {string} color - Title color
   * @returns
   */
  static Title = (titleProps) => <div className="wl-header-three-levels-title" style={{color: titleProps.color}}>{titleProps.children}</div>;

  /**
   * The HeaderThreeLevels' second level— subtitle
   * @param {string} color - Subtitle color
   * @returns
   */
  static Subtitle = (subtitleProps) => <div className="wl-header-three-levels-subtitle" style={{color: subtitleProps.color}}>{subtitleProps.children}</div>;

  /**
   * The HeaderThreeLevels' third level— body
   * @param {string} color - Body color
   * @returns
   */
  static Body = (bodyProps) => <div className="wl-header-three-levels-body" style={{color: bodyProps.color}}>{bodyProps.children}</div>;

  title = React.Children.toArray(this.props.children).find(child => child.type === HeaderThreeLevels.Title);
  subtitle = React.Children.toArray(this.props.children).find(child => child.type === HeaderThreeLevels.Subtitle);
  body = React.Children.toArray(this.props.children).find(child => child.type === HeaderThreeLevels.Body);

  render() {
    return (
      <hgroup
        className={`wl-header-three-levels mw-650`}
      >
        {this.title}
        {this.subtitle}
        {this.body}
        {this.props.button}
      </hgroup>
    )
  }
}
