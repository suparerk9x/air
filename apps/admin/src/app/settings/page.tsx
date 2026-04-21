"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Card } from "@/components/ui/card";
import { Home, Package, Rss, Loader2 } from "lucide-react";

interface MenuConfig {
  dashboard: boolean;
  inventory: boolean;
  calendarSync: boolean;
}

const MENU_ITEMS = [
  { key: "dashboard" as const, label: "Dashboard", icon: Home },
  { key: "inventory" as const, label: "Inventory", icon: Package },
  { key: "calendarSync" as const, label: "Calendar Sync", icon: Rss },
];

export default function SettingsPage() {
  const [config, setConfig] = useState<MenuConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setConfig(
          data?.web_menu_config ?? {
            dashboard: true,
            inventory: true,
            calendarSync: true,
          }
        );
      })
      .catch(() => {
        setConfig({ dashboard: true, inventory: true, calendarSync: true });
      })
      .finally(() => setLoading(false));
  }, []);

  async function toggle(key: keyof MenuConfig) {
    if (!config) return;
    const updated = { ...config, [key]: !config[key] };
    setConfig(updated);
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "web_menu_config", value: updated }),
    });
    setSaving(false);
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
        <p className="text-sm text-gray-500 mb-6">
          เปิด/ปิด menu ที่แสดงใน web app สำหรับผู้ใช้ทั่วไป
        </p>

        <Card className="divide-y">
          {MENU_ITEMS.map((item) => {
            const enabled = config?.[item.key] ?? true;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {item.label}
                  </span>
                </div>
                <button
                  onClick={() => toggle(item.key)}
                  disabled={saving}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    enabled ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      enabled ? "translate-x-4.5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </Card>

        {saving && (
          <p className="text-xs text-gray-400 mt-2">Saving...</p>
        )}
      </div>
    </AdminSidebar>
  );
}
