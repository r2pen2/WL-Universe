import "../../../../packages/web-legos/Layouts/wl.css";
import { WLThemeProvider, createWLTheme } from "../../../../packages/web-legos/Layouts/WLThemes.jsx";
import { BannerCentered, BannerWithImage } from "../../../../packages/web-legos/Layouts/Sections/Banner.jsx";
import { GlyphSectionTwoItemsNoActions } from "../../../../packages/web-legos/Layouts/Sections/GlyphSection.jsx";
import { HeaderThreeLevels } from "../../../../packages/web-legos/Layouts/Headers/Headers.jsx";
import FooterCentered from "../../../../packages/web-legos/Layouts/Footers/FooterCentered.jsx";
import NavbarMinimal from "../../../../packages/web-legos/Layouts/Navigation/Navbars.jsx";
import { WLFooterSocials } from "../../../../packages/web-legos/components/Footer.jsx";
import photo from "../../../../packages/room01890/source-assets/images/meeting-space-image-1.jpg";

/**
 * Ready-made sections in web-legos/Layouts, themed with WLThemeProvider (createWLTheme colors).
 * They're slot-based: e.g. <BannerCentered.Header> / <BannerCentered.Body> as children.
 */
export default {
  title: "Layouts",
  decorators: [
    (Story) => (
      <WLThemeProvider theme={createWLTheme({ textPrimary: "#1e1e1e" })}>
        <div style={{ fontFamily: "system-ui, sans-serif" }}>
          <Story />
        </div>
      </WLThemeProvider>
    ),
  ],
};

const body = "Section copy goes here. On a site, each slot would hold WL text from the CMS.";
const slots = (C) => [<C.Header key="h">Section header</C.Header>, <C.Body key="b">{body}</C.Body>];

export const Header = {
  render: () => (
    <HeaderThreeLevels>
      <HeaderThreeLevels.Title>Meet and Mingle</HeaderThreeLevels.Title>
      <HeaderThreeLevels.Subtitle>Gatherings &amp; Events</HeaderThreeLevels.Subtitle>
      <HeaderThreeLevels.Body>{body}</HeaderThreeLevels.Body>
    </HeaderThreeLevels>
  ),
};

export const Banner = { args: { dark: false }, render: (args) => <BannerCentered dark={args.dark}>{slots(BannerCentered)}</BannerCentered> };

export const BannerWithAnImage = {
  name: "Banner with image",
  render: () => (
    <BannerWithImage>
      {slots(BannerWithImage)}
      <BannerWithImage.ImageContainer>
        <img src={photo} alt="" style={{ maxWidth: 360, borderRadius: 8 }} />
      </BannerWithImage.ImageContainer>
    </BannerWithImage>
  ),
};

export const TwoColumnSection = {
  name: "Two-column section",
  render: () => (
    <GlyphSectionTwoItemsNoActions>
      <GlyphSectionTwoItemsNoActions.Left>
        <h3>Left item</h3>
        <p>{body}</p>
      </GlyphSectionTwoItemsNoActions.Left>
      <GlyphSectionTwoItemsNoActions.Right>
        <h3>Right item</h3>
        <p>{body}</p>
      </GlyphSectionTwoItemsNoActions.Right>
    </GlyphSectionTwoItemsNoActions>
  ),
};

export const MinimalNavbar = {
  name: "Minimal navbar",
  render: () => (
    <NavbarMinimal>
      {["Home", "About", "Services", "Contact"].map((l) => (
        <NavbarMinimal.Item key={l} href="#">{l}</NavbarMinimal.Item>
      ))}
    </NavbarMinimal>
  ),
};

export const CenteredFooter = {
  name: "Centered footer",
  args: { dark: false },
  render: (args) => (
    <FooterCentered dark={args.dark} onLoginClick={() => {}}>
      <FooterCentered.Header>Example Site</FooterCentered.Header>
      <FooterCentered.Content>Short footer copy.</FooterCentered.Content>
      <WLFooterSocials>
        <WLFooterSocials.Button platformKey="facebook" href="#" size={36} />
        <WLFooterSocials.Button platformKey="instagram" href="#" size={36} />
        <WLFooterSocials.Button platformKey="mail" href="#" size={36} />
      </WLFooterSocials>
    </FooterCentered>
  ),
};
