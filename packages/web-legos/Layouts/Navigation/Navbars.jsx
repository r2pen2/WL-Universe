import React, { Component } from 'react'

import "./navbars.css"

export default class NavbarMinimal extends Component {

  static Item = (itemProps) => <a href={itemProps.href} data-testid="wl-navbar-minimal-anchor">{itemProps.children}</a>

  position = this.props.sticky ? "fixed" : "absolute";

  render() {
    return (
      <nav className="wl-navbar wl-navbar-minimal" style={{position: this.position}}>
        {this.props.children}
      </nav>
    )
  }
}
