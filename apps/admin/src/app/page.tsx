"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Card } from "@/components/ui/card";
import { Users, Home, CalendarDays, RefreshCw } from "lucide-react";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalProperties: number;
  totalBookings: number;
  recentUsers: { id: string; email: string; name: string | null; createdAt: string }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminSidebar>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalUsers ?? 0}</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeUsers ?? 0}</p>
                <p className="text-xs text-gray-500">Active Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Home className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalProperties ?? 0}</p>
                <p className="text-xs text-gray-500">Properties</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalBookings ?? 0}</p>
                <p className="text-xs text-gray-500">Bookings</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent users */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Users</h3>
          <Card>
            {stats?.recentUsers && stats.recentUsers.length > 0 ? (
              <div className="divide-y">
                {stats.recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                      {(u.name?.[0] || u.email[0]).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name || u.email}</p>
                      {u.name && <p className="text-xs text-gray-400">{u.email}</p>}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-gray-400">No users yet</div>
            )}
          </Card>
        </div>
      </div>
    </AdminSidebar>
  );
}
