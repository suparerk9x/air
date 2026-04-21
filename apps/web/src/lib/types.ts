export interface CalendarBooking {
  id: string;
  summary: string | null;
  startDate: string;
  endDate: string;
  status: string;
  source: string | null;
  propertyId: string;
  propertyName: string;
  propertyColor: string;
}

export interface PropertyWithBookings {
  id: string;
  name: string;
  color: string;
  icalUrl: string | null;
  platform: string | null;
  bookings: CalendarBooking[];
}
