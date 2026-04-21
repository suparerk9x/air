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
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchData(); }, [fetchData]);

  // Get system stock for selected property
  const getSystemStock = (item: InventoryItem) => {
    const ps = item.propertyStocks.find((s) => s.property.id === selectedProperty);
    return ps?.quantity ?? 0;
  };

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

  const setQty = (itemId: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, value) }));
  };

  const getQty = (itemId: string) => quantities[itemId] ?? 0;

  // Cart summary
  const cartItems = useMemo(() => {
    return items.filter((i) => getQty(i.id) > 0).map((i) => ({
      ...i,
      qty: getQty(i.id),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, quantities]);

  const totalItems = cartItems.reduce((s, i) => s + i.qty, 0);

  const handleReset = () => {
    setQuantities({});
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (cartItems.length === 0) return;

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
        const systemQty = getSystemStock(item);
        const diff = item.qty - systemQty;
        if (diff !== 0) {
          await fetch("/api/inventory/stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemId: item.id,
              propertyId: selectedProperty,
              type: "ADJUSTMENT",
              quantity: diff,
              note: `Stock count: system ${systemQty} → actual ${item.qty} (diff ${diff > 0 ? "+" : ""}${diff})`,
            }),
          });
        }
      }
    }

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
            {totalItems} items updated for {selectedProp?.name}
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
            <span className="text-sm font-semibold text-gray-700">Stock Counter</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-gray-500">
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        </div>
      </header>

      {/* ── Mode + Property selector ── */}
      <div className="bg-white border-b px-4 py-3 space-y-3">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => { setMode("restock"); handleReset(); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors",
              mode === "restock" ? "bg-white text-green-700 shadow-sm" : "text-gray-500"
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            Restock
          </button>
          <button
            onClick={() => { setMode("count"); handleReset(); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors",
              mode === "count" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500"
            )}
          >
            <ClipboardCheck className="h-4 w-4" />
            Stock Count
          </button>
        </div>

        {/* Property selector */}
        <Select value={selectedProperty} onValueChange={(v) => { v && setSelectedProperty(v); handleReset(); }}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              {selectedProp && (
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedProp.color }} />
              )}
              <SelectValue placeholder="Select property" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Item grid ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
        {CATEGORIES.map((cat) => {
          const catItems = grouped.get(cat.value);
          if (!catItems || catItems.length === 0) return null;

          return (
            <div key={cat.value}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>{cat.icon}</span> {cat.label}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {catItems.map((item) => {
                  const qty = getQty(item.id);
                  const systemQty = getSystemStock(item);
                  const hasValue = qty > 0;
                  const diff = mode === "count" && hasValue ? qty - systemQty : 0;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "bg-white rounded-xl border px-4 py-3 flex items-center gap-3 transition-all",
                        hasValue && mode === "restock" && "border-green-300 bg-green-50/30",
                        hasValue && mode === "count" && diff === 0 && "border-blue-300 bg-blue-50/30",
                        hasValue && mode === "count" && diff !== 0 && "border-amber-300 bg-amber-50/30"
                      )}
                    >
                      {/* Item image */}
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-lg">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          CATEGORIES.find((c) => c.value === item.category)?.icon || "📦"
                        )}
                      </div>
                      {/* Item info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.name}</div>
                        <div className="text-[10px] text-gray-400">
                          {mode === "count" ? (
                            <span>System: <span className="font-semibold text-gray-600">{systemQty}</span> {item.unit}</span>
                          ) : (
                            <span>Current: {systemQty} {item.unit}</span>
                          )}
                        </div>
                        {/* Diff indicator for count mode */}
                        {mode === "count" && hasValue && (
                          <div className={cn(
                            "text-[10px] font-semibold mt-0.5",
                            diff === 0 ? "text-green-600" : "text-amber-600"
                          )}>
                            {diff === 0 ? "✓ Match" : (
                              <span className="flex items-center gap-0.5">
                                <AlertTriangle className="h-3 w-3" />
                                Diff: {diff > 0 ? "+" : ""}{diff}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Counter */}
                      <div className="flex items-center gap-0">
                        <button
                          onClick={() => setQty(item.id, qty - 1)}
                          disabled={qty === 0}
                          className={cn(
                            "w-10 h-10 rounded-l-xl flex items-center justify-center transition-colors border",
                            qty === 0
                              ? "bg-gray-50 text-gray-300 border-gray-200"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 active:bg-gray-200"
                          )}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className={cn(
                          "w-14 h-10 flex items-center justify-center text-lg font-bold border-y",
                          hasValue
                            ? mode === "restock" ? "bg-green-50 text-green-700 border-green-300" : "bg-blue-50 text-blue-700 border-blue-300"
                            : "bg-gray-50 text-gray-400 border-gray-200"
                        )}>
                          {qty}
                        </div>
                        <button
                          onClick={() => setQty(item.id, qty + 1)}
                          className={cn(
                            "w-10 h-10 rounded-r-xl flex items-center justify-center transition-colors border",
                            mode === "restock"
                              ? "bg-green-500 text-white border-green-500 hover:bg-green-600 active:bg-green-700"
                              : "bg-blue-500 text-white border-blue-500 hover:bg-blue-600 active:bg-blue-700"
                          )}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Sticky bottom bar (cart) ── */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg transition-transform",
        cartItems.length > 0 ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="max-w-[800px] mx-auto px-4 py-3">
          {/* Cart summary */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-700">
                {mode === "restock" ? "🛒 Restock Cart" : "📋 Count Summary"}
              </div>
              <div className="text-xs text-gray-400">
                {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} · {totalItems} total {mode === "restock" ? "to add" : "counted"}
              </div>
            </div>
            {selectedProp && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedProp.color }} />
                {selectedProp.name}
              </div>
            )}
          </div>

          {/* Scrollable item chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin mb-2">
            {cartItems.map((item) => (
              <div key={item.id} className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0",
                mode === "restock" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
              )}>
                {item.name}
                <span className="font-bold">×{item.qty}</span>
              </div>
            ))}
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            className={cn(
              "w-full h-12 text-base font-semibold rounded-xl",
              mode === "restock"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {mode === "restock" ? (
              <>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Confirm Restock ({totalItems} items)
              </>
            ) : (
              <>
                <ClipboardCheck className="h-5 w-5 mr-2" />
                Save Stock Count ({cartItems.length} items)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
