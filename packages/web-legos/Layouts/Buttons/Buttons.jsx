import React from 'react'
import "./buttons.css"

import {Button} from "@nextui-org/react"
import { ColorMaster, swanPurple } from '../../api/colors'

export function ButtonRounded(props) {

  /** Default color for testing purposes */
  const unhoveredColor = props.color ? props.color : swanPurple;

  const buttonHoverColor = `#${ColorMaster.addHexColor(unhoveredColor, "#111111")}`

  return (
    <Button
      data-testid="wl-button-rounded"
      onClick={props.onClick}
      size={props.size}
      className="wl-rounded-button"
      style={{
        "--wl-button-color": props.color,
        "--wl-button-hover-color": buttonHoverColor
      }}
    >
      {props.children}
    </Button>
  )
}
