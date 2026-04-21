"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PanelLeftClose,
  PanelLeft,
  Rss,
  Package,
  Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/inventory", label: "Inventory", icon: Package },
];

const SETTINGS_ITEMS = [
  { href: "/calendar-sync", label: "Calendar Sync", icon: Rss },
];

export function AppSidebar({
  children,
  headerRight,
}: {
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  const pageTitle =
    pathname === "/" ? "Dashboard" :
    pathname === "/inventory" ? "Inventory" :
    pathname === "/calendar-sync" ? "Calendar Sync" :
    "";

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa] overflow-hidden">
      {/* ── Header ── */}
      <header className="h-11 bg-white border-b flex items-center px-3 shrink-0 z-30">
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-bold text-gray-900"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center">
              <Plane className="h-3 w-3 text-white -rotate-45" />
            </div>
            Air
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500 font-medium">{pageTitle}</span>
          <button
            onClick={() => setOpen(!open)}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-300 hover:text-gray-500 ml-1"
          >
            {open ? (
              <PanelLeftClose className="h-3.5 w-3.5" />
            ) : (
              <PanelLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {headerRight && (
          <div className="flex-1 flex items-center justify-end gap-2 ml-4 min-w-0">
            {headerRight}
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={cn(
            "flex flex-col border-r bg-white transition-all duration-200 shrink-0 overflow-y-auto",
            open ? "w-48" : "w-0 border-r-0"
          )}
        >
          <nav className="py-2 px-1.5 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors whitespace-nowrap",
                    active
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="h-px bg-gray-100 my-2" />

            <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Settings
            </div>
            {SETTINGS_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors whitespace-nowrap",
                    active
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
