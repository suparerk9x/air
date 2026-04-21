"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plane,
  Package,
  ChevronLeft,
  Minus,
  Plus,
  ShoppingCart,
  ClipboardCheck,
  Check,
  RotateCcw,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────────────
interface PropertyStock {
  quantity: number;
  property: { id: string; name: string; color: string };
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  imageUrl: string | null;
  minStock: number;
  propertyStocks: PropertyStock[];
}

interface Property {
  id: string;
  name: string;
  color: string;
}

const CATEGORIES = [
  { value: "LINEN", label: "Linen", icon: "🛏️" },
  { value: "AMENITY", label: "Amenities", icon: "🧴" },
  { value: "CONSUMABLE", label: "Consumables", icon: "🧹" },
  { value: "EQUIPMENT", label: "Equipment", icon: "🔌" },
  { value: "MAINTENANCE", label: "Maintenance", icon: "🔧" },
];

// ─── Component ───────────────────────────────────────────────────────
export default function StockCounterPage() {
  const [mode, setMode] = useState<"restock" | "count">("restock");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [itemsRes, propsRes] = await Promise.all([
      fetch("/api/inventory/items"),
      fetch("/api/properties"),
    ]);
    const itemsData = await itemsRes.json();
    const propsData = await propsRes.json();
    setItems(itemsData);
    setProperties(propsData);
    if (propsData.length > 0 && !selectedProperty) {
      setSelectedProperty(propsData[0].id);
    }
    setLoading(false);
  }, [selectedProperty]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get system stock for selected property
  const getSystemStock = useCallback(
    (item: InventoryItem) => {
      const ps = item.propertyStocks.find(
        (s) => s.property.id === selectedProperty
      );
      return ps?.quantity ?? 0;
    },
    [selectedProperty]
  );

  // Group items by category
  const grouped = useMemo(() => {
    const map = new Map<string, InventoryItem[]>();
    for (const item of items) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [items]);

  // Categories that have items
  const availableCategories = useMemo(() => {
    return CATEGORIES.filter((c) => grouped.has(c.value));
  }, [grouped]);

  // Items to show in the left grid (filtered by active category or all)
  const gridItems = useMemo(() => {
    if (activeCategory) {
      return grouped.get(activeCategory) || [];
    }
    const all: InventoryItem[] = [];
    for (const cat of CATEGORIES) {
      const catItems = grouped.get(cat.value);
      if (catItems) all.push(...catItems);
    }
    return all;
  }, [grouped, activeCategory]);

  const setQty = (itemId: string, value: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      if (value <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = value;
      }
      return next;
    });
  };

  const getQty = (itemId: string) => quantities[itemId] ?? 0;

  // Tap to add +1
  const tapItem = (itemId: string) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? 0) + 1,
    }));
  };

  // Cart items (items with qty > 0)
  const cartItems = useMemo(() => {
    return items
      .filter((i) => getQty(i.id) > 0)
      .map((i) => ({
        ...i,
        qty: getQty(i.id),
        systemQty: getSystemStock(i),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, quantities, getSystemStock]);

  // Progress for count mode: % of total items that have been counted
  const progress = useMemo(() => {
    if (items.length === 0) return { counted: 0, total: 0, percent: 0 };
    const counted = Object.keys(quantities).length;
    const total = items.length;
    return { counted, total, percent: Math.round((counted / total) * 100) };
  }, [items, quantities]);

  const allCounted = progress.counted === progress.total && progress.total > 0;

  const handleReset = () => {
    setQuantities({});
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (cartItems.length === 0) return;
    setSubmitting(true);

    for (const item of cartItems) {
      if (mode === "restock") {
        await fetch("/api/inventory/stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: item.id,
            propertyId: selectedProperty,
            type: "RESTOCK",
            quantity: item.qty,
            note: `POS restock: ${item.qty} ${item.unit}`,
          }),
        });
      } else {
        // Stock count mode: calculate diff and adjust
        const diff = item.qty - item.systemQty;
        if (diff !== 0) {
          await fetch("/api/inventory/stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemId: item.id,
              propertyId: selectedProperty,
              type: "ADJUSTMENT",
              quantity: diff,
              note: `Stock count: system ${item.systemQty} → actual ${item.qty} (diff ${diff > 0 ? "+" : ""}${diff})`,
            }),
          });
        }
      }
    }

    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      handleReset();
      fetchData();
    }, 2000);
  };

  const selectedProp = properties.find((p) => p.id === selectedProperty);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Package className="h-8 w-8 text-gray-400 animate-pulse" />
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            {mode === "restock" ? "Restock Saved!" : "Stock Count Saved!"}
          </h2>
          <p className="text-sm text-gray-500">
            {cartItems.length} items updated for {selectedProp?.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/inventory" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Plane className="h-4 w-4 text-white -rotate-45" />
              </div>
            </Link>
            <ChevronLeft className="h-4 w-4 text-gray-300" />
            <span className="text-sm font-semibold text-gray-700">
              Stock Counter
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-gray-500"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        </div>

        {/* Mode + Property */}
        <div className="px-4 pb-3 flex items-center gap-3">
          {/* Mode toggle */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => {
                setMode("restock");
                handleReset();
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all touch-manipulation",
                mode === "restock"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-gray-500"
              )}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Restock
            </button>
            <button
              onClick={() => {
                setMode("count");
                handleReset();
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all touch-manipulation",
                mode === "count"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500"
              )}
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              Count
            </button>
          </div>

          {/* Property selector */}
          <Select
            value={selectedProperty}
            onValueChange={(v) => {
              if (v) {
                setSelectedProperty(v);
                handleReset();
              }
            }}
          >
            <SelectTrigger className="flex-1 max-w-[200px]">
              <div className="flex items-center gap-2">
                {selectedProp && (
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: selectedProp.color }}
                  />
                )}
                <SelectValue placeholder="Select property" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* ── Split Screen ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ─── LEFT: Item Grid (tap to count) ─── */}
        <div className="flex-[2] flex flex-col border-r bg-white overflow-hidden">
          {/* Category filter tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b overflow-x-auto shrink-0 scrollbar-thin">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors touch-manipulation",
                activeCategory === null
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              All
            </button>
            {availableCategories.map((c) => (
              <button
                key={c.value}
                onClick={() =>
                  setActiveCategory(activeCategory === c.value ? null : c.value)
                }
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors touch-manipulation",
                  activeCategory === c.value
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {/* Item grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {gridItems.map((item) => {
                const qty = getQty(item.id);
                const systemQty = getSystemStock(item);
                const isLow =
                  systemQty <= item.minStock && systemQty > 0;
                const isOut = systemQty === 0;
                const cat = CATEGORIES.find((c) => c.value === item.category);

                return (
                  <button
                    key={item.id}
                    onClick={() => tapItem(item.id)}
                    className={cn(
                      "relative flex flex-col items-center p-3 rounded-xl border-2 transition-all",
                      "active:scale-95 touch-manipulation select-none",
                      "hover:shadow-md",
                      qty > 0 && mode === "restock" && "border-green-400 bg-green-50 shadow-sm",
                      qty > 0 && mode === "count" && "border-blue-400 bg-blue-50 shadow-sm",
                      qty === 0 && "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    {/* Quantity badge */}
                    {qty > 0 && (
                      <div
                        className={cn(
                          "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm",
                          mode === "restock" ? "bg-green-500" : "bg-blue-500"
                        )}
                      >
                        {qty}
                      </div>
                    )}

                    {/* Status dot */}
                    {(isLow || isOut) && qty === 0 && (
                      <div
                        className={cn(
                          "absolute top-1.5 left-1.5 w-2 h-2 rounded-full",
                          isOut ? "bg-red-500" : "bg-amber-400"
                        )}
                      />
                    )}

                    {/* Image / Icon */}
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center text-2xl mb-1.5">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        cat?.icon || "📦"
                      )}
                    </div>

                    {/* Name */}
                    <div className="text-[11px] font-medium text-gray-700 text-center leading-tight line-clamp-2 w-full">
                      {item.name}
                    </div>

                    {/* System stock */}
                    <div
                      className={cn(
                        "text-[10px] mt-0.5",
                        isOut
                          ? "text-red-500 font-semibold"
                          : isLow
                          ? "text-amber-500 font-semibold"
                          : "text-gray-400"
                      )}
                    >
                      {systemQty} {item.unit}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Count/Restock List ─── */}
        <div className="flex-[3] flex flex-col bg-gray-50 overflow-hidden">
          {/* Progress bar (count mode) */}
          {mode === "count" && (
            <div className="px-4 pt-3 pb-2 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-500">
                  Progress
                </span>
                <span className="text-xs font-bold text-gray-700">
                  {progress.counted} / {progress.total} items ({progress.percent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    allCounted ? "bg-green-500" : "bg-blue-500"
                  )}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Counted items list */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  {mode === "restock" ? (
                    <ShoppingCart className="h-7 w-7 text-gray-300" />
                  ) : (
                    <ClipboardCheck className="h-7 w-7 text-gray-300" />
                  )}
                </div>
                <p className="text-sm font-medium">
                  {mode === "restock"
                    ? "Tap items to restock"
                    : "Tap items to start counting"}
                </p>
                <p className="text-xs mt-1">
                  Each tap adds +1 to the count
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cartItems.map((item) => {
                  const diff = item.qty - item.systemQty;
                  const cat = CATEGORIES.find(
                    (c) => c.value === item.category
                  );

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "bg-white rounded-xl border px-4 py-3 flex items-center gap-3 transition-all",
                        mode === "restock" && "border-green-200",
                        mode === "count" && diff === 0 && "border-green-200",
                        mode === "count" && diff !== 0 && "border-amber-200"
                      )}
                    >
                      {/* Image */}
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-lg">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          cat?.icon || "📦"
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {item.name}
                        </div>
                        {mode === "count" ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400">
                              System:{" "}
                              <span className="font-semibold text-gray-600">
                                {item.systemQty}
                              </span>
                            </span>
                            {diff === 0 ? (
                              <span className="text-[10px] font-semibold text-green-600">
                                ✓ Match
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5">
                                <AlertTriangle className="h-3 w-3" />
                                {diff > 0 ? "+" : ""}
                                {diff}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Current: {item.systemQty} {item.unit} → {item.systemQty + item.qty}
                          </div>
                        )}
                      </div>

                      {/* +/- Controls */}
                      <div className="flex items-center gap-0 shrink-0">
                        <button
                          onClick={() => setQty(item.id, item.qty - 1)}
                          className={cn(
                            "w-9 h-9 rounded-l-lg flex items-center justify-center transition-colors border",
                            "bg-white text-gray-600 border-gray-300 hover:bg-gray-100 active:bg-gray-200 active:scale-95 touch-manipulation"
                          )}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <div
                          className={cn(
                            "w-12 h-9 flex items-center justify-center text-base font-bold border-y tabular-nums",
                            mode === "restock"
                              ? "bg-green-50 text-green-700 border-green-300"
                              : "bg-blue-50 text-blue-700 border-blue-300"
                          )}
                        >
                          {item.qty}
                        </div>
                        <button
                          onClick={() => setQty(item.id, item.qty + 1)}
                          className={cn(
                            "w-9 h-9 rounded-r-lg flex items-center justify-center transition-colors border",
                            "active:scale-95 touch-manipulation",
                            mode === "restock"
                              ? "bg-green-500 text-white border-green-500 hover:bg-green-600"
                              : "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                          )}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => setQty(item.id, 0)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 touch-manipulation"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit bar */}
          <div className="shrink-0 border-t bg-white px-4 py-3">
            {/* Summary */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                {selectedProp && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: selectedProp.color }}
                    />
                    {selectedProp.name}
                  </div>
                )}
                <span className="text-xs text-gray-400">
                  {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
                </span>
              </div>
              {mode === "count" && (
                <span
                  className={cn(
                    "text-xs font-semibold",
                    allCounted ? "text-green-600" : "text-gray-400"
                  )}
                >
                  {allCounted ? "All items counted ✓" : `${progress.total - progress.counted} remaining`}
                </span>
              )}
            </div>

            {/* Submit button */}
            <Button
              onClick={handleSubmit}
              disabled={
                cartItems.length === 0 ||
                submitting ||
                (mode === "count" && !allCounted)
              }
              className={cn(
                "w-full h-12 text-base font-semibold rounded-xl transition-all active:scale-[0.98] touch-manipulation",
                mode === "restock"
                  ? "bg-green-600 hover:bg-green-700 disabled:bg-gray-200"
                  : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200"
              )}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === "restock" ? (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Confirm Restock ({cartItems.length} items)
                </>
              ) : (
                <>
                  <ClipboardCheck className="h-5 w-5 mr-2" />
                  Save Stock Count
                </>
              )}
            </Button>

            {mode === "count" && !allCounted && cartItems.length > 0 && (
              <p className="text-[10px] text-center text-amber-600 mt-1.5">
                Count all items before submitting
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
