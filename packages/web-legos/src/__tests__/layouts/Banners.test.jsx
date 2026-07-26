import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { WLLayoutHeader, WLLayoutText } from "../../../components/Text";
import { BannerCentered, BannerWithImage } from "../../../Layouts/Sections/Banner";

describe("BannerCentered tests", () => {

  const TestBanner = (props) => (
    <BannerCentered>
      <BannerCentered.Header>
        <WLLayoutHeader editable>Test Header</WLLayoutHeader>
      </BannerCentered.Header>
      <BannerCentered.Body>
        <WLLayoutText editable>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias vero accusantium ea nulla nisi unde sunt quasi rem. Quas at, distinctio deserunt voluptatum totam enim! Laudantium nulla natus tempore necessitatibus.
        </WLLayoutText>
      </BannerCentered.Body>
    </BannerCentered>
  )

  test("BannerCentered renders", () => {
    render(<TestBanner />)
    const banner = screen.getByTestId("wl-banner-centered");
    expect(banner).toBeVisible();
  })

  test("BannerCentered renders header", () => {
    render(<TestBanner />)
    const header = screen.getByTestId("wl-banner-header");
    expect(header).toBeVisible();
  })

  test("BannerCentered renders body", () => {
    render(<TestBanner />)
    const body = screen.getByTestId("wl-banner-body");
    expect(body).toBeVisible();
  })
})

describe("BannerWithImage tests", () => {

  const TestBanner = (props) => (
    <BannerWithImage>
      <BannerWithImage.Header>
        <WLLayoutHeader editable>Test Header</WLLayoutHeader>
      </BannerWithImage.Header>
      <BannerWithImage.Body>
        <WLLayoutText editable>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias vero accusantium ea nulla nisi unde sunt quasi rem. Quas at, distinctio deserunt voluptatum totam enim! Laudantium nulla natus tempore necessitatibus.
        </WLLayoutText>
      </BannerWithImage.Body>
      <BannerWithImage.ImageContainer>
        <img data-testid="test-img" src="https://ih1.redbubble.net/image.2563931895.3731/flat,750x1000,075,f.jpg" alt="test-img" />
      </BannerWithImage.ImageContainer>
    </BannerWithImage>
  )

  test("BannerWithImage renders", () => {
    render(<TestBanner />)
    const banner = screen.getByTestId("wl-banner-with-image");
    expect(banner).toBeVisible();
  })

  test("BannerWithImage renders header", () => {
    render(<TestBanner />)
    const header = screen.getByTestId("wl-banner-header");
    expect(header).toBeVisible();
  })

  test("BannerWithImage renders body", () => {
    render(<TestBanner />)
    const body = screen.getByTestId("wl-banner-body");
    expect(body).toBeVisible();
  })

  test("BannerWithImage renders image", () => {
    render(<TestBanner />)
    const imageContainer = screen.getByTestId("wl-banner-with-image-image-container");
    expect(imageContainer).toBeVisible();
    const image = screen.getByTestId("test-img");
    expect(image).toBeVisible();
  })
})
