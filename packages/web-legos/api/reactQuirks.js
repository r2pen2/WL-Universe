import React from "react"

/**
 * Turn a React props.children into an array of children (using a forEach)
 * @returns an array of React.ReactNode
 */
export function getChildrenList(children) {
  let newChildren = [];
  React.Children.forEach(children, function(child) { newChildren.push(child); });
  return newChildren;
}
