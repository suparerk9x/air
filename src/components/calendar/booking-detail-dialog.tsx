"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  User,
  MapPin,
  Clock,
  Moon,
  ArrowRight,
  Trash2,
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

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  CONFIRMED: { label: "Confirmed", variant: "default" },
  CHECKEDIN: { label: "Checked In", variant: "default" },
  CHECKEDOUT: { label: "Checked Out", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  BLOCKED: { label: "Blocked", variant: "outline" },
};

interface BookingDetailDialogProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export function BookingDetailDialog({
  booking,
  open,
  onClose,
  onDelete,
  onStatusChange,
}: BookingDetailDialogProps) {
  if (!booking) return null;

  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  const nights = differenceInDays(end, start);
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
  const textColor = getContrastTextColor(booking.property.color);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Color header */}
        <div
          className="px-6 pt-6 pb-4"
          style={{ backgroundColor: booking.property.color }}
        >
          <DialogHeader>
            <DialogTitle
              className="text-lg font-semibold"
              style={{ color: textColor }}
            >
              {booking.summary || "Reserved"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-1" style={{ color: textColor, opacity: 0.85 }}>
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-sm">{booking.property.name}</span>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Status + Source */}
          <div className="flex items-center gap-2 pt-2">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            {booking.source && (
              <Badge variant="outline" className="text-xs">
                {booking.source === "ical" ? "iCal Sync" : "Manual"}
              </Badge>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-gray-50 rounded-lg p-3">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                Check-in
              </div>
              <div className="font-semibold text-sm">
                {format(start, "MMM d")}
              </div>
              <div className="text-xs text-gray-500">
                {format(start, "EEE")}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-4 w-4 text-gray-300" />
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Moon className="h-3 w-3" />
                {nights}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                Check-out
              </div>
              <div className="font-semibold text-sm">
                {format(end, "MMM d")}
              </div>
              <div className="text-xs text-gray-500">
                {format(end, "EEE")}
              </div>
            </div>
          </div>

          {/* Quick info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>
                {format(start, "d MMM yyyy")} - {format(end, "d MMM yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>
                {nights} night{nights !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4 text-gray-400" />
              <span>{booking.summary || "No guest name"}</span>
            </div>
          </div>

          {booking.notes && (
            <>
              <Separator />
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">
                  Notes
                </div>
                <p className="text-sm text-gray-700">{booking.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {booking.status === "CONFIRMED" && (
                <Button
                  size="sm"
                  onClick={() => onStatusChange(booking.id, "CHECKEDIN")}
                >
                  Check In
                </Button>
              )}
              {booking.status === "CHECKEDIN" && (
                <Button
                  size="sm"
                  onClick={() => onStatusChange(booking.id, "CHECKEDOUT")}
                >
                  Check Out
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                onDelete(booking.id);
                onClose();
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
