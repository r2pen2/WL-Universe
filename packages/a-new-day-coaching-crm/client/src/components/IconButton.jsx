import { ActionIcon, Tooltip } from '@mantine/core'
import React from 'react'

/** Abstraction of a structure I seem to be using a lot in this project */
export default function IconButton(props) {
  
  /** Color could come from two places in the props */
  const color = props.color ? props.color : props.buttonProps?.color;

  const [shiftDown, setShiftDown] = React.useState(false);

  function checkShift(e) {
    if (e.shiftKey) { setShiftDown(true); } else { setShiftDown(false); }
  }

  function executeClick() {
    if (props.onShiftClick) {
      if (shiftDown) {
        props.onShiftClick();
        return;
      }
    }
    props.onClick();
  }

  return (
    <Tooltip label={props.label} className={props.className} onMouseMove={checkShift} onMouseLeave={() => setShiftDown(false)}>
      <ActionIcon {...props.buttonProps} color={color} disabled={props.disabled} onClick={executeClick}>
        {props.icon}
      </ActionIcon>
    </Tooltip>
  )
}
