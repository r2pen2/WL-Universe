import { Component } from "react";
import { Divider, Dropdown, Image, Navbar, Text } from "@nextui-org/react";
import { SocialButton, SocialIcon } from "./Icons";

import "../assets/style/navigation.css";

export class WLNav extends Component {

  static Toggle() {
    return <Navbar.Toggle className="px-2 d-inline d-lg-none" />
  }

  static Left(props) {
    return (
      <div className="d-flex flex-row align-items-center justify-content-start gap-2" style={{flex: 1}}>
        {props.children}
      </div>
    )
  }

  static Center(props) {
    return (
      <div className="d-flex d-lg-none flex-row align-items-center justify-content-center gap-2" style={{flex: 1}} >
        {props.children}
      </div>
    )
  }

  static Right(props) {
    return (
      <div className="d-flex flex-row align-items-center justify-content-end gap-2" style={{flex: 1}}>
        {props.children}
      </div>
    )
  }

  render() {
    return (
      <Navbar
        height={this.props.height ? this.props.height : "80px"}
        variant={this.props.variant ? this.props.variant : "sticky"}
        maxWidth="fluid"
      >
        {this.props.children}
      </Navbar>
    )
  }
}

/**
 * @param {string} showIn - breakpoint to start showing WLNavSocials
 * @param {boolean} lineLeft - whether to show a line on the left side
 * @param {boolean} lineRight - whether to show a line on the right side
 */
export class WLNavSocials extends Component {

  /**
   * A button for social platforms in the navbar
   * @param {string} playformKey - platform to display button for
   * @param {string} color - alternative color for button
   * @param {string} href - link to social platform
   * @param {number} size - size of button
   * @param {boolean} bordered - whether to include a border around the button
   * @param {boolean} noHide - whether socials will stay visible at all widths
   * @default
   * size = 32
   * bordered = false
   * noHide = false
   * @returns
   */
  static Button({platformKey, color, href, size, bordered}) {
    return <SocialButton bordered={bordered} borderColor={color} socialIcon={<SocialIcon platformKey={platformKey} color={color} size={size ? size : 32} />} color={color} socialLink={href} />
  }

  render() {
    return (
      <div className={`d-flex flex-row align-items-center justify-content-start gap-2 ${!this.props.noHide ? "d-none" : ""} d${!this.props.noHide ? (this.props.showIn ? "-" + this.props.showIn : "-xxl") : ""}-flex`}>
          { this.props.lineLeft && <Divider className="d-none d-xxl-inline mx-2" css={{width: "3rem"}}/> }
          { this.props.children }
          { this.props.lineRight && <Divider className="d-none d-xxl-inline mx-2" css={{width: "3rem"}}/> }
      </div>
    )
  }
}

export class WLNavContent extends Component {

  static Left(props) {
    return <div className="d-flex flex-row align-items-center justify-content-start">{props.children}</div>
  }

  static Right(props) {
    return <div className="d-flex flex-row align-items-center justify-content-end">{props.children}</div>
  }

  render () {
    return this.props.children;
  }
}

/**
 * @param {boolean} buttonLight - whether to display light button for dropdown menu
 * @param {boolean} buttonBordered - whether to display bordered button for dropdown menu
 * @param {string} buttonText - text to display in button
 * @param {string} buttonFontSize - font size inside button
 * @param {React.ReactNode} buttonIcon - icon to place in button when text is too large
 * @param {string} hideTextIn - breakpoint to switch from text to image
 */
export class WLNavDropdownMenu extends Component {

  render() {

    return (
      <div className="d-flex flex-row align-items-center justify-content-center">
        <Dropdown
          isBordered
        >
          <Navbar.Item
            className={this.props.hideTextIn ? `d-none d-${this.props.hideTextIn}-flex` : "d-flex"}
            css={{
              fontSize: this.props.buttonFontSize,
              padding: this.props.buttonLight
            }}
          >
            <Dropdown.Button auto light={this.props.buttonLight} bordered={this.props.buttonBordered} aria-label="navbar-dropdown-menu-button">
              {this.props.buttonText}
            </Dropdown.Button>
          </Navbar.Item>
          <Dropdown.Menu
            aria-label="navbar-dropdown-menu"
            css={{
              $$dropdownMenuWidth: "340px",
              $$dropdownItemHeight: "fit-content",
              "& .nextui-dropdown-item": {
                py: "$4",
                // dropdown item left icon
                svg: {
                  color: "$secondary",
                  mr: "$4",
                },
                // dropdown item title
                "& .nextui-dropdown-item-content": {
                  w: "100%",
                  fontWeight: "$semibold",
                },
                // dropdown item description
                "& .nextui-dropdown-item-description": {
                  fontSize: this.props.descriptionFontSize ? this.props.descriptionFontSize : "1rem",
                },
              },
            }}
            onAction={(key) => {
              for (const link of this.props.links) {
                if (link.key === key) {
                  window.open(link.href, "_blank");
                }
              }
            }}
          >
            {this.props.children}
          </Dropdown.Menu>
        </Dropdown>
        <Dropdown isBordered>
          <Navbar.Item
            className={this.props.hideTextIn ? `d-flex d-${this.props.hideTextIn}-none` : "d-none"}
            css={{
              fontSize: this.props.buttonFontSize
            }}
          >
            <Dropdown.Button auto light={this.props.buttonLight} bordered={this.props.buttonBordered} iconRight={this.props.buttonIcon}/>
          </Navbar.Item>
          <Dropdown.Menu
            aria-label="navbar-dropdown-menu"
            css={{
              $$dropdownMenuWidth: "340px",
              $$dropdownItemHeight: "fit-content",
              "& .nextui-dropdown-item": {
                py: "$4",
                // dropdown item left icon
                svg: {
                  color: "$secondary",
                  mr: "$4",
                },
                // dropdown item title
                "& .nextui-dropdown-item-content": {
                  w: "100%",
                  fontWeight: "$semibold",
                },
              },
            }}
            onAction={(key) => {
              for (const link of this.props.links) {
                if (link.key === key) {
                  window.open(link.href, "_blank");
                }
              }
            }}
          >
            {this.props.children}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    )
  }
}

export function WLNavBrandLeft({title, imageSize, source, showIn, onClick}) {
  return (
    <Navbar.Brand
      className={`${showIn ? `d-none d-${showIn}-flex` : "d-lg-flex"} flex-row justify-content-start web-legos-nav-brand`}
      onClick={onClick ? onClick : () => window.location = "/"}
    >
        { source && <Image
          width={imageSize ? imageSize : 40}
          height={imageSize ? imageSize : 40}
          src={source}
          alt="navbar-brand"
        />}
        <Text b css={{fontSize: 20, marginLeft: "0.5em"}}>
          {title}
        </Text>
    </Navbar.Brand>
  )
}

export function WLNavBrandCenter({title, imageSize, source, hideIn, onClick}) {
  return (
    <Navbar.Brand
      className={`${hideIn ? `d-flex d-${hideIn}-none` : "d-lg-none"} flex-row justify-content-start gap-2 web-legos-nav-brand`}
      onClick={onClick ? onClick : () => window.location = "/"}
    >
        { source && <Image
          width={imageSize ? imageSize : 40}
          height={imageSize ? imageSize : 40}
          src={source}
          alt="navbar-brand"
        />}
        <Text b css={{fontSize: 20, marginLeft: "0.5em"}}>
          {title}
        </Text>
    </Navbar.Brand>
  )
}
