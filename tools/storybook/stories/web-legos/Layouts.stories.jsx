import "../../../../packages/web-legos/Layouts/wl.css";
import { BannerCentered, BannerWithImage } from "../../../../packages/web-legos/Layouts/Sections/Banner.jsx";
import { GlyphSectionTwoItemsNoActions } from "../../../../packages/web-legos/Layouts/Sections/GlyphSection.jsx";
import { HeaderThreeLevels } from "../../../../packages/web-legos/Layouts/Headers/Headers.jsx";
import photo from "../../fixtures/cms-assets/room01890/images/meeting-space-image-1.jpg";

/**
 * Ready-made sections in web-legos/Layouts. They're slot-based (e.g. BannerCentered.Header /
 * BannerCentered.Body as children); most sites still hand-write their own sections instead.
 */
export default {
  title: "Web-Legos/Layouts",
  parameters: { site: "web-legos" },
};

const body = "Section copy goes here. Every word on a WL site is CMS text, so a real section would use WLTextV2 inside the slot.";

export const Header = {
  render: () => (
    <HeaderThreeLevels>
      <HeaderThreeLevels.Title>Meet and Mingle</HeaderThreeLevels.Title>
      <HeaderThreeLevels.Subtitle>Gatherings &amp; Events</HeaderThreeLevels.Subtitle>
      <HeaderThreeLevels.Body>{body}</HeaderThreeLevels.Body>
    </HeaderThreeLevels>
  ),
};

const bannerSlots = (Banner) => [
  <Banner.Header key="h">Banner header</Banner.Header>,
  <Banner.Body key="b">{body}</Banner.Body>,
];

export const Banner = { render: () => <BannerCentered>{bannerSlots(BannerCentered)}</BannerCentered> };
export const BannerDark = { render: () => <BannerCentered dark>{bannerSlots(BannerCentered)}</BannerCentered> };
export const BannerImage = {
  render: () => (
    <BannerWithImage>
      {bannerSlots(BannerWithImage)}
      <BannerWithImage.ImageContainer>
        <img src={photo} alt="" style={{ maxWidth: 360, borderRadius: 8 }} />
      </BannerWithImage.ImageContainer>
    </BannerWithImage>
  ),
};

export const GlyphSection = {
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
