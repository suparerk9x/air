"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PanelLeftClose,
  PanelLeft,
  Rss,
  Package,
  Plane,
  ShoppingCart,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Menu item registry ──────────────────────────────────────────────
interface MenuDef {
  key: string;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: "settings";
  children?: MenuDef[];
}

const MENU_REGISTRY: Record<string, MenuDef> = {
  dashboard: { key: "dashboard", href: "/", label: "Dashboard", icon: Home },
  inventory: {
    key: "inventory",
    href: "/inventory",
    label: "Inventory",
    icon: Package,
    children: [
      { key: "inventoryCounter", href: "/inventory/counter", label: "Counter", icon: ShoppingCart },
      { key: "inventoryItems", href: "/inventory/items", label: "Items", icon: Package },
    ],
  },
  calendarSync: {
    key: "calendarSync",
    href: "/calendar-sync",
    label: "Calendar Sync",
    icon: Rss,
    section: "settings",
  },
};

// ─── Config types ────────────────────────────────────────────────────
interface MenuItemConfig {
  key: string;
  visible: boolean;
  children?: { key: string; visible: boolean }[];
}

const DEFAULT_CONFIG: MenuItemConfig[] = [
  { key: "dashboard", visible: true },
  {
    key: "inventory",
    visible: true,
    children: [
      { key: "inventoryCounter", visible: true },
      { key: "inventoryItems", visible: true },
    ],
  },
  { key: "calendarSync", visible: true },
];

// ─── Component ───────────────────────────────────────────────────────
export function AppSidebar({
  children,
  headerRight,
}: {
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [menuConfig, setMenuConfig] = useState<MenuItemConfig[]>(DEFAULT_CONFIG);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  // Auto-expand parent menu when on a child page
  useEffect(() => {
    for (const item of menuConfig) {
      const def = MENU_REGISTRY[item.key];
      if (def?.children?.some((c) => pathname.startsWith(c.href))) {
        setExpandedKeys((prev) => new Set(prev).add(item.key));
      }
    }
  }, [pathname, menuConfig]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          setMenuConfig(data);
        } else if (data && typeof data === "object") {
          // Legacy boolean format — convert
          const legacy = data as Record<string, boolean>;
          const converted = DEFAULT_CONFIG.map((item) => ({
            ...item,
            visible: legacy[item.key] ?? item.visible,
          }));
          setMenuConfig(converted);
        }
      })
      .catch(() => {});
  }, []);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Build page title from pathname
  const pageTitle =
    pathname === "/"
      ? "Dashboard"
      : pathname === "/inventory"
      ? "Inventory"
      : pathname === "/inventory/counter"
      ? "Stock Counter"
      : pathname === "/inventory/items"
      ? "Inventory Items"
      : pathname === "/calendar-sync"
      ? "Calendar Sync"
      : "";

  // Split into nav and settings sections
  const navItems = menuConfig.filter(
    (item) => item.visible && MENU_REGISTRY[item.key] && MENU_REGISTRY[item.key].section !== "settings"
  );
  const settingsItems = menuConfig.filter(
    (item) => item.visible && MENU_REGISTRY[item.key] && MENU_REGISTRY[item.key].section === "settings"
  );

  const renderItem = (itemConfig: MenuItemConfig) => {
    const def = MENU_REGISTRY[itemConfig.key];
    if (!def) return null;

    const hasChildren = def.children && def.children.length > 0;
    const isExpanded = expandedKeys.has(itemConfig.key);
    const active =
      pathname === def.href ||
      (hasChildren && def.children!.some((c) => pathname.startsWith(c.href)));

    // Get visible children
    const visibleChildren = hasChildren
      ? (itemConfig.children || [])
          .filter((c) => c.visible)
          .map((c) => def.children!.find((d) => d.key === c.key))
          .filter(Boolean) as MenuDef[]
      : [];

    return (
      <div key={def.key}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(def.key)}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors whitespace-nowrap w-full",
              active
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <def.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">{def.label}</span>
            <ChevronDown
              className={cn(
                "h-3 w-3 text-gray-400 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </button>
        ) : (
          <Link
            href={def.href}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors whitespace-nowrap",
              active
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <def.icon className="h-4 w-4 shrink-0" />
            <span>{def.label}</span>
          </Link>
        )}

        {/* Children */}
        {hasChildren && isExpanded && visibleChildren.length > 0 && (
          <div className="ml-4 mt-0.5 space-y-0.5">
            {/* Parent link */}
            <Link
              href={def.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors whitespace-nowrap",
                pathname === def.href
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              Overview
            </Link>
            {visibleChildren.map((child) => {
              const childActive = pathname.startsWith(child.href);
              return (
                <Link
                  key={child.key}
                  href={child.href}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors whitespace-nowrap",
                    childActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <child.icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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
            {navItems.map(renderItem)}

            {settingsItems.length > 0 && (
              <>
                <div className="h-px bg-gray-100 my-2" />
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Settings
                </div>
              </>
            )}
            {settingsItems.map(renderItem)}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
