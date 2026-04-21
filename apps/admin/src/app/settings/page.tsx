"use client";

import { useState, useEffect, useRef } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Card } from "@/components/ui/card";
import {
  Home,
  Package,
  Rss,
  ShoppingCart,
  Loader2,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────
interface MenuItemConfig {
  key: string;
  visible: boolean;
  children?: { key: string; visible: boolean }[];
}

interface MenuDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { key: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

// ─── Registry ────────────────────────────────────────────────────────
const MENU_DEFS: MenuDef[] = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  {
    key: "inventory",
    label: "Inventory",
    icon: Package,
    children: [
      { key: "inventoryCounter", label: "Counter", icon: ShoppingCart },
      { key: "inventoryItems", label: "Items", icon: Package },
    ],
  },
  { key: "calendarSync", label: "Calendar Sync", icon: Rss },
];

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

function getDef(key: string): MenuDef | undefined {
  return MENU_DEFS.find((d) => d.key === key);
}

// ─── Page ────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [config, setConfig] = useState<MenuItemConfig[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(["inventory"]));

  // DnD state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const menuConfig = data?.web_menu_config;
        if (Array.isArray(menuConfig)) {
          setConfig(menuConfig);
        } else if (menuConfig && typeof menuConfig === "object") {
          // Legacy boolean format
          const legacy = menuConfig as Record<string, boolean>;
          setConfig(
            DEFAULT_CONFIG.map((item) => ({
              ...item,
              visible: legacy[item.key] ?? item.visible,
            }))
          );
        } else {
          setConfig(DEFAULT_CONFIG);
        }
      })
      .catch(() => setConfig(DEFAULT_CONFIG))
      .finally(() => setLoading(false));
  }, []);

  async function saveConfig(updated: MenuItemConfig[]) {
    setConfig(updated);
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "web_menu_config", value: updated }),
    });
    setSaving(false);
  }

  function toggleVisible(key: string) {
    if (!config) return;
    const updated = config.map((item) =>
      item.key === key ? { ...item, visible: !item.visible } : item
    );
    saveConfig(updated);
  }

  function toggleChild(parentKey: string, childKey: string) {
    if (!config) return;
    const updated = config.map((item) => {
      if (item.key !== parentKey || !item.children) return item;
      return {
        ...item,
        children: item.children.map((c) =>
          c.key === childKey ? { ...c, visible: !c.visible } : c
        ),
      };
    });
    saveConfig(updated);
  }

  function toggleExpand(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // ─── Drag handlers ─────────────────────────────────────────────────
  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragEnter(index: number) {
    dragCounter.current++;
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(index: number) {
    if (!config || dragIndex === null || dragIndex === index) {
      resetDrag();
      return;
    }
    const updated = [...config];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    saveConfig(updated);
    resetDrag();
  }

  function handleDragEnd() {
    resetDrag();
  }

  function resetDrag() {
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  }

  if (loading) {
    return (
      <AdminSidebar>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="p-6 max-w-2xl">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">
          Web App Menu
        </h1>
        <p className="text-sm text-gray-500 mb-1">
          เปิด/ปิด menu ที่แสดงใน web app สำหรับผู้ใช้ทั่วไป
        </p>
        <p className="text-xs text-gray-400 mb-6">
          ลาก (drag) เพื่อจัดลำดับ menu
        </p>

        <Card className="overflow-hidden">
          {config?.map((item, index) => {
            const def = getDef(item.key);
            if (!def) return null;

            const hasChildren = def.children && def.children.length > 0;
            const isExpanded = expandedKeys.has(item.key);
            const isDragging = dragIndex === index;
            const isDragOver = dragOverIndex === index && dragIndex !== index;

            return (
              <div key={item.key}>
                {/* Main item row */}
                <div
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-all",
                    isDragging && "opacity-40",
                    isDragOver && "bg-indigo-50 border-indigo-200"
                  )}
                >
                  {/* Drag handle */}
                  <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-manipulation">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  {/* Expand toggle for items with children */}
                  {hasChildren ? (
                    <button
                      onClick={() => toggleExpand(item.key)}
                      className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ) : (
                    <div className="w-4" />
                  )}

                  {/* Icon + label */}
                  <def.icon className="h-4 w-4 text-gray-500 shrink-0" />
                  <span
                    className={cn(
                      "text-sm font-medium flex-1",
                      item.visible ? "text-gray-700" : "text-gray-400"
                    )}
                  >
                    {def.label}
                  </span>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleVisible(item.key)}
                    disabled={saving}
                    className={cn(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
                      item.visible ? "bg-indigo-600" : "bg-gray-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                        item.visible ? "translate-x-4.5" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && item.children && (
                  <div className="bg-gray-50/50">
                    {item.children.map((child) => {
                      const childDef = def.children!.find(
                        (d) => d.key === child.key
                      );
                      if (!childDef) return null;

                      return (
                        <div
                          key={child.key}
                          className="flex items-center gap-3 pl-16 pr-4 py-2.5 border-b last:border-b-0"
                        >
                          <childDef.icon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span
                            className={cn(
                              "text-xs font-medium flex-1",
                              child.visible ? "text-gray-600" : "text-gray-400"
                            )}
                          >
                            {childDef.label}
                          </span>

                          <button
                            onClick={() => toggleChild(item.key, child.key)}
                            disabled={saving || !item.visible}
                            className={cn(
                              "relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0",
                              !item.visible
                                ? "bg-gray-200 opacity-50"
                                : child.visible
                                ? "bg-indigo-500"
                                : "bg-gray-300"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-block h-2.5 w-2.5 rounded-full bg-white transition-transform",
                                child.visible ? "translate-x-3.5" : "translate-x-1"
                              )}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </Card>

        {saving && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </p>
        )}
      </div>
    </AdminSidebar>
  );
}
