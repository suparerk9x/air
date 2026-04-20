"use client";

import { useState } from "react";
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
import { format } from "date-fns";

interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    summary: string;
    startDate: string;
    endDate: string;
    propertyId: string;
    status: string;
  }) => void;
  properties: { id: string; name: string; color: string }[];
  initialDate?: Date;
}

export function BookingDialog({
  open,
  onClose,
  onSave,
  properties,
  initialDate,
}: BookingDialogProps) {
  const [summary, setSummary] = useState("");
  const [startDate, setStartDate] = useState(
    initialDate ? format(initialDate, "yyyy-MM-dd") : ""
  );
  const [endDate, setEndDate] = useState("");
  const [propertyId, setPropertyId] = useState(properties[0]?.id || "");
  const [status, setStatus] = useState("CONFIRMED");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ summary, startDate, endDate, propertyId, status });
    setSummary("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Booking</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="guest">Guest Name</Label>
            <Input
              id="guest"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. John Smith"
            />
          </div>

          <div>
            <Label htmlFor="property">Property</Label>
            <Select value={propertyId} onValueChange={(v) => v && setPropertyId(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startDate">Check-in</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">Check-out</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => v && setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Booking</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
