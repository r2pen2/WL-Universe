// Library Imports
import { Divider, Link, Text } from "@nextui-org/react";
import { Component } from "react";
import { SocialButton, SocialIcon } from "./Icons";

export function Copyright({year, name}) {
  return (
    <Text size="$sm">
      Copyright © {year} {name}
    </Text>
  )
}

/**
 * Component to show a list of socials in the footer
 * @param {boolean} lineTop - whether to show a line on top of this social list
 * @param {boolean} lineBottom - whether to show a line below this social list
 */
export class WLFooterSocials extends Component {

  /**
   * A button for social platforms in the navbar
   * @param {string} playformKey - platform to display button for
   * @param {string} color - alternative color for button
   * @param {string} href - link to social platform
   * @param {number} size - size of button
   * @param {boolean} bordered - whether to include a border around the button
   * @default
   * size = 48
   * bordered = false
   */
  static Button({platformKey, color, href, size, bordered}) {
    return <SocialButton bordered={bordered} socialIcon={<SocialIcon platformKey={platformKey} color={color} size={size ? size : 48} />} color={color} socialLink={href} />
  }

  render() {
    return (
      <div className={`d-flex flex-column align-items-center justify-content-center gap-2`}>
        { this.props.lineTop && <Divider /> }
        <div className={`d-flex flex-row align-items-center justify-content-center py-2`} style={{gap: "1rem"}}>
          { this.props.children }
        </div>
        { this.props.lineBottom && <Divider /> }
      </div>
    )
  }
}

/**
 * Styled icon for Web-Legos site footers
 * @param {ImageSource} source - source for footer icon
 */
export function WLFooterLogo({source}) {
  return <img src={source} alt="footer-logo" className="m-2" style={{maxHeight: 150, width: "auto"}}/>
}

export function WLFooterSignature() {
  return (
    <div className="d-flex align-items-center justify-content-center flex-row">
      <Text size="$xs">
        Web Developer: <Link href="https://www.joed.dev/" style={{textDecoration: "underline"}}>Joe Dobbelaar</Link>
      </Text>
    </div>
  )
}
