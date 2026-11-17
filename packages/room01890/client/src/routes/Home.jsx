import { useContext, useEffect } from "react";
import { AnalyticsManager } from "../libraries/Web-Legos/api/analytics.ts";
import { Hero } from "../components/home/Hero.jsx";
import { MeetingSpace } from "../components/home/MeetingSpace.jsx";
import { EventsGames } from "../components/home/EventsGames.jsx";
import { OurSpaceGallery } from "../components/home/OurSpaceGallery.jsx";
import { ContactSection } from "../components/home/ContactSection.jsx";

export default function Home() {
  const { analyticsManager } = useContext(AnalyticsManager.Context);

  useEffect(() => {
    document.title = "Home | Room 01890";
    analyticsManager?.logPageView("home");
  }, [analyticsManager]);

  return (
    <>
      <Hero />
      <MeetingSpace />
      <EventsGames />
      <OurSpaceGallery />
      <ContactSection />
    </>
  );
}
