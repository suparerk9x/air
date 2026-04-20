"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Package,
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  ImagePlus,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────────────
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  description: string | null;
  imageUrl: string | null;
  minStock: number;
  usagePerCheckout: number;
}

const CATEGORIES = [
  { value: "LINEN", label: "Linen", icon: "🛏️", color: "bg-blue-50 border-blue-200" },
  { value: "AMENITY", label: "Amenities", icon: "🧴", color: "bg-green-50 border-green-200" },
  { value: "CONSUMABLE", label: "Consumables", icon: "🧹", color: "bg-amber-50 border-amber-200" },
  { value: "EQUIPMENT", label: "Equipment", icon: "🔌", color: "bg-purple-50 border-purple-200" },
  { value: "MAINTENANCE", label: "Maintenance", icon: "🔧", color: "bg-red-50 border-red-200" },
];

const UNITS = [
  { value: "pcs", label: "Pieces" },
  { value: "set", label: "Sets" },
  { value: "bottle", label: "Bottles" },
  { value: "roll", label: "Rolls" },
  { value: "box", label: "Boxes" },
  { value: "pack", label: "Packs" },
];

// ─── Component ───────────────────────────────────────────────────────
export default function ItemSetupPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/inventory/items");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSave = async (data: Partial<InventoryItem> & { name: string; category: string }) => {
    if (editItem) {
      await fetch(`/api/inventory/items/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setShowForm(false);
    setEditItem(null);
    await fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/inventory/items/${id}`, { method: "DELETE" });
    await fetchItems();
  };

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "ALL" || item.category === categoryFilter;
    return matchSearch && matchCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Package className="h-8 w-8 text-gray-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 md:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/inventory" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Plane className="h-4 w-4 text-white -rotate-45" />
              </div>
            </Link>
            <ChevronLeft className="h-4 w-4 text-gray-300" />
            <span className="text-sm font-semibold text-gray-700">Item Setup</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length} items</span>
          </div>
          <Button size="sm" onClick={() => { setEditItem(null); setShowForm(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
          </Button>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto p-4 space-y-4">
        {/* Search + Category filter */}
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

        {/* Item Grid — POS style cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Add new card */}
          <button
            onClick={() => { setEditItem(null); setShowForm(true); }}
            className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center min-h-[200px] hover:border-blue-400 hover:bg-blue-50/30 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors mb-2">
              <Plus className="h-6 w-6 text-gray-400 group-hover:text-blue-500" />
            </div>
            <span className="text-sm font-medium text-gray-400 group-hover:text-blue-500">Add Item</span>
          </button>

          {/* Item cards */}
          {filtered.map((item) => {
            const cat = CATEGORIES.find((c) => c.value === item.category);
            return (
              <div
                key={item.id}
                className={cn(
                  "bg-white rounded-xl border overflow-hidden group hover:shadow-md transition-all cursor-pointer relative",
                  cat?.color
                )}
                onClick={() => { setEditItem(item); setShowForm(true); }}
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {cat?.icon || "📦"}
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-1">
                      <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                        <Pencil className="h-3.5 w-3.5 text-gray-700" />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                  {/* Category badge */}
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-gray-600">
                    {cat?.label}
                  </span>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <div className="text-sm font-semibold truncate">{item.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-400">{item.unit}</span>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span>Min: {item.minStock}</span>
                      {item.usagePerCheckout > 0 && (
                        <span className="text-blue-500 font-medium">{item.usagePerCheckout}/{item.unit}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ Item Form Dialog ═══ */}
      <ItemFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        onSave={handleSave}
        initial={editItem}
      />
    </div>
  );
}

// ─── Item Form Dialog ────────────────────────────────────────────────
function ItemFormDialog({ open, onClose, onSave, initial }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<InventoryItem> & { name: string; category: string }) => void;
  initial: InventoryItem | null;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("LINEN");
  const [unit, setUnit] = useState("pcs");
  const [description, setDescription] = useState("");
  const [minStock, setMinStock] = useState("5");
  const [usage, setUsage] = useState("0");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setCategory(initial.category);
      setUnit(initial.unit);
      setDescription(initial.description || "");
      setMinStock(String(initial.minStock));
      setUsage(String(initial.usagePerCheckout));
      setImageUrl(initial.imageUrl);
    } else {
      setName("");
      setCategory("LINEN");
      setUnit("pcs");
      setDescription("");
      setMinStock("5");
      setUsage("0");
      setImageUrl(null);
    }
  }, [initial, open]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    setImageUrl(data.url);
    setUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      category,
      unit,
      description: description || null,
      imageUrl,
      minStock: parseInt(minStock),
      usagePerCheckout: parseInt(usage),
    });
  };

  const cat = CATEGORIES.find((c) => c.value === category);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="flex">
          {/* Left: Image */}
          <div className="w-48 bg-gray-100 flex flex-col items-center justify-center relative shrink-0 min-h-[360px]">
            {imageUrl ? (
              <>
                <Image src={imageUrl} alt="Product" fill className="object-cover" sizes="192px" />
                <button
                  onClick={() => setImageUrl(null)}
                  className="absolute top-2 right-2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center shadow-sm z-10 hover:bg-red-50"
                >
                  <X className="h-3 w-3 text-red-500" />
                </button>
              </>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors p-4"
                disabled={uploading}
              >
                {uploading ? (
                  <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <ImagePlus className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium">Add Photo</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            {/* Category preview */}
            {!imageUrl && (
              <div className="absolute bottom-3 text-5xl">{cat?.icon}</div>
            )}
          </div>

          {/* Right: Form */}
          <div className="flex-1 p-5">
            <DialogHeader className="mb-4">
              <DialogTitle>{initial ? "Edit Item" : "New Item"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label className="text-xs">Item Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bath Towel" required className="mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Unit</Label>
                  <Select value={unit} onValueChange={(v) => v && setUnit(v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Min Stock (alert)</Label>
                  <Input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Usage / Checkout</Label>
                  <Input type="number" value={usage} onChange={(e) => setUsage(e.target.value)} className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-xs">Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className="mt-1" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={!name.trim()}>
                  {initial ? "Save Changes" : "Create Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
