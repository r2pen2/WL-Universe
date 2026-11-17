import { useContext } from "react";
import { Link } from "react-router-dom";
import { WLFooterSocials } from "../libraries/Web-Legos/components/Footer.jsx";
import { FooterAuthButton } from "../libraries/Web-Legos/components/Auth.jsx";
import { AuthenticationManager } from "../libraries/Web-Legos/api/auth.ts";
import { CurrentSignInContext } from "../App.jsx";
import { SOCIALS } from "../content.js";
import { Header, Text } from "./Wl.jsx";

import logo from "../assets/images/logo.png";
import facebook from "../assets/icons/facebook.svg";
import instagram from "../assets/icons/instagram.svg";
import youtube from "../assets/icons/youtube.svg";
import x from "../assets/icons/x.svg";
import linkedin from "../assets/icons/linkedin.svg";
import tiktok from "../assets/icons/tiktok.svg";

const ICONS = { facebook, instagram, youtube, x, linkedin, tiktok };

export function SiteFooter() {
  const { authenticationManager } = useContext(AuthenticationManager.Context);
  const { currentSignIn, setCurrentSignIn } = useContext(CurrentSignInContext);

  return (
    <footer className="r01-footer">
      <div className="r01-footer__grid">
        <div className="r01-footer__brand">
          <Link to="/" aria-label="Room 01890 home">
            <img src={logo} alt="Consulting Space - Homepage" className="r01-footer__logo" />
          </Link>
        </div>

        <div className="r01-footer__col">
          <Header id="footer-contact-header" level={6} className="r01-footer__heading" />
          <Text id="footer-contact-text" className="r01-footer__small" />
        </div>

        <div className="r01-footer__col">
          <Header id="footer-mission-header" level={6} className="r01-footer__heading" />
          <Text id="footer-mission-text" className="r01-footer__body" />
        </div>

        <div className="r01-footer__col">
          <Header id="footer-connect-header" level={6} className="r01-footer__heading" />
          <nav aria-label="Social Bar" className="r01-footer__socials">
            <WLFooterSocials>
              {SOCIALS.map((social) => (
                <a
                  key={social.key}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.label}
                  className="r01-footer__social"
                >
                  <img src={ICONS[social.key]} alt="" aria-hidden="true" />
                </a>
              ))}
            </WLFooterSocials>
          </nav>
        </div>
      </div>

      <hr className="r01-footer__rule" />

      <div className="r01-footer__bottom">
        <Text id="footer-copyright" className="r01-footer__small" />
        <div className="r01-footer__login">
          <FooterAuthButton
            link
            color="#41425F"
            authManager={authenticationManager}
            currentSignIn={currentSignIn}
            setCurrentSignIn={setCurrentSignIn}
          />
        </div>
      </div>
    </footer>
  );
}
