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

// describe("BP-10700 default tests", () => {
//   test("BP-10700 loads and displays Lego brick", () => {
//     render(<TestApp />)
//     const legoBrick = screen.getByTestId("lego-brick");
//     expect(legoBrick).toBeVisible();
//   })
  
//   test("BP-10700 loads and displays text", () => {
//     render(<TestApp />)
//     const titleText = screen.getByTestId("title-text");
//     expect(titleText).toBeVisible();
//   })
// })