"use client";

import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  differenceInCalendarDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getContrastTextColor } from "@/lib/color";

// ─── Types ───────────────────────────────────────────────────────────
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

interface CalendarGridProps {
  bookings: Booking[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onDateClick?: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
  selectedPropertyIds: string[];
}

// ─── Lane assignment ─────────────────────────────────────────────────
// Each booking in a week gets a "lane" (row index) so they don't overlap.
interface WeekBooking {
  booking: Booking;
  startCol: number; // 0-6
  endCol: number; // 0-6 (inclusive)
  isStart: boolean; // does booking start in this week?
  isEnd: boolean; // does booking end in this week?
  lane: number;
}

function assignLanes(items: Omit<WeekBooking, "lane">[]): WeekBooking[] {
  // Sort by startCol, then by span length (longer first)
  const sorted = [...items].sort((a, b) => {
    if (a.startCol !== b.startCol) return a.startCol - b.startCol;
    return (b.endCol - b.startCol) - (a.endCol - a.startCol);
  });

  const lanes: number[][] = []; // lanes[lane] = array of endCols already used

  return sorted.map((item) => {
    // Find first lane where this item fits (no overlap)
    let lane = 0;
    while (true) {
      if (!lanes[lane]) {
        lanes[lane] = [];
        break;
      }
      const canFit = lanes[lane].every((usedEnd) => item.startCol > usedEnd);
      if (canFit) break;
      lane++;
    }
    lanes[lane].push(item.endCol);
    return { ...item, lane };
  });
}

// ─── Component ───────────────────────────────────────────────────────
export function CalendarGrid({
  bookings,
  currentDate,
  onDateChange,
  onDateClick,
  onBookingClick,
}: CalendarGridProps) {
  // Build calendar days split into weeks
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: calStart, end: calEnd });

    const result: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      result.push(allDays.slice(i, i + 7));
    }
    return result;
  }, [currentDate]);

  // For each week, compute which bookings are visible and assign lanes.
  // Use a global lane map so the same booking keeps the same lane across weeks.
  const weekBookings = useMemo(() => {
    // First pass: collect all items per week
    const allWeekItems: Omit<WeekBooking, "lane">[][] = weeks.map((week) => {
      const weekStart = week[0];
      const weekEnd = week[6];
      const visible: Omit<WeekBooking, "lane">[] = [];

      for (const booking of bookings) {
        const bStart = new Date(booking.startDate);
        const bEnd = new Date(booking.endDate);
        const bEndInclusive = new Date(bEnd);
        bEndInclusive.setDate(bEndInclusive.getDate() - 1);

        if (bEndInclusive < weekStart || bStart > weekEnd) continue;

        const startCol = Math.max(0, differenceInCalendarDays(bStart, weekStart));
        const endCol = Math.min(6, differenceInCalendarDays(bEndInclusive, weekStart));

        if (startCol > 6 || endCol < 0) continue;

        visible.push({
          booking,
          startCol,
          endCol,
          isStart: bStart >= weekStart,
          isEnd: bEndInclusive <= weekEnd,
        });
      }

      return visible;
    });

    // Second pass: assign lanes with global consistency
    // A booking that continues from a previous week should keep its lane.
    const globalLaneMap = new Map<string, number>(); // bookingId -> lane

    return allWeekItems.map((items) => {
      // Split into continuations (already have lane) and new starts
      const withExistingLane: WeekBooking[] = [];
      const needsLane: Omit<WeekBooking, "lane">[] = [];

      for (const item of items) {
        const existingLane = globalLaneMap.get(item.booking.id);
        if (existingLane !== undefined && !item.isStart) {
          withExistingLane.push({ ...item, lane: existingLane });
        } else {
          needsLane.push(item);
        }
      }

      // Assign lanes to new items, respecting existing lane reservations
      const occupiedLanes: { col: number; endCol: number; lane: number }[] =
        withExistingLane.map((wb) => ({
          col: wb.startCol,
          endCol: wb.endCol,
          lane: wb.lane,
        }));

      // Sort by startCol, then longer spans first
      needsLane.sort((a, b) => {
        if (a.startCol !== b.startCol) return a.startCol - b.startCol;
        return (b.endCol - b.startCol) - (a.endCol - a.startCol);
      });

      const result: WeekBooking[] = [...withExistingLane];

      for (const item of needsLane) {
        let lane = 0;
        while (true) {
          const conflict = occupiedLanes.some(
            (o) => o.lane === lane && !(item.startCol > o.endCol || item.endCol < o.col)
          );
          if (!conflict) break;
          lane++;
        }
        occupiedLanes.push({ col: item.startCol, endCol: item.endCol, lane });
        globalLaneMap.set(item.booking.id, lane);
        result.push({ ...item, lane });
      }

      return result;
    });
  }, [weeks, bookings]);

  // Check which days need cleaning (checkout day)
  const cleaningDays = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookings) {
      if (b.status === "BLOCKED" || b.status === "CANCELLED") continue;
      set.add(format(new Date(b.endDate), "yyyy-MM-dd"));
    }
    return set;
  }, [bookings]);

  // Detect same-day turnovers (a checkout and checkin on the same day)
  const turnoverDays = useMemo(() => {
    const checkouts = new Set<string>();
    const checkins = new Set<string>();
    for (const b of bookings) {
      if (b.status === "CANCELLED" || b.status === "BLOCKED") continue;
      checkouts.add(format(new Date(b.endDate), "yyyy-MM-dd"));
      checkins.add(format(new Date(b.startDate), "yyyy-MM-dd"));
    }
    const set = new Set<string>();
    for (const d of checkouts) {
      if (checkins.has(d)) set.add(d);
    }
    return set;
  }, [bookings]);

  const today = new Date();
  const BAR_HEIGHT = 22;
  const BAR_GAP = 3;
  const BAR_TOP_OFFSET = 30; // space for date number

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50/50">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDateChange(subMonths(currentDate, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-semibold tracking-tight">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDateChange(addMonths(currentDate, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b bg-gray-50/30">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className={cn(
              "py-2 text-center text-[11px] font-semibold uppercase tracking-wider",
              d === "Sat" || d === "Sun" ? "text-gray-400" : "text-gray-500"
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div>
        {weeks.map((week, wi) => {
          const wbookings = weekBookings[wi];
          const maxLane = wbookings.reduce((m, b) => Math.max(m, b.lane), -1);
          const rowHeight = Math.max(
            110,
            BAR_TOP_OFFSET + (maxLane + 1) * (BAR_HEIGHT + BAR_GAP) + 8
          );

          return (
            <div key={wi} className="grid grid-cols-7 relative" style={{ height: rowHeight }}>
              {/* Day cells (background + date number) */}
              {week.map((day, di) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, today);
                const isWeekend = di >= 5;
                const dayKey = format(day, "yyyy-MM-dd");
                const needsCleaning = cleaningDays.has(dayKey);
                const isTurnover = turnoverDays.has(dayKey);
                const dayHasBooking = wbookings.some(
                  (wb) => di >= wb.startCol && di <= wb.endCol
                );

                return (
                  <div
                    key={di}
                    className={cn(
                      "border-b border-r relative transition-colors",
                      di === 0 && "border-l",
                      !isCurrentMonth && "bg-gray-50/60",
                      isWeekend && isCurrentMonth && "bg-slate-50/40",
                      isCurrentMonth && !dayHasBooking && "cursor-pointer hover:bg-blue-50/30 group"
                    )}
                    style={{ height: rowHeight }}
                    onClick={() => {
                      if (isCurrentMonth) onDateClick?.(day);
                    }}
                  >
                    {/* Date number + cleaning icon */}
                    <div className="flex items-center justify-between px-1.5 py-1 relative z-20">
                      <div
                        className={cn(
                          "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                          !isCurrentMonth && "text-gray-300",
                          isCurrentMonth && !isToday && "text-gray-700",
                          isToday && "bg-blue-600 text-white font-bold shadow-sm"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                      {isTurnover ? (
                        <div
                          className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center"
                          title="Same-day turnover! Checkout + Checkin"
                        >
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                        </div>
                      ) : needsCleaning ? (
                        <div
                          className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center"
                          title="Cleaning needed"
                        >
                          <User className="h-3 w-3 text-gray-900" />
                        </div>
                      ) : null}
                    </div>

                    {/* "+ Add" hint on empty days */}
                    {isCurrentMonth && !dayHasBooking && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        <span className="text-[10px] text-blue-400 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                          + Add
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Booking bars - absolute positioned, spanning across cells */}
              {wbookings.map((wb) => {
                const { booking, startCol, endCol, isStart, isEnd, lane } = wb;
                const color =
                  booking.status === "BLOCKED" ? "#9ca3af" : booking.property.color;
                const textColor =
                  booking.status === "BLOCKED" ? "#fff" : getContrastTextColor(color);

                const isCheckedOut = booking.status === "CHECKEDOUT";
                let opacity = 1;
                if (isCheckedOut) opacity = 0.35;
                if (booking.status === "CANCELLED") opacity = 0.3;

                // Position: percentage-based within the 7-column grid
                const leftPercent = (startCol / 7) * 100;
                const widthPercent = ((endCol - startCol + 1) / 7) * 100;
                const top = BAR_TOP_OFFSET + lane * (BAR_HEIGHT + BAR_GAP);

                // Inset for rounded edges: small padding on start/end
                const INSET = 4; // px inset from cell edge

                return (
                  <div
                    key={`${booking.id}-w${wi}`}
                    role="button"
                    data-booking="true"
                    className={cn(
                      "absolute cursor-pointer truncate font-medium transition-all hover:brightness-[0.92] hover:shadow-md active:scale-[0.995]",
                      "flex items-center text-[11px] leading-none",
                      booking.status === "CANCELLED" && "line-through",
                      isCheckedOut && "bar-checked-out"
                    )}
                    style={{
                      left: `calc(${leftPercent}% + ${isStart ? INSET : 0}px)`,
                      width: `calc(${widthPercent}% - ${(isStart ? INSET : 0) + (isEnd ? INSET : 0)}px)`,
                      top,
                      height: BAR_HEIGHT,
                      backgroundColor: color,
                      color: textColor,
                      opacity,
                      borderRadius: `${isStart ? 6 : 0}px ${isEnd ? 6 : 0}px ${isEnd ? 6 : 0}px ${isStart ? 6 : 0}px`,
                      paddingLeft: isStart ? 8 : 4,
                      paddingRight: isEnd ? 8 : 4,
                      zIndex: 10,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookingClick?.(booking);
                    }}
                    title={`${booking.summary || "Reserved"} - ${booking.property.name}`}
                  >
                    {isStart ? (
                      <span className="truncate flex-1">
                        {booking.summary || "Reserved"}
                      </span>
                    ) : (
                      <span className="truncate flex-1 opacity-70 text-[10px]">
                        {booking.summary || "Reserved"}
                      </span>
                    )}
                    {!isEnd && (
                      <span className="opacity-50 text-[10px] ml-1 shrink-0">&raquo;</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
