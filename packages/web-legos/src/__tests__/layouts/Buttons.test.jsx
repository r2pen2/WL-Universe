import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import {ButtonRounded} from "../../../Layouts/Buttons/Buttons"

describe("ButtonRounded tests", () => {

  function clickTest() {
    const container = screen.getByTestId("wl-button-rounded")
    container.setAttribute("test-clicked", "clicked");
  }

  const TestButton = () => <ButtonRounded onClick={clickTest}>Test</ButtonRounded>

  test("ButtonRounded renders", () => {
    render(<TestButton />)
    const button = screen.getByTestId("wl-button-rounded");
    expect(button).toBeVisible();
  })

  test("ButtonRounded fills text", () => {
    render(<TestButton />)
    const button = screen.getByTestId("wl-button-rounded");
    expect(button).toHaveTextContent("Test");
  })

  test("ButtonRounded registers click", () => {
    render(<TestButton />)
    const button = screen.getByTestId("wl-button-rounded");
    fireEvent.click(button)
    expect(button).toHaveAttribute("test-clicked");
  })
})
