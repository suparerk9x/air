"use client";

import { isSameDay, isWithinInterval, format } from "date-fns";
import {
  LogIn,
  LogOut,
  BedDouble,
  User,
  AlertTriangle,
} from "lucide-react";
import { getContrastTextColor } from "@/lib/color";

interface Booking {
  id: string;
  summary: string | null;
  startDate: string;
  endDate: string;
  status: string;
  source: string | null;
  notes: string | null;
  propertyId: string;
  property: {
    name: string;
    color: string;
  };
}

interface TodayPanelProps {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
}

export function TodayPanel({ bookings, onBookingClick }: TodayPanelProps) {
  const today = new Date();

  const checkIns = bookings.filter((b) =>
    isSameDay(new Date(b.startDate), today)
  );

  const checkOuts = bookings.filter((b) =>
    isSameDay(new Date(b.endDate), today)
  );

  const currentlyStaying = bookings.filter((b) => {
    const start = new Date(b.startDate);
    const end = new Date(b.endDate);
    return (
      isWithinInterval(today, { start, end }) &&
      b.status === "CHECKEDIN"
    );
  });

  const needsCleaning = checkOuts.filter(
    (b) => b.status !== "BLOCKED" && b.status !== "CANCELLED"
  );

  const unconfirmedCheckIns = checkIns.filter(
    (b) => b.status === "CONFIRMED"
  );

  if (
    checkIns.length === 0 &&
    checkOuts.length === 0 &&
    currentlyStaying.length === 0
  ) {
    return (
      <div className="bg-white rounded-xl border p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Today - {format(today, "d MMM")}
        </h3>
        <p className="text-sm text-gray-400 text-center py-2">
          No activities today
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
        Today - {format(today, "d MMM")}
      </h3>

      {/* Alerts */}
      {unconfirmedCheckIns.length > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-800 rounded-lg px-3 py-2 text-xs font-medium">
          <AlertTriangle className="h-3.5 w-3.5" />
          {unconfirmedCheckIns.length} check-in
          {unconfirmedCheckIns.length > 1 ? "s" : ""} not yet checked in
        </div>
      )}

      {needsCleaning.length > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-900 rounded-lg px-3 py-2 text-xs font-medium">
          <User className="h-3.5 w-3.5" />
          {needsCleaning.length} room{needsCleaning.length > 1 ? "s" : ""} need
          cleaning
        </div>
      )}

      {/* Check-ins */}
      {checkIns.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 mb-1.5">
            <LogIn className="h-3.5 w-3.5" />
            Check-in ({checkIns.length})
          </div>
          <div className="space-y-1">
            {checkIns.map((b) => (
              <button
                key={b.id}
                onClick={() => onBookingClick(b)}
                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: b.property.color }}
                />
                <span className="text-sm font-medium truncate flex-1">
                  {b.summary || "Reserved"}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                  style={{
                    backgroundColor: b.property.color,
                    color: getContrastTextColor(b.property.color),
                  }}
                >
                  {b.property.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Check-outs */}
      {checkOuts.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-orange-700 mb-1.5">
            <LogOut className="h-3.5 w-3.5" />
            Check-out ({checkOuts.length})
          </div>
          <div className="space-y-1">
            {checkOuts.map((b) => (
              <button
                key={b.id}
                onClick={() => onBookingClick(b)}
                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: b.property.color }}
                />
                <span className="text-sm font-medium truncate flex-1">
                  {b.summary || "Reserved"}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                  style={{
                    backgroundColor: b.property.color,
                    color: getContrastTextColor(b.property.color),
                  }}
                >
                  {b.property.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Currently staying */}
      {currentlyStaying.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 mb-1.5">
            <BedDouble className="h-3.5 w-3.5" />
            Staying ({currentlyStaying.length})
          </div>
          <div className="space-y-1">
            {currentlyStaying.map((b) => (
              <button
                key={b.id}
                onClick={() => onBookingClick(b)}
                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: b.property.color }}
                />
                <span className="text-sm font-medium truncate flex-1">
                  {b.summary || "Reserved"}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                  style={{
                    backgroundColor: b.property.color,
                    color: getContrastTextColor(b.property.color),
                  }}
                >
                  {b.property.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
