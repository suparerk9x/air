"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plane,
  Plus,
  Package,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wrench,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle,
  LogOut,
  LogIn,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";

// ─── Types ───────────────────────────────────────────────────────────
interface PropertyStock {
  id: string;
  quantity: number;
  property: { id: string; name: string; color: string };
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  description: string | null;
  minStock: number;
  usagePerCheckout: number;
  propertyStocks: PropertyStock[];
  totalStock: number;
  isLowStock: boolean;
}

interface StockLog {
  id: string;
  type: string;
  quantity: number;
  note: string | null;
  cost: number | null;
  propertyId: string | null;
  createdAt: string;
  item: { name: string; unit: string; category: string };
}

interface MaintenanceTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  cost: number | null;
  assignee: string | null;
  propertyId: string;
  createdAt: string;
}

interface Property {
  id: string;
  name: string;
  color: string;
}

interface PrepItem {
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

interface CheckoutPrep {
  bookingId: string;
  guestName: string;
  propertyId: string;
  propertyName: string;
  propertyColor: string;
  items: PrepItem[];
}

interface TodayData {
  checkouts: CheckoutPrep[];
  checkins: { guestName: string; propertyName: string; propertyColor: string }[];
  lowStockItems: { id: string; name: string; category: string; unit: string; totalStock: number; minStock: number }[];
  openTasks: number;
  urgentTasks: number;
}

// ─── Constants ───────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "LINEN", label: "Linen", icon: "🛏️", color: "bg-blue-100 text-blue-700" },
  { value: "AMENITY", label: "Amenities", icon: "🧴", color: "bg-green-100 text-green-700" },
  { value: "CONSUMABLE", label: "Consumables", icon: "🧹", color: "bg-amber-100 text-amber-700" },
  { value: "EQUIPMENT", label: "Equipment", icon: "🔌", color: "bg-purple-100 text-purple-700" },
  { value: "MAINTENANCE", label: "Maintenance", icon: "🔧", color: "bg-red-100 text-red-700" },
];

