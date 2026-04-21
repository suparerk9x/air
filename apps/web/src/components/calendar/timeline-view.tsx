"use client";

import { useMemo, useRef, useEffect } from "react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isToday,
  startOfDay,
} from "date-fns";
import { User } from "lucide-react";
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
}

interface Property {
  id: string;
  name: string;
  color: string;
  platform: string | null;
  bookings: Booking[];
}

interface TimelineViewProps {
  properties: Property[];
  currentDate: Date;
  onBookingClick?: (booking: Booking & { property: { name: string; color: string } }) => void;
  selectedPropertyIds: string[];
}

// ─── Constants ───────────────────────────────────────────────────────
const DAY_WIDTH = 48;
const ROW_HEIGHT = 64;
const HEADER_HEIGHT = 62;
const LABEL_WIDTH = 130;
const BAR_HEIGHT = 32;
const BAR_Y_OFFSET = 16;     // vertically centered: (64 - 32) / 2
const TOTAL_DAYS = 42; // 6 weeks

export function TimelineView({
  properties,
  currentDate,
  onBookingClick,
  selectedPropertyIds,
}: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  // Generate date columns
  const dates = useMemo(() => {
    const start = addDays(startOfDay(currentDate), -7); // start 1 week before
    return Array.from({ length: TOTAL_DAYS }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const filteredProperties = properties.filter((p) =>
    selectedPropertyIds.includes(p.id)
  );

  // Scroll to today on mount
  useEffect(() => {
    if (todayRef.current && scrollRef.current) {
      const todayOffset = todayRef.current.offsetLeft - DAY_WIDTH * 2;
      scrollRef.current.scrollLeft = Math.max(0, todayOffset);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates]);

  const timelineWidth = TOTAL_DAYS * DAY_WIDTH;

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Split layout: fixed labels | scrollable grid */}
      <div className="flex">
        {/* ── Left: Fixed property labels ── */}
        <div className="shrink-0 border-r shadow-[2px_0_4px_rgba(0,0,0,0.04)] z-20 bg-white" style={{ width: LABEL_WIDTH }}>
          {/* Header label */}
          <div
            className="bg-gray-50 border-b flex items-end px-3 pb-1.5"
            style={{ height: HEADER_HEIGHT }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Property
            </span>
          </div>
          {/* Property names */}
          {filteredProperties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white border-b flex items-center gap-2 px-3"
              style={{ height: ROW_HEIGHT }}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: prop.color }}
              />
              <span className="text-sm font-medium truncate" title={prop.name}>
                {prop.name}
              </span>
            </div>
          ))}
        </div>

        {/* ── Right: Scrollable date grid ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto min-w-0 scrollbar-thin"
        >
          <div className="relative" style={{ width: timelineWidth }}>
            {/* Date headers */}
            <div className="flex border-b" style={{ height: HEADER_HEIGHT }}>
              {dates.map((date, i) => {
                const isT = isToday(date);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const isMonday = date.getDay() === 1;
                const isMonthStart = date.getDate() === 1;

                return (
                  <div
                    key={i}
                    ref={isT ? todayRef : undefined}
                    className={cn(
                      "flex flex-col items-center justify-end pb-1 border-r shrink-0",
                      isT && "bg-emerald-50",
                      isWeekend && !isT && "bg-gray-50/60",
                      isMonthStart && "border-l-2 border-l-gray-300",
                      isMonday && !isMonthStart && "border-l border-l-gray-200"
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 h-3 leading-3">
                      {(i === 0 || isMonthStart) ? format(date, "MMM") : "\u00A0"}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-medium uppercase",
                        isWeekend ? "text-red-500 font-bold" : "text-gray-500"
                      )}
                    >
                      {format(date, "EEE")}
                    </span>
                    <span
                      className={cn(
                        "text-[13px] font-semibold w-7 h-7 flex items-center justify-center rounded-full leading-none",
                        isT && "bg-emerald-600 text-white",
                        !isT && isWeekend && "text-red-500",
                        !isT && !isWeekend && "text-gray-700"
                      )}
                    >
                      {format(date, "d")}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Property rows (grid only) */}
            {filteredProperties.map((prop) => (
              <div key={prop.id} className="flex relative" style={{ height: ROW_HEIGHT }}>
                {dates.map((date, di) => {
                  const isT = isToday(date);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isMonday = date.getDay() === 1;
                  const isMonthStart = date.getDate() === 1;
                  const dayKey = format(date, "yyyy-MM-dd");
                  const isCleaning = prop.bookings.some((b) => {
                    if (b.status === "BLOCKED" || b.status === "CANCELLED") return false;
                    return format(new Date(b.endDate), "yyyy-MM-dd") === dayKey;
                  });

                  return (
                    <div
                      key={di}
                      className={cn(
                        "border-b border-r shrink-0 relative group/cell",
                        isT && "bg-emerald-50",
                        isWeekend && !isT && "bg-gray-50/40",
                        isMonthStart && "border-l-2 border-l-gray-300",
                        isMonday && !isMonthStart && "border-l border-l-gray-200"
                      )}
                      style={{ width: DAY_WIDTH, height: ROW_HEIGHT }}
                    >
                      {/* Cleaning icon — centered, above bars */}
                      {isCleaning && (
                        <div
                          className="absolute z-[15] flex items-center justify-center w-[18px] h-[18px] rounded-full shadow-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400"
                          title="Cleaning needed"
                        >
                          <User className="h-2.5 w-2.5 text-gray-900" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Booking bars */}
                {prop.bookings
                  .filter((b) => b.status !== "CANCELLED")
                  .map((booking) => {
                    const bStart = new Date(booking.startDate);
                    const bEnd = new Date(booking.endDate);
                    const bLastNight = new Date(bEnd);
                    bLastNight.setDate(bLastNight.getDate() - 1);

                    const gridStart = dates[0];
                    const gridEnd = dates[dates.length - 1];

                    if (bEnd < gridStart || bStart > gridEnd) return null;

                    const startIdx = Math.max(0, differenceInCalendarDays(bStart, gridStart));
                    const lastNightIdx = Math.min(
                      TOTAL_DAYS - 1,
                      differenceInCalendarDays(bLastNight, gridStart)
                    );
                    const checkoutIdx = Math.min(
                      TOTAL_DAYS - 1,
                      differenceInCalendarDays(bEnd, gridStart)
                    );

                    if (startIdx > TOTAL_DAYS - 1 || lastNightIdx < 0) return null;

                    const HALF = DAY_WIDTH * 0.5;
                    const isStartVisible = bStart >= gridStart;
                    const hasCheckoutDay = checkoutIdx <= TOTAL_DAYS - 1 && checkoutIdx >= 0;
                    const isEndVisible = hasCheckoutDay;

                    const left = startIdx * DAY_WIDTH + (isStartVisible ? HALF : 0);
                    const rightEdge = hasCheckoutDay
                      ? checkoutIdx * DAY_WIDTH + HALF
                      : (lastNightIdx + 1) * DAY_WIDTH;
                    const width = rightEdge - left;

                    const isClipped = bStart < gridStart || bEnd > gridEnd;

                    const color =
                      booking.status === "BLOCKED" ? "#9ca3af" : prop.color;
                    const textColor =
                      booking.status === "BLOCKED" ? "#fff" : getContrastTextColor(color);

                    // #2 Checked-out: desaturated + striped
                    const isCheckedOut = booking.status === "CHECKEDOUT";
                    const opacity = isCheckedOut ? 0.35 : 1;

                    const INSET = 2;
                    const nights = differenceInCalendarDays(bEnd, bStart);

                    return (
                      <div
                        key={booking.id}
                        role="button"
                        className={cn(
                          "absolute cursor-pointer flex items-center font-medium transition-all",
                          "hover:brightness-[0.92] hover:shadow-lg active:scale-[0.998]",
                          "text-[11px] leading-none",
                          isCheckedOut && "bar-checked-out"
                        )}
                        style={{
                          left: left + INSET,
                          width: width - INSET * 2,
                          top: BAR_Y_OFFSET,
                          height: BAR_HEIGHT,
                          backgroundColor: color,
                          color: textColor,
                          opacity,
                          borderRadius: `${isStartVisible ? 6 : 0}px ${isEndVisible ? 4 : 0}px ${isEndVisible ? 4 : 0}px ${isStartVisible ? 6 : 0}px`,
                          paddingLeft: isStartVisible ? 8 : 4,
                          paddingRight: isEndVisible ? 8 : 4,
                          zIndex: 10,
                          boxShadow: isCheckedOut ? "none" : "0 1px 2px rgba(0,0,0,0.08)",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookingClick?.({
                            ...booking,
                            property: { name: prop.name, color: prop.color },
                          });
                        }}
                        // #7 Rich tooltip
                        title={`${booking.summary || "Reserved"} · ${prop.name}\n${format(bStart, "d MMM")} → ${format(bEnd, "d MMM")} · ${nights} night${nights !== 1 ? "s" : ""}\nStatus: ${booking.status}`}
                      >
                        <span className="truncate">
                          {booking.summary || "Reserved"}
                        </span>
                        {isClipped && (
                          <span className="ml-1 opacity-50 text-[10px] shrink-0">
                            &raquo;
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}
