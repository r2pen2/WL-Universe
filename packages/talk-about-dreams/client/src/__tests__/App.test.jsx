import { App } from "../App";
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

const TestApp = () => <App isTestingEnvironment={true} />

describe("High-level tests", () => {
  test("App container renders", () => {
    render(<TestApp />)
    const app = screen.getByTestId("app");
    expect(app).toBeVisible();
  })

  test("Testing flag renders", () => {
    render(<TestApp />)
    const testingFlag = screen.getByTestId("wl-testing-flag");
    expect(testingFlag).toBeInTheDocument();
  })
})