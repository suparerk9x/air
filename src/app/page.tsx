"use client";

import { useState, useEffect, useCallback } from "react";
import { logout } from "@/app/actions/auth";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { TimelineView } from "@/components/calendar/timeline-view";
import { PropertySidebar } from "@/components/calendar/property-sidebar";
import { PropertyDialog } from "@/components/calendar/property-dialog";
import { BookingDialog } from "@/components/calendar/booking-dialog";
import { BookingDetailDialog } from "@/components/calendar/booking-detail-dialog";
import { TodayPanel } from "@/components/calendar/today-panel";
import { StatsBar } from "@/components/calendar/stats-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Plus,
  RefreshCw,
  Bell,
  User,
  Plane,
  CalendarDays,
  GanttChart,
  Info,
  Package,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { isSameDay, addDays } from "date-fns";

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
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetail, setShowBookingDetail] = useState(false);
  const [viewMode, setViewMode] = useState<"monthly" | "timeline">("monthly");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/properties");
      const data = await res.json();
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
    for (const prop of properties.filter((p) => p.icalUrl)) {
      await handleSync(prop.id);
    }
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

  const handleSaveBooking = async (data: {
    summary: string;
    startDate: string;
    endDate: string;
    propertyId: string;
    status: string;
  }) => {
    await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowBookingDialog(false);
    await fetchProperties();
  };

  const handleDeleteBooking = async (id: string) => {
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    setShowBookingDetail(false);
    setSelectedBooking(null);
    await fetchProperties();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setShowBookingDetail(false);
    setSelectedBooking(null);
    await fetchProperties();
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowBookingDialog(true);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Plane className="h-8 w-8 text-blue-500 animate-bounce" />
          <span className="text-sm text-gray-400">Loading properties...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 md:px-6 py-2.5 flex items-center justify-between">
          {/* Left: Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Plane className="h-4 w-4 text-white -rotate-45" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none">
                Air
              </h1>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                Property Manager
              </span>
            </div>
            <Link
              href="/inventory"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Package className="h-3.5 w-3.5" />
              Inventory
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("monthly")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
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
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  viewMode === "timeline"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <GanttChart className="h-3.5 w-3.5" />
                Timeline
              </button>
            </div>

            {/* Legend tooltip */}
            <DropdownMenu>
              <DropdownMenuTrigger className="h-8 w-8 hidden md:inline-flex items-center justify-center rounded-md hover:bg-gray-100">
                <Info className="h-4 w-4 text-gray-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 p-3">
                <div className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Legend</div>
                <div className="space-y-2 text-[11px] text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-2 rounded-sm bg-blue-500" />
                    Confirmed / Checked-in
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-2 rounded-sm bg-blue-500 opacity-35 bar-checked-out" />
                    Checked-out
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-2 rounded-sm bg-gray-400 opacity-70" />
                    Blocked
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                      <User className="h-2.5 w-2.5 text-gray-900" />
                    </span>
                    Cleaning needed
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center text-amber-500 shrink-0">⚠</span>
                    Same-day turnover
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex"
              onClick={handleSyncAll}
              disabled={syncing !== null}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`}
              />
              Sync
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setSelectedDate(undefined);
                setShowBookingDialog(true);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Booking</span>
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
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Settings className="h-4 w-4 text-gray-400" />
                  Settings
                </DropdownMenuItem>
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
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex gap-4 p-4 max-w-[1600px] mx-auto">
        {/* Left sidebar */}
        <div className="hidden md:flex flex-col gap-3 shrink-0 w-60">
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

          <StatsBar
            bookings={allBookings}
            properties={properties.filter((p) => selectedIds.includes(p.id))}
            currentDate={currentDate}
          />

          <TodayPanel
            bookings={allBookings}
            onBookingClick={handleBookingClick}
          />
        </div>

        {/* Center: Calendar */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Calendar / Timeline */}
          {viewMode === "monthly" ? (
            <CalendarGrid
              bookings={allBookings}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onDateClick={handleDateClick}
              onBookingClick={handleBookingClick}
              selectedPropertyIds={selectedIds}
            />
          ) : (
            <TimelineView
              properties={properties}
              currentDate={currentDate}
              onBookingClick={handleBookingClick}
              onDateClick={handleDateClick}
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

      <BookingDialog
        open={showBookingDialog}
        onClose={() => setShowBookingDialog(false)}
        onSave={handleSaveBooking}
        properties={properties.map((p) => ({
          id: p.id,
          name: p.name,
          color: p.color,
        }))}
        initialDate={selectedDate}
      />

      <BookingDetailDialog
        booking={selectedBooking}
        open={showBookingDetail}
        onClose={() => {
          setShowBookingDetail(false);
          setSelectedBooking(null);
        }}
        onDelete={handleDeleteBooking}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
