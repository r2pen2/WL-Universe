import { Link } from "react-router-dom";
import { Header, Image } from "../Wl.jsx";

/** Full-bleed photo with the heading + "Book a Consultation", then two half-width photos. */
export function MeetingSpace() {
  return (
    <section id="meeting-space" className="r01-meeting">
      <div className="r01-meeting__banner">
        <Image id="meeting-space-background" className="r01-cover r01-meeting__bg" />
        <div className="r01-meeting__overlay">
          <Header id="meeting-space-header" level={2} className="r01-h2" />
          <Link to="/book-online" className="r01-button r01-button--ink r01-meeting__button">
            Book a Consultation
          </Link>
        </div>
      </div>
      <div className="r01-meeting__pair">
        <div className="r01-meeting__half">
          <Image id="meeting-space-image-1" className="r01-cover" />
        </div>
        <div className="r01-meeting__half">
          <Image id="meeting-space-image-2" className="r01-cover" />
        </div>
      </div>
    </section>
  );
}
