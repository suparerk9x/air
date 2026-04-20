"use client";

import { useState } from "react";
import {
  Plus,
  RefreshCw,
  MoreVertical,
  Pencil,
  Trash2,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PLATFORM_COLORS } from "@/lib/color";

interface Property {
  id: string;
  name: string;
  color: string;
  platform: string | null;
  icalUrl: string | null;
  _count?: { bookings: number };
}

interface PropertySidebarProps {
  properties: Property[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSync: (id: string) => void;
  onAdd: () => void;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
  syncing: string | null;
}

export function PropertySidebar({
  properties,
  selectedIds,
  onToggle,
  onSync,
  onAdd,
  onEdit,
  onDelete,
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
        <div className="w-6 h-px bg-gray-200" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onAdd}
          title="Add property"
        >
          <Plus className="h-4 w-4" />
        </Button>
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
        {properties.map((prop) => {
          const platform = prop.platform || "other";
          const platformColor =
            PLATFORM_COLORS[platform] || PLATFORM_COLORS.other;

          return (
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
                {prop.icalUrl && (
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
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-gray-100">
                    <MoreVertical className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(prop)}>
                      <Pencil className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(prop.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}

        {properties.length === 0 && (
          <div className="text-center py-6 px-4">
            <p className="text-sm text-gray-400 mb-2">No listings yet</p>
            <Button size="sm" variant="outline" onClick={onAdd}>
              <Plus className="h-3 w-3 mr-1" />
              Add Listing
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
