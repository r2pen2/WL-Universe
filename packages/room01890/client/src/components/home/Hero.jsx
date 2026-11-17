import { Link } from "react-router-dom";
import { Header, Image, Text } from "../Wl.jsx";
import { useScrollToContact } from "../SiteHeader.jsx";

/** "Gatherings & Events / Meet and Mingle" — navy hero with the rounded photo on the right. */
export function Hero() {
  const scrollToContact = useScrollToContact();
  return (
    <section id="home" className="r01-hero">
      <div className="r01-hero__inner">
        <div className="r01-hero__copy">
          <Text id="hero-eyebrow" className="r01-eyebrow" />
          <Header id="hero-header" level={1} className="r01-hero__title" />
          <Text id="hero-text" className="r01-hero__text" />
          <div>
            <Link to="/#contact" onClick={scrollToContact} className="r01-button r01-button--paper r01-hero__button">
              Join the Next Event
            </Link>
          </div>
        </div>
        <div className="r01-hero__media">
          <Image id="hero-image" className="r01-cover" loading="eager" />
        </div>
      </div>
    </section>
  );
}
