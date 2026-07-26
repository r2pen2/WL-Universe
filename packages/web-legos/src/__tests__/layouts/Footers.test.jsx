import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import FooterCentered from "../../../Layouts/Footers/FooterCentered";
import { WLLayoutHeader, WLLayoutText } from "../../../components/Text";

describe("FooterCentered tests", () => {

  function clickTest() {
    const container = screen.getByTestId("wl-footer-centered")
    container.setAttribute("test-clicked", "clicked");
  }

  const TestFooter = (props) => (
    <FooterCentered {...props} onLoginClick={clickTest}>
      <FooterCentered.Header>
        <WLLayoutHeader data-testid="wl-layout-header" editable={true}>Test Header</WLLayoutHeader>
      </FooterCentered.Header>
      <FooterCentered.Content>
        <WLLayoutText>Test Content</WLLayoutText>
      </FooterCentered.Content>
      <FooterCentered.Content>
        <WLLayoutText>Test Content</WLLayoutText>
      </FooterCentered.Content>
      <FooterCentered.Link href="mailto:test@test.com">test@test.com</FooterCentered.Link>
    </FooterCentered>
  )

  test("FooterCentered renders", () => {
    render(<TestFooter />)
    const footer = screen.getByTestId("wl-footer-centered");
    expect(footer).toBeVisible();
  })

  test("FooterCentered renders signature and login button", () => {
    render(<TestFooter />);
    const signatureContainer = screen.getByTestId("wl-footer-centered-signature-container");
    expect(signatureContainer).toBeVisible();
    const signature = screen.getByTestId("wl-footer-centered-signature");
    expect(signature).toBeVisible();
    const button = screen.getByTestId("wl-footer-centered-login-button");
    expect(button).toBeVisible();
  })

  test("FooterCentered login button registers click", () => {
    render(<TestFooter />)
    const button = screen.getByTestId("wl-footer-centered-login-button");
    fireEvent.click(button);
    const container = screen.getByTestId("wl-footer-centered")
    expect(container).toHaveAttribute("test-clicked");
  })

  test("FooterCentered content renders", () => {
    render(<TestFooter />);
    const content = screen.getAllByTestId("wl-footer-centered-content")[0];
    expect(content).toBeVisible();
  })

  test("FooterCentered link renders", () => {
    render(<TestFooter />);
    const link = screen.getAllByTestId("wl-footer-centered-link")[0];
    expect(link).toBeVisible();
  })

  test("FooterCentered header renders", () => {
    render(<TestFooter />);
    const header = screen.getByTestId("wl-footer-centered-header");
    expect(header).toBeVisible();
  })

  test("FooterCentered works as a dark section", () => {
    render(<TestFooter dark/>);
    const footer = screen.getByTestId("wl-footer-centered");
    expect(footer).toHaveClass("wl-section-dark");
  });

  test("FooterCentered allows for WL editing", () => {
    render(<TestFooter />);
    const header = screen.getByTestId("wl-layout-header");
    fireEvent.click(header);
    const editFlag = screen.getByTestId("wl-layout-header:editing")
    expect(editFlag).toBeVisible();
  });
})
