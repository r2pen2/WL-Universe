// Library Imports
import { useContext, useEffect, useRef, useState } from "react";
import { Loader, Paper, Spoiler, Text } from "@mantine/core";

// API Imports
import { getEventTime, getVerboseDateString } from "../api/strings.js";
import { LinkMaster } from "../api/links.ts";
import { getCalendarEvents, mockEvents } from "../api/calendar.ts";

// Style Imports
import "../assets/style/schedule.css";
import ModuleHeader from "../components/dashboard/ModuleHeader.jsx";
import { CurrentUserContext } from "../App.jsx";


export default function Schedule() {
  return (
    <div className="container-fluid d-flex flex-column align-items-center justify-content-center p-0">
      <div className="row p-1 w-100">
        <AppointmentList />
        <CalendarFrame />
      </div>
    </div>
  )
}

/**
 * A list of upcoming appointments from the google calendar API. Each item is a clickable Paper component.
 */
function AppointmentList() {

  const {currentUser} = useContext(CurrentUserContext)
  const delegateUser = currentUser.delegate ? currentUser.delegate : currentUser;
  const [events, setEvents] = useState([]);

  useEffect(() => {
    getCalendarEvents(delegateUser.personalData.email).then(events => {
      setEvents(events.events)
    })
  }, [delegateUser])
  
  /**
   * Renders an upcoming event in a Paper component. Clicking on the event opens the calendar item in a new tab.
   * @param {any} event - Event JSON data from Google Calendar API 
   */
  const EventCard = ({event}) => {

    return (
      <Paper withBorder className="p-2 mb-2 mb-xl-0 w-100" style={{cursor: "pointer", minWidth: 200}} onClick={() => window.open(event.href, "_blank")}>
        <Text fz="lg" fw={500}>
          {event.summary}
        </Text>
        <Text fz="sm" c="dimmed" mt={5}>
          {getVerboseDateString(event.start.dateTime)}
        </Text>
        <Text fz="sm" c="dimmed">
          {getEventTime(event.start.dateTime)} - {getEventTime(event.end.dateTime)}
        </Text>
      </Paper>
    )
  }

  return (
    <div className="p-1 col-12 col-xl-3">
      <Paper withBorder >
        <ModuleHeader>Upcoming</ModuleHeader>
        <Spoiler showLabel="Show All Appointments" className="centered-expander" hideLabel="Show Fewer Appointments" maxHeight={400}>
          <div style={{overflowX: "scroll", flexWrap: "nowrap"}} className="d-flex gap-2 flex-row flex-xl-column align-items-start px-2">
            {events.map((event, index) => <EventCard key={index} event={event} />)}
            {events.length === 0 && <Text className="w-100 text-center">No upcoming events.</Text>}
          </div>
        </Spoiler>
      </Paper>
    </div>
  )
}

function CalendarFrame() {
  
  const [isMounted, setIsMounted] = useState(false);
  const iframeRef = useRef(null);

  /** When the iframe loads, set that it's mounted and hide the loading indicator */
  const handleIframeLoad = () => { setIsMounted(true); };

  /** Display a loading indicator when the iframe has not been completely mounted */
  const LoadingNotif = () => {
    if (isMounted) { return; }
    return (
      <div className="d-flex flex-column align-items-center justify-content-center">
        <Loader />
        <p>Fetching Calendar...</p>
      </div>
    )
  }

  const {currentUser} = useContext(CurrentUserContext);

  return (
    <div className="mt-2 p-1 mt-xl-0 col-12 col-xl-9">
      <Paper withBorder style={{height: "100vh", position: "relative", }} className="d-flex flex-column align-items-center justify-content-center">
        <LoadingNotif />
        <iframe ref={iframeRef} onLoad={handleIframeLoad} title="Schedule" src={LinkMaster.schedule.calendarEmbed} style={{border: 0, position: "absolute"}} width="100%" height="100%" frameBorder="0" />
      </Paper>
    </div>
  )
}