import ical from "node-ical";

export interface ICalEvent {
  uid: string;
  summary: string;
  start: Date;
  end: Date;
  description?: string;
  reservationUrl?: string;
}

export async function fetchICalEvents(url: string): Promise<ICalEvent[]> {
  const events = await ical.async.fromURL(url);
  const results: ICalEvent[] = [];

  for (const [, event] of Object.entries(events)) {
    if (!event || event.type !== "VEVENT") continue;
    if (!("start" in event) || !("end" in event) || !event.start || !event.end) continue;

    const rawSummary = typeof event.summary === "string" ? event.summary : String(event.summary || "");
    const description = typeof event.description === "string" ? event.description : undefined;

    // Extract phone last 4 digits and reservation URL from description
    const phoneMatch = description?.match(/Phone Number \(Last 4 Digits\):\s*(\d{4})/);
    const urlMatch = description?.match(/Reservation URL:\s*(https?:\/\/\S+)/);

    // Use #0000 format if phone found and summary is generic "Reserved"
    const summary = phoneMatch && (!rawSummary || rawSummary === "Reserved")
      ? `#${phoneMatch[1]}`
      : rawSummary || "Reserved";

    results.push({
      uid: event.uid,
      summary,
      start: event.start instanceof Date ? event.start : new Date(event.start as unknown as string),
      end: event.end instanceof Date ? event.end : new Date(event.end as unknown as string),
      description,
      reservationUrl: urlMatch?.[1],
    });
  }

  return results;
}
