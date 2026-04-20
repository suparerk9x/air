import ical from "node-ical";

export interface ICalEvent {
  uid: string;
  summary: string;
  start: Date;
  end: Date;
  description?: string;
}

export async function fetchICalEvents(url: string): Promise<ICalEvent[]> {
  const events = await ical.async.fromURL(url);
  const results: ICalEvent[] = [];

  for (const [, event] of Object.entries(events)) {
    if (!event || event.type !== "VEVENT") continue;
    if (!("start" in event) || !("end" in event) || !event.start || !event.end) continue;

    const summary = typeof event.summary === "string" ? event.summary : String(event.summary || "Reserved");
    const description = typeof event.description === "string" ? event.description : undefined;

    results.push({
      uid: event.uid,
      summary: summary || "Reserved",
      start: new Date(event.start as unknown as string),
      end: new Date(event.end as unknown as string),
      description,
    });
  }

  return results;
}
