"use client";

import { useState } from "react";
import {
  RefreshCw,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Property {
  id: string;
  name: string;
  color: string;
  platform: string | null;
  icalUrl: string | null;
}

interface PropertySidebarProps {
  properties: Property[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSync: (id: string) => void;
  syncing: string | null;
}

export function PropertySidebar({
  properties,
  selectedIds,
  onToggle,
  onSync,
  syncing,
}: PropertySidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="w-12 bg-white rounded-xl shadow-sm border p-2 h-fit flex flex-col items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <div className="w-6 h-px bg-gray-200" />
        {properties.map((prop) => (
          <button
            key={prop.id}
            onClick={() => onToggle(prop.id)}
            className="w-6 h-6 rounded-full shrink-0 transition-transform hover:scale-110"
            style={{
              backgroundColor: selectedIds.includes(prop.id)
                ? prop.color
                : "transparent",
              border: `2px solid ${prop.color}`,
            }}
            title={prop.name}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border h-fit">
      {/* Header */}
      <div className="px-3 py-2 border-b">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-gray-400">
          Listings
        </h3>
      </div>

      {/* Property list */}
      <div className="p-1.5 space-y-0">
        {properties.map((prop) => (
          <div
            key={prop.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 group transition-colors"
          >
            <button
              onClick={() => onToggle(prop.id)}
              className="flex items-center gap-2.5 flex-1 min-w-0"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0 border-2 transition-all"
                style={{
                  backgroundColor: selectedIds.includes(prop.id)
                    ? prop.color
                    : "transparent",
                  borderColor: prop.color,
                }}
              />
              <div className="min-w-0 text-left">
                <div className="text-sm font-medium truncate" title={prop.name}>
                  {prop.name}
                </div>
              </div>
            </button>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onSync(prop.id)}
                disabled={syncing === prop.id}
                title="Sync iCal"
              >
                <RefreshCw
                  className={`h-3 w-3 ${syncing === prop.id ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        ))}

        {properties.length === 0 && (
          <div className="text-center py-6 px-4">
            <p className="text-sm text-gray-400">No listings yet</p>
            <p className="text-xs text-gray-300 mt-1">Add listings in Calendar Sync</p>
          </div>
        )}
      </div>
    </div>
  );
}
