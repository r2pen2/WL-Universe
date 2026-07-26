import { Text } from '@mantine/core'
import React from 'react'

export default function ModuleHeader(props) {
  return (
    <div style={{height: props.large ? 50 : "2rem"}} className="green-bg mb-2 text-center d-flex align-items-center justify-content-center w-100">
      <Text size={props.large ? "xl" : ""} c="white" fw="bold">{props.children}</Text>
    </div>
  )
}
