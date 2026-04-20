"use client";

import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWithinInterval,
  isSameDay,
  differenceInDays,
} from "date-fns";
import { Percent, Moon, Home, TrendingUp } from "lucide-react";

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  propertyId: string;
}

interface Property {
  id: string;
  name: string;
  color: string;
}

interface StatsBarProps {
  bookings: Booking[];
  properties: Property[];
  currentDate: Date;
}

export function StatsBar({ bookings, properties, currentDate }: StatsBarProps) {
  const stats = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const totalSlots = daysInMonth.length * properties.length;

    if (totalSlots === 0) return { occupancy: 0, bookedNights: 0, avgStay: 0, properties: 0 };

    let bookedSlots = 0;
    let totalNights = 0;
    let bookingCount = 0;

    const activeBookings = bookings.filter(
      (b) => b.status !== "CANCELLED" && b.status !== "BLOCKED"
    );

    for (const day of daysInMonth) {
      for (const prop of properties) {
        const hasBooking = activeBookings.some((b) => {
          if (b.propertyId !== prop.id) return false;
          const start = new Date(b.startDate);
          const end = new Date(b.endDate);
          end.setDate(end.getDate() - 1); // end date is exclusive
          return isWithinInterval(day, { start, end }) || isSameDay(day, start);
        });
        if (hasBooking) bookedSlots++;
      }
    }

    const seenBookings = new Set<string>();
    for (const b of activeBookings) {
      if (seenBookings.has(b.id)) continue;
      seenBookings.add(b.id);
      const nights = differenceInDays(new Date(b.endDate), new Date(b.startDate));
      totalNights += nights;
      bookingCount++;
    }

    return {
      occupancy: Math.round((bookedSlots / totalSlots) * 100),
      bookedNights: bookedSlots,
      avgStay: bookingCount > 0 ? Math.round((totalNights / bookingCount) * 10) / 10 : 0,
      properties: properties.length,
    };
  }, [bookings, properties, currentDate]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard
        icon={<Percent className="h-4 w-4" />}
        label="Occupancy Rate"
        value={`${stats.occupancy}%`}
        color={
          stats.occupancy >= 80
            ? "text-green-600"
            : stats.occupancy >= 50
              ? "text-amber-600"
              : "text-red-500"
        }
        bgColor={
          stats.occupancy >= 80
            ? "bg-green-50"
            : stats.occupancy >= 50
              ? "bg-amber-50"
              : "bg-red-50"
        }
        bar={stats.occupancy}
        barColor={
          stats.occupancy >= 80
            ? "bg-green-500"
            : stats.occupancy >= 50
              ? "bg-amber-500"
              : "bg-red-500"
        }
      />
      <StatCard
        icon={<Moon className="h-4 w-4" />}
        label="Booked Nights"
        value={stats.bookedNights.toString()}
        color="text-blue-600"
        bgColor="bg-blue-50"
      />
      <StatCard
        icon={<TrendingUp className="h-4 w-4" />}
        label="Avg Stay"
        value={`${stats.avgStay} nights`}
        color="text-purple-600"
        bgColor="bg-purple-50"
      />
      <StatCard
        icon={<Home className="h-4 w-4" />}
        label="Properties"
        value={stats.properties.toString()}
        color="text-gray-600"
        bgColor="bg-gray-50"
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
  bar,
  barColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  bar?: number;
  barColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <div className={`p-1 rounded-md ${bgColor} ${color}`}>{icon}</div>
        <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider leading-tight">
          {label}
        </span>
      </div>
      <div className={`text-lg font-bold ${color} mt-0.5`}>{value}</div>
      {bar !== undefined && barColor && (
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(bar, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
