"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Moon,
  ArrowRight,
  ExternalLink,
  Phone,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
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

const STATUS_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  CONFIRMED: { label: "Reserved", bg: "bg-blue-50", text: "text-blue-700" },
  BLOCKED: { label: "Blocked", bg: "bg-gray-100", text: "text-gray-500" },
};

interface BookingDetailDialogProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
}

export function BookingDetailDialog({
  booking,
  open,
  onClose,
}: BookingDetailDialogProps) {
  if (!booking) return null;

  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  const nights = differenceInDays(end, start);
  const status = STATUS_STYLE[booking.status] || STATUS_STYLE.CONFIRMED;
  const textColor = getContrastTextColor(booking.property.color);
  const isPhone = booking.summary?.startsWith("#");
  const reservationUrl = booking.notes?.startsWith("http") ? booking.notes : null;
  const reservationId = reservationUrl?.match(/\/details\/(\w+)/)?.[1] ?? null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden gap-0" showCloseButton={false}>
        {/* ── Header with property color ── */}
        <div
          className="px-5 pt-5 pb-4"
          style={{ backgroundColor: booking.property.color }}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle
                className="text-lg font-bold tracking-tight"
                style={{ color: textColor }}
              >
                {booking.summary || "Reserved"}
              </DialogTitle>
              {reservationId && (
                <span className="text-sm font-mono font-semibold" style={{ color: textColor }}>
                  ID: {reservationId}
                </span>
              )}
            </div>
          </DialogHeader>

          <div className="flex items-center mt-1.5" style={{ color: textColor, opacity: 0.8 }}>
            <div className="flex items-center gap-1.5 text-xs">
              <MapPin className="h-3 w-3" />
              {booking.property.name}
            </div>
            {isPhone && (
              <div className="flex items-center gap-1.5 text-xs ml-auto">
                <Phone className="h-3 w-3" />
                Last 4: {booking.summary?.slice(1)}
              </div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-4 space-y-4">
          {/* Date block */}
          <div className="flex items-center gap-4">
            <div className="flex-1 text-center">
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                Check-in
              </div>
              <div className="text-base font-semibold text-gray-900 mt-0.5">
                {format(start, "MMM d")}
              </div>
              <div className="text-[11px] text-gray-400">
                {format(start, "EEEE")}
              </div>
            </div>

            <div className="flex flex-col items-center gap-0.5 text-gray-300">
              <ArrowRight className="h-4 w-4" />
              <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                <Moon className="h-3 w-3" />
                {nights}n
              </span>
            </div>

            <div className="flex-1 text-center">
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                Check-out
              </div>
              <div className="text-base font-semibold text-gray-900 mt-0.5">
                {format(end, "MMM d")}
              </div>
              <div className="text-[11px] text-gray-400">
                {format(end, "EEEE")}
              </div>
            </div>
          </div>

          {/* Reservation link */}
          {reservationUrl && (
            <a
              href={reservationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View on Airbnb
            </a>
          )}

          {/* Notes (only if not a URL) */}
          {booking.notes && !reservationUrl && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              {booking.notes}
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