const LOG_TYPES: Record<string, { label: string; color: string }> = {
  RESTOCK: { label: "Restock", color: "text-green-600" },
  CHECKOUT_USE: { label: "Checkout", color: "text-orange-600" },
  MANUAL_USE: { label: "Manual Use", color: "text-red-600" },
  ADJUSTMENT: { label: "Adjustment", color: "text-blue-600" },
  TRANSFER: { label: "Transfer", color: "text-purple-600" },
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

// ─── Main Page ───────────────────────────────────────────────────────
export default function InventoryPage() {
  const [tab, setTab] = useState<"dashboard" | "stock" | "logs" | "maintenance">("dashboard");
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showAddItem, setShowAddItem] = useState(false);
  const [showStockOp, setShowStockOp] = useState<InventoryItem | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [checkedPrep, setCheckedPrep] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [todayRes, itemsRes, logsRes, tasksRes, propsRes] = await Promise.all([
        fetch("/api/inventory/today"),
        fetch("/api/inventory/items"),
        fetch("/api/inventory/stock?limit=100"),
        fetch("/api/inventory/maintenance"),
        fetch("/api/properties"),
      ]);
      setTodayData(await todayRes.json());
      setItems(await itemsRes.json());
      setLogs(await logsRes.json());
      setTasks(await tasksRes.json());
      setProperties(await propsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const togglePrep = (key: string) => {
    setCheckedPrep((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleStockOp = async (data: {
    itemId: string; propertyId: string; type: string; quantity: number; note: string; cost?: number;
  }) => {
    await fetch("/api/inventory/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowStockOp(null);
    await fetchAll();
  };

  const handleAddItem = async (data: {
    name: string; category: string; unit: string; minStock: number; usagePerCheckout: number;
  }) => {
    await fetch("/api/inventory/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowAddItem(false);
    await fetchAll();
  };

  const handleAddTask = async (data: {
    title: string; propertyId: string; priority: string; assignee: string; description: string;
  }) => {
    await fetch("/api/inventory/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowAddTask(false);
    await fetchAll();
  };

  const handleTaskStatus = async (id: string, status: string) => {
    await fetch(`/api/inventory/maintenance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchAll();
  };

  const filteredItems = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "ALL" || item.category === categoryFilter;
    return matchSearch && matchCat;
  });

  if (loading) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center h-full">
          <Package className="h-5 w-5 text-gray-400 animate-pulse" />
        </div>
      </AppSidebar>
    );
  }

  const tabItems = [
    { key: "dashboard" as const, label: "Today", icon: <CheckCircle className="h-3.5 w-3.5" /> },
    { key: "stock" as const, label: "Stock", icon: <Package className="h-3.5 w-3.5" /> },
    { key: "logs" as const, label: "Activity", icon: <ArrowDownToLine className="h-3.5 w-3.5" /> },
    { key: "maintenance" as const, label: "Maintenance", icon: <Wrench className="h-3.5 w-3.5" /> },
  ];

  return (
    <AppSidebar headerRight={
      <div className="flex items-center gap-2">
        <Link
          href="/inventory/counter"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Counter
        </Link>
        <Link
          href="/inventory/items"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Package className="h-3.5 w-3.5" />
          Items
        </Link>
        {todayData && todayData.lowStockItems.length > 0 && (
          <button onClick={() => setTab("stock")} className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold hover:bg-red-100 transition-colors">
            <AlertTriangle className="h-3 w-3" />
            {todayData.lowStockItems.length} Low Stock
          </button>
        )}
        <Button size="sm" onClick={() => tab === "maintenance" ? setShowAddTask(true) : tab === "stock" ? setShowAddItem(true) : setShowAddItem(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {tab === "maintenance" ? "Task" : "Item"}
        </Button>
      </div>
    }>
      <div className="max-w-[1200px] mx-auto p-4 space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
          {tabItems.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ DASHBOARD TAB ═══ */}
        {tab === "dashboard" && todayData && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => setTab("stock")} className="bg-white rounded-xl border p-3 text-left hover:border-red-200 transition-colors">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase">
                  <AlertTriangle className="h-3 w-3 text-red-500" /> Low Stock
                </div>
                <div className={cn("text-2xl font-bold mt-1", todayData.lowStockItems.length > 0 ? "text-red-500" : "text-green-600")}>
                  {todayData.lowStockItems.length}
                </div>
                <div className="text-[10px] text-gray-400">{todayData.lowStockItems.length > 0 ? "items need restock" : "all stocked up ✓"}</div>
              </button>
              <div className="bg-white rounded-xl border p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase">
                  <LogOut className="h-3 w-3 text-orange-500" /> Checkouts Today
                </div>
                <div className="text-2xl font-bold mt-1 text-orange-600">{todayData.checkouts.length}</div>
                <div className="text-[10px] text-gray-400">{todayData.checkouts.length > 0 ? "rooms to prepare" : "no checkouts"}</div>
              </div>
              <div className="bg-white rounded-xl border p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase">
                  <LogIn className="h-3 w-3 text-green-500" /> Checkins Today
                </div>
                <div className="text-2xl font-bold mt-1 text-green-600">{todayData.checkins.length}</div>
                <div className="text-[10px] text-gray-400">{todayData.checkins.length > 0 ? "guests arriving" : "no checkins"}</div>
              </div>
              <button onClick={() => setTab("maintenance")} className="bg-white rounded-xl border p-3 text-left hover:border-orange-200 transition-colors">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase">
                  <Wrench className="h-3 w-3 text-blue-500" /> Maintenance
                </div>
                <div className="text-2xl font-bold mt-1 text-blue-600">{todayData.openTasks}</div>
                <div className="text-[10px] text-gray-400">
                  {todayData.urgentTasks > 0 ? `${todayData.urgentTasks} urgent` : "open tasks"}
                </div>
              </button>
            </div>

            {/* Checkout Prep Checklists */}
            {todayData.checkouts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <LogOut className="h-4 w-4 text-orange-500" />
                  Today's Checkout Prep
                </h3>
                <div className="space-y-3">
                  {todayData.checkouts.map((checkout) => (
                    <div key={checkout.bookingId} className="bg-white rounded-xl border overflow-hidden">
                      {/* Property header */}
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-gray-50/50">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: checkout.propertyColor }} />
                        <span className="text-sm font-semibold">{checkout.propertyName}</span>
                        <span className="text-xs text-gray-400">—</span>
                        <span className="text-xs text-gray-500">{checkout.guestName}</span>
                      </div>
                      {/* Item checklist */}
                      <div className="divide-y">
                        {checkout.items.map((item) => {
                          const key = `${checkout.bookingId}-${item.itemId}`;
                          const checked = checkedPrep.has(key);
                          return (
                            <button
                              key={key}
                              onClick={() => togglePrep(key)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-50 transition-colors",
                                checked && "bg-green-50/50"
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                checked ? "bg-green-500 border-green-500" : "border-gray-300"
                              )}>
                                {checked && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                              </div>
                              <span className={cn(
                                "text-sm flex-1",
                                checked ? "line-through text-gray-400" : "text-gray-700"
                              )}>
                                {item.name}
                              </span>
                              <span className={cn(
                                "text-sm font-semibold shrink-0",
                                checked ? "text-gray-300" : "text-gray-900"
                              )}>
                                ×{item.quantity}
                              </span>
                              <span className="text-[10px] text-gray-400 w-10">{item.unit}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {todayData.checkouts.length === 0 && todayData.checkins.length === 0 && (
              <div className="bg-white rounded-xl border p-8 text-center">
                <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-600">No checkouts or checkins today</div>
                <div className="text-xs text-gray-400 mt-1">All rooms are settled</div>
              </div>
            )}

            {/* Low Stock Quick Restock */}
            {todayData.lowStockItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Low Stock — Need Restock
                </h3>
                <div className="bg-white rounded-xl border divide-y">
                  {todayData.lowStockItems.map((item) => {
                    const cat = CATEGORIES.find((c) => c.value === item.category);
                    const fullItem = items.find((i) => i.id === item.id);
                    return (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className={cn("text-[10px] ml-2 px-1.5 py-0.5 rounded-full", cat?.color)}>
                            {cat?.icon}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-red-600">{item.totalStock}</span>
                          <span className="text-[10px] text-gray-400"> / {item.minStock} min</span>
                        </div>
                        {fullItem && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50 shrink-0"
                            onClick={() => setShowStockOp(fullItem)}
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Restock
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setTab("stock")}>
                <Package className="h-3.5 w-3.5 mr-1.5" /> View Full Stock
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTab("logs")}>
                <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" /> Activity Log
              </Button>
            </div>
          </div>
        )}

        {/* ═══ STOCK TAB ═══ */}
        {tab === "stock" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setCategoryFilter("ALL")}
                  className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
                    categoryFilter === "ALL" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                  All
                </button>
                {CATEGORIES.map((c) => (
                  <button key={c.value} onClick={() => setCategoryFilter(c.value)}
                    className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
                      categoryFilter === c.value ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-semibold uppercase text-gray-400">
                    <th className="text-left px-4 py-2.5">Item</th>
                    <th className="text-left px-4 py-2.5">Category</th>
                    {properties.slice(0, 3).map((p) => (
                      <th key={p.id} className="text-center px-2 py-2.5">
                        <div className="flex items-center justify-center gap-1" title={p.name}>
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                          <span className="truncate max-w-[70px]">{p.name.split(" ")[0]}</span>
                        </div>
                      </th>
                    ))}
                    <th className="text-center px-3 py-2.5">Total</th>
                    <th className="text-center px-3 py-2.5">Min</th>
                    <th className="text-right px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const cat = CATEGORIES.find((c) => c.value === item.category);
                    return (
                      <tr key={item.id} className={cn("border-t hover:bg-gray-50/50 transition-colors", item.isLowStock && "bg-red-50/40")}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {item.isLowStock && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                            <div>
                              <div className="text-sm font-medium">{item.name}</div>
                              {item.usagePerCheckout > 0 && (
                                <div className="text-[10px] text-gray-400">{item.usagePerCheckout} {item.unit} / checkout</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", cat?.color)}>
                            {cat?.icon} {cat?.label}
                          </span>
                        </td>
                        {properties.slice(0, 3).map((p) => {
                          const ps = item.propertyStocks.find((s) => s.property.id === p.id);
                          const qty = ps?.quantity ?? 0;
                          const isLow = qty <= item.minStock;
                          return (
                            <td key={p.id} className="text-center px-2 py-2.5">
                              <span className={cn("text-sm font-semibold", isLow ? "text-red-600" : "text-gray-700")}>
                                {qty}
                              </span>
                              <span className="text-[10px] text-gray-400 ml-1">{item.unit}</span>
                            </td>
                          );
                        })}
                        <td className="text-center px-3 py-2.5">
                          <span className={cn("text-sm font-bold", item.isLowStock ? "text-red-600" : "text-gray-900")}>
                            {item.totalStock}
                          </span>
                        </td>
                        <td className="text-center px-3 py-2.5 text-xs text-gray-400">{item.minStock}</td>
                        <td className="text-right px-4 py-2.5">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowStockOp(item)}>
                            <ArrowDownToLine className="h-3 w-3 mr-1" /> Update
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-400">No items found</div>
              )}
            </div>
          </div>
        )}

        {/* ═══ LOGS TAB ═══ */}
        {tab === "logs" && (
          <div className="bg-white rounded-xl border overflow-hidden divide-y">
            {logs.map((log) => {
              const logType = LOG_TYPES[log.type] || LOG_TYPES.ADJUSTMENT;
              return (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    log.quantity > 0 ? "bg-green-100" : "bg-orange-100")}>
                    {log.quantity > 0 ? <ArrowDownToLine className="h-4 w-4 text-green-600" /> : <ArrowUpFromLine className="h-4 w-4 text-orange-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{log.item.name}</span>
                      <span className={cn("text-[10px] font-semibold", logType.color)}>{logType.label}</span>
                    </div>
                    {log.note && <div className="text-xs text-gray-400 truncate">{log.note}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn("text-sm font-bold", log.quantity > 0 ? "text-green-600" : "text-orange-600")}>
                      {log.quantity > 0 ? "+" : ""}{log.quantity} {log.item.unit}
                    </div>
                    {log.cost && <div className="text-[10px] text-gray-400">฿{log.cost.toLocaleString()}</div>}
                  </div>
                  <div className="text-[10px] text-gray-400 shrink-0 w-14 text-right">
                    {format(new Date(log.createdAt), "d MMM")}
                  </div>
                </div>
              );
            })}
            {logs.length === 0 && <div className="text-center py-8 text-sm text-gray-400">No activity yet</div>}
          </div>
        )}

        {/* ═══ MAINTENANCE TAB ═══ */}
        {tab === "maintenance" && (
          <div className="space-y-3">
            {tasks.map((task) => {
              const prop = properties.find((p) => p.id === task.propertyId);
              return (
                <div key={task.id} className={cn("bg-white rounded-xl border p-4 flex items-start gap-3",
                  task.status === "COMPLETED" && "opacity-50")}>
                  <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0",
                    task.status === "COMPLETED" ? "bg-green-500" : task.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-gray-400")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-sm font-medium", task.status === "COMPLETED" && "line-through")}>{task.title}</span>
                      <Badge className={cn("text-[9px]", PRIORITY_COLORS[task.priority])}>{task.priority}</Badge>
                      {prop && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ backgroundColor: prop.color + "20", color: prop.color }}>{prop.name}</span>
                      )}
                    </div>
                    {task.description && <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                      {task.assignee && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {task.assignee}</span>}
                      <span>{format(new Date(task.createdAt), "d MMM yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {task.status === "OPEN" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleTaskStatus(task.id, "IN_PROGRESS")}>Start</Button>
                    )}
                    {task.status === "IN_PROGRESS" && (
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleTaskStatus(task.id, "COMPLETED")}>Done</Button>
                    )}
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && <div className="text-center py-12 text-sm text-gray-400">No maintenance tasks</div>}
          </div>
        )}
      </div>

      {/* ═══ DIALOGS ═══ */}
      <AddItemDialog open={showAddItem} onClose={() => setShowAddItem(false)} onSave={handleAddItem} />
      <StockOpDialog item={showStockOp} properties={properties} open={!!showStockOp} onClose={() => setShowStockOp(null)} onSave={handleStockOp} />
      <AddTaskDialog properties={properties} open={showAddTask} onClose={() => setShowAddTask(false)} onSave={handleAddTask} />
    </AppSidebar>
  );
}

// ═══ DIALOGS ═══════════════════════════════════════════════════════

function AddItemDialog({ open, onClose, onSave }: {
  open: boolean; onClose: () => void;
  onSave: (d: { name: string; category: string; unit: string; minStock: number; usagePerCheckout: number }) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("LINEN");
  const [unit, setUnit] = useState("pcs");
  const [minStock, setMinStock] = useState("5");
  const [usage, setUsage] = useState("0");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, category, unit, minStock: +minStock, usagePerCheckout: +usage }); setName(""); }} className="space-y-4">
          <div><Label>Item Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bath Towel" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label>
              <Select value={category} onValueChange={(v) => v && setCategory(v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>))}</SelectContent>
              </Select></div>
            <div><Label>Unit</Label>
              <Select value={unit} onValueChange={(v) => v && setUnit(v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pcs">Pieces</SelectItem><SelectItem value="set">Sets</SelectItem><SelectItem value="bottle">Bottles</SelectItem><SelectItem value="roll">Rolls</SelectItem><SelectItem value="box">Boxes</SelectItem></SelectContent>
              </Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Min Stock (alert)</Label><Input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} /></div>
            <div><Label>Usage per Checkout</Label><Input type="number" value={usage} onChange={(e) => setUsage(e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!name.trim()}>Add Item</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StockOpDialog({ item, properties, open, onClose, onSave }: {
  item: InventoryItem | null; properties: Property[]; open: boolean; onClose: () => void;
  onSave: (d: { itemId: string; propertyId: string; type: string; quantity: number; note: string; cost?: number }) => void;
}) {
  const [propId, setPropId] = useState(properties[0]?.id || "");
  const [type, setType] = useState("RESTOCK");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [cost, setCost] = useState("");
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Stock: {item.name}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          const q = type === "RESTOCK" || type === "ADJUSTMENT" ? Math.abs(+qty) : -Math.abs(+qty);
          onSave({ itemId: item.id, propertyId: propId, type, quantity: q, note, cost: cost ? +cost : undefined });
          setQty("1"); setNote(""); setCost("");
        }} className="space-y-4">
          <div><Label>Operation</Label>
            <Select value={type} onValueChange={(v) => v && setType(v)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="RESTOCK">➕ Restock</SelectItem><SelectItem value="MANUAL_USE">➖ Manual Use</SelectItem><SelectItem value="ADJUSTMENT">🔄 Adjustment</SelectItem></SelectContent>
            </Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Property</Label>
              <Select value={propId} onValueChange={(v) => v && setPropId(v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{properties.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
              </Select></div>
            <div><Label>Quantity ({item.unit})</Label><Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} required /></div>
          </div>
          {type === "RESTOCK" && <div><Label>Cost (฿)</Label><Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Optional" /></div>}
          <div><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit">Confirm</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddTaskDialog({ properties, open, onClose, onSave }: {
  properties: Property[]; open: boolean; onClose: () => void;
  onSave: (d: { title: string; propertyId: string; priority: string; assignee: string; description: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [propId, setPropId] = useState(properties[0]?.id || "");
  const [priority, setPriority] = useState("MEDIUM");
  const [assignee, setAssignee] = useState("");
  const [desc, setDesc] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New Maintenance Task</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ title, propertyId: propId, priority, assignee, description: desc }); setTitle(""); setDesc(""); setAssignee(""); }} className="space-y-4">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fix leaky faucet" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Property</Label>
              <Select value={propId} onValueChange={(v) => v && setPropId(v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{properties.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
              </Select></div>
            <div><Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => v && setPriority(v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="LOW">Low</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="URGENT">Urgent</SelectItem></SelectContent>
              </Select></div>
          </div>
          <div><Label>Assignee</Label><Input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="e.g. Somchai" /></div>
          <div><Label>Description</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!title.trim()}>Create Task</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
