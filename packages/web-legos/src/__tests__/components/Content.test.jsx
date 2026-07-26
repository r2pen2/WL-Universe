import { WLSlick } from "../../../components/Content"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

describe("react-slick tests", () => {

  const SlickTestCarousel = () => (
    <WLSlick>
      <div>1</div>
      <div>2</div>
      <div>3</div>
      <div>4</div>
    </WLSlick>
  )

  test("react-slick is able to render in testing environment", () => {
    render(<SlickTestCarousel />)
    const slickContainer = screen.getByTestId("react-slick-container");
    expect(slickContainer).toBeVisible();
  })
})
