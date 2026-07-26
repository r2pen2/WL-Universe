import { hostname } from "./db/dbManager.ts";

export async function getCalendarEvents(email) {
  return new Promise<any>((resolve, reject) => {
    fetch(hostname + `/calendar/events?invitee=${email}`).then((res) => {
      res.json().then((data) => {
        resolve(data)
      })
    })
  })
}

export class EventWrapper {

  href: string;
  createdAt: Date;
  startAt: Date;
  endAt: Date;
  summary: string;
  organizer: string;
  id: string;

  constructor(event: any) {
    this.href = event.htmlLink
    this.createdAt = new Date(event.created)
    this.startAt = new Date(event.start.dateTime)
    this.endAt = new Date(event.end.dateTime)
    this.summary = event.summary
    this.organizer = event.organizer
    this.id = event.id
  }
}
