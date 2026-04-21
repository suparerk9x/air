"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  Database,
  Rss,
  AlertCircle,
  CheckCircle2,
  Users,
} from "lucide-react";

interface MonitorData {
  db: { status: string; latencyMs: number };
  sync: {
    totalFeeds: number;
    syncedFeeds: number;
    errorFeeds: {
      id: string;
      platform: string;
      property: string;
      user: string;
      lastError: string;
      lastSyncAt: string | null;
    }[];
  };
  topUsers: { email: string; name: string | null; properties: number }[];
}

export default function MonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/monitor")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) {
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
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">System Monitor</h2>
          <Button size="sm" variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Health cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Database */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Database className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Database</span>
              <Badge variant={data?.db.status === "ok" ? "default" : "destructive"} className="ml-auto text-[10px]">
                {data?.db.status === "ok" ? "Healthy" : "Error"}
              </Badge>
            </div>
            <div className="text-xs text-gray-500">
              Latency: <span className="font-mono font-medium text-gray-900">{data?.db.latencyMs ?? "—"}ms</span>
            </div>
          </Card>

          {/* Sync status */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Rss className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">iCal Feeds</span>
              {data?.sync.errorFeeds.length ? (
                <Badge variant="destructive" className="ml-auto text-[10px]">
                  {data.sync.errorFeeds.length} error{data.sync.errorFeeds.length > 1 ? "s" : ""}
                </Badge>
              ) : (
                <Badge className="ml-auto text-[10px]">All OK</Badge>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {data?.sync.syncedFeeds ?? 0} / {data?.sync.totalFeeds ?? 0} synced
            </div>
          </Card>

          {/* Users */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Top Users</span>
            </div>
            <div className="text-xs text-gray-500">
              {data?.topUsers?.[0]
                ? `${data.topUsers[0].name || data.topUsers[0].email}: ${data.topUsers[0].properties} properties`
                : "No users"}
            </div>
          </Card>
        </div>

        {/* Feed errors */}
        {data?.sync.errorFeeds && data.sync.errorFeeds.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Feed Errors
            </h3>
            <Card>
              <div className="divide-y">
                {data.sync.errorFeeds.map((f) => (
                  <div key={f.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{f.property}</span>
                      <Badge variant="outline" className="text-[10px]">{f.platform}</Badge>
                      <span className="text-xs text-gray-400 ml-auto">{f.user}</span>
                    </div>
                    <p className="text-xs text-red-600 font-mono">{f.lastError}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Top users table */}
        {data?.topUsers && data.topUsers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Users by Properties</h3>
            <Card>
              <div className="divide-y">
                {data.topUsers.map((u, i) => (
                  <div key={u.email} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{u.name || u.email}</span>
                      {u.name && <span className="text-xs text-gray-400 ml-2">{u.email}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {u.properties > 0 ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-gray-300" />
                      )}
                      <span className="text-sm font-mono">{u.properties}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminSidebar>
  );
}
