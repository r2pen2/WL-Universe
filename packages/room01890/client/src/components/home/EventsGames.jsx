import { Header, Image, Text } from "../Wl.jsx";

const EVENTS = [
  { key: "meeting", image: "event-meeting-image" },
  { key: "board-games", image: "event-board-games-image" },
  { key: "networking", image: "event-networking-image" },
];

function EventCard({ eventKey, image, index }) {
  return (
    <article className={`r01-event r01-event--${index + 1}`}>
      <div className="r01-event__media">
        <Image id={image} className="r01-cover" />
      </div>
      <Header id={`event-${eventKey}-header`} level={5} className="r01-event__title" />
      <Text id={`event-${eventKey}-subheader`} className="r01-event__kicker" />
      <Text id={`event-${eventKey}-text`} className="r01-event__text" />
    </article>
  );
}

/** "Events & Games": three staggered cards (one column on mobile). */
export function EventsGames() {
  return (
    <section id="events" className="r01-events">
      <Header id="events-header" level={2} className="r01-h2 r01-events__title" />
      <div className="r01-events__grid">
        {EVENTS.map((e, index) => (
          <EventCard key={e.key} eventKey={e.key} image={e.image} index={index} />
        ))}
      </div>
    </section>
  );
}
