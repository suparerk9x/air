"use client";

import { useState, useEffect, useCallback } from "react";
import { logout } from "@/app/actions/auth";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { TimelineView } from "@/components/calendar/timeline-view";
import { PropertySidebar } from "@/components/calendar/property-sidebar";
import { PropertyDialog } from "@/components/calendar/property-dialog";
import { BookingDetailDialog } from "@/components/calendar/booking-detail-dialog";
import { TodayPanel } from "@/components/calendar/today-panel";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  Bell,
  CalendarDays,
  GanttChart,
  LogOut,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { isSameDay, addDays, format } from "date-fns";

interface Property {
  id: string;
  name: string;
  color: string;
  platform: string | null;
  icalUrl: string | null;
  address: string | null;
  bookings: RawBooking[];
}

interface RawBooking {
  id: string;
  summary: string | null;
  startDate: string;
  endDate: string;
  status: string;
  source: string | null;
  notes: string | null;
  propertyId: string;
}

interface Booking extends RawBooking {
  property: {
    name: string;
    color: string;
  };
}

interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export default function Dashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetail, setShowBookingDetail] = useState(false);
  const [viewMode, setViewMode] = useState<"monthly" | "timeline">("monthly");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/properties");
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setProperties(data);
      if (selectedIds.length === 0 && data.length > 0) {
        setSelectedIds(data.map((p: Property) => p.id));
      }
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedIds.length]);

  useEffect(() => {
    fetchProperties();
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setUser(data))
      .catch(() => {});
  }, [fetchProperties]);

  const handleToggleProperty = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSync = async (propertyId: string) => {
    setSyncing(propertyId);
    try {
      const res = await fetch(`/api/properties/${propertyId}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        await fetchProperties();
      }
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    const propsWithIcal = properties.filter(
      (p) => p.icalUrl || (p as unknown as { icalFeeds?: { id: string }[] }).icalFeeds?.length
    );
    for (const prop of propsWithIcal) {
      await handleSync(prop.id);
    }
    setLastSyncTime(new Date());
  };

  const handleSaveProperty = async (data: {
    name: string;
    address: string;
    icalUrl: string;
    color: string;
    platform: string;
  }) => {
    if (editingProperty) {
      await fetch(`/api/properties/${editingProperty.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setShowPropertyDialog(false);
    setEditingProperty(null);
    await fetchProperties();
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm("Delete this property and all its bookings?")) return;
    await fetch(`/api/properties/${id}`, { method: "DELETE" });
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    await fetchProperties();
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetail(true);
  };

  // Flatten bookings from selected properties
  const allBookings: Booking[] = properties
    .filter((p) => selectedIds.includes(p.id))
    .flatMap((p) =>
      p.bookings.map((b) => ({
        ...b,
        property: { name: p.name, color: p.color },
      }))
    );

  // Upcoming notifications
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const tomorrowCheckIns = allBookings.filter((b) =>
    isSameDay(new Date(b.startDate), tomorrow)
  );
  const tomorrowCheckOuts = allBookings.filter((b) =>
    isSameDay(new Date(b.endDate), tomorrow)
  );
  const notificationCount = tomorrowCheckIns.length + tomorrowCheckOuts.length;

  if (loading) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </AppSidebar>
    );
  }

  const headerRight = (
    <>
          {/* View switcher */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("monthly")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                viewMode === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Month
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                viewMode === "timeline"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <GanttChart className="h-3.5 w-3.5" />
              Timeline
            </button>
          </div>

          <div className="w-px h-5 bg-gray-200 hidden md:block" />

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex items-center"
              onClick={handleSyncAll}
              disabled={syncing !== null}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing..." : "Sync"}
              {lastSyncTime && !syncing && (
                <span className="ml-1.5 text-[10px] text-gray-400 font-normal">
                  {format(lastSyncTime, "HH:mm")}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-8 w-8 inline-flex items-center justify-center rounded-md border hover:bg-gray-50">
                <Bell className="h-4 w-4 text-gray-500" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {notificationCount === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-gray-400">
                    No upcoming events for tomorrow
                  </div>
                ) : (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
                      Tomorrow
                    </div>
                    {tomorrowCheckIns.map((b) => (
                      <DropdownMenuItem
                        key={b.id}
                        onClick={() => handleBookingClick(b)}
                      >
                        <span className="text-green-600 font-medium mr-2">
                          IN
                        </span>
                        {b.summary || "Reserved"} - {b.property.name}
                      </DropdownMenuItem>
                    ))}
                    {tomorrowCheckOuts.map((b) => (
                      <DropdownMenuItem
                        key={b.id}
                        onClick={() => handleBookingClick(b)}
                      >
                        <span className="text-orange-600 font-medium mr-2">
                          OUT
                        </span>
                        {b.summary || "Reserved"} - {b.property.name}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-sm ring-2 ring-white transition-all hover:scale-105">
                <span className="text-xs font-bold text-white leading-none">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                      <span className="text-sm font-bold text-white">
                        {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {user?.name || "User"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                      {user?.role && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600">
                          <Shield className="h-2.5 w-2.5" />
                          {user.role === "ADMIN" ? "Admin" : "Co-host"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-red-600"
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
    </>
  );

  return (
    <AppSidebar headerRight={headerRight}>
      {/* ── Main Content ── */}
      <div className="flex gap-3 p-3 max-w-[1600px] mx-auto">
        {/* Properties + Today sidebar */}
        <div className="hidden md:flex flex-col gap-2 shrink-0 w-56">
          <PropertySidebar
            properties={properties}
            selectedIds={selectedIds}
            onToggle={handleToggleProperty}
            onSync={handleSync}
            onAdd={() => {
              setEditingProperty(null);
              setShowPropertyDialog(true);
            }}
            onEdit={(prop) => {
              setEditingProperty(prop as Property);
              setShowPropertyDialog(true);
            }}
            onDelete={handleDeleteProperty}
            syncing={syncing}
          />

          <TodayPanel
            bookings={allBookings}
            onBookingClick={handleBookingClick}
          />
        </div>

        {/* Center: Calendar */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* Calendar / Timeline */}
          {viewMode === "monthly" ? (
            <CalendarGrid
              bookings={allBookings}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onBookingClick={handleBookingClick}
              selectedPropertyIds={selectedIds}
            />
          ) : (
            <TimelineView
              properties={properties}
              currentDate={currentDate}
              onBookingClick={handleBookingClick}
              selectedPropertyIds={selectedIds}
            />
          )}

          {/* Legend removed — now in header tooltip */}
        </div>
      </div>

      {/* ── Mobile bottom bar (properties on mobile) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2 flex items-center gap-2 overflow-x-auto z-30">
        {properties.map((prop) => (
          <button
            key={prop.id}
            onClick={() => handleToggleProperty(prop.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium shrink-0 transition-colors"
            style={{
              backgroundColor: selectedIds.includes(prop.id)
                ? prop.color + "20"
                : "transparent",
              borderColor: selectedIds.includes(prop.id)
                ? prop.color
                : "#e5e7eb",
              color: selectedIds.includes(prop.id) ? prop.color : "#6b7280",
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: prop.color }}
            />
            {prop.name}
          </button>
        ))}
      </div>

      {/* ── Dialogs ── */}
      <PropertyDialog
        open={showPropertyDialog}
        onClose={() => {
          setShowPropertyDialog(false);
          setEditingProperty(null);
        }}
        onSave={handleSaveProperty}
        initial={editingProperty || undefined}
      />

      <BookingDetailDialog
        booking={selectedBooking}
        open={showBookingDetail}
        onClose={() => {
          setShowBookingDetail(false);
          setSelectedBooking(null);
        }}
      />
    </AppSidebar>
  );
}
