"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

interface PropertyDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    address: string;
    icalUrl: string;
    color: string;
    platform: string;
  }) => void;
  initial?: {
    name: string;
    address: string | null;
    icalUrl: string | null;
    color: string;
    platform: string | null;
  };
}

export function PropertyDialog({
  open,
  onClose,
  onSave,
  initial,
}: PropertyDialogProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [icalUrl, setIcalUrl] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [platform, setPlatform] = useState("airbnb");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setAddress(initial.address || "");
      setIcalUrl(initial.icalUrl || "");
      setColor(initial.color);
      setPlatform(initial.platform || "airbnb");
    } else {
      setName("");
      setAddress("");
      setIcalUrl("");
      setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
      setPlatform("airbnb");
    }
  }, [initial, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, address, icalUrl, color, platform });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Listing" : "Add Listing"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Listing Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sukhumvit Studio"
              required
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Sukhumvit Soi 24"
            />
          </div>

          <div>
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="airbnb">Airbnb</SelectItem>
                <SelectItem value="booking">Booking.com</SelectItem>
                <SelectItem value="agoda">Agoda</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="icalUrl">iCal URL</Label>
            <Input
              id="icalUrl"
              value={icalUrl}
              onChange={(e) => setIcalUrl(e.target.value)}
              placeholder="https://www.airbnb.com/calendar/ical/..."
              type="url"
            />
            <p className="text-xs text-gray-400 mt-1">
              Get this from your Airbnb listing &gt; Calendar &gt; Export Calendar
            </p>
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform"
                  style={{
                    backgroundColor: c,
                    transform: color === c ? "scale(1.2)" : "scale(1)",
                    boxShadow:
                      color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {initial ? "Save" : "Add Listing"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
