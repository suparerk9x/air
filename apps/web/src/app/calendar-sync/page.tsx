"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Rss,
  ExternalLink,
  Pencil,
  Check,
  MoreHorizontal,
  GripVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";

const COLORS = [
  // [vivid, soft]
  ["#4f7df9", "#93b4fc"],
  ["#34b882", "#7dd8af"],
  ["#f5a623", "#fcd077"],
  ["#e54d4d", "#f09090"],
  ["#9265e8", "#bea3f3"],
  ["#e06aad", "#f0a5cc"],
  ["#2db5c9", "#7dd4e0"],
  ["#6bba45", "#a8d98a"],
];

interface Property {
  id: string;
  name: string;
  color: string;
}

interface ICalFeed {
  id: string;
  url: string;
  label: string | null;
  platform: string;
  lastSyncAt: string | null;
  lastError: string | null;
  property: { id: string; name: string; color: string };
}

export default function SettingsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [feeds, setFeeds] = useState<ICalFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  // New feed form
  const [newUrl, setNewUrl] = useState("");
  const [newPropertyName, setNewPropertyName] = useState("");
  const [newPropertyColor, setNewPropertyColor] = useState(COLORS[0][0]);
  const [saving, setSaving] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editPropertyName, setEditPropertyName] = useState("");
  const [editPropertyColor, setEditPropertyColor] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragCounter = useRef(0);


  const fetchData = useCallback(async () => {
    try {
      const [propsRes, feedsRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/ical-feeds"),
      ]);
      if (propsRes.ok) {
        const props = await propsRes.json();
        if (Array.isArray(props)) {
          setProperties(props);
        }
      }
      if (feedsRes.ok) {
        const data = await feedsRes.json();
        if (Array.isArray(data)) setFeeds(data);
      }
    } catch (err) {
      console.error("Failed to fetch settings data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setSaving(true);
    setSyncResult(null);

    if (!newPropertyName.trim()) {
      setSyncResult("Error: Listing name is required");
      setSaving(false);
      return;
    }

    // Create property
    const propPlatform = newUrl.includes("airbnb") ? "airbnb"
      : newUrl.includes("booking.com") ? "booking"
      : newUrl.includes("agoda") ? "agoda" : "other";
    const propRes = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newPropertyName.trim(),
        color: newPropertyColor,
        platform: propPlatform,
      }),
    });
    if (!propRes.ok) {
      const err = await propRes.json().catch(() => ({}));
      setSyncResult(`Error: ${err.error || "Failed to create property"}`);
      setSaving(false);
      return;
    }
    const newProp = await propRes.json();
    const propertyId = newProp.id;

    // Auto-detect platform from URL
    const url = newUrl.trim();
    const detectedPlatform = url.includes("airbnb") ? "airbnb"
      : url.includes("booking.com") ? "booking"
      : url.includes("agoda") ? "agoda"
      : "other";

    // Add feed
    const res = await fetch("/api/ical-feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        label: null,
        platform: detectedPlatform,
        propertyId,
      }),
    });

    if (res.ok) {
      setNewUrl("");
      setNewPropertyName("");
      const randomPair = COLORS[Math.floor(Math.random() * COLORS.length)];
      setNewPropertyColor(randomPair[0]);
      setSyncResult("Listing added — syncing...");
      await fetchData();
      // Auto-sync after adding
      setSaving(false);
      await handleSync(propertyId);
      return;
    } else {
      const err = await res.json().catch(() => ({}));
      setSyncResult(`Error: ${err.error || res.statusText}`);
    }
    setSaving(false);
  };

  const handleStartEditProperty = (prop: Property) => {
    setEditingPropertyId(prop.id);
    setEditPropertyName(prop.name);
    setEditPropertyColor(prop.color);
  };

  const handleSaveProperty = async () => {
    if (!editingPropertyId || !editPropertyName.trim()) return;
    await fetch(`/api/properties/${editingPropertyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editPropertyName.trim(), color: editPropertyColor }),
    });
    setEditingPropertyId(null);
    setSyncResult("Listing updated");
    await fetchData();
  };

  const handleStartEdit = (feed: ICalFeed) => {
    setEditingFeedId(feed.id);
    setEditUrl(feed.url);
    setEditLabel(feed.label || "");
  };

  const handleSaveEdit = async () => {
    if (!editingFeedId || !editUrl.trim()) return;
    await fetch(`/api/ical-feeds/${editingFeedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: editUrl.trim(), label: editLabel.trim() || null }),
    });
    setEditingFeedId(null);
    setSyncResult("Feed updated");
    await fetchData();
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm("Remove this listing and all its bookings?")) return;
    const res = await fetch(`/api/properties/${propertyId}`, { method: "DELETE" });
    if (res.ok) {
      setSyncResult("Listing removed");
    } else {
      setSyncResult("Error: Failed to remove listing");
    }
    await fetchData();
  };

  const handleSync = async (propertyId: string) => {
    setSyncing(propertyId);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success || data.created || data.updated) {
        setSyncResult(
          `Synced: ${data.created || 0} new, ${data.updated || 0} updated`
        );
      } else if (data.error) {
        setSyncResult(`Error: ${data.error}`);
      }
      if (data.errors?.length) {
        setSyncResult(
          `Partial: ${data.created || 0} new, ${data.updated || 0} updated. Errors: ${data.errors.map((e: { label: string; error: string }) => e.label).join(", ")}`
        );
      }
    } catch {
      setSyncResult("Sync failed - network error");
    }
    await fetchData();
    setSyncing(null);
  };

  const handleDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const ids = properties.map((p) => p.id);
    const fromIndex = ids.indexOf(dragId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    // Reorder locally
    const newOrder = [...ids];
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, dragId);

    // Optimistic update
    const reordered = newOrder.map((id) => properties.find((p) => p.id === id)!);
    setProperties(reordered);
    setDragId(null);
    setDragOverId(null);

    // Persist
    await fetch("/api/properties/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: newOrder }),
    });
  };

  // Group feeds by property — show ALL properties (calendar-sync is master)
  const feedsByProperty = properties
    .map((prop) => ({
      property: prop,
      feeds: feeds.filter((f) => f.property.id === prop.id),
    }));

  return (
    <AppSidebar>
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="p-6">
            {/* Status toast */}
            {syncResult && (
              <div
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm flex items-center gap-2",
                  syncResult.startsWith("Error")
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-green-50 text-green-700 border border-green-200"
                )}
              >
                {syncResult.startsWith("Error") ? (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                )}
                {syncResult}
                <button
                  className="ml-auto text-gray-400 hover:text-gray-600"
                  onClick={() => setSyncResult(null)}
                >
                  &times;
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
              {/* Left: Add new */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-900">Add Listing</h2>
                <div className="bg-white rounded-lg border shadow-sm">
                  <form onSubmit={handleAddFeed} className="p-4 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                        Property
                      </label>
                      <div className="flex items-center gap-2.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="w-9 h-9 rounded-lg shrink-0 transition-transform hover:scale-105 shadow-sm border border-black/10 cursor-pointer"
                            style={{ backgroundColor: newPropertyColor }}
                          />
                          <DropdownMenuContent align="start" className="p-2 w-auto">
                            <div className="grid grid-cols-8 gap-1">
                              {COLORS.flat().map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setNewPropertyColor(c)}
                                  className={cn(
                                    "w-7 h-7 rounded-md transition-all border-2 flex items-center justify-center",
                                    newPropertyColor === c
                                      ? "border-gray-900 scale-110"
                                      : "border-transparent hover:scale-110"
                                  )}
                                  style={{ backgroundColor: c }}
                                >
                                  {newPropertyColor === c && (
                                    <svg className="w-3.5 h-3.5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Input
                          value={newPropertyName}
                          onChange={(e) => setNewPropertyName(e.target.value)}
                          placeholder="e.g. Sukhumvit Studio"
                          required
                          className="h-9 flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                        iCal URL
                      </label>
                      <Input
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="Paste iCal export URL"
                        required
                        className="h-9 font-mono text-xs"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        From your listing&apos;s calendar export.
                      </p>
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={saving || !newUrl.trim() || !newPropertyName.trim()}
                      className="w-full"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      {saving ? "Adding..." : "Add Listing"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Right: List */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-900">
                  Listings
                  {feedsByProperty.length > 0 && (
                    <span className="text-gray-400 font-normal ml-1.5">({feedsByProperty.length})</span>
                  )}
                </h2>
                {feedsByProperty.length === 0 && (
                  <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
                    <Rss className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No listings yet</p>
                  </div>
                )}
                {feedsByProperty.map(({ property, feeds: propFeeds }) => {
                  const feedTime = propFeeds[0]?.lastSyncAt
                    ? (() => {
                        const diff = Date.now() - new Date(propFeeds[0].lastSyncAt!).getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 1) return "just now";
                        if (mins < 60) return `${mins}m ago`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `${hrs}h ago`;
                        return `${Math.floor(hrs / 24)}d ago`;
                      })()
                    : null;
                  const hasError = propFeeds.some((f) => f.lastError);
                  const isSynced = propFeeds.some((f) => f.lastSyncAt);

                  return (
                    <div
                      key={property.id}
                      draggable={editingPropertyId !== property.id}
                      onDragStart={(e) => {
                        setDragId(property.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setDragOverId(null);
                        dragCounter.current = 0;
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        dragCounter.current++;
                        setDragOverId(property.id);
                      }}
                      onDragLeave={() => {
                        dragCounter.current--;
                        if (dragCounter.current === 0) {
                          setDragOverId(null);
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        dragCounter.current = 0;
                        handleDrop(property.id);
                      }}
                      className={cn(
                        "bg-white rounded-lg border shadow-sm hover:shadow transition-all",
                        dragId === property.id && "opacity-40",
                        dragOverId === property.id && dragId !== property.id && "ring-2 ring-blue-400 ring-offset-1",
                      )}
                    >
                      {editingPropertyId === property.id ? (
                        /* Edit mode */
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2.5">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className="w-8 h-8 rounded-lg shrink-0 shadow-sm border border-black/10 cursor-pointer hover:scale-105 transition-transform"
                                style={{ backgroundColor: editPropertyColor }}
                              />
                              <DropdownMenuContent align="start" className="p-2 w-auto">
                                <div className="grid grid-cols-8 gap-1">
                                  {COLORS.flat().map((c) => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => setEditPropertyColor(c)}
                                      className={cn(
                                        "w-6 h-6 rounded-md transition-all border-2 flex items-center justify-center",
                                        editPropertyColor === c ? "border-gray-900 scale-110" : "border-transparent hover:scale-110"
                                      )}
                                      style={{ backgroundColor: c }}
                                    >
                                      {editPropertyColor === c && (
                                        <svg className="w-3 h-3 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Input
                              value={editPropertyName}
                              onChange={(e) => setEditPropertyName(e.target.value)}
                              placeholder="Listing name"
                              className="h-8 flex-1"
                              autoFocus
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button size="sm" className="h-7 gap-1" onClick={handleSaveProperty} disabled={!editPropertyName.trim()}>
                              <Check className="h-3 w-3" /> Save
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => setEditingPropertyId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* View mode — single row */
                        <div className="flex items-center gap-2 px-3 py-3 group">
                          {/* Drag handle */}
                          <GripVertical className="h-4 w-4 text-gray-300 shrink-0 cursor-grab active:cursor-grabbing" />

                          {/* Color dot */}
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: property.color }}
                          />

                          {/* Name + sync status */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {property.name}
                              </span>
                              {hasError ? (
                                <span className="flex items-center gap-1 text-[10px] text-red-500">
                                  <AlertCircle className="h-3 w-3" /> error
                                </span>
                              ) : isSynced ? (
                                <span className="text-[10px] text-gray-400">
                                  {feedTime}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {propFeeds.length > 0 && (
                              <button
                                className={cn(
                                  "h-7 w-7 flex items-center justify-center rounded text-gray-400 transition-colors",
                                  syncing === property.id
                                    ? "text-blue-500"
                                    : "hover:bg-gray-100 hover:text-gray-600"
                                )}
                                onClick={() => handleSync(property.id)}
                                disabled={syncing === property.id || syncing === "all"}
                                title="Sync"
                              >
                                <RefreshCw className={cn("h-3.5 w-3.5", syncing === property.id && "animate-spin")} />
                              </button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-[160px]">
                                <DropdownMenuItem onClick={() => handleStartEditProperty(property)}>
                                  <Pencil className="h-3.5 w-3.5 mr-2 shrink-0" />
                                  <span className="whitespace-nowrap">Edit listing</span>
                                </DropdownMenuItem>
                                {propFeeds[0] && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleStartEdit(propFeeds[0])}>
                                      <Rss className="h-3.5 w-3.5 mr-2 shrink-0" />
                                      <span className="whitespace-nowrap">Edit URL</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => window.open(propFeeds[0].url, "_blank")}>
                                      <ExternalLink className="h-3.5 w-3.5 mr-2 shrink-0" />
                                      <span className="whitespace-nowrap">Open URL</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProperty(property.id)}>
                                  <Trash2 className="h-3.5 w-3.5 mr-2 shrink-0" />
                                  <span className="whitespace-nowrap">Remove listing</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )}

                      {/* Edit feed inline (shown below card when editing) */}
                      {propFeeds.map((feed) =>
                        editingFeedId === feed.id ? (
                          <div key={feed.id} className="px-4 pb-3 space-y-2 border-t pt-3">
                            <Input
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              placeholder="iCal URL"
                              className="h-8 font-mono text-xs"
                              autoFocus
                            />
                            <div className="flex items-center gap-1.5">
                              <Button size="sm" className="h-7 gap-1" onClick={handleSaveEdit} disabled={!editUrl.trim()}>
                                <Check className="h-3 w-3" /> Save
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => setEditingFeedId(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>
                  );
                })}

              </div>
            </div>
          </div>
        )}
    </AppSidebar>
  );
}
