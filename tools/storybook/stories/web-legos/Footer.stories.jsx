import { Copyright, WLFooterLogo, WLFooterSignature, WLFooterSocials } from "../../../../packages/web-legos/components/Footer.jsx";
import { FooterAuthButton } from "../../../../packages/web-legos/components/Auth.jsx";
import "../../../../packages/web-legos/Layouts/wl.css";
import FooterCentered from "../../../../packages/web-legos/Layouts/Footers/FooterCentered.jsx";
import { fakeAuthManager } from "../_support/site.jsx";
import logo from "../../../../packages/room01890/client/public/logo.png";

export default {
  title: "Web-Legos/Footer pieces",
  parameters: { layout: "padded", site: "web-legos" },
};

const socials = (
  <WLFooterSocials lineTop lineBottom>
    <WLFooterSocials.Button platformKey="facebook" href="https://facebook.com" size={40} />
    <WLFooterSocials.Button platformKey="instagram" href="https://instagram.com" size={40} />
    <WLFooterSocials.Button platformKey="youtube" href="https://youtube.com" size={40} />
    <WLFooterSocials.Button platformKey="linkedin" href="https://linkedin.com" size={40} />
    <WLFooterSocials.Button platformKey="tiktok" href="https://tiktok.com" size={40} />
  </WLFooterSocials>
);

/** The shared building blocks every site's footer is made of today. */
export const Pieces = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <WLFooterLogo source={logo} />
      {socials}
      <Copyright year={2026} name="Example Site" />
      <WLFooterSignature />
    </div>
  ),
};

/** Admin login control: what visitors see. */
export const AuthSignedOut = {
  render: () => <FooterAuthButton link authManager={fakeAuthManager()} currentSignIn={null} setCurrentSignIn={() => {}} />,
};

/** Signed in as a site admin: Request content changes and Site settings appear under it. */
export const AuthAdmin = {
  parameters: { admin: true },
  render: () => (
    <FooterAuthButton
      link
      authManager={fakeAuthManager({ admin: true })}
      currentSignIn={{ uid: "storybook-admin", displayName: "Storybook Admin" }}
      setCurrentSignIn={() => {}}
    />
  ),
};

const centered = (
  <>
    <FooterCentered.Header>Example Site</FooterCentered.Header>
    <FooterCentered.Content>A ready-made footer layout from web-legos/Layouts.</FooterCentered.Content>
    <FooterCentered.Link href="#">Privacy</FooterCentered.Link>
    {socials}
  </>
);

/** FooterCentered (web-legos Layouts): a ready-made footer no site uses yet. */
export const FooterCenteredLayout = { render: () => <FooterCentered onLoginClick={() => {}}>{centered}</FooterCentered> };

export const FooterCenteredDark = { render: () => <FooterCentered dark onLoginClick={() => {}}>{centered}</FooterCentered> };
