import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { AnalyticsManager } from "../libraries/Web-Legos/api/analytics.ts";
import { Header, Image, Text } from "../components/Wl.jsx";
import { ReactComponent as BreadcrumbChevron } from "../assets/icons/breadcrumb-chevron.svg";

/** "Book Online": breadcrumb, "Our Services" and the Consultation service card. */
export default function BookOnline() {
  const { analyticsManager } = useContext(AnalyticsManager.Context);

  useEffect(() => {
    document.title = "Book Online | Room 01890";
    analyticsManager?.logPageView("book-online");
  }, [analyticsManager]);

  return (
    <section className="r01-services">
      <nav aria-label="Breadcrumbs" className="r01-breadcrumb">
        <Link to="/">Home</Link>
        <BreadcrumbChevron className="r01-breadcrumb__chevron" aria-hidden="true" />
        <span aria-current="page">Services</span>
      </nav>

      <Header id="services-header" level={1} className="r01-services__title" />

      <article className="r01-service">
        <div className="r01-service__media">
          <Image id="service-consultation-image" className="r01-cover" loading="eager" />
        </div>
        <div className="r01-service__body">
          <Header id="service-consultation-header" level={2} className="r01-service__name" />
          <hr className="r01-service__rule" />
          <Text id="service-consultation-duration" className="r01-service__meta" />
          <Text id="service-consultation-price" className="r01-service__meta" />
          <div>
            <Link to="/#contact" className="r01-button r01-button--ink r01-service__book">
              Book Now
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}
