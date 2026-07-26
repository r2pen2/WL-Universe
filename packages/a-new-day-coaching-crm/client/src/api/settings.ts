export function updateAfterSwitchFlip(state: boolean, setState: Function, callback: Function) {
  const switchTransitionTime = 150
  setState(!state)
  setTimeout(callback, switchTransitionTime)
}